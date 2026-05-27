import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Play, SkipForward, Pause, RotateCcw, BookOpen, ChevronRight, Code2, Save, Trash2, FolderOpen, Hand, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import ParticleBackground from "@/components/ParticleBackground";
import { traceCode, type ExecutionStep, type Language } from "./interpreter";
import { examples } from "./examples";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const starterCodeByLanguage: Record<Language, string> = {
  python: `# Write your Python code here
count = 1
while count <= 3:
    print(count)
    count += 1`,
  c: `int x = 10;
int y = 20;
int sum = x + y;
printf("%d\\n", sum);`,
  javascript: `// Write your JavaScript code here
let total = 0
for (let i = 1; i <= 3; i++) {
    total += i
}
console.log(total)`,
  java: `class Program {
    static void Main(string[] args) {
        int a = 5;
        int b = 7;
        System.out.println(a + b);
    }
}`,
  dotnet: `class Program {
    static void Main(string[] args) {
        int a = 8;
        int b = 6;
        Console.WriteLine(a + b);
    }
}`,
  php: `<?php
$total = 0;
for ($i = 1; $i <= 3; $i++) {
    $total = $total + $i;
}
echo($total);`,
};

const getStarterCode = (language: Language): string => {
  const firstExample = examples.find(e => e.language === language);
  return firstExample?.code ?? starterCodeByLanguage[language];
};

const CodeEditor = ({ code, onChange, currentLine }: { code: string; onChange: (c: string) => void; currentLine: number }) => {
  const lines = code.split("\n");
  const textRef = useRef<HTMLTextAreaElement>(null);
  const INDENT = "    ";

  const setSelectionAfterUpdate = (start: number, end: number) => {
    requestAnimationFrame(() => {
      if (!textRef.current) return;
      textRef.current.focus();
      textRef.current.setSelectionRange(start, end);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!textRef.current) return;
    const textarea = textRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    if (e.key === "Tab") {
      e.preventDefault();
      const before = code.slice(0, start);
      const after = code.slice(end);

      if (!e.shiftKey) {
        if (start === end) {
          const next = `${before}${INDENT}${after}`;
          onChange(next);
          setSelectionAfterUpdate(start + INDENT.length, start + INDENT.length);
          return;
        }

        const lineStart = code.lastIndexOf("\n", start - 1) + 1;
        const fullSelected = code.slice(lineStart, end);
        const indented = fullSelected
          .split("\n")
          .map(line => `${INDENT}${line}`)
          .join("\n");
        const next = `${code.slice(0, lineStart)}${indented}${after}`;
        onChange(next);
        const lineCount = fullSelected.split("\n").length;
        const newStart = start + INDENT.length;
        const newEnd = end + INDENT.length * lineCount;
        setSelectionAfterUpdate(newStart, newEnd);
        return;
      }

      const lineStart = code.lastIndexOf("\n", start - 1) + 1;
      const fullSelected = code.slice(lineStart, end);
      const selectedLines = fullSelected.split("\n");
      let removedFromFirstLine = 0;
      let removedTotal = 0;
      const unindented = selectedLines
        .map((line, idx) => {
          if (line.startsWith(INDENT)) {
            if (idx === 0) removedFromFirstLine = INDENT.length;
            removedTotal += INDENT.length;
            return line.slice(INDENT.length);
          }
          if (line.startsWith("\t")) {
            if (idx === 0) removedFromFirstLine = 1;
            removedTotal += 1;
            return line.slice(1);
          }
          return line;
        })
        .join("\n");

      const next = `${code.slice(0, lineStart)}${unindented}${after}`;
      onChange(next);
      const newStart = Math.max(lineStart, start - removedFromFirstLine);
      const newEnd = Math.max(newStart, end - removedTotal);
      setSelectionAfterUpdate(newStart, newEnd);
      return;
    }

    if (e.key === "Enter") {
      const currentLineStart = code.lastIndexOf("\n", start - 1) + 1;
      const currentLineText = code.slice(currentLineStart, start);
      const currentIndent = currentLineText.match(/^\s*/)?.[0] ?? "";
      e.preventDefault();
      const next = `${code.slice(0, start)}\n${currentIndent}${code.slice(end)}`;
      onChange(next);
      const caret = start + 1 + currentIndent.length;
      setSelectionAfterUpdate(caret, caret);
    }
  };

  return (
    <div className="flex font-mono text-xs leading-6 bg-[hsl(220,20%,8%)] rounded-lg overflow-hidden border border-white/5 h-full">
      <div className="py-3 px-1 text-right select-none border-r border-white/10 min-w-[2.5rem] text-muted-foreground/50">
        {lines.map((_, i) => (
          <div key={i} className={`px-1 ${i === currentLine ? "bg-neon-purple/30 text-neon-purple font-bold rounded-sm" : ""}`}>
            {i + 1}
          </div>
        ))}
      </div>
      <div className="relative flex-1">
        <div className="absolute inset-0 py-3 pointer-events-none">
          {lines.map((_, i) => (
            <div key={i} className={`leading-6 ${i === currentLine ? "bg-neon-purple/10" : ""}`} />
          ))}
        </div>
        <textarea
          ref={textRef}
          value={code}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full h-full py-3 px-3 bg-transparent text-foreground/90 leading-6 resize-none outline-none"
          spellCheck={false}
        />
      </div>
    </div>
  );
};

const formatVal = (v: any): string => {
  if (v === null || v === undefined) return "None";
  if (Array.isArray(v)) return `[${v.map(formatVal).join(", ")}]`;
  if (typeof v === "string") return `"${v}"`;
  return String(v);
};

type Primitive = string | number | boolean | null;

const isPrimitive = (v: unknown): v is Primitive =>
  v === null || ["string", "number", "boolean"].includes(typeof v);

const resolveVisualizerIndex = (idx: unknown, length: number): number | null => {
  if (typeof idx !== "number" || !Number.isFinite(idx) || length <= 0) return null;
  const n = Math.floor(idx);
  if (n >= 0 && n < length) return n;
  if (n >= 1 && n <= length) return n - 1;
  return null;
};

const isPrimitiveArray = (v: unknown): v is Primitive[] =>
  Array.isArray(v) && v.every(isPrimitive);

const isPrimitiveMatrix = (v: unknown): v is Primitive[][] => {
  if (!Array.isArray(v) || v.length === 0) return false;
  if (!v.every(Array.isArray)) return false;
  const width = (v[0] as unknown[]).length;
  if (width === 0) return false;
  return v.every(r => (r as unknown[]).length === width && (r as unknown[]).every(isPrimitive));
};

const getChangedArrayIndices = (current: Primitive[], previous?: Primitive[]): Set<number> => {
  const out = new Set<number>();
  if (!previous) return out;
  const maxLen = Math.max(current.length, previous.length);
  for (let i = 0; i < maxLen; i++) {
    if (current[i] !== previous[i]) out.add(i);
  }
  return out;
};

const getChangedMatrixCells = (current: Primitive[][], previous?: Primitive[][]): Set<string> => {
  const out = new Set<string>();
  if (!previous) return out;
  for (let r = 0; r < current.length; r++) {
    for (let c = 0; c < current[r].length; c++) {
      if (!previous[r] || current[r][c] !== previous[r][c]) out.add(`${r}:${c}`);
    }
  }
  return out;
};

type LinkedNode = { id: string; label: Primitive; nextId: string | null };

const toLinkedList = (value: unknown): LinkedNode[] | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const nodes: LinkedNode[] = [];
  const seen = new Set<any>();
  let cur: any = value;
  let guard = 0;

  while (cur && typeof cur === "object" && !Array.isArray(cur) && guard++ < 32) {
    if (seen.has(cur)) break;
    seen.add(cur);

    const label = ("value" in cur ? cur.value : "val" in cur ? cur.val : "data" in cur ? cur.data : null) as Primitive;
    if (!isPrimitive(label)) return null;

    const next = (cur as any).next;
    const id = `N${nodes.length}`;
    const nextId = next && typeof next === "object" && !Array.isArray(next) ? `N${nodes.length + 1}` : null;
    nodes.push({ id, label, nextId });

    if (!next || typeof next !== "object" || Array.isArray(next)) break;
    cur = next;
  }

  return nodes.length > 0 ? nodes : null;
};

