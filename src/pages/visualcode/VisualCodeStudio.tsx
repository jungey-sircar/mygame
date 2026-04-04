import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, KeyRound, Pause, Play, RotateCcw, SkipForward, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import ParticleBackground from "@/components/ParticleBackground";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { traceCode, type ExecutionStep, type Language } from "./interpreter";
import { examples, type CodeExample } from "./examples";
import {
  ALL_CATEGORY,
  studioExamplesByLanguage,
} from "./studioExamples";

const LOCK_USERNAME = "jungeysircar";
const LOCK_PASSWORD = "eric@123";

const starterCode: Record<Language, string> = {
  python: `total = 0
for i in range(1, 6):
    total += i
print(total)`,
  c: `int total = 0;
for (int i = 1; i <= 5; i++) {
  total += i;
}
printf("%d\\n", total);`,
  javascript: `let total = 0;
for (let i = 1; i <= 5; i++) {
  total += i;
}
console.log(total);`,
  java: `class Program {
  static void Main(string[] args) {
    int total = 0;
    for (int i = 1; i <= 5; i++) {
      total += i;
    }
    System.out.println(total);
  }
}`,
  dotnet: `class Program {
  static void Main(string[] args) {
    int total = 0;
    for (int i = 1; i <= 5; i++) {
      total += i;
    }
    Console.WriteLine(total);
  }
}`,
  php: `<?php
$total = 0;
for ($i = 1; $i <= 5; $i++) {
  $total = $total + $i;
}
echo($total);`,
};

const matrixDemoCode: Record<Language, string> = {
  python: `matrix = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
]

n = len(matrix)
for i in range(0, n // 2):
    for j in range(i, n - i - 1):
        temp = matrix[i][j]
        matrix[i][j] = matrix[n - 1 - j][i]
        matrix[n - 1 - j][i] = matrix[n - 1 - i][n - 1 - j]
        matrix[n - 1 - i][n - 1 - j] = matrix[j][n - 1 - i]
        matrix[j][n - 1 - i] = temp

print(matrix)`,
  c: `int a = 1;
int b = 2;
int c = 3;
printf("%d %d %d\\n", a, b, c);`,
  javascript: `const matrix = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9]
];

const n = matrix.length;
for (let i = 0; i < Math.floor(n / 2); i++) {
  for (let j = i; j < n - i - 1; j++) {
    const temp = matrix[i][j];
    matrix[i][j] = matrix[n - 1 - j][i];
    matrix[n - 1 - j][i] = matrix[n - 1 - i][n - 1 - j];
    matrix[n - 1 - i][n - 1 - j] = matrix[j][n - 1 - i];
    matrix[j][n - 1 - i] = temp;
  }
}

console.log(matrix);`,
  java: `class Program {
  static void Main(string[] args) {
    int[][] matrix = {
      {1, 2, 3},
      {4, 5, 6},
      {7, 8, 9}
    };

    matrix[0][0] = 99;
    System.out.println(matrix);
  }
}`,
  dotnet: `class Program {
  static void Main(string[] args) {
    int[][] matrix = {
      {1, 2, 3},
      {4, 5, 6},
      {7, 8, 9}
    };

    matrix[1][1] = 42;
    Console.WriteLine(matrix);
  }
}`,
  php: `<?php
$matrix = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9]
];

$matrix[1][1] = 42;
echo($matrix);`,
};

