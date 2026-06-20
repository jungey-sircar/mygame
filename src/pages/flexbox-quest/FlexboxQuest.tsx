import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ThemeToggle from "@/components/ThemeToggle";
import ParticleBackground from "@/components/ParticleBackground";
import levels, { type Level } from "./levels";

// ─── Constants ──────────────────────────────────────────────────────
const STORAGE_KEY = "flexbox-quest-progress";

// ─── Frog colors ────────────────────────────────────────────────────
const FROG_COLORS: Record<string, { bg: string; lilyBg: string; emoji: string }> = {
  green:  { bg: "hsl(140,60%,45%)", lilyBg: "hsl(140,50%,30%)", emoji: "🐸" },
  yellow: { bg: "hsl(50,90%,55%)",  lilyBg: "hsl(50,60%,35%)",  emoji: "🐸" },
  red:    { bg: "hsl(0,70%,50%)",   lilyBg: "hsl(0,50%,35%)",   emoji: "🐸" },
};

// ─── CSS Parser ─────────────────────────────────────────────────────
function parseCSS(raw: string): Record<string, string> {
  const props: Record<string, string> = {};
  raw.split(/[;\n]/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("/*")) return;
    const colonIdx = trimmed.indexOf(":");
    if (colonIdx === -1) return;
    const key = trimmed.slice(0, colonIdx).trim();
    const val = trimmed.slice(colonIdx + 1).trim().replace(/;$/, "");
    if (key && val) props[key] = val;
  });
  return props;
}

function normalizeAnswer(answer: string): Record<string, string> {
  return parseCSS(answer);
}

function checkAnswer(userCSS: string, level: Level): boolean {
  const expected = normalizeAnswer(level.answer);
  const userProps = parseCSS(userCSS);
  // Check all expected properties exist with correct values
  for (const [key, val] of Object.entries(expected)) {
    if (!userProps[key]) return false;
    if (userProps[key].replace(/\s+/g, " ").trim() !== val.replace(/\s+/g, " ").trim()) return false;
  }
  return true;
}

// ─── Save / Load ────────────────────────────────────────────────────
function loadProgress(): { current: number; solved: Set<number> } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      return { current: data.current ?? 0, solved: new Set(data.solved ?? []) };
    }
  } catch { /* ignore */ }
  return { current: 0, solved: new Set() };
}

function saveProgress(current: number, solved: Set<number>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ current, solved: [...solved] }));
}