const toTreeLevels = (value: unknown): Primitive[][] | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const root = value as any;
  if (!("left" in root) && !("right" in root)) return null;

  const levels: Primitive[][] = [];
  let queue: Array<any> = [root];
  let depth = 0;
  while (queue.length > 0 && depth++ < 6) {
    const nextQ: Array<any> = [];
    const level: Primitive[] = [];
    let hasRealNode = false;

    for (const node of queue) {
      if (!node) {
        level.push(null);
        nextQ.push(null, null);
        continue;
      }

      const label = ("value" in node ? node.value : "val" in node ? node.val : "data" in node ? node.data : null) as Primitive;
      if (!isPrimitive(label)) return null;
      hasRealNode = true;
      level.push(label);
      nextQ.push(node.left ?? null, node.right ?? null);
    }

    if (!hasRealNode) break;
    levels.push(level);
    queue = nextQ;
  }

  return levels.length > 0 ? levels : null;
};

type GraphEdge = { to: string; weight?: Primitive };
type GraphAdjacency = Array<{ node: string; edges: GraphEdge[] }>;

const normalizeGraphEdge = (raw: unknown): GraphEdge | null => {
  if (isPrimitive(raw)) {
    return { to: String(raw) };
  }
  if (Array.isArray(raw) && raw.length >= 1 && isPrimitive(raw[0])) {
    const weight = raw.length > 1 && isPrimitive(raw[1]) ? raw[1] : undefined;
    return { to: String(raw[0]), weight };
  }
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>;
    const toVal = obj.to ?? obj.node ?? obj.target ?? obj.id;
    if (!isPrimitive(toVal)) return null;
    const weightRaw = obj.weight ?? obj.w ?? obj.cost;
    const weight = isPrimitive(weightRaw) ? weightRaw : undefined;
    return { to: String(toVal), weight };
  }
  return null;
};

const toAdjacencyList = (value: unknown): GraphAdjacency | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length === 0) return null;
  const out: GraphAdjacency = [];

  for (const [node, edges] of entries) {
    if (!Array.isArray(edges)) return null;
    const normalized: GraphEdge[] = [];
    for (const edge of edges) {
      const parsed = normalizeGraphEdge(edge);
      if (!parsed) return null;
      normalized.push(parsed);
    }
    out.push({ node, edges: normalized });
  }

  return out;
};

const detectSwapPair = (current: Primitive[], previous?: Primitive[]): { a: number; b: number } | null => {
  if (!previous || current.length !== previous.length) return null;
  const changed: number[] = [];
  for (let i = 0; i < current.length; i++) {
    if (current[i] !== previous[i]) changed.push(i);
  }
  if (changed.length !== 2) return null;
  const [a, b] = changed;
  if (previous[a] === current[b] && previous[b] === current[a]) {
    return { a, b };
  }
  return null;
};

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const getGraphNodeNames = (list: GraphAdjacency): string[] => {
  const set = new Set<string>();
  for (const item of list) {
    set.add(item.node);
    for (const edge of item.edges) set.add(edge.to);
  }
  return Array.from(set);
};

const applyForceLayoutStep = (
  positions: Record<string, { x: number; y: number }>,
  graph: GraphAdjacency,
  width: number,
  height: number
): Record<string, { x: number; y: number }> => {
  const nodes = Object.keys(positions);
  if (nodes.length <= 1) return positions;

  const forces: Record<string, { x: number; y: number }> = {};
  nodes.forEach(n => { forces[n] = { x: 0, y: 0 }; });

  const REPULSION = 3600;
  const SPRING = 0.04;
  const TARGET_LEN = 90;
  const DAMPING = 0.25;

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      const dx = positions[a].x - positions[b].x;
      const dy = positions[a].y - positions[b].y;
      const dist2 = Math.max(60, dx * dx + dy * dy);
      const dist = Math.sqrt(dist2);
      const force = REPULSION / dist2;
      const ux = dx / dist;
      const uy = dy / dist;
      forces[a].x += ux * force;
      forces[a].y += uy * force;
      forces[b].x -= ux * force;
      forces[b].y -= uy * force;
    }
  }

  for (const { node, edges } of graph) {
    for (const edge of edges) {
      if (!positions[edge.to]) continue;
      const dx = positions[edge.to].x - positions[node].x;
      const dy = positions[edge.to].y - positions[node].y;
      const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
      const stretch = dist - TARGET_LEN;
      const ux = dx / dist;
      const uy = dy / dist;
      const f = stretch * SPRING;
      forces[node].x += ux * f;
      forces[node].y += uy * f;
      forces[edge.to].x -= ux * f;
      forces[edge.to].y -= uy * f;
    }
  }

  const next: Record<string, { x: number; y: number }> = {};
  for (const n of nodes) {
    next[n] = {
      x: clamp(positions[n].x + forces[n].x * DAMPING, 20, width - 20),
      y: clamp(positions[n].y + forces[n].y * DAMPING, 20, height - 20),
    };
  }
  return next;
};