const formatValue = (value: unknown): string => {
  if (value === null || value === undefined) return "None";
  if (Array.isArray(value)) return `[${value.map(formatValue).join(", ")}]`;
  if (typeof value === "string") return `"${value}"`;
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

type MatrixValue = string | number | boolean | null;

interface MatrixCandidate {
  name: string;
  matrix: MatrixValue[][];
}

const isMatrixCell = (value: unknown): value is MatrixValue => {
  return value === null || ["number", "string", "boolean"].includes(typeof value);
};

const toMatrixCandidate = (name: string, value: unknown): MatrixCandidate | null => {
  if (!Array.isArray(value) || value.length === 0) return null;
  if (!value.every(row => Array.isArray(row))) return null;

  const rows = value as unknown[];
  const width = (rows[0] as unknown[]).length;
  if (width === 0) return null;
  if (!rows.every(row => (row as unknown[]).length === width)) return null;

  const matrix: MatrixValue[][] = [];
  for (const row of rows) {
    const nextRow: MatrixValue[] = [];
    for (const cell of row as unknown[]) {
      if (!isMatrixCell(cell)) return null;
      nextRow.push(cell);
    }
    matrix.push(nextRow);
  }

  return { name, matrix };
};

const toChangedCellSet = (
  current: MatrixValue[][],
  previous: MatrixValue[][] | null,
): Set<string> => {
  const changed = new Set<string>();
  if (!previous) return changed;

  for (let r = 0; r < current.length; r++) {
    for (let c = 0; c < current[r].length; c++) {
      if (!previous[r] || current[r][c] !== previous[r][c]) {
        changed.add(`${r}:${c}`);
      }
    }
  }

  return changed;
};

const parsePointer = (scope: Record<string, unknown>, names: string[]): number | null => {
  for (const name of names) {
    const value = scope[name];
    if (typeof value === "number" && Number.isFinite(value)) {
      return Math.floor(value);
    }
  }
  return null;
};

const getOperationBadges = (step: ExecutionStep | null): string[] => {
  if (!step) return [];
  const text = step.explanation.toLowerCase();
  const badges: string[] = [];

  if (step.type.includes("loop")) badges.push("loop");
  if (step.type === "function_call") badges.push("call");
  if (step.type === "assignment" || text.includes("assigned") || text.includes("set ")) badges.push("assign");
  if (text.includes("condition") || text.includes("true") || text.includes("false")) badges.push("branch");
  if (text.includes("print") || step.type === "print") badges.push("output");
  if (text.includes("swap") || text.includes("temp")) badges.push("swap");

  return Array.from(new Set(badges));
};

const computeHeatMap = (
  steps: ExecutionStep[],
  matrixName: string,
  uptoStep: number,
): Record<string, number> => {
  const heat: Record<string, number> = {};

  if (uptoStep <= 0) return heat;

  for (let idx = 1; idx <= uptoStep && idx < steps.length; idx++) {
    const curr = toMatrixCandidate(matrixName, steps[idx]?.variables?.[matrixName])?.matrix;
    const prev = toMatrixCandidate(matrixName, steps[idx - 1]?.variables?.[matrixName])?.matrix;
    if (!curr || !prev) continue;

    for (let r = 0; r < curr.length; r++) {
      for (let c = 0; c < curr[r].length; c++) {
        if (!prev[r] || curr[r][c] !== prev[r][c]) {
          const key = `${r}:${c}`;
          heat[key] = (heat[key] ?? 0) + 1;
        }
      }
    }
  }

  return heat;
};

type StudioExampleOption = {
  name: string;
  code: string;
  description: string;
  categories: string[];
  primaryCategory: string;
};

const toStudioExampleFromLab = (example: CodeExample): StudioExampleOption => ({
  name: example.name,
  code: example.code,
  description: example.description,
  categories: ["General"],
  primaryCategory: "General",
});

const mergeStudioAndLabExamples = (language: Language): StudioExampleOption[] => {
  const studio = studioExamplesByLanguage[language] as StudioExampleOption[];
  const lab = examples.filter((example) => example.language === language).map(toStudioExampleFromLab);
  const seen = new Set<string>();
  const merged: StudioExampleOption[] = [];

  for (const example of [...studio, ...lab]) {
    const key = example.name.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(example);
  }

  return merged;
};

const VisualCodeStudio = () => {
  const [isPageUnlocked, setIsPageUnlocked] = useState(false);
  const [unlockUsername, setUnlockUsername] = useState("");
  const [unlockPassword, setUnlockPassword] = useState("");
  const [unlockError, setUnlockError] = useState("");

  const [isRunning, setIsRunning] = useState(false);
  const [speed] = useState(1);

  const [language, setLanguage] = useState<Language>("python");
  const [code, setCode] = useState<string>(starterCode.python);
  const [selectedCategory, setSelectedCategory] = useState<string>(ALL_CATEGORY);
  const [selectedExampleName, setSelectedExampleName] = useState<string>("");
  const [steps, setSteps] = useState<ExecutionStep[]>([]);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [error, setError] = useState<string>("");
  const [selectedMatrix, setSelectedMatrix] = useState<string>("");
  const runTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const languageExamples = useMemo(() => mergeStudioAndLabExamples(language), [language]);
  const languageCategories = useMemo(() => {
    const categorySet = new Set<string>();
    for (const example of languageExamples) {
      for (const category of example.categories) {
        categorySet.add(category);
      }
    }
    return Array.from(categorySet).sort((a, b) => a.localeCompare(b));
  }, [languageExamples]);
  const filteredExamples = useMemo(
    () => selectedCategory === ALL_CATEGORY
      ? languageExamples
      : languageExamples.filter(example => example.categories.includes(selectedCategory)),
    [languageExamples, selectedCategory]
  );

  const resetTraceState = useCallback(() => {
    if (runTimer.current) {
      clearTimeout(runTimer.current);
      runTimer.current = null;
    }
    setIsRunning(false);
    setSteps([]);
    setActiveStep(0);
    setError("");
    setSelectedMatrix("");
  }, []);

  const loadCode = useCallback((nextCode: string) => {
    setCode(nextCode);
    resetTraceState();
  }, [resetTraceState]);

  const current = steps[activeStep] ?? null;
  const previous = activeStep > 0 ? steps[activeStep - 1] : null;

  const runCode = useCallback(() => {
    if (runTimer.current) {
      clearTimeout(runTimer.current);
      runTimer.current = null;
    }

    try {
      const traced = traceCode(code, language);
      setSteps(traced);
      setActiveStep(0);
      setError("");
      setIsRunning(true);
    } catch (err) {
      setSteps([]);
      setActiveStep(0);
      setError(err instanceof Error ? err.message : String(err));
      setIsRunning(false);
    }
  }, [code, language]);

  const handleStep = useCallback(() => {
    if (steps.length === 0) {
      try {
        const traced = traceCode(code, language);
        setSteps(traced);
        setActiveStep(0);
        setError("");
      } catch (err) {
        setSteps([]);
        setActiveStep(0);
        setError(err instanceof Error ? err.message : String(err));
      }
      return;
    }

    if (runTimer.current) {
      clearTimeout(runTimer.current);
      runTimer.current = null;
    }
    setIsRunning(false);
    setActiveStep((prev) => Math.min(prev + 1, Math.max(0, steps.length - 1)));
  }, [code, language, steps]);

  const handlePause = useCallback(() => {
    setIsRunning(false);
    if (runTimer.current) {
      clearTimeout(runTimer.current);
      runTimer.current = null;
    }
  }, []);

  const handleReset = useCallback(() => {
    resetTraceState();
  }, [resetTraceState]);

  const variableTimeline = useMemo(() => {
    const timeline: Array<{ step: number; line: number; name: string; value: unknown }> = [];
    const previous: Record<string, string> = {};

    steps.forEach((step, stepIndex) => {
      Object.entries(step.variables).forEach(([name, value]) => {
        const next = JSON.stringify(value);
        if (previous[name] !== next) {
          timeline.push({
            step: stepIndex + 1,
            line: step.line + 1,
            name,
            value,
          });
          previous[name] = next;
        }
      });
    });

    return timeline;
  }, [steps]);

  const matrixCandidates = useMemo(() => {
    if (!current) return [] as MatrixCandidate[];
    return Object.entries(current.variables)
      .map(([name, value]) => toMatrixCandidate(name, value))
      .filter((m): m is MatrixCandidate => Boolean(m));
  }, [current]);

  useEffect(() => {
    if (matrixCandidates.length === 0) {
      setSelectedMatrix("");
      return;
    }
    if (!matrixCandidates.some(c => c.name === selectedMatrix)) {
      setSelectedMatrix(matrixCandidates[0].name);
    }
  }, [matrixCandidates, selectedMatrix]);

  const activeMatrix = useMemo(() => {
    if (matrixCandidates.length === 0) return null;
    return matrixCandidates.find(c => c.name === selectedMatrix) ?? matrixCandidates[0];
  }, [matrixCandidates, selectedMatrix]);

  const changedCells = useMemo(() => {
    if (!activeMatrix || !previous) return new Set<string>();
    const prevMatrix = toMatrixCandidate(activeMatrix.name, previous.variables?.[activeMatrix.name])?.matrix ?? null;
    return toChangedCellSet(activeMatrix.matrix, prevMatrix);
  }, [activeMatrix, previous]);

  const heatMap = useMemo(() => {
    if (!activeMatrix) return {} as Record<string, number>;
    return computeHeatMap(steps, activeMatrix.name, activeStep);
  }, [steps, activeMatrix, activeStep]);

  const maxHeat = useMemo(() => {
    const values = Object.values(heatMap);
    return values.length > 0 ? Math.max(...values) : 0;
  }, [heatMap]);

  const operationBadges = useMemo(() => getOperationBadges(current), [current]);

  const pointerRow = useMemo(() => {
    if (!current) return null;
    return parsePointer(current.variables as Record<string, unknown>, ["i", "row", "r"]);
  }, [current]);

  const pointerCol = useMemo(() => {
    if (!current) return null;
    return parsePointer(current.variables as Record<string, unknown>, ["j", "col", "c"]);
  }, [current]);

  const codeLines = useMemo(() => code.split("\n"), [code]);
  const currentLine = current?.line ?? -1;

  useEffect(() => {
    const currentLanguageExamples = mergeStudioAndLabExamples(language);
    setSelectedCategory(ALL_CATEGORY);
    const first = currentLanguageExamples[0];
    if (first) {
      setSelectedExampleName(first.name);
      setCode(first.code);
      resetTraceState();
    } else {
      setSelectedExampleName("");
      setCode(starterCode[language]);
      resetTraceState();
    }
  }, [language]);

  useEffect(() => {
    if (selectedExampleName === "") return;
    if (!filteredExamples.some(example => example.name === selectedExampleName)) {
      setSelectedExampleName("");
    }
  }, [filteredExamples, selectedExampleName]);

  useEffect(() => {
    if (!isRunning) return;
    if (steps.length === 0) {
      setIsRunning(false);
      return;
    }

    if (activeStep >= steps.length - 1) {
      setIsRunning(false);
      return;
    }

    runTimer.current = setTimeout(() => {
      setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
    }, Math.max(180, 800 / speed));

    return () => {
      if (runTimer.current) {
        clearTimeout(runTimer.current);
        runTimer.current = null;
      }
    };
  }, [isRunning, steps.length, activeStep, speed]);

  const handleUnlock = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (unlockUsername.trim().toLowerCase() === LOCK_USERNAME && unlockPassword === LOCK_PASSWORD) {
      setIsPageUnlocked(true);
      setUnlockPassword("");
      setUnlockError("");
      return;
    }

    setUnlockError("Invalid username or password.");
  };

  if (!isPageUnlocked) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <ParticleBackground />

        <div className="relative z-10 max-w-xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="glass-panel p-6 sm:p-8 border border-neon-cyan/20 rounded-2xl">
            <div className="flex items-center justify-between gap-3 mb-5">
              <h1 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                Fun Code Visualization Locked
              </h1>
              <KeyRound className="w-6 h-6 text-neon-cyan" />
            </div>

            <p className="text-sm sm:text-base text-muted-foreground mb-6">
              Enter the authorized username and password to unlock this workspace.
            </p>

            <form className="space-y-4" onSubmit={handleUnlock}>
              <div>
                <label className="block text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Username</label>
                <Input
                  value={unlockUsername}
                  onChange={(event) => setUnlockUsername(event.target.value)}
                  placeholder="Enter username"
                  autoComplete="username"
                  className="bg-background/40 border-border/40"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Password</label>
                <Input
                  value={unlockPassword}
                  onChange={(event) => setUnlockPassword(event.target.value)}
                  type="password"
                  placeholder="Enter password"
                  autoComplete="current-password"
                  className="bg-background/40 border-border/40"
                />
              </div>

              {unlockError && <p className="text-sm text-red-400">{unlockError}</p>}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button type="submit" className="gap-2">
                  <KeyRound className="w-4 h-4" />
                  Unlock Visualization
                </Button>
                <Link to="/" className="inline-flex">
                  <Button type="button" variant="outline" className="gap-2 w-full sm:w-auto">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                  </Button>
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <ParticleBackground />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <div className="flex items-center gap-2">
            <Link to="/" className="inline-flex">
              <Button size="sm" variant="ghost" className="gap-2">
                <ArrowLeft size={14} /> Home
              </Button>
            </Link>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 text-xs text-neon-cyan">
              <Sparkles size={12} /> Studio Preview
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            Roadmap: breakpoints, heap graph, call-tree replay, and collaborative sessions
          </div>
        </div>

        <div className="mb-6">
          <h1 className="font-display text-3xl sm:text-4xl font-black tracking-tight text-foreground mb-2">
            Fun Code Visualization
          </h1>
          <p className="text-muted-foreground max-w-3xl">
            Dedicated workspace for the full-fledged code visualization experience. This page is separated from the existing VisualCode Lab so we can build the next generation safely.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
          className="grid grid-cols-1 xl:grid-cols-12 gap-4"
        >
          <motion.div
            layout
            className="xl:col-span-6 glass-panel p-4 border border-neon-purple/20"
          >
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <select
                value={language}
                onChange={e => {
                  const next = e.target.value as Language;
                  setLanguage(next);
                }}
                className="px-2 py-1 rounded-md bg-muted/50 border border-white/10 text-xs font-mono text-foreground"
              >
                <option value="python">Python</option>
                <option value="c">C</option>
                <option value="javascript">JavaScript</option>
                <option value="java">Java</option>
                <option value="dotnet">.NET (C#)</option>
                <option value="php">PHP</option>
              </select>

              <Button size="sm" onClick={runCode} className="gap-2">
                <Play size={12} /> {isRunning ? "Running" : steps.length > 0 ? "Resume Trace" : "Run Trace"}
              </Button>

              <Button size="sm" variant="secondary" onClick={handleStep} className="gap-2">
                <SkipForward size={12} /> Step
              </Button>

              <Button size="sm" variant="secondary" onClick={handlePause} className="gap-2" disabled={!isRunning}>
                <Pause size={12} /> Pause
              </Button>

              <Button size="sm" variant="secondary" onClick={handleReset} className="gap-2">
                <RotateCcw size={12} /> Reset
              </Button>

              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setSelectedExampleName("");
                  loadCode(matrixDemoCode[language]);
                }}
              >
                Matrix Demo
              </Button>
            </div>

            <div className="mb-3 rounded-lg border border-white/10 bg-white/5 p-2.5">
              <div className="mb-2 text-[11px] font-mono text-muted-foreground">
                Studio + Lab examples for {language.toUpperCase()}: {languageExamples.length} available
              </div>
              <div className="mb-2 flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-mono text-muted-foreground">Category</span>
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="px-2 py-1 rounded-md bg-muted/50 border border-white/10 text-xs font-mono text-foreground"
                >
                  <option value={ALL_CATEGORY}>All Categories ({languageExamples.length})</option>
                  {languageCategories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] font-mono text-muted-foreground">
                  Showing {filteredExamples.length}
                </span>
              </div>
              <div className="mb-2 flex flex-wrap gap-1.5">
                {languageCategories.map(category => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider border transition-colors ${
                      selectedCategory === category
                        ? "bg-neon-cyan/20 border-neon-cyan/40 text-neon-cyan"
                        : "bg-white/5 border-white/15 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {category}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setSelectedCategory(ALL_CATEGORY)}
                  className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider border transition-colors ${
                    selectedCategory === ALL_CATEGORY
                      ? "bg-neon-cyan/20 border-neon-cyan/40 text-neon-cyan"
                      : "bg-white/5 border-white/15 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  all
                </button>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={selectedExampleName}
                  onChange={e => {
                    const name = e.target.value;
                    setSelectedExampleName(name);
                    const selected = filteredExamples.find(example => example.name === name);
                    if (selected) {
                      loadCode(selected.code);
                    }
                  }}
                  className="min-w-[240px] flex-1 px-2 py-1 rounded-md bg-muted/50 border border-white/10 text-xs font-mono text-foreground"
                >
                  <option value="">Custom / current editor code</option>
                  {filteredExamples.map(example => (
                    <option key={example.name} value={example.name}>
                      {example.name} [{example.primaryCategory}]
                    </option>
                  ))}
                </select>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    if (filteredExamples.length === 0) return;
                    const random = filteredExamples[Math.floor(Math.random() * filteredExamples.length)];
                    setSelectedExampleName(random.name);
                    loadCode(random.code);
                  }}
                  disabled={filteredExamples.length === 0}
                >
                  Random Example
                </Button>
              </div>
            </div>

            <div className="relative h-[420px] rounded-lg border border-white/10 overflow-hidden bg-[hsl(220,20%,8%)]">
              <div className="absolute inset-0 pointer-events-none px-3 py-3">
                {codeLines.map((_, idx) => (
                  <div
                    key={`line-bg-${idx}`}
                    className={`h-6 rounded ${idx === currentLine ? "bg-neon-cyan/15" : ""}`}
                  />
                ))}
              </div>

              <div className="relative h-full flex">
                <div className="w-11 shrink-0 py-3 text-right border-r border-white/10 bg-black/20 text-[11px] font-mono text-muted-foreground/70 select-none">
                  {codeLines.map((_, idx) => (
                    <div key={`line-no-${idx}`} className={`h-6 pr-2 ${idx === currentLine ? "text-neon-cyan font-bold" : ""}`}>
                      {idx + 1}
                    </div>
                  ))}
                </div>
                <textarea
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  spellCheck={false}
                  className="flex-1 h-full bg-transparent text-foreground/95 p-3 font-mono text-xs leading-6 resize-none outline-none"
                />
              </div>
            </div>

            <div className="mt-3 text-[11px] text-muted-foreground/80 font-mono bg-white/5 rounded-md px-2 py-1">
              Tip: any rectangular 2D array variable like matrix/grid/board is auto-rendered in Matrix View.
            </div>

            {error && (
              <div className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive font-mono">
                {error}
              </div>
            )}
          </motion.div>

          <motion.div
            layout
            className="xl:col-span-6 grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div className="glass-panel p-4 md:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs uppercase tracking-wider text-muted-foreground">Execution Timeline</h2>
                <div className="text-xs text-muted-foreground">
                  {steps.length > 0 ? `Step ${activeStep + 1}/${steps.length}` : "No trace yet"}
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-2">
                {operationBadges.length > 0 ? (
                  operationBadges.map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider bg-neon-purple/20 border border-neon-purple/30 text-neon-purple font-semibold"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] text-muted-foreground/60">No operation tags yet</span>
                )}
              </div>

              <Slider
                min={1}
                max={Math.max(1, steps.length)}
                step={1}
                value={[Math.min(Math.max(1, activeStep + 1), Math.max(1, steps.length))]}
                onValueChange={([value]) => setActiveStep(Math.max(0, value - 1))}
                disabled={steps.length === 0}
                className="mb-3"
              />

              <div className="rounded-md bg-[hsl(220,20%,6%)] p-3 font-mono text-xs min-h-[96px]">
                {current ? (
                  <>
                    <div className="text-muted-foreground mb-1">Line {current.line + 1} | {current.type}</div>
                    <div>{current.explanation}</div>
                  </>
                ) : (
                  <div className="text-muted-foreground/60">Run trace to inspect step-by-step execution.</div>
                )}
              </div>
            </div>

            <div className="glass-panel p-4 md:col-span-2">
              <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                <h2 className="text-xs uppercase tracking-wider text-muted-foreground">Matrix View</h2>
                {matrixCandidates.length > 1 && (
                  <select
                    value={activeMatrix?.name ?? ""}
                    onChange={e => setSelectedMatrix(e.target.value)}
                    className="px-2 py-1 rounded-md bg-muted/50 border border-white/10 text-[11px] font-mono text-foreground"
                  >
                    {matrixCandidates.map(candidate => (
                      <option key={candidate.name} value={candidate.name}>{candidate.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <AnimatePresence mode="wait">
                {activeMatrix ? (
                  <motion.div
                    key={`${activeMatrix.name}-${activeStep}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.16 }}
                    className="rounded-xl border border-neon-cyan/40 bg-[linear-gradient(160deg,rgba(16,24,38,0.95),rgba(24,18,40,0.95))] p-3 overflow-auto"
                  >
                    <div className="text-[11px] text-neon-cyan mb-3 font-mono">
                      Variable: {activeMatrix.name} | {activeMatrix.matrix.length} x {activeMatrix.matrix[0]?.length ?? 0}
                    </div>

                    <div className="inline-grid gap-2" style={{ gridTemplateColumns: `44px repeat(${activeMatrix.matrix[0].length}, minmax(44px, 1fr))` }}>
                      <div />
                      {activeMatrix.matrix[0].map((_, colIndex) => (
                        <div
                          key={`col-${colIndex}`}
                          className={`h-9 flex items-center justify-center rounded-md text-[11px] font-mono ${
                            pointerCol === colIndex ? "bg-neon-purple/30 text-neon-purple border border-neon-purple/40" : "bg-white/10 text-muted-foreground"
                          }`}
                        >
                          {colIndex}
                        </div>
                      ))}

                      {activeMatrix.matrix.map((row, rowIndex) => (
                        <div key={`row-${rowIndex}`} className="contents">
                          <div
                            className={`h-9 flex items-center justify-center rounded-md text-[11px] font-mono ${
                              pointerRow === rowIndex ? "bg-neon-purple/30 text-neon-purple border border-neon-purple/40" : "bg-white/10 text-muted-foreground"
                            }`}
                          >
                            {rowIndex}
                          </div>
                          {row.map((cell, colIndex) => {
                            const changed = changedCells.has(`${rowIndex}:${colIndex}`);
                            const heatCount = heatMap[`${rowIndex}:${colIndex}`] ?? 0;
                            const heatAlpha = maxHeat > 0 ? Math.min(0.5, (heatCount / maxHeat) * 0.5) : 0;
                            const showPointer = pointerRow === rowIndex && pointerCol === colIndex;
                            return (
                              <motion.div
                                key={`cell-${rowIndex}-${colIndex}`}
                                initial={changed ? { scale: 0.9, opacity: 0.6 } : false}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.2 }}
                                className={`h-9 flex items-center justify-center rounded-md border font-mono text-sm ${
                                  changed
                                    ? "bg-neon-cyan/25 border-neon-cyan text-neon-cyan"
                                    : "bg-white/5 border-white/15 text-foreground"
                                }`}
                                style={{ boxShadow: heatAlpha > 0 ? `inset 0 0 0 999px rgba(34,211,238,${heatAlpha})` : undefined }}
                              >
                                <div className="relative w-full h-full flex items-center justify-center">
                                  {showPointer && (
                                    <span className="absolute -top-2 px-1 rounded bg-neon-purple text-black text-[9px] font-bold leading-4">
                                      i,j
                                    </span>
                                  )}
                                  {formatValue(cell)}
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 text-[10px] text-muted-foreground font-mono flex flex-wrap gap-3">
                      <span>Heatmap intensity shows frequently changed cells.</span>
                      <span>Pointer badges track i/j style loop indices.</span>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="no-matrix"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="rounded-lg border border-dashed border-white/15 bg-white/5 p-4 text-xs text-muted-foreground"
                  >
                    No matrix-like variable in this step. Define a 2D rectangular array to unlock matrix visualization.
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="glass-panel p-4">
              <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Current Variables</h2>
              <div className="space-y-1 max-h-[260px] overflow-auto pr-1">
                {current && Object.keys(current.variables).length > 0 ? (
                  Object.entries(current.variables).map(([name, value]) => (
                    <div key={name} className="flex items-start justify-between gap-3 rounded bg-neon-purple/10 p-2 text-xs font-mono">
                      <span>{name}</span>
                      <span className="text-right break-all">{formatValue(value)}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-muted-foreground/60">No variables in current step.</div>
                )}
              </div>
            </div>

            <div className="glass-panel p-4">
              <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Output</h2>
              <div className="rounded bg-[hsl(220,20%,6%)] p-2 text-xs font-mono min-h-[140px] max-h-[260px] overflow-auto">
                {current && current.output.length > 0 ? (
                  current.output.map((line, idx) => (
                    <div key={`${idx}-${line}`}>{line}</div>
                  ))
                ) : (
                  <div className="text-muted-foreground/60">No output yet.</div>
                )}
              </div>
            </div>

            <div className="glass-panel p-4 md:col-span-2">
              <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Variable Change Feed</h2>
              <div className="space-y-1 max-h-[220px] overflow-auto pr-1">
                {variableTimeline.length > 0 ? (
                  variableTimeline.map(item => (
                    <div
                      key={`${item.step}-${item.name}-${JSON.stringify(item.value)}`}
                      className="rounded bg-white/5 px-2 py-1 text-xs font-mono"
                    >
                      STEP {item.step} | L{item.line} | {item.name} = {formatValue(item.value)}
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-muted-foreground/60">Run trace to populate variable history.</div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default VisualCodeStudio;