// ─── Component ──────────────────────────────────────────────────────
const FlexboxQuest = () => {
  const saved = useMemo(() => loadProgress(), []);
  const [levelIdx, setLevelIdx] = useState(saved.current);
  const [solved, setSolved] = useState<Set<number>>(saved.solved);
  const [code, setCode] = useState("");
  const [win, setWin] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showLevels, setShowLevels] = useState(false);
  const [shake, setShake] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const level = levels[levelIdx];

  // Reset code when level changes
  useEffect(() => {
    setCode("");
    setWin(false);
    setShowHint(false);
    setShake(false);
  }, [levelIdx]);

  // Save progress
  useEffect(() => {
    saveProgress(levelIdx, solved);
  }, [levelIdx, solved]);

  // Check solution
  const handleCheck = useCallback(() => {
    if (checkAnswer(code, level)) {
      setWin(true);
      setSolved((prev) => new Set([...prev, level.id]));
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 600);
    }
  }, [code, level]);

  // Handle Enter key (Ctrl+Enter or just Enter)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        // Allow Enter for new lines, but Ctrl/Cmd+Enter to submit
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          handleCheck();
        }
      }
    },
    [handleCheck]
  );

  const nextLevel = useCallback(() => {
    if (levelIdx < levels.length - 1) {
      setLevelIdx(levelIdx + 1);
    }
  }, [levelIdx]);

  const goToLevel = useCallback((idx: number) => {
    setLevelIdx(idx);
    setShowLevels(false);
  }, []);

  const resetProgress = useCallback(() => {
    setSolved(new Set());
    setLevelIdx(0);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Build the dynamic CSS for the pond
  const pondStyle = useMemo(() => {
    const userProps = parseCSS(code);
    // Extract the before block's CSS for the #pond
    const beforeProps = parseCSS(level.before.replace("#pond {", "").replace("}", ""));
    const allProps = { ...beforeProps, ...userProps };
    const style: React.CSSProperties = { display: "flex" };

    // Map CSS props to React CSSProperties
    if (allProps["justify-content"]) style.justifyContent = allProps["justify-content"];
    if (allProps["align-items"]) style.alignItems = allProps["align-items"];
    if (allProps["flex-direction"]) style.flexDirection = allProps["flex-direction"] as any;
    if (allProps["flex-wrap"]) style.flexWrap = allProps["flex-wrap"] as any;
    if (allProps["align-content"]) style.alignContent = allProps["align-content"];
    if (allProps["flex-flow"]) {
      const parts = allProps["flex-flow"].split(/\s+/);
      if (parts[0]) style.flexDirection = parts[0] as any;
      if (parts[1]) style.flexWrap = parts[1] as any;
    }

    return style;
  }, [code, level]);

  // Build the target CSS for lily pads (using the answer)
  const targetStyle = useMemo(() => {
    const answerProps = normalizeAnswer(level.answer);
    const beforeProps = parseCSS(level.before.replace("#pond {", "").replace("}", ""));
    const allProps = { ...beforeProps, ...answerProps };
    const style: React.CSSProperties = { display: "flex" };

    if (allProps["justify-content"]) style.justifyContent = allProps["justify-content"];
    if (allProps["align-items"]) style.alignItems = allProps["align-items"];
    if (allProps["flex-direction"]) style.flexDirection = allProps["flex-direction"] as any;
    if (allProps["flex-wrap"]) style.flexWrap = allProps["flex-wrap"] as any;
    if (allProps["align-content"]) style.alignContent = allProps["align-content"];
    if (allProps["flex-flow"]) {
      const parts = allProps["flex-flow"].split(/\s+/);
      if (parts[0]) style.flexDirection = parts[0] as any;
      if (parts[1]) style.flexWrap = parts[1] as any;
    }

    return style;
  }, [level]);

  // Individual frog styles (for order, align-self)
  const frogStyles = useMemo(() => {
    const userProps = parseCSS(code);
    return level.board.frogs.map((frog) => {
      const style: React.CSSProperties = {};
      if (frog.selector) {
        if (userProps["order"]) style.order = parseInt(userProps["order"]) || 0;
        if (userProps["align-self"]) style.alignSelf = userProps["align-self"];
      }
      return style;
    });
  }, [code, level]);

  // Individual lily pad styles (using answer for targeted frogs)
  const lilyStyles = useMemo(() => {
    const answerProps = normalizeAnswer(level.answer);
    return level.board.frogs.map((frog) => {
      const style: React.CSSProperties = {};
      if (frog.selector) {
        if (answerProps["order"]) style.order = parseInt(answerProps["order"]) || 0;
        if (answerProps["align-self"]) style.alignSelf = answerProps["align-self"];
      }
      return style;
    });
  }, [level]);

  // Build the syntax-highlighted before/after display
  const beforeLines = level.before.split("\n");
  const afterLines = level.after.split("\n");

  // Count total lines for line numbers
  const codeLines = code.split("\n").length;
  const totalLines = beforeLines.length + codeLines + afterLines.length;

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <ParticleBackground />

      {/* ─── Top Bar ─── */}
      <div className="relative z-20 flex items-center justify-between px-4 py-2.5 border-b border-border bg-background/90 backdrop-blur-xl flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/" className="font-display text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Back
          </Link>
          <h1 className="font-display text-lg font-bold text-foreground">
            🐸 Flexbox Quest
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Level Counter */}
          <div className="relative">
            <button
              onClick={() => setShowLevels(!showLevels)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/30 border border-border text-sm font-display font-bold text-foreground hover:bg-muted/50 transition-colors"
            >
              <span className="text-xs text-muted-foreground">Level</span>
              <span className="text-neon-cyan">{level.id}</span>
              <span className="text-muted-foreground/50">of</span>
              <span>{levels.length}</span>
              <span className="text-[10px] ml-1">▾</span>
            </button>

            {/* Level Dropdown */}
            <AnimatePresence>
              {showLevels && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute top-full right-0 mt-1 z-50 bg-card border border-border rounded-xl shadow-xl p-3 w-[280px]"
                >
                  <div className="grid grid-cols-6 gap-1.5 mb-3">
                    {levels.map((l, i) => (
                      <button
                        key={l.id}
                        onClick={() => goToLevel(i)}
                        className={`w-9 h-9 rounded-lg text-xs font-bold transition-all flex items-center justify-center
                          ${i === levelIdx
                            ? "bg-neon-cyan text-black ring-2 ring-neon-cyan/40"
                            : solved.has(l.id)
                              ? "bg-green-500/20 text-green-400 border border-green-500/30"
                              : "bg-muted/30 text-muted-foreground border border-border hover:bg-muted/50"
                          }`}
                      >
                        {solved.has(l.id) ? "✓" : l.id}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={resetProgress}
                    className="w-full text-xs text-destructive hover:underline font-display"
                  >
                    Reset Progress
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Nav arrows */}
          <button
            onClick={() => levelIdx > 0 && setLevelIdx(levelIdx - 1)}
            disabled={levelIdx === 0}
            className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
          >
            ◀
          </button>
          <button
            onClick={() => levelIdx < levels.length - 1 && setLevelIdx(levelIdx + 1)}
            disabled={levelIdx === levels.length - 1}
            className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
          >
            ▶
          </button>

          <ThemeToggle />
        </div>
      </div>

      {/* ─── Main Content: Sidebar + Game Board ─── */}
      <div className="relative z-10 flex-1 flex flex-col md:flex-row overflow-hidden">

        {/* ─── LEFT: Instructions + Code Editor ─── */}
        <div className="w-full md:w-[420px] flex flex-col border-r border-border bg-background/80 backdrop-blur-xl flex-shrink-0 overflow-auto">

          {/* Instructions */}
          <div className="px-4 py-4 border-b border-border">
            <p
              className="text-sm text-foreground leading-relaxed font-body [&_code]:bg-neon-cyan/10 [&_code]:text-neon-cyan [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-xs [&_ul]:mt-2 [&_ul]:ml-4 [&_ul]:space-y-1 [&_li]:text-xs [&_li]:text-muted-foreground [&_b]:text-neon-purple [&_b]:font-bold"
              dangerouslySetInnerHTML={{ __html: level.instructions }}
            />
          </div>

          {/* Code Editor */}
          <div className="flex-1 flex flex-col px-4 py-3 min-h-0">
            <div className="flex-1 rounded-xl border border-border bg-card/80 overflow-hidden flex flex-col font-mono text-sm">
              {/* Line numbers + code area */}
              <div className="flex flex-1 overflow-auto">
                {/* Line numbers */}
                <div className="flex flex-col items-end px-3 py-3 bg-muted/20 text-muted-foreground/40 select-none text-xs leading-[1.65rem] border-r border-border flex-shrink-0">
                  {Array.from({ length: totalLines }, (_, i) => (
                    <span key={i}>{i + 1}</span>
                  ))}
                </div>

                {/* Code content */}
                <div className="flex-1 py-3 px-3 flex flex-col leading-[1.65rem] text-xs">
                  {/* Before (read-only) */}
                  {beforeLines.map((line, i) => (
                    <div key={`b-${i}`} className="text-muted-foreground whitespace-pre">
                      {highlightCSS(line)}
                    </div>
                  ))}

                  {/* Editable area */}
                  <div className="relative min-h-[4.5rem]">
                    <textarea
                      ref={textareaRef}
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="absolute inset-0 w-full h-full bg-transparent text-transparent caret-neon-cyan outline-none resize-none leading-[1.65rem] font-mono text-xs z-10"
                      spellCheck={false}
                      autoCapitalize="none"
                      autoFocus
                      placeholder="  Type your CSS here..."
                    />
                    <div className="pointer-events-none whitespace-pre-wrap leading-[1.65rem] text-foreground min-h-[4.5rem]">
                      {code ? code.split("\n").map((line, i) => (
                        <div key={i}>{highlightCSS(line) || "\u00A0"}</div>
                      )) : (
                        <div className="text-muted-foreground/30">  Type your CSS here...</div>
                      )}
                    </div>
                  </div>

                  {/* After (read-only) */}
                  {afterLines.map((line, i) => (
                    <div key={`a-${i}`} className="text-muted-foreground whitespace-pre">
                      {highlightCSS(line)}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-3 flex-shrink-0">
              <button
                onClick={() => setShowHint(!showHint)}
                className="px-3 py-2 rounded-lg border border-border text-xs font-display text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
              >
                💡 Hint
              </button>
              <button
                onClick={() => { setCode(""); setWin(false); }}
                className="px-3 py-2 rounded-lg border border-border text-xs font-display text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
              >
                ↺ Reset
              </button>
              <div className="flex-1" />

              {win ? (
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  onClick={nextLevel}
                  className="px-6 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-display font-bold shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-shadow"
                >
                  Next →
                </motion.button>
              ) : (
                <button
                  onClick={handleCheck}
                  className="px-6 py-2 rounded-lg bg-gradient-to-r from-neon-purple to-neon-cyan text-white text-sm font-display font-bold shadow-lg shadow-neon-purple/20 hover:shadow-neon-purple/40 transition-shadow"
                >
                  Check ⏎
                </button>
              )}
            </div>

            {/* Hint */}
            <AnimatePresence>
              {showHint && level.hint && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono overflow-hidden"
                >
                  💡 {level.hint}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Progress bar */}
          <div className="px-4 py-2 border-t border-border flex-shrink-0">
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-display">
              <span>{solved.size}/{levels.length} completed</span>
              <div className="flex-1 h-1.5 rounded-full bg-muted/30 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-neon-purple to-neon-cyan"
                  animate={{ width: `${(solved.size / levels.length) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ─── RIGHT: Game Board (Pond) ─── */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
          {/* Background glow effects */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-neon-purple/5 rounded-full blur-[150px]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-neon-cyan/5 rounded-full blur-[150px]" />
          </div>

          {/* The Pond */}
          <motion.div
            animate={shake ? { x: [-5, 5, -5, 5, 0] } : {}}
            transition={{ duration: 0.4 }}
            className="relative z-10 w-full max-w-[600px] aspect-square rounded-2xl overflow-hidden border-2 border-border shadow-2xl"
            style={{
              background: "linear-gradient(145deg, hsl(200,60%,30%) 0%, hsl(210,50%,22%) 50%, hsl(200,60%,18%) 100%)",
            }}
          >
            {/* Water ripple effects */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full border border-cyan-300/10"
                  style={{
                    width: `${60 + i * 30}%`,
                    height: `${60 + i * 30}%`,
                    top: `${20 - i * 10}%`,
                    left: `${20 - i * 10}%`,
                  }}
                  animate={{
                    scale: [1, 1.05, 1],
                    opacity: [0.3, 0.1, 0.3],
                  }}
                  transition={{
                    duration: 3 + i,
                    repeat: Infinity,
                    delay: i * 0.8,
                  }}
                />
              ))}
            </div>

            {/* Lily pads (targets) — positioned using answer CSS */}
            <div
              className="absolute inset-0 p-4"
              style={targetStyle}
            >
              {level.board.frogs.map((frog, i) => {
                const c = FROG_COLORS[frog.color] || FROG_COLORS.green;
                return (
                  <div
                    key={`lily-${i}`}
                    className="w-[60px] h-[60px] sm:w-[70px] sm:h-[70px] rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500"
                    style={{
                      background: `radial-gradient(circle, ${c.lilyBg}, ${c.lilyBg}88)`,
                      boxShadow: `0 0 20px ${c.lilyBg}44`,
                      ...lilyStyles[i],
                    }}
                  >
                    <div className="w-[50px] h-[50px] sm:w-[58px] sm:h-[58px] rounded-full border-2 border-dashed opacity-40"
                      style={{ borderColor: c.bg }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Frogs — positioned using player CSS */}
            <div
              className="absolute inset-0 p-4 transition-all duration-500"
              style={pondStyle}
            >
              {level.board.frogs.map((frog, i) => {
                const c = FROG_COLORS[frog.color] || FROG_COLORS.green;
                return (
                  <motion.div
                    key={`frog-${i}`}
                    layout
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className="w-[60px] h-[60px] sm:w-[70px] sm:h-[70px] rounded-full flex items-center justify-center flex-shrink-0 text-2xl sm:text-3xl select-none cursor-default"
                    style={{
                      background: `radial-gradient(circle at 35% 35%, ${c.bg}, ${c.bg}cc)`,
                      boxShadow: win
                        ? `0 0 25px ${c.bg}88, 0 0 50px ${c.bg}44`
                        : `0 0 15px ${c.bg}44`,
                      ...frogStyles[i],
                    }}
                  >
                    {c.emoji}
                  </motion.div>
                );
              })}
            </div>

            {/* Win overlay */}
            <AnimatePresence>
              {win && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-20"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="bg-card/90 border border-green-500/30 rounded-2xl px-8 py-6 text-center shadow-2xl"
                  >
                    <div className="text-5xl mb-2">🎉</div>
                    <h3 className="font-display text-xl font-bold text-green-400 mb-1">
                      {levelIdx === levels.length - 1 ? "YOU WIN!" : "Level Complete!"}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {levelIdx === levels.length - 1
                        ? "You've mastered CSS Flexbox!"
                        : "Great job! Click Next to continue."}
                    </p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Confetti on final level */}
      {win && levelIdx === levels.length - 1 && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {Array.from({ length: 30 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 rounded-sm"
              style={{
                left: `${Math.random() * 100}%`,
                background: ["#a78bfa", "#22d3ee", "#f472b6", "#fbbf24", "#34d399"][i % 5],
              }}
              initial={{ top: "-5%", rotate: 0, opacity: 1 }}
              animate={{
                top: "105%",
                rotate: Math.random() * 720,
                opacity: 0,
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                delay: Math.random() * 0.5,
                ease: "easeIn",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Syntax Highlighting ────────────────────────────────────────────
function highlightCSS(line: string): React.ReactNode {
  // Simple CSS highlighting
  const trimmed = line.trim();

  // Selector line (e.g., "#pond {")
  if (trimmed.match(/^[.#\w][^:]*\{/)) {
    const braceIdx = trimmed.indexOf("{");
    return (
      <>
        <span className="text-amber-400">{line.slice(0, line.indexOf(trimmed) + braceIdx)}</span>
        <span className="text-muted-foreground">{" {"}</span>
      </>
    );
  }

  // Closing brace
  if (trimmed === "}") {
    return <span className="text-muted-foreground">{line}</span>;
  }

  // Property: value
  const colonIdx = trimmed.indexOf(":");
  if (colonIdx > 0) {
    const indent = line.length - line.trimStart().length;
    const prop = trimmed.slice(0, colonIdx);
    const val = trimmed.slice(colonIdx + 1);
    return (
      <>
        {" ".repeat(indent)}
        <span className="text-sky-400">{prop}</span>
        <span className="text-muted-foreground">:</span>
        <span className="text-amber-300">{val}</span>
      </>
    );
  }

  return <span>{line}</span>;
}

export default FlexboxQuest;