const getDefaultGraphLayout = (
  nodes: string[],
  width: number,
  height: number
): Record<string, { x: number; y: number }> => {
  const out: Record<string, { x: number; y: number }> = {};
  if (nodes.length === 0) return out;
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.max(40, Math.min(width, height) * 0.32);
  nodes.forEach((node, i) => {
    const angle = (Math.PI * 2 * i) / nodes.length;
    out[node] = {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  });
  return out;
};

const Canvas = ({
  step,
  learningMode,
  steps,
  currentStep,
}: {
  step: ExecutionStep | null;
  learningMode: boolean;
  steps: ExecutionStep[];
  currentStep: number;
}) => {
  const GRAPH_W = 560;
  const GRAPH_H = 300;

  const executedSteps = useMemo(
    () => (currentStep >= 0 ? steps.slice(0, currentStep + 1) : []),
    [steps, currentStep]
  );

  const prevStep = currentStep > 0 ? steps[currentStep - 1] : null;

  const variableHistory = useMemo(() => {
    const history: Record<string, { stepIndex: number; line: number; value: any }[]> = {};
    let prevVars: Record<string, any> = {};

    for (let i = 0; i < executedSteps.length; i++) {
      const vars = executedSteps[i].variables ?? {};
      for (const [name, value] of Object.entries(vars)) {
        const prev = prevVars[name];
        const changed = JSON.stringify(prev) !== JSON.stringify(value);
        if (!(name in prevVars) || changed) {
          if (!history[name]) history[name] = [];
          history[name].push({
            stepIndex: i,
            line: executedSteps[i].line,
            value,
          });
        }
      }
      prevVars = vars;
    }

    return history;
  }, [executedSteps]);

  const vars = useMemo(() => Object.entries(step?.variables ?? {}), [step]);
  const matrixEntries = useMemo(() => vars.filter(([, value]) => isPrimitiveMatrix(value)) as [string, Primitive[][]][], [vars]);
  const arrayEntries = useMemo(() => vars.filter(([, value]) => isPrimitiveArray(value) && !isPrimitiveMatrix(value)) as [string, Primitive[]][], [vars]);
  const objectEntries = useMemo(() => vars.filter(([, value]) => value && typeof value === "object" && !Array.isArray(value)) as [string, Record<string, any>][], [vars]);
  const linkedListEntries = useMemo(
    () => vars.map(([name, value]) => ({ name, nodes: toLinkedList(value) })).filter(v => v.nodes && v.nodes.length > 0) as Array<{ name: string; nodes: LinkedNode[] }>,
    [vars]
  );
  const treeEntries = useMemo(
    () => vars.map(([name, value]) => ({ name, levels: toTreeLevels(value) })).filter(v => v.levels && v.levels.length > 0) as Array<{ name: string; levels: Primitive[][] }>,
    [vars]
  );
  const graphEntries = useMemo(
    () => vars.map(([name, value]) => ({ name, list: toAdjacencyList(value) })).filter(v => v.list && v.list.length > 0) as Array<{ name: string; list: GraphAdjacency }>,
    [vars]
  );

  const [graphLayouts, setGraphLayouts] = useState<Record<string, Record<string, { x: number; y: number }>>>({});
  const [forceRelayoutEnabled, setForceRelayoutEnabled] = useState<boolean>(false);

  useEffect(() => {
    if (graphEntries.length === 0) return;
    setGraphLayouts(prev => {
      const next = { ...prev };
      for (const graph of graphEntries) {
        const nodes = getGraphNodeNames(graph.list);
        const existing = next[graph.name] ?? {};
        const missing = nodes.some(n => !existing[n]);
        if (!next[graph.name] || missing) {
          const defaults = getDefaultGraphLayout(nodes, GRAPH_W, GRAPH_H);
          next[graph.name] = { ...defaults, ...existing };
        }
      }
      return next;
    });
  }, [graphEntries]);

  useEffect(() => {
    if (!forceRelayoutEnabled || graphEntries.length === 0) return;
    const id = setInterval(() => {
      setGraphLayouts(prev => {
        const next = { ...prev };
        for (const graph of graphEntries) {
          const existing = next[graph.name];
          if (!existing) continue;
          next[graph.name] = applyForceLayoutStep(existing, graph.list, GRAPH_W, GRAPH_H);
        }
        return next;
      });
    }, 80);
    return () => clearInterval(id);
  }, [forceRelayoutEnabled, graphEntries]);

  if (!step) return (
    <div className="h-full flex items-center justify-center text-muted-foreground/40">
      <div className="text-center space-y-3">
        <Code2 className="w-16 h-16 mx-auto opacity-30" />
        <p className="font-display text-lg">Press Run or Step to begin</p>
        <p className="text-sm">Write code or load an example to visualize execution</p>
      </div>
    </div>
  );

  const pointerI = step.variables?.i;
  const pointerJ = step.variables?.j;
  const stackEntries = arrayEntries.filter(([name]) => /stack|stk/i.test(name));
  const queueEntries = arrayEntries.filter(([name]) => /queue|deque|q/i.test(name));

  return (
    <div className="h-full flex flex-col gap-3 p-4 overflow-auto">
      {matrixEntries.length > 0 && (
        <div className="glass-panel p-4">
          <h3 className="text-xs font-bold uppercase text-muted-foreground/70 mb-1 tracking-wider">
            2D Arrays: Navigate the Grid of Possibilities
          </h3>
          <p className="text-[11px] text-muted-foreground/80 mb-3 leading-relaxed">
            Step into the world of two-dimensional arrays, where data comes alive in rows and columns. Watch as we traverse matrices,
            solve grid-based puzzles, and manipulate game boards through interactive visualizations. See how 2D arrays power
            everything from image processing to tile-based games, making complex data structures beautifully simple.
          </p>

          <div className="space-y-3">
            {matrixEntries.map(([name, matrix]) => {
              const prevMatrix = isPrimitiveMatrix(prevStep?.variables?.[name]) ? prevStep.variables[name] as Primitive[][] : undefined;
              const changedCells = getChangedMatrixCells(matrix, prevMatrix);
              const activeRow = resolveVisualizerIndex(pointerI, matrix.length);
              const activeCol = resolveVisualizerIndex(pointerJ, matrix[0]?.length ?? 0);

              return (
                <div key={name} className="rounded-lg border border-neon-cyan/30 bg-[hsl(220,20%,7%)] p-3 overflow-auto">
                  <div className="text-[11px] font-mono text-neon-cyan mb-2">
                    {name} | {matrix.length} x {matrix[0]?.length ?? 0}
                  </div>

                  <div className="inline-grid gap-1.5" style={{ gridTemplateColumns: `36px repeat(${matrix[0]?.length ?? 0}, minmax(36px, 1fr))` }}>
                    <div />
                    {matrix[0]?.map((_, colIdx) => (
                      <div
                        key={`col-${name}-${colIdx}`}
                        className={`h-8 w-8 rounded flex items-center justify-center text-[10px] font-mono border ${
                          activeCol === colIdx ? "bg-neon-purple/30 border-neon-purple/60 text-neon-purple" : "bg-white/5 border-white/10 text-muted-foreground"
                        }`}
                      >
                        {colIdx}
                      </div>
                    ))}

                    {matrix.map((row, rowIdx) => (
                      <div key={`row-${name}-${rowIdx}`} className="contents">
                        <div
                          className={`h-8 w-8 rounded flex items-center justify-center text-[10px] font-mono border ${
                            activeRow === rowIdx ? "bg-neon-purple/30 border-neon-purple/60 text-neon-purple" : "bg-white/5 border-white/10 text-muted-foreground"
                          }`}
                        >
                          {rowIdx}
                        </div>

                        {row.map((cell, colIdx) => {
                          const changed = changedCells.has(`${rowIdx}:${colIdx}`);
                          const focused = activeRow === rowIdx && activeCol === colIdx;
                          return (
                            <motion.div
                              key={`cell-${name}-${rowIdx}-${colIdx}`}
                              initial={changed ? { scale: 0.92, opacity: 0.7 } : false}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ duration: 0.18 }}
                              className={`h-8 min-w-8 rounded flex items-center justify-center text-xs font-mono border relative ${
                                changed
                                  ? "bg-neon-cyan/25 border-neon-cyan/70 text-neon-cyan"
                                  : "bg-muted/20 border-white/10 text-foreground"
                              } ${focused ? "ring-2 ring-neon-purple/60" : ""}`}
                            >
                              {focused && <span className="absolute -top-2 text-[8px] px-1 rounded bg-neon-purple text-black font-bold">i,j</span>}
                              {formatVal(cell)}
                            </motion.div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {arrayEntries.length > 0 && (
        <div className="glass-panel p-4">
          <h3 className="text-xs font-bold uppercase text-muted-foreground/70 mb-1 tracking-wider">
            1D Array Flow
          </h3>
          <p className="text-[11px] text-muted-foreground/80 mb-3">
            Track index-by-index changes for linear data structures while loops and swaps execute.
          </p>

          <div className="space-y-3">
            {arrayEntries.map(([name, arr]) => {
              const prevArr = isPrimitiveArray(prevStep?.variables?.[name]) ? prevStep.variables[name] as Primitive[] : undefined;
              const changed = getChangedArrayIndices(arr, prevArr);
              const activeIdx = resolveVisualizerIndex(pointerI, arr.length);
              const swap = detectSwapPair(arr, prevArr);
              const laneWidth = Math.max(arr.length * 54, 80);

              return (
                <div key={name} className="rounded-lg border border-neon-purple/30 bg-[hsl(220,20%,7%)] p-3 overflow-auto">
                  <div className="text-[11px] font-mono text-neon-purple mb-2">{name} | length {arr.length}</div>
                  <div className="relative" style={{ width: `${laneWidth}px` }}>
                    {swap && (
                      <svg className="absolute left-0 top-3 pointer-events-none" width={laneWidth} height={42}>
                        <motion.path
                          d={`M ${swap.a * 54 + 27} 30 Q ${(swap.a * 54 + swap.b * 54) / 2 + 27} 2 ${swap.b * 54 + 27} 30`}
                          fill="none"
                          stroke="rgba(34, 211, 238, 0.9)"
                          strokeWidth={2}
                          initial={{ pathLength: 0, opacity: 0.25 }}
                          animate={{ pathLength: 1, opacity: 1 }}
                          transition={{ duration: 0.35 }}
                        />
                        <motion.circle
                          r={4}
                          cy={30}
                          fill="rgba(34, 211, 238, 1)"
                          initial={{ cx: swap.a * 54 + 27, opacity: 0.3 }}
                          animate={{ cx: swap.b * 54 + 27, opacity: 1 }}
                          transition={{ duration: 0.35 }}
                        />
                      </svg>
                    )}

                    <div className="flex gap-1.5 relative z-10 pt-7">
                      {arr.map((v, idx) => (
                        <div key={`${name}-${idx}`} className="flex flex-col items-center gap-1 w-12">
                          <span className={`text-[9px] font-mono ${activeIdx === idx ? "text-neon-purple" : "text-muted-foreground"}`}>{idx}</span>
                          <motion.div
                            initial={changed.has(idx) ? { y: -4, opacity: 0.7 } : false}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.16 }}
                            className={`w-12 h-8 px-2 rounded border flex items-center justify-center text-xs font-mono ${
                              changed.has(idx)
                                ? "bg-neon-purple/25 border-neon-purple/70 text-neon-purple"
                                : "bg-muted/20 border-white/10 text-foreground"
                            } ${activeIdx === idx ? "ring-1 ring-neon-purple/60" : ""}`}
                          >
                            {formatVal(v)}
                          </motion.div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {objectEntries.length > 0 && (
        <div className="glass-panel p-4">
          <h3 className="text-xs font-bold uppercase text-muted-foreground/70 mb-1 tracking-wider">
            Object State Map
          </h3>
          <p className="text-[11px] text-muted-foreground/80 mb-3">
            Observe object/class instances as live key-value maps to understand state transitions over time.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            {objectEntries.map(([name, obj]) => (
              <div key={name} className="rounded-lg border border-cyan-500/30 bg-[hsl(220,20%,7%)] p-3">
                <p className="text-[11px] font-mono text-cyan-400 mb-2">
                  {name}
                  {typeof obj.__class === "string" ? ` : ${obj.__class}` : ""}
                </p>
                <div className="space-y-1.5">
                  {Object.entries(obj).map(([k, v]) => (
                    <div key={`${name}-${k}`} className="rounded bg-white/5 border border-white/10 px-2 py-1 text-[10px] font-mono flex items-start justify-between gap-2">
                      <span className="text-muted-foreground">{k}</span>
                      <span className="text-foreground break-all text-right">{formatVal(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {stackEntries.length > 0 && (
        <div className="glass-panel p-4">
          <h3 className="text-xs font-bold uppercase text-muted-foreground/70 mb-1 tracking-wider">Stack Lane</h3>
          <p className="text-[11px] text-muted-foreground/80 mb-3">Visualize LIFO behavior from bottom to top.</p>
          <div className="space-y-3">
            {stackEntries.map(([name, arr]) => {
              const top = arr.length - 1;
              return (
                <div key={`stack-${name}`} className="rounded-lg border border-amber-500/30 bg-[hsl(220,20%,7%)] p-3 inline-flex flex-col gap-1">
                  <div className="text-[11px] font-mono text-amber-300 mb-1">{name} (top index {top})</div>
                  {arr.length === 0 ? (
                    <div className="text-[10px] text-muted-foreground">empty</div>
                  ) : (
                    [...arr].map((v, idx) => {
                      const actual = arr.length - 1 - idx;
                      const isTop = actual === top;
                      return (
                        <div
                          key={`${name}-stack-${actual}`}
                          className={`h-8 min-w-20 px-2 rounded border text-xs font-mono flex items-center justify-between ${
                            isTop ? 'bg-amber-400/20 border-amber-400/60 text-amber-300' : 'bg-muted/20 border-white/10 text-foreground'
                          }`}
                        >
                          <span>{actual}</span>
                          <span>{formatVal(arr[actual])}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {queueEntries.length > 0 && (
        <div className="glass-panel p-4">
          <h3 className="text-xs font-bold uppercase text-muted-foreground/70 mb-1 tracking-wider">Queue Lane</h3>
          <p className="text-[11px] text-muted-foreground/80 mb-3">Visualize FIFO behavior from front to rear.</p>
          <div className="space-y-3">
            {queueEntries.map(([name, arr]) => (
              <div key={`queue-${name}`} className="rounded-lg border border-emerald-500/30 bg-[hsl(220,20%,7%)] p-3 overflow-auto">
                <div className="text-[11px] font-mono text-emerald-300 mb-2">{name} (front 0, rear {Math.max(0, arr.length - 1)})</div>
                <div className="flex items-center gap-1.5">
                  {arr.map((v, idx) => (
                    <div
                      key={`${name}-queue-${idx}`}
                      className={`min-w-12 h-8 px-2 rounded border text-xs font-mono flex items-center justify-center ${
                        idx === 0
                          ? 'bg-emerald-400/20 border-emerald-400/60 text-emerald-300'
                          : idx === arr.length - 1
                            ? 'bg-cyan-400/20 border-cyan-400/60 text-cyan-300'
                            : 'bg-muted/20 border-white/10 text-foreground'
                      }`}
                    >
                      {formatVal(v)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {linkedListEntries.length > 0 && (
        <div className="glass-panel p-4">
          <h3 className="text-xs font-bold uppercase text-muted-foreground/70 mb-1 tracking-wider">Linked List Chain</h3>
          <p className="text-[11px] text-muted-foreground/80 mb-3">Follow node-by-node pointers through a linked structure.</p>
          <div className="space-y-3">
            {linkedListEntries.map(({ name, nodes }) => (
              <div key={`list-${name}`} className="rounded-lg border border-blue-500/30 bg-[hsl(220,20%,7%)] p-3 overflow-auto">
                <div className="text-[11px] font-mono text-blue-300 mb-2">{name}</div>
                <div className="flex items-center gap-2">
                  {nodes.map((node, idx) => (
                    <div key={`${name}-${node.id}`} className="flex items-center gap-2">
                      <div className="min-w-16 h-8 px-2 rounded border border-blue-400/60 bg-blue-400/20 text-blue-200 text-xs font-mono flex items-center justify-center">
                        {formatVal(node.label)}
                      </div>
                      {idx < nodes.length - 1 && <span className="text-blue-300 text-xs font-mono">-&gt;</span>}
                    </div>
                  ))}
                  <span className="text-xs text-muted-foreground font-mono">null</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {treeEntries.length > 0 && (
        <div className="glass-panel p-4">
          <h3 className="text-xs font-bold uppercase text-muted-foreground/70 mb-1 tracking-wider">Tree Levels</h3>
          <p className="text-[11px] text-muted-foreground/80 mb-3">Inspect hierarchical nodes level-by-level.</p>
          <div className="space-y-3">
            {treeEntries.map(({ name, levels }) => (
              <div key={`tree-${name}`} className="rounded-lg border border-fuchsia-500/30 bg-[hsl(220,20%,7%)] p-3">
                <div className="text-[11px] font-mono text-fuchsia-300 mb-2">{name}</div>
                <div className="relative overflow-auto" style={{ minHeight: `${levels.length * 74 + 24}px` }}>
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    {levels.slice(0, -1).map((level, li) => {
                      const nextLevel = levels[li + 1] ?? [];
                      return level.map((parent, pi) => {
                        if (parent === null) return null;
                        const children = [2 * pi, 2 * pi + 1];
                        return children.map(ci => {
                          if (ci >= nextLevel.length || nextLevel[ci] === null) return null;
                          const parentX = ((pi + 0.5) / level.length) * 100;
                          const parentY = 22 + li * 74;
                          const childX = ((ci + 0.5) / nextLevel.length) * 100;
                          const childY = 22 + (li + 1) * 74;
                          return (
                            <motion.line
                              key={`edge-${name}-${li}-${pi}-${ci}`}
                              x1={`${parentX}%`}
                              y1={parentY}
                              x2={`${childX}%`}
                              y2={childY}
                              stroke="rgba(232, 121, 249, 0.7)"
                              strokeWidth={1.5}
                              initial={{ pathLength: 0, opacity: 0.2 }}
                              animate={{ pathLength: 1, opacity: 0.9 }}
                              transition={{ duration: 0.25 }}
                            />
                          );
                        });
                      });
                    })}
                  </svg>

                  <div className="relative z-10 space-y-10 pt-1">
                    {levels.map((level, li) => (
                      <div key={`${name}-level-${li}`} className="flex gap-1.5 justify-center flex-nowrap">
                        {level.map((node, ni) => (
                          <motion.div
                            key={`${name}-${li}-${ni}`}
                            initial={{ scale: 0.95, opacity: 0.65 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className={`min-w-10 h-8 px-2 rounded border text-xs font-mono flex items-center justify-center ${
                              node === null
                                ? 'bg-white/5 border-white/10 text-muted-foreground/60'
                                : 'bg-fuchsia-400/20 border-fuchsia-400/60 text-fuchsia-200'
                            }`}
                          >
                            {node === null ? '-' : formatVal(node)}
                          </motion.div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {graphEntries.length > 0 && (
        <div className="glass-panel p-4">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="text-xs font-bold uppercase text-muted-foreground/70 tracking-wider">Graph Adjacency Map</h3>
            <Button
              size="sm"
              variant={forceRelayoutEnabled ? "default" : "secondary"}
              className="h-6 text-[10px] px-2"
              onClick={() => setForceRelayoutEnabled(v => !v)}
            >
              {forceRelayoutEnabled ? "Force Layout: On" : "Force Layout: Off"}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground/80 mb-3">Drag nodes around and watch animated edges keep the graph alive.</p>
          <div className="space-y-3">
            {graphEntries.map(({ name, list }) => (
              <div key={`graph-${name}`} className="rounded-lg border border-lime-500/30 bg-[hsl(220,20%,7%)] p-3 overflow-auto">
                <div className="text-[11px] font-mono text-lime-300 mb-2">{name}</div>
                <div className="relative rounded border border-white/10 bg-black/20" style={{ width: `${GRAPH_W}px`, height: `${GRAPH_H}px` }}>
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <defs>
                      <marker
                        id={`arrow-${name}`}
                        viewBox="0 0 10 10"
                        refX="8"
                        refY="5"
                        markerWidth="6"
                        markerHeight="6"
                        orient="auto-start-reverse"
                      >
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(163, 230, 53, 0.95)" />
                      </marker>
                    </defs>
                    {list.flatMap(({ node, edges }) => edges.map((edge, ei) => {
                      const to = edge.to;
                      const fromPos = graphLayouts[name]?.[node];
                      const toPos = graphLayouts[name]?.[to];
                      if (!fromPos || !toPos) return null;
                      const dx = toPos.x - fromPos.x;
                      const dy = toPos.y - fromPos.y;
                      const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
                      const ux = dx / dist;
                      const uy = dy / dist;
                      const startX = fromPos.x + ux * 18;
                      const startY = fromPos.y + uy * 18;
                      const endX = toPos.x - ux * 18;
                      const endY = toPos.y - uy * 18;
                      const midX = (startX + endX) / 2;
                      const midY = (startY + endY) / 2;
                      return (
                        <g key={`graph-edge-${name}-${node}-${to}-${ei}`}>
                          <motion.line
                            x1={startX}
                            y1={startY}
                            x2={endX}
                            y2={endY}
                            stroke="rgba(163, 230, 53, 0.75)"
                            strokeWidth={1.8}
                            markerEnd={`url(#arrow-${name})`}
                            initial={{ pathLength: 0, opacity: 0.25 }}
                            animate={{ pathLength: 1, opacity: 0.95 }}
                            transition={{ duration: 0.3 }}
                          />
                          {edge.weight !== undefined && (
                            <text
                              x={midX}
                              y={midY - 6}
                              textAnchor="middle"
                              fontSize="10"
                              fill="rgba(163, 230, 53, 0.95)"
                              stroke="rgba(0,0,0,0.45)"
                              strokeWidth="2"
                              paintOrder="stroke"
                            >
                              {String(edge.weight)}
                            </text>
                          )}
                        </g>
                      );
                    }))}
                  </svg>

                  {getGraphNodeNames(list).map(node => {
                    const pos = graphLayouts[name]?.[node];
                    if (!pos) return null;
                    return (
                      <motion.div
                        key={`graph-node-${name}-${node}`}
                        drag
                        dragMomentum={false}
                        onDragEnd={(_, info) => {
                          setGraphLayouts(prev => {
                            const g = prev[name] ?? {};
                            const current = g[node] ?? pos;
                            const nextX = clamp(current.x + info.offset.x, 20, GRAPH_W - 20);
                            const nextY = clamp(current.y + info.offset.y, 20, GRAPH_H - 20);
                            return {
                              ...prev,
                              [name]: {
                                ...g,
                                [node]: { x: nextX, y: nextY },
                              },
                            };
                          });
                        }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 h-9 min-w-9 px-2 rounded-full border border-lime-400/70 bg-lime-400/20 text-lime-200 text-xs font-mono flex items-center justify-center cursor-grab active:cursor-grabbing"
                        style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
                      >
                        {node}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {learningMode && (
        <motion.div
          key={step.explanation}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-3 border-l-4 border-neon-cyan"
        >
          <p className="text-sm font-body">Insight: {step.explanation}</p>
        </motion.div>
      )}

      <motion.div
        key={`${step.line}-${step.type}`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel p-4"
      >
        <div className="flex items-center gap-3 mb-2">
          <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
            step.type.includes("condition_true") ? "bg-green-500/20 text-green-400" :
            step.type.includes("condition_false") ? "bg-red-500/20 text-red-400" :
            step.type === "function_call" ? "bg-blue-500/20 text-blue-400" :
            step.type === "function_return" ? "bg-amber-500/20 text-amber-400" :
            step.type === "print" ? "bg-cyan-500/20 text-cyan-400" :
            step.type.includes("loop") ? "bg-purple-500/20 text-purple-400" :
            "bg-white/10 text-muted-foreground"
          }`}>
            {step.type.replace("_", " ")}
          </span>
          <span className="text-xs text-muted-foreground font-mono">
            Line {step.line + 1}
          </span>
        </div>
        <p className="font-mono text-sm text-foreground">{step.explanation}</p>
      </motion.div>

      <div className="glass-panel p-4">
        <h3 className="text-xs font-bold uppercase text-muted-foreground/70 mb-3">
          Statement History
        </h3>
        <div className="max-h-44 overflow-auto space-y-1.5 pr-1">
          {executedSteps.length === 0 ? (
            <p className="text-[10px] text-muted-foreground/60">No statements executed yet</p>
          ) : (
            executedSteps.map((s, idx) => {
              const isCurrent = idx === currentStep;
              return (
                <div
                  key={`${idx}-${s.line}-${s.type}`}
                  className={`rounded px-2 py-1 border text-[10px] font-mono ${
                    isCurrent
                      ? "bg-neon-cyan/15 border-neon-cyan/40 text-neon-cyan"
                      : "bg-muted/20 border-white/10 text-foreground/80"
                  }`}
                >
                  <span className="mr-2 text-muted-foreground">#{idx + 1}</span>
                  <span className="mr-2">L{s.line + 1}</span>
                  <span>{s.explanation}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="glass-panel p-4">
        <h3 className="text-xs font-bold uppercase text-muted-foreground/70 mb-3">
          Variables
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {vars.map(([name, value]) => (
            <div key={name} className="bg-neon-purple/10 rounded p-2 text-center">
              <p className="text-[10px] text-muted-foreground">{name}</p>
              <p className="font-mono text-sm text-neon-purple">{formatVal(value)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel p-4">
        <h3 className="text-xs font-bold uppercase text-muted-foreground/70 mb-3">
          Variable Value History
        </h3>
        <div className="max-h-48 overflow-auto space-y-2 pr-1">
          {Object.keys(variableHistory).length === 0 ? (
            <p className="text-[10px] text-muted-foreground/60">No variable changes tracked yet</p>
          ) : (
            Object.entries(variableHistory).map(([name, records]) => (
              <div key={name} className="rounded border border-white/10 bg-muted/15 p-2">
                <p className="text-[11px] font-bold text-neon-purple mb-1">{name}</p>
                <div className="space-y-1">
                  {records.slice(-6).map((r, i) => (
                    <p key={`${name}-${i}-${r.stepIndex}`} className="text-[10px] font-mono text-foreground/85">
                      STEP {r.stepIndex + 1} | L{r.line + 1} | {formatVal(r.value)}
                    </p>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="glass-panel p-4">
        <h3 className="text-xs font-bold uppercase text-muted-foreground/70 mb-2">
          Output
        </h3>
        <div className="font-mono text-sm bg-[hsl(220,20%,6%)] rounded p-2 min-h-[2.5rem]">
          {step.output.map((line, i) => (
            <div key={i} className="text-neon-cyan">{line}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface SavedSnippet {
  id: string;
  name: string;
  language: string;
  code: string;
  description: string;
}

const VisualCodeLab = () => {
  const { user } = useAuth();
  const [language, setLanguage] = useState<Language>("python");
  const [code, setCode] = useState(() => {
    try {
      return localStorage.getItem("vcl-code") ?? getStarterCode("python");
    } catch {
      return getStarterCode("python");
    }
  });
  const [steps, setSteps] = useState<ExecutionStep[]>([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [runMode, setRunMode] = useState<"manual" | "auto">("manual");
  const [speed, setSpeed] = useState(1);
  const [learningMode, setLearningMode] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExamples, setShowExamples] = useState(false);
  const [savedSnippets, setSavedSnippets] = useState<SavedSnippet[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [snippetName, setSnippetName] = useState("");
  const [snippetDesc, setSnippetDesc] = useState("");
  const [showSaved, setShowSaved] = useState(false);
  const runTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filteredExamples = examples.filter(e => e.language === language);

  useEffect(() => {
    if (!user) { setSavedSnippets([]); return; }
    supabase.from("user_code_snippets").select("*").eq("user_id", user.id).order("updated_at", { ascending: false })
      .then(({ data }) => { if (data) setSavedSnippets(data as any); });
  }, [user]);

  const saveSnippet = async () => {
    if (!user || !snippetName.trim()) return;
    const { data, error: err } = await supabase.from("user_code_snippets")
      .insert({ user_id: user.id, name: snippetName.trim(), language, code, description: snippetDesc.trim() })
      .select().single();
    if (data && !err) {
      setSavedSnippets(prev => [data as any, ...prev]);
      toast.success("Snippet saved!");
      setShowSaveDialog(false);
      setSnippetName("");
      setSnippetDesc("");
    } else { toast.error("Failed to save"); }
  };

  const deleteSnippet = async (id: string) => {
    if (!user) return;
    await supabase.from("user_code_snippets").delete().eq("id", id).eq("user_id", user.id);
    setSavedSnippets(prev => prev.filter(s => s.id !== id));
    toast.success("Snippet deleted");
  };

  const handleRun = useCallback(() => {
    try {
      const traced = traceCode(code, language);
      setSteps(traced);
      setCurrentStep(0);
      setError(null);
      setIsRunning(runMode === "auto");
    } catch (e: any) {
      setError(e.message || String(e));
      setIsRunning(false);
    }
  }, [code, language, runMode]);

  const handleToggleRunMode = useCallback(() => {
    setRunMode(prev => {
      const next = prev === "auto" ? "manual" : "auto";
      if (next === "manual") {
        setIsRunning(false);
        if (runTimer.current) clearTimeout(runTimer.current);
      }
      return next;
    });
  }, []);

  const handleStep = useCallback(() => {
    if (steps.length === 0) {
      try {
        const traced = traceCode(code, language);
        setSteps(traced);
        setCurrentStep(0);
        setError(null);
      } catch (e: any) { setError(e.message || String(e)); }
      return;
    }
    if (currentStep < steps.length - 1) setCurrentStep(p => p + 1);
  }, [steps, currentStep, code, language]);

  const handleReset = useCallback(() => {
    setSteps([]);
    setCurrentStep(-1);
    setIsRunning(false);
    setError(null);
    if (runTimer.current) clearTimeout(runTimer.current);
  }, []);

  const handlePause = useCallback(() => {
    setIsRunning(false);
    if (runTimer.current) clearTimeout(runTimer.current);
  }, []);

  useEffect(() => {
    if (isRunning && currentStep < steps.length - 1) {
      runTimer.current = setTimeout(() => setCurrentStep(p => p + 1), 800 / speed);
      return () => { if (runTimer.current) clearTimeout(runTimer.current); };
    }
    if (isRunning && currentStep >= steps.length - 1) setIsRunning(false);
  }, [isRunning, currentStep, steps.length, speed]);

  useEffect(() => { localStorage.setItem("vcl-code", code); }, [code]);

  const stepData = steps[currentStep] ?? null;

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <ParticleBackground />

      <div className="relative z-20 flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-background/90 backdrop-blur-xl flex-wrap">
        <Link to="/" className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="font-display text-base sm:text-lg font-bold text-foreground mr-2">VisualCode Lab</h1>

        <select
          value={language}
          onChange={e => {
            const nextLang = e.target.value as Language;
            setLanguage(nextLang);
            setCode(getStarterCode(nextLang));
            handleReset();
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

        <div className="h-5 w-px bg-white/10 mx-1 hidden sm:block" />

        <Button size="sm" variant="default" onClick={handleRun} disabled={isRunning} className="gap-1 text-xs h-7">
          <Play size={12} /> Run
        </Button>
        <Button size="sm" variant="secondary" onClick={handleToggleRunMode} className="gap-1 text-xs h-7">
          {runMode === "auto" ? <Zap size={12} /> : <Hand size={12} />}
          {runMode === "auto" ? "Auto" : "Manual"}
        </Button>
        <Button size="sm" variant="secondary" onClick={handleStep} className="gap-1 text-xs h-7">
          <SkipForward size={12} /> Step
        </Button>
        <Button size="sm" variant="secondary" onClick={handlePause} disabled={!isRunning} className="gap-1 text-xs h-7">
          <Pause size={12} />
        </Button>
        <Button size="sm" variant="secondary" onClick={handleReset} className="gap-1 text-xs h-7">
          <RotateCcw size={12} />
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setCode(starterCodeByLanguage[language]);
            handleReset();
          }}
          className="gap-1 text-xs h-7"
        >
          <FolderOpen size={12} /> New Code
        </Button>

        <div className="hidden sm:flex items-center gap-2 ml-2">
          <span className="text-[10px] text-muted-foreground">{speed}x</span>
          <Slider
            min={0.25} max={2} step={0.25}
            value={[speed]}
            onValueChange={([v]) => setSpeed(v)}
            className="w-20"
          />
        </div>

        <span className="text-[10px] font-mono text-muted-foreground ml-auto mr-2">
          {currentStep >= 0 ? `Step ${currentStep + 1}/${steps.length}` : "-"}
        </span>

        <div className="flex items-center gap-1.5">
          <BookOpen size={12} className="text-muted-foreground" />
          <Switch checked={learningMode} onCheckedChange={setLearningMode} className="scale-75" />
          <span className="text-[10px] text-muted-foreground">Learn</span>
        </div>
      </div>

      {error && (
        <div className="relative z-20 px-4 py-2 bg-destructive/20 border-b border-destructive/30 text-destructive text-xs font-mono">
          Warning: {error}
        </div>
      )}

      <div className="relative z-10 flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <Canvas step={stepData} learningMode={learningMode} steps={steps} currentStep={currentStep} />
        </div>

        <div className="w-80 lg:w-96 border-l border-white/10 flex flex-col bg-background/80 backdrop-blur-xl overflow-hidden hidden md:flex">
          <button
            onClick={() => { setShowExamples(!showExamples); setShowSaved(false); }}
            className="flex items-center gap-2 px-3 py-2 border-b border-white/10 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight size={12} className={`transition-transform ${showExamples ? "rotate-90" : ""}`} />
            Examples ({filteredExamples.length})
          </button>

          {showExamples && (
            <div className="border-b border-white/10 max-h-48 overflow-auto p-2 space-y-1">
              {filteredExamples.map(ex => (
                <button
                  key={ex.name}
                  onClick={() => { setCode(ex.code); handleReset(); setShowExamples(false); }}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-muted/50 transition-colors group"
                >
                  <p className="text-xs font-bold text-foreground group-hover:text-neon-cyan transition-colors">{ex.name}</p>
                  <p className="text-[10px] text-muted-foreground">{ex.description}</p>
                </button>
              ))}
            </div>
          )}

          {user && (
            <>
              <button
                onClick={() => { setShowSaved(!showSaved); setShowExamples(false); }}
                className="flex items-center gap-2 px-3 py-2 border-b border-white/10 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronRight size={12} className={`transition-transform ${showSaved ? "rotate-90" : ""}`} />
                My Snippets ({savedSnippets.filter(s => s.language === language).length})
              </button>

              {showSaved && (
                <div className="border-b border-white/10 max-h-48 overflow-auto p-2 space-y-1">
                  {savedSnippets.filter(s => s.language === language).length === 0 ? (
                    <p className="text-[10px] text-muted-foreground/50 italic px-3 py-2">No saved snippets yet</p>
                  ) : savedSnippets.filter(s => s.language === language).map(s => (
                    <div key={s.id} className="flex items-center gap-1">
                      <button
                        onClick={() => { setCode(s.code); handleReset(); setShowSaved(false); }}
                        className="flex-1 text-left px-3 py-2 rounded-md hover:bg-muted/50 transition-colors group"
                      >
                        <p className="text-xs font-bold text-foreground group-hover:text-neon-cyan transition-colors">{s.name}</p>
                        {s.description && <p className="text-[10px] text-muted-foreground">{s.description}</p>}
                      </button>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive shrink-0" onClick={() => deleteSnippet(s.id)}>
                        <Trash2 size={10} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {user && (
            <div className="px-2 py-1.5 border-b border-white/10">
              {showSaveDialog ? (
                <div className="space-y-1.5">
                  <input value={snippetName} onChange={e => setSnippetName(e.target.value)} placeholder="Snippet name..." className="w-full px-2 py-1.5 rounded bg-muted/30 border border-white/10 text-xs text-foreground outline-none" />
                  <input value={snippetDesc} onChange={e => setSnippetDesc(e.target.value)} placeholder="Description (optional)..." className="w-full px-2 py-1.5 rounded bg-muted/30 border border-white/10 text-xs text-foreground outline-none" />
                  <div className="flex gap-1">
                    <Button size="sm" className="text-xs h-6 flex-1" onClick={saveSnippet} disabled={!snippetName.trim()}>Save</Button>
                    <Button size="sm" variant="ghost" className="text-xs h-6" onClick={() => setShowSaveDialog(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <Button size="sm" variant="secondary" className="w-full text-xs h-7 gap-1" onClick={() => setShowSaveDialog(true)}>
                  <Save size={12} /> Save Snippet
                </Button>
              )}
            </div>
          )}

          <div className="flex-1 overflow-hidden p-2">
            <CodeEditor code={code} onChange={c => { setCode(c); handleReset(); }} currentLine={stepData?.line ?? -1} />
          </div>
        </div>
      </div>

      <div className="md:hidden fixed bottom-4 right-4 z-30">
        <Button size="icon" variant="secondary" onClick={() => setShowExamples(!showExamples)} className="rounded-full shadow-lg w-12 h-12">
          <Code2 size={20} />
        </Button>
      </div>

      {showExamples && (
        <div className="md:hidden fixed inset-0 z-40 bg-background/95 backdrop-blur-xl p-4 overflow-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-display font-bold">Code & Examples</h2>
            <Button size="sm" variant="ghost" onClick={() => setShowExamples(false)}>Close</Button>
          </div>
          <div className="space-y-2 mb-4">
            {filteredExamples.map(ex => (
              <button
                key={ex.name}
                onClick={() => { setCode(ex.code); handleReset(); setShowExamples(false); }}
                className="w-full text-left px-3 py-2 rounded-md glass-panel"
              >
                <p className="text-sm font-bold">{ex.name}</p>
                <p className="text-xs text-muted-foreground">{ex.description}</p>
              </button>
            ))}
          </div>
          <div className="h-64">
            <CodeEditor code={code} onChange={c => { setCode(c); handleReset(); }} currentLine={stepData?.line ?? -1} />
          </div>
        </div>
      )}
    </div>
  );
};

export default VisualCodeLab;
