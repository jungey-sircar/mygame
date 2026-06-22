import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "@/components/Confetti";
import ParticleBackground from "@/components/ParticleBackground";
import ThemeToggle from "@/components/ThemeToggle";

// ─── Types ──────────────────────────────────────────────────────────
type GameMode = "pvp" | "pvai" | "classroom" | null;
type Difficulty = "beginner" | "intermediate" | "advanced" | "expert";
type AIDifficulty = "easy" | "medium" | "hard";
type GamePhase = "menu" | "playing" | "victory";
type Side = "left" | "right";

interface Question {
  text: string;
  answer: number;
}

interface LeaderboardEntry {
  wins: number;
  losses: number;
  accuracy: number;
  totalCorrect: number;
  totalAnswered: number;
  fastestAnswer: number;
  highestCombo: number;
  totalGames: number;
}

// ─── Sound Engine (Web Audio API) ───────────────────────────────────
const audioCtxRef: { current: AudioContext | null } = { current: null };

function getAudioCtx(): AudioContext {
  if (!audioCtxRef.current) {
    audioCtxRef.current = new AudioContext();
  }
  if (audioCtxRef.current.state === "suspended") {
    audioCtxRef.current.resume();
  }
  return audioCtxRef.current;
}

function playTone(freq: number, duration: number, type: OscillatorType = "sine", vol = 0.15) {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = vol;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio not supported
  }
}

function sfxCorrect() {
  playTone(523, 0.12, "sine", 0.12);
  setTimeout(() => playTone(659, 0.12, "sine", 0.12), 80);
  setTimeout(() => playTone(784, 0.18, "sine", 0.12), 160);
}
function sfxWrong() {
  playTone(200, 0.25, "square", 0.08);
  setTimeout(() => playTone(150, 0.3, "square", 0.08), 120);
}
function sfxPull() {
  playTone(180, 0.15, "triangle", 0.1);
  setTimeout(() => playTone(260, 0.1, "triangle", 0.1), 60);
}
function sfxCountdown() { playTone(440, 0.08, "sine", 0.1); }
function sfxVictory() {
  [523, 659, 784, 1047].forEach((n, i) => setTimeout(() => playTone(n, 0.2, "sine", 0.1), i * 120));
}
function sfxCheer() {
  for (let i = 0; i < 5; i++) setTimeout(() => playTone(300 + Math.random() * 400, 0.15, "sawtooth", 0.03), i * 60);
}
function sfxPowerPull() {
  playTone(330, 0.1, "square", 0.1);
  setTimeout(() => playTone(440, 0.1, "square", 0.1), 80);
  setTimeout(() => playTone(660, 0.15, "square", 0.12), 160);
  setTimeout(() => playTone(880, 0.2, "sine", 0.1), 250);
}

// ─── Math Question Generator ────────────────────────────────────────
function generateQuestion(difficulty: Difficulty): Question {
  switch (difficulty) {
    case "beginner": {
      const ops = ["+", "-"];
      const op = ops[Math.floor(Math.random() * ops.length)];
      const a = Math.floor(Math.random() * 20) + 1;
      const b = Math.floor(Math.random() * 20) + 1;
      if (op === "+") return { text: `${a} + ${b}`, answer: a + b };
      const big = Math.max(a, b), small = Math.min(a, b);
      return { text: `${big} - ${small}`, answer: big - small };
    }
    case "intermediate": {
      const ops = ["×", "÷"];
      const op = ops[Math.floor(Math.random() * ops.length)];
      if (op === "×") {
        const a = Math.floor(Math.random() * 12) + 2;
        const b = Math.floor(Math.random() * 12) + 2;
        return { text: `${a} × ${b}`, answer: a * b };
      }
      const b = Math.floor(Math.random() * 11) + 2;
      const answer = Math.floor(Math.random() * 12) + 2;
      const a = b * answer;
      return { text: `${a} ÷ ${b}`, answer };
    }
    case "advanced": {
      const type = Math.floor(Math.random() * 3);
      if (type === 0) {
        const pcts = [10, 20, 25, 50, 75];
        const pct = pcts[Math.floor(Math.random() * pcts.length)];
        const val = Math.floor(Math.random() * 20) * 10 + 20;
        return { text: `${pct}% of ${val}`, answer: (pct / 100) * val };
      }
      if (type === 1) {
        const denoms = [2, 4, 5, 10];
        const d = denoms[Math.floor(Math.random() * denoms.length)];
        const a = Math.floor(Math.random() * (d - 1)) + 1;
        const b = Math.floor(Math.random() * (d - 1)) + 1;
        return { text: `${a}/${d} + ${b}/${d} = ?/${d}`, answer: a + b };
      }
      const a = Math.floor(Math.random() * 50 + 10) / 10;
      const b = Math.floor(Math.random() * 50 + 10) / 10;
      return { text: `${a} + ${b}`, answer: Math.round((a + b) * 10) / 10 };
    }
    case "expert": {
      const type = Math.floor(Math.random() * 3);
      if (type === 0) {
        const x = Math.floor(Math.random() * 15) + 1;
        const coeff = Math.floor(Math.random() * 4) + 2;
        const b = Math.floor(Math.random() * 20) + 1;
        return { text: `${coeff}x + ${b} = ${coeff * x + b}, x = ?`, answer: x };
      }
      if (type === 1) {
        const n = Math.floor(Math.random() * 12) + 2;
        return { text: `${n}² = ?`, answer: n * n };
      }
      const exp = Math.floor(Math.random() * 7) + 2;
      return { text: `2^${exp} = ?`, answer: Math.pow(2, exp) };
    }
  }
}

// ─── Leaderboard Storage ────────────────────────────────────────────
const LB_KEY = "maths_tug_of_war_leaderboard";
function getLeaderboard(): LeaderboardEntry {
  try {
    const raw = localStorage.getItem(LB_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { wins: 0, losses: 0, accuracy: 0, totalCorrect: 0, totalAnswered: 0, fastestAnswer: Infinity, highestCombo: 0, totalGames: 0 };
}
function saveLeaderboard(lb: LeaderboardEntry) {
  lb.accuracy = lb.totalAnswered > 0 ? Math.round((lb.totalCorrect / lb.totalAnswered) * 100) : 0;
  localStorage.setItem(LB_KEY, JSON.stringify(lb));
}

// ─── SVG Character Components ───────────────────────────────────────
// Flat cartoon tug-of-war person — proper pulling pose
interface PersonProps {
  color: "blue" | "red";
  flip?: boolean;
  scale?: number;
}

// Person in a proper tug-of-war pulling pose:
// - Body leaning BACKWARD (away from rope direction)
// - Both arms stretched FORWARD gripping the rope
// - Front leg bent, back leg extended and braced
// - Whole body conveys pulling effort
// Default orientation: facing RIGHT, pulling rope to the LEFT
const TugPerson = ({ color, flip = false, scale = 1 }: PersonProps) => {
  const shirt = color === "blue" ? "#3B82F6" : "#EF4444";
  const shirtDark = color === "blue" ? "#2563EB" : "#DC2626";
  const helmet = color === "blue" ? "#60A5FA" : "#F87171";
  const helmetBand = color === "blue" ? "#1D4ED8" : "#B91C1C";
  const skin = "#EDCBA0";
  const skinDark = "#D4AA78";
  const pants = "#1E293B";
  const shoes = color === "blue" ? "#2563EB" : "#DC2626";
  const shoeLight = color === "blue" ? "#3B82F6" : "#EF4444";

  return (
    <svg width={80 * scale} height={100 * scale} viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ transform: flip ? "scaleX(-1)" : undefined }}>
      {/* === Person leaning back, arms forward === */}
      {/* The whole figure is angled: head at back-left, feet at front-right */}

      {/* Back leg (left) — extended far back, braced on ground */}
      <path d="M22 62 L6 88 L14 90 L26 65" fill={pants} />
      <ellipse cx="9" cy="92" rx="9" ry="4" fill={shoeLight} />
      <rect x="1" y="93" width="16" height="3" rx="1.5" fill={shoes} />

      {/* Front leg (right) — bent forward, weight planted */}
      <path d="M36 62 L50 84 L58 82 L40 60" fill={pants} />
      <ellipse cx="55" cy="86" rx="9" ry="4" fill={shoeLight} />
      <rect x="47" y="87" width="16" height="3" rx="1.5" fill={shoes} />

      {/* Body/Torso — tilted backward ~20° (leaning away from pull) */}
      <path d="M18 34 L40 30 L44 62 L20 66 Z" fill={shirt} />
      {/* Shirt number/badge */}
      <circle cx="32" cy="46" r="5" fill={shirtDark} opacity="0.6" />
      <text x="32" y="49" textAnchor="middle" fontSize="7" fontWeight="bold" fill="white" opacity="0.8">
        {color === "blue" ? "B" : "R"}
      </text>

      {/* Neck — angled with body */}
      <rect x="22" y="28" width="7" height="6" rx="2" fill={skin} transform="rotate(-8 25 31)" />

      {/* Head — tilted slightly back, looking toward rope */}
      <g transform="translate(20, 14) rotate(-8)">
        {/* Helmet */}
        <ellipse cx="10" cy="4" rx="13" ry="12" fill={helmet} />
        <rect x="-3" y="7" width="26" height="4" rx="2" fill={helmetBand} />
        <ellipse cx="10" cy="11" rx="14" ry="3" fill={helmetBand} opacity="0.5" />
        {/* Face */}
        <ellipse cx="10" cy="8" rx="9" ry="8" fill={skin} />
        {/* Eyebrows — determined/straining */}
        <line x1="4" y1="4" x2="9" y2="5" stroke="#1E293B" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="11" y1="5" x2="16" y2="4" stroke="#1E293B" strokeWidth="1.5" strokeLinecap="round" />
        {/* Eyes — focused, slightly squinting */}
        <circle cx="7" cy="7" r="1.5" fill="#1E293B" />
        <circle cx="14" cy="7" r="1.5" fill="#1E293B" />
        {/* Mouth — gritting teeth / straining */}
        <path d="M5 12 L15 12" stroke="#1E293B" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M6 12 L6 14" stroke="#1E293B" strokeWidth="0.6" />
        <path d="M9 12 L9 14" stroke="#1E293B" strokeWidth="0.6" />
        <path d="M12 12 L12 14" stroke="#1E293B" strokeWidth="0.6" />
      </g>

      {/* === Arms reaching forward and DOWN to rope === */}
      {/* Back arm — reaches forward-down to grip rope */}
      <path d="M38 38 L50 46 L60 53" stroke={skinDark} strokeWidth="5" strokeLinecap="round" fill="none" />
      {/* Front arm — reaches forward-down to grip rope */}
      <path d="M40 36 L55 44 L70 53" stroke={skin} strokeWidth="6" strokeLinecap="round" fill="none" />
      {/* Arm thickness fill */}
      <path d="M38 36 L50 44 L60 51 L60 55 L50 48 L38 40 Z" fill={skinDark} />
      <path d="M40 34 L55 42 L70 51 L70 55 L55 46 L40 38 Z" fill={skin} />

      {/* === FRONT HAND — closed fist gripping rope === */}
      {/* Rope segment visible inside the grip */}
      <rect x="66" y="52" width="10" height="5" rx="2" fill="#8B7355" />
      <rect x="66" y="52" width="10" height="2" rx="1" fill="#C9A96E" opacity="0.4" />
      {/* Fingers wrapping OVER the top of rope (4 fingers) */}
      <path d="M67 52 C67 47 69 45 70 45 C71 45 72 47 72 49 L72 52" fill={skin} />
      <path d="M72 52 C72 47 73 45 74 45 C75 45 76 47 76 50 L76 52" fill={skin} />
      <ellipse cx="70" cy="45" rx="1.5" ry="1.2" fill={skin} />
      <ellipse cx="74" cy="45" rx="1.5" ry="1.2" fill={skin} />
      {/* Finger knuckle ridge */}
      <path d="M67 49 Q70 47 76 49" stroke={skinDark} strokeWidth="1" fill="none" opacity="0.5" />
      {/* Palm side visible */}
      <rect x="66" y="49" width="11" height="4" rx="1.5" fill={skin} />
      {/* Thumb wrapping UNDER the rope from below */}
      <path d="M68 57 C68 59 70 61 72 60 C74 59 74 57 73 56" fill={skin} />
      <ellipse cx="71" cy="60" rx="2.5" ry="2" fill={skin} />

      {/* === BACK HAND — closed fist gripping rope === */}
      {/* Rope segment */}
      <rect x="52" y="53" width="9" height="4.5" rx="1.5" fill="#8B7355" />
      <rect x="52" y="53" width="9" height="1.5" rx="1" fill="#C9A96E" opacity="0.3" />
      {/* Fingers over top */}
      <path d="M53 53 C53 49 55 47 56 47 C57 47 58 49 58 51 L58 53" fill={skinDark} />
      <path d="M58 53 C58 49 59 47 60 48 C61 49 61 51 61 53" fill={skinDark} />
      <ellipse cx="56" cy="47.5" rx="1.3" ry="1" fill={skinDark} />
      <ellipse cx="60" cy="48" rx="1.2" ry="1" fill={skinDark} />
      {/* Palm */}
      <rect x="52" y="50" width="10" height="4" rx="1.5" fill={skinDark} />
      {/* Thumb under */}
      <path d="M54 57.5 C54 59 56 60 57 59 C58 58 58 57 57 57" fill={skinDark} />
      <ellipse cx="56" cy="59" rx="2" ry="1.5" fill={skinDark} />
    </svg>
  );
};

const CelebPerson = ({ color, flip = false, scale = 1 }: PersonProps) => {
  const shirt = color === "blue" ? "#3B82F6" : "#EF4444";
  const shirtDark = color === "blue" ? "#2563EB" : "#DC2626";
  const helmet = color === "blue" ? "#60A5FA" : "#F87171";
  const helmetBand = color === "blue" ? "#1D4ED8" : "#B91C1C";
  const skin = "#EDCBA0";
  const pants = "#1E293B";
  const shoes = color === "blue" ? "#3B82F6" : "#EF4444";

  return (
    <svg width={70 * scale} height={100 * scale} viewBox="0 0 70 100" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ transform: flip ? "scaleX(-1)" : undefined }}>
      {/* Helmet */}
      <ellipse cx="35" cy="10" rx="13" ry="12" fill={helmet} />
      <rect x="22" y="13" width="26" height="4" rx="2" fill={helmetBand} />
      <ellipse cx="35" cy="17" rx="14" ry="3" fill={helmetBand} opacity="0.5" />
      {/* Face */}
      <ellipse cx="35" cy="14" rx="9" ry="8" fill={skin} />
      {/* Eyes — happy arcs */}
      <path d="M29 12 Q32 9 34 12" stroke="#1E293B" strokeWidth="1.8" fill="none" />
      <path d="M36 12 Q38 9 41 12" stroke="#1E293B" strokeWidth="1.8" fill="none" />
      {/* Big open smile */}
      <path d="M28 18 Q35 25 42 18" stroke="#1E293B" strokeWidth="1.3" fill="#fff" />
      {/* Neck */}
      <rect x="32" y="22" width="6" height="5" fill={skin} />
      {/* Body — upright */}
      <path d="M24 27 L46 27 L44 58 L26 58 Z" fill={shirt} />
      <circle cx="35" cy="40" r="5" fill={shirtDark} opacity="0.5" />
      {/* Left arm raised — V victory */}
      <path d="M24 31 L6 6 L12 4 L27 28" fill={skin} />
      {/* Right arm raised — fist pump */}
      <path d="M46 31 L64 6 L58 4 L43 28" fill={skin} />
      {/* Fists */}
      <circle cx="8" cy="5" r="4.5" fill={skin} />
      <circle cx="62" cy="5" r="4.5" fill={skin} />
      {/* Legs — spread in jump */}
      <path d="M28 58 L18 82 L25 84 L33 58" fill={pants} />
      <path d="M37 58 L47 82 L54 84 L41 58" fill={pants} />
      {/* Shoes */}
      <ellipse cx="20" cy="86" rx="8" ry="4" fill={shoes} />
      <ellipse cx="52" cy="86" rx="8" ry="4" fill={shoes} />
    </svg>
  );
};

// ─── Number Pad Component ───────────────────────────────────────────
interface NumPadProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  color: "blue" | "red";
}

const NumPad = ({ value, onChange, onSubmit, disabled, color }: NumPadProps) => {
  const accent = color === "blue" ? "bg-blue-600 hover:bg-blue-500" : "bg-red-600 hover:bg-red-500";
  const clearColor = color === "blue" ? "bg-blue-500/20 text-blue-600 dark:text-blue-300 hover:bg-blue-500/30" : "bg-red-500/20 text-red-600 dark:text-red-300 hover:bg-red-500/30";
  const btnBase = "rounded-lg font-display font-bold text-foreground transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed select-none";

  const press = (digit: string) => {
    if (disabled) return;
    onChange(value + digit);
  };

  return (
    <div className="space-y-2">
      {/* Display */}
      <div className={`w-full h-11 rounded-lg border ${
        color === "blue" ? "border-blue-500/30 bg-blue-500/10" : "border-red-500/30 bg-red-500/10"
      } flex items-center justify-center px-3 font-display text-xl font-bold text-foreground tabular-nums min-h-[44px]`}>
        {value || <span className="text-muted-foreground/40 text-base">?</span>}
      </div>

      {/* Number grid */}
      <div className="grid grid-cols-3 gap-1.5">
        {[1,2,3,4,5,6,7,8,9].map(n => (
          <button
            key={n}
            onClick={() => press(String(n))}
            disabled={disabled}
            className={`${btnBase} h-10 sm:h-11 bg-muted hover:bg-muted/70 text-base sm:text-lg`}
          >
            {n}
          </button>
        ))}
        <button
          onClick={() => { if (!disabled) onChange(""); }}
          disabled={disabled}
          className={`${btnBase} h-10 sm:h-11 ${clearColor} text-xs sm:text-sm tracking-wider`}
        >
          C
        </button>
        <button
          onClick={() => press("0")}
          disabled={disabled}
          className={`${btnBase} h-10 sm:h-11 bg-muted hover:bg-muted/70 text-base sm:text-lg`}
        >
          0
        </button>
        <button
          onClick={onSubmit}
          disabled={disabled}
          className={`${btnBase} h-10 sm:h-11 ${accent} text-white text-xs sm:text-sm tracking-wider`}
        >
          OK
        </button>
      </div>
    </div>
  );
};

// ─── Constants ──────────────────────────────────────────────────────
const ROPE_MAX = 100;
const PULL_NORMAL = 10;
const PULL_FAST = 20;
const PULL_POWER = 30;
const PULL_MEGA = 50;
const FAST_THRESHOLD = 3000;
const COMBO_POWER = 3;
const COMBO_MEGA = 5;
const PULL_PENALTY = 5;
const TIMER_OPTIONS = [60, 90, 120];

// ─── Component ──────────────────────────────────────────────────────
const MathsTugOfWar = () => {
  // Game state
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [mode, setMode] = useState<GameMode>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("beginner");
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>("medium");
  const [timerDuration, setTimerDuration] = useState(90);
  const [muted, setMuted] = useState(false);

  // Playing state — SEPARATE questions for each team
  const [ropePos, setRopePos] = useState(0);
  const [leftQuestion, setLeftQuestion] = useState<Question | null>(null);
  const [rightQuestion, setRightQuestion] = useState<Question | null>(null);
  const [leftInput, setLeftInput] = useState("");
  const [rightInput, setRightInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(90);
  const [round, setRound] = useState(1);
  const [leftScore, setLeftScore] = useState(0);
  const [rightScore, setRightScore] = useState(0);
  const [leftCombo, setLeftCombo] = useState(0);
  const [rightCombo, setRightCombo] = useState(0);
  const [leftTotal, setLeftTotal] = useState(0);
  const [rightTotal, setRightTotal] = useState(0);
  const [leftCorrect, setLeftCorrect] = useState(0);
  const [rightCorrect, setRightCorrect] = useState(0);
  const [shakeLeft, setShakeLeft] = useState(false);
  const [shakeRight, setShakeRight] = useState(false);
  const [showPower, setShowPower] = useState<Side | null>(null);
  const [leftQStartTime, setLeftQStartTime] = useState(Date.now());
  const [rightQStartTime, setRightQStartTime] = useState(Date.now());
  const [leftFastest, setLeftFastest] = useState(Infinity);
  const [rightFastest, setRightFastest] = useState(Infinity);
  const [showConfetti, setShowConfetti] = useState(false);
  const [winner, setWinner] = useState<"left" | "right" | "draw" | null>(null);

  // Classroom mode
  const [classroomTurn, setClassroomTurn] = useState<Side>("left");
  const [classLeftMembers, setClassLeftMembers] = useState(3);
  const [classRightMembers, setClassRightMembers] = useState(3);
  const [classCurrentIdx, setClassCurrentIdx] = useState(0);

  // AI state
  const aiTimerRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const confettiTimerRef = useRef<number | null>(null);

  // Leaderboard
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry>(getLeaderboard);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const play = useCallback((fn: () => void) => { if (!muted) fn(); }, [muted]);

  // Generate new question for a side
  const newQuestionForSide = useCallback((side: Side) => {
    const q = generateQuestion(difficulty);
    if (side === "left") {
      setLeftQuestion(q);
      setLeftInput("");
      setLeftQStartTime(Date.now());
    } else {
      setRightQuestion(q);
      setRightInput("");
      setRightQStartTime(Date.now());
    }
  }, [difficulty]);

  // Generate questions for both sides
  const nextQuestions = useCallback(() => {
    setLeftQuestion(generateQuestion(difficulty));
    setRightQuestion(generateQuestion(difficulty));
    setLeftInput("");
    setRightInput("");
    setLeftQStartTime(Date.now());
    setRightQStartTime(Date.now());
    setRound(r => r + 1);
  }, [difficulty]);

  // Check victory
  const checkVictory = useCallback((newPos: number) => {
    if (newPos <= -ROPE_MAX) {
      setWinner("left"); setPhase("victory"); play(sfxVictory); play(sfxCheer); setShowConfetti(true); return true;
    }
    if (newPos >= ROPE_MAX) {
      setWinner("right"); setPhase("victory"); play(sfxVictory); play(sfxCheer); setShowConfetti(true); return true;
    }
    return false;
  }, [play]);

  // Pull rope
  const pullRope = useCallback((side: Side, fast: boolean, combo: number) => {
    let amount = fast ? PULL_FAST : PULL_NORMAL;
    let powerType: Side | null = null;
    if (combo >= COMBO_MEGA) { amount = PULL_MEGA; powerType = side; play(sfxPowerPull); }
    else if (combo >= COMBO_POWER) { amount = PULL_POWER; powerType = side; play(sfxPowerPull); }
    else { play(sfxPull); }
    if (powerType) { setShowPower(powerType); setTimeout(() => setShowPower(null), 1200); }
    const direction = side === "left" ? -amount : amount;
    setRopePos(prev => {
      const newPos = Math.max(-ROPE_MAX, Math.min(ROPE_MAX, prev + direction));
      checkVictory(newPos);
      return newPos;
    });
  }, [play, checkVictory]);

  // Handle answer — each side has its own question
  const handleAnswer = useCallback((side: Side, inputVal: string) => {
    if (phase !== "playing") return;
    const q = side === "left" ? leftQuestion : rightQuestion;
    if (!q) return;

    const parsed = parseFloat(inputVal.trim());
    if (isNaN(parsed)) return;

    const startTime = side === "left" ? leftQStartTime : rightQStartTime;
    const elapsed = Date.now() - startTime;
    const fast = elapsed < FAST_THRESHOLD;
    const correct = Math.abs(parsed - q.answer) < 0.01;

    if (side === "left") {
      setLeftTotal(p => p + 1);
      if (correct) {
        play(sfxCorrect);
        setLeftCorrect(p => p + 1);
        setLeftScore(p => p + 1);
        const newCombo = leftCombo + 1;
        setLeftCombo(newCombo);
        if (fast && elapsed < leftFastest) setLeftFastest(elapsed);
        pullRope("left", fast, newCombo);
        // Give a NEW question to left side
        setTimeout(() => newQuestionForSide("left"), 400);
      } else {
        play(sfxWrong);
        setShakeLeft(true);
        setTimeout(() => setShakeLeft(false), 500);
        setLeftCombo(0);
        setLeftInput("");
        // Penalty: rope moves toward opponent (right)
        setRopePos(prev => {
          const newPos = Math.max(-ROPE_MAX, Math.min(ROPE_MAX, prev + PULL_PENALTY));
          checkVictory(newPos);
          return newPos;
        });
      }
    } else {
      setRightTotal(p => p + 1);
      if (correct) {
        play(sfxCorrect);
        setRightCorrect(p => p + 1);
        setRightScore(p => p + 1);
        const newCombo = rightCombo + 1;
        setRightCombo(newCombo);
        if (fast && elapsed < rightFastest) setRightFastest(elapsed);
        pullRope("right", fast, newCombo);
        setTimeout(() => newQuestionForSide("right"), 400);
      } else {
        play(sfxWrong);
        setShakeRight(true);
        setTimeout(() => setShakeRight(false), 500);
        setRightCombo(0);
        setRightInput("");
        // Penalty: rope moves toward opponent (left)
        setRopePos(prev => {
          const newPos = Math.max(-ROPE_MAX, Math.min(ROPE_MAX, prev - PULL_PENALTY));
          checkVictory(newPos);
          return newPos;
        });
      }
    }

    // Classroom mode: rotate member index for the side that answered
    if (mode === "classroom") {
      const maxMembers = side === "left" ? classLeftMembers : classRightMembers;
      setClassCurrentIdx(prev => (prev + 1) % maxMembers);
    }
  }, [phase, leftQuestion, rightQuestion, leftQStartTime, rightQStartTime, leftCombo, rightCombo, leftFastest, rightFastest, play, pullRope, newQuestionForSide, mode, classCurrentIdx, classLeftMembers, classRightMembers]);

  // AI logic — AI solves its OWN (right) question
  useEffect(() => {
    if (phase !== "playing" || mode !== "pvai" || !rightQuestion) return;
    const getAIDelay = () => {
      switch (aiDifficulty) {
        case "easy": return 5000 + Math.random() * 3000;
        case "medium": return 3000 + Math.random() * 2000;
        case "hard": return 1000 + Math.random() * 2000;
      }
    };
    const getAIAccuracy = () => {
      switch (aiDifficulty) { case "easy": return 0.6; case "medium": return 0.8; case "hard": return 0.95; }
    };
    aiTimerRef.current = window.setTimeout(() => {
      if (phase !== "playing") return;
      const isCorrect = Math.random() < getAIAccuracy();
      const answerStr = isCorrect ? String(rightQuestion.answer) : String(rightQuestion.answer + Math.floor(Math.random() * 5) + 1);
      setRightInput(answerStr);
      setTimeout(() => handleAnswer("right", answerStr), 100);
    }, getAIDelay());
    return () => { if (aiTimerRef.current) clearTimeout(aiTimerRef.current); };
  }, [rightQuestion, phase, mode, aiDifficulty, handleAnswer]);

  // Timer
  useEffect(() => {
    if (phase !== "playing") return;
    timerRef.current = window.setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          const finalWinner = ropePos < 0 ? "left" : ropePos > 0 ? "right" : "draw";
          setWinner(finalWinner); setPhase("victory");
          if (finalWinner !== "draw") { play(sfxVictory); play(sfxCheer); setShowConfetti(true); }
          return 0;
        }
        if (prev <= 10) play(sfxCountdown);
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, ropePos, play]);

  // Confetti cleanup
  useEffect(() => {
    if (showConfetti) confettiTimerRef.current = window.setTimeout(() => setShowConfetti(false), 4000);
    return () => { if (confettiTimerRef.current) clearTimeout(confettiTimerRef.current); };
  }, [showConfetti]);

  // Update leaderboard on victory
  useEffect(() => {
    if (phase !== "victory" || !winner) return;
    const lb = getLeaderboard();
    lb.totalGames++;
    if (winner === "left") lb.wins++; else if (winner === "right") lb.losses++;
    lb.totalCorrect += leftCorrect; lb.totalAnswered += leftTotal;
    if (leftFastest < lb.fastestAnswer && leftFastest < Infinity) lb.fastestAnswer = leftFastest;
    const maxCombo = Math.max(leftCombo, rightCombo);
    if (maxCombo > lb.highestCombo) lb.highestCombo = maxCombo;
    saveLeaderboard(lb); setLeaderboard(lb);
  }, [phase, winner, leftCorrect, leftTotal, leftFastest, leftCombo, rightCombo]);

  // Start game
  const startGame = useCallback(() => {
    if (!mode) return;
    setPhase("playing"); setRopePos(0); setTimeLeft(timerDuration); setRound(0);
    setLeftScore(0); setRightScore(0); setLeftCombo(0); setRightCombo(0);
    setLeftTotal(0); setRightTotal(0); setLeftCorrect(0); setRightCorrect(0);
    setLeftFastest(Infinity); setRightFastest(Infinity);
    setWinner(null); setShowConfetti(false); setClassroomTurn("left"); setClassCurrentIdx(0);
    nextQuestions();
  }, [mode, timerDuration, nextQuestions]);

  const playAgain = useCallback(() => { setPhase("menu"); setWinner(null); setShowConfetti(false); }, []);

  // Derived
  const leftName = mode === "pvai" ? "You" : mode === "classroom" ? "Team A" : "Player 1";
  const rightName = mode === "pvai" ? "AI" : mode === "classroom" ? "Team B" : "Player 2";
  const leftAccuracy = leftTotal > 0 ? Math.round((leftCorrect / leftTotal) * 100) : 0;
  const rightAccuracy = rightTotal > 0 ? Math.round((rightCorrect / rightTotal) * 100) : 0;
  const ropePercent = useMemo(() => ((ropePos + ROPE_MAX) / (2 * ROPE_MAX)) * 100, [ropePos]);

  const floatingSymbols = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => ({
      char: ["+", "−", "×", "÷", "=", "π", "∑", "√", "%", "∞", "Δ", "λ"][i],
      left: `${5 + (i * 8) % 90}%`, delay: i * 0.7, duration: 8 + (i % 4) * 2,
    }))
  , []);

  // ─── MENU SCREEN ─────────────────────────────────────────────────
  if (phase === "menu") {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <ParticleBackground />
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-neon-purple/8 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-neon-cyan/8 rounded-full blur-[120px]" />
        </div>
        {floatingSymbols.map((s, i) => (
          <motion.div key={i} className="fixed text-2xl text-neon-cyan/15 font-bold pointer-events-none z-0 select-none" style={{ left: s.left }}
            animate={{ y: ["-10vh", "110vh"] }} transition={{ duration: s.duration, delay: s.delay, repeat: Infinity, ease: "linear" }}>{s.char}</motion.div>
        ))}
        <div className="relative z-10 flex flex-col items-center px-4 sm:px-6 py-12 sm:py-16">
          <Link to="/" className="absolute top-4 left-4 sm:top-6 sm:left-6 font-display text-sm text-muted-foreground hover:text-foreground transition-colors">← Back</Link>
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2">
            <ThemeToggle />
            <button onClick={() => setMuted(m => !m)} className="text-xl opacity-60 hover:opacity-100 transition-opacity" title={muted ? "Unmute" : "Mute"}>{muted ? "🔇" : "🔊"}</button>
          </div>

          <motion.div className="text-center max-w-2xl mx-auto mb-10" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-foreground mb-3 text-glow-purple">🪢 Maths Tug Of War</h1>
            <p className="font-body text-base sm:text-lg text-muted-foreground">Solve math problems faster to pull the rope and win!</p>
            <div className="mt-4 mx-auto w-48 h-[2px] bg-gradient-to-r from-transparent via-neon-purple to-transparent opacity-60" />
          </motion.div>

          <motion.div className="w-full max-w-xl glass-panel p-6 sm:p-8 space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
            {/* Mode Selection */}
            <div>
              <h2 className="font-display text-sm uppercase tracking-[0.2em] text-muted-foreground mb-3">Game Mode</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {([
                  { key: "pvp" as GameMode, label: "Player vs Player", icon: "👥", desc: "2 players, same device" },
                  { key: "pvai" as GameMode, label: "Player vs AI", icon: "🤖", desc: "Challenge the computer" },
                  { key: "classroom" as GameMode, label: "Classroom Battle", icon: "🏫", desc: "Team A vs Team B" },
                ]).map(m => (
                  <button key={m.key} onClick={() => setMode(m.key)}
                    className={`p-4 rounded-xl border text-left transition-all duration-300 ${mode === m.key ? "border-neon-cyan bg-neon-cyan/10 shadow-[0_0_15px_rgba(0,200,200,0.15)]" : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8"}`}>
                    <div className="text-2xl mb-2">{m.icon}</div>
                    <div className="font-display text-sm font-bold text-foreground">{m.label}</div>
                    <div className="text-xs text-muted-foreground mt-1">{m.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            {/* Difficulty */}
            <div>
              <h2 className="font-display text-sm uppercase tracking-[0.2em] text-muted-foreground mb-3">Math Level</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {([
                  { key: "beginner" as Difficulty, label: "Beginner", desc: "+ −" },
                  { key: "intermediate" as Difficulty, label: "Intermediate", desc: "× ÷" },
                  { key: "advanced" as Difficulty, label: "Advanced", desc: "% fractions" },
                  { key: "expert" as Difficulty, label: "Expert", desc: "algebra" },
                ]).map(d => (
                  <button key={d.key} onClick={() => setDifficulty(d.key)}
                    className={`p-3 rounded-lg border text-center transition-all duration-300 ${difficulty === d.key ? "border-neon-purple bg-neon-purple/10" : "border-white/10 bg-white/5 hover:border-white/20"}`}>
                    <div className="font-display text-xs font-bold text-foreground">{d.label}</div>
                    <div className="text-[10px] text-muted-foreground mt-1">{d.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            {/* AI Difficulty */}
            <AnimatePresence>
              {mode === "pvai" && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <h2 className="font-display text-sm uppercase tracking-[0.2em] text-muted-foreground mb-3">AI Difficulty</h2>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { key: "easy" as AIDifficulty, label: "Easy", color: "text-green-400" },
                      { key: "medium" as AIDifficulty, label: "Medium", color: "text-yellow-400" },
                      { key: "hard" as AIDifficulty, label: "Hard", color: "text-red-400" },
                    ]).map(a => (
                      <button key={a.key} onClick={() => setAiDifficulty(a.key)}
                        className={`p-3 rounded-lg border text-center transition-all ${aiDifficulty === a.key ? "border-neon-cyan bg-neon-cyan/10" : "border-white/10 bg-white/5 hover:border-white/20"}`}>
                        <span className={`font-display text-sm font-bold ${a.color}`}>{a.label}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {/* Classroom members */}
            <AnimatePresence>
              {mode === "classroom" && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <h2 className="font-display text-sm uppercase tracking-[0.2em] text-muted-foreground mb-3">Team Size</h2>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-blue-400 font-display">Team A Members</label>
                      <input type="number" min={1} max={10} value={classLeftMembers} onChange={e => setClassLeftMembers(Math.max(1, Math.min(10, Number(e.target.value))))}
                        className="w-full mt-1 bg-muted/30 border border-border/60 rounded-lg px-3 py-2 outline-none focus:border-neon-cyan/70 text-center" />
                    </div>
                    <div>
                      <label className="text-xs text-red-400 font-display">Team B Members</label>
                      <input type="number" min={1} max={10} value={classRightMembers} onChange={e => setClassRightMembers(Math.max(1, Math.min(10, Number(e.target.value))))}
                        className="w-full mt-1 bg-muted/30 border border-border/60 rounded-lg px-3 py-2 outline-none focus:border-neon-cyan/70 text-center" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {/* Timer */}
            <div>
              <h2 className="font-display text-sm uppercase tracking-[0.2em] text-muted-foreground mb-3">Round Timer</h2>
              <div className="flex gap-2">
                {TIMER_OPTIONS.map(t => (
                  <button key={t} onClick={() => setTimerDuration(t)}
                    className={`flex-1 py-2 rounded-lg border text-center transition-all ${timerDuration === t ? "border-neon-pink bg-neon-pink/10" : "border-white/10 bg-white/5 hover:border-white/20"}`}>
                    <span className="font-display text-sm font-bold text-foreground">{t}s</span>
                  </button>
                ))}
              </div>
            </div>
            {/* Start */}
            <motion.button onClick={startGame} disabled={!mode}
              className="w-full py-4 rounded-xl font-display text-lg font-black tracking-wide uppercase bg-gradient-to-r from-blue-600 via-purple-600 to-red-600 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:shadow-[0_0_30px_rgba(147,51,234,0.3)]"
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>{mode ? "⚔️ Start Battle" : "Select a Mode"}</motion.button>
            {/* Leaderboard */}
            <button onClick={() => setShowLeaderboard(s => !s)} className="w-full py-2 text-center font-display text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors">
              {showLeaderboard ? "Hide" : "Show"} Leaderboard 🏆
            </button>
            <AnimatePresence>
              {showLeaderboard && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center">
                    {[
                      { label: "Wins", value: leaderboard.wins, icon: "🏆" },
                      { label: "Losses", value: leaderboard.losses, icon: "💀" },
                      { label: "Accuracy", value: `${leaderboard.accuracy}%`, icon: "🎯" },
                      { label: "Fastest", value: leaderboard.fastestAnswer < Infinity ? `${(leaderboard.fastestAnswer / 1000).toFixed(1)}s` : "--", icon: "⚡" },
                      { label: "Best Combo", value: leaderboard.highestCombo, icon: "🔥" },
                      { label: "Games", value: leaderboard.totalGames, icon: "🎮" },
                    ].map(s => (
                      <div key={s.label} className="rounded-lg border border-white/10 bg-white/5 p-3">
                        <div className="text-lg">{s.icon}</div>
                        <div className="font-display text-lg font-bold text-foreground">{s.value}</div>
                        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    );
  }

  // ─── VICTORY SCREEN ───────────────────────────────────────────────
  if (phase === "victory") {
    const winColor = winner === "left" ? "blue" as const : "red" as const;
    const loseColor = winner === "left" ? "red" as const : "blue" as const;

    return (
      <div className="min-h-screen relative overflow-hidden">
        <ParticleBackground />
        {showConfetti && <Confetti />}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-neon-purple/8 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-neon-cyan/8 rounded-full blur-[120px]" />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 py-12">
          {/* Celebrating & losing characters */}
          {winner !== "draw" && (
            <div className="relative w-full max-w-2xl mx-auto mb-[-30px] flex items-end justify-center gap-4 sm:gap-8 z-0">
              {/* Losers — dejected, greyed */}
              <motion.div className="opacity-30" style={{ filter: "grayscale(0.8)" }}
                animate={{ rotate: [0, -2, 0], y: [0, 2, 0] }}
                transition={{ duration: 2, repeat: Infinity }}>
                <TugPerson color={loseColor} scale={1.2} />
              </motion.div>
              {/* Winners — celebrating & jumping! */}
              <motion.div
                animate={{ y: [0, -18, 0] }}
                transition={{ duration: 0.7, repeat: Infinity, ease: "easeInOut" }}>
                <CelebPerson color={winColor} scale={1.8} />
              </motion.div>
              <motion.div
                animate={{ y: [0, -14, 0] }}
                transition={{ duration: 0.7, repeat: Infinity, ease: "easeInOut", delay: 0.15 }}>
                <CelebPerson color={winColor} flip scale={1.8} />
              </motion.div>
              {/* Losers — other side */}
              <motion.div className="opacity-30" style={{ filter: "grayscale(0.8)" }}
                animate={{ rotate: [0, 2, 0], y: [0, 2, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}>
                <TugPerson color={loseColor} flip scale={1.2} />
              </motion.div>
            </div>
          )}

          <motion.div className="text-center max-w-lg mx-auto glass-panel p-8 sm:p-10 space-y-6 relative z-10" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 20 }}>
            <motion.div className="text-5xl sm:text-6xl" animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1, repeat: Infinity }}>
              {winner === "draw" ? "🤝" : "🏆"}
            </motion.div>
            <h1 className="font-display text-3xl sm:text-4xl font-black text-foreground text-glow-purple">
              {winner === "draw" ? "It's a Draw!" : winner === "left" ? `${leftName} Wins!` : `${rightName} Wins!`}
            </h1>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className={`rounded-xl border p-4 space-y-2 ${winner === "left" ? "border-blue-400/50 bg-blue-500/15 ring-2 ring-blue-400/20" : "border-blue-500/20 bg-blue-500/5 opacity-70"}`}>
                <div className="font-display font-bold text-blue-400 text-lg">{leftName} {winner === "left" && "👑"}</div>
                <div>Score: <span className="font-bold text-foreground">{leftScore}</span></div>
                <div>Accuracy: <span className="font-bold text-foreground">{leftAccuracy}%</span></div>
                <div>Fastest: <span className="font-bold text-foreground">{leftFastest < Infinity ? `${(leftFastest / 1000).toFixed(1)}s` : "--"}</span></div>
              </div>
              <div className={`rounded-xl border p-4 space-y-2 ${winner === "right" ? "border-red-400/50 bg-red-500/15 ring-2 ring-red-400/20" : "border-red-500/20 bg-red-500/5 opacity-70"}`}>
                <div className="font-display font-bold text-red-400 text-lg">{rightName} {winner === "right" && "👑"}</div>
                <div>Score: <span className="font-bold text-foreground">{rightScore}</span></div>
                <div>Accuracy: <span className="font-bold text-foreground">{rightAccuracy}%</span></div>
                <div>Fastest: <span className="font-bold text-foreground">{rightFastest < Infinity ? `${(rightFastest / 1000).toFixed(1)}s` : "--"}</span></div>
              </div>
            </div>
            <div className="flex gap-3">
              <motion.button onClick={startGame} className="flex-1 py-3 rounded-xl font-display text-sm font-bold uppercase bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-[0_0_20px_rgba(147,51,234,0.3)]" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>⚔️ Play Again</motion.button>
              <motion.button onClick={playAgain} className="flex-1 py-3 rounded-xl font-display text-sm font-bold uppercase border border-white/20 bg-white/5 hover:bg-white/10 text-foreground" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>🏠 Menu</motion.button>
            </div>
            <Link to="/" className="inline-block font-display text-xs text-muted-foreground hover:text-foreground transition-colors uppercase tracking-[0.2em]">← Back to Games</Link>
          </motion.div>
        </div>
      </div>
    );
  }

  // ─── PLAYING SCREEN ─────────────────────────────────────────────
  // Mobile: stacked vertically — [Question headers side-by-side] [Compact Arena] [NumPads side-by-side]
  // Desktop: 3-column — [Blue Panel] [Arena] [Red Panel]
  return (
    <div className="min-h-screen relative overflow-hidden">
      <ParticleBackground />
      {showConfetti && <Confetti />}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-neon-purple/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-neon-cyan/8 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col h-screen px-2 sm:px-4 py-2 sm:py-4 max-w-[1400px] mx-auto">

        {/* ─── Top Bar ─── */}
        <div className="flex items-center justify-between mb-2 lg:mb-3 flex-shrink-0">
          <button onClick={playAgain} className="font-display text-sm text-muted-foreground hover:text-foreground transition-colors">← Back</button>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="font-display text-xs uppercase tracking-[0.15em] text-muted-foreground hidden sm:inline">Round {round}</span>
            <motion.div
              className={`font-display text-lg sm:text-2xl font-black tabular-nums ${timeLeft <= 10 ? "text-red-400" : timeLeft <= 30 ? "text-yellow-400" : "text-foreground"}`}
              animate={timeLeft <= 10 ? { scale: [1, 1.15, 1] } : {}}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
            </motion.div>
            <ThemeToggle />
            <button onClick={() => setMuted(m => !m)} className="text-lg opacity-60 hover:opacity-100 transition-opacity" title={muted ? "Unmute" : "Mute"}>
              {muted ? "🔇" : "🔊"}
            </button>
          </div>
        </div>

        {/* ─── Score Bar ─── */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-2 lg:mb-3 flex-shrink-0">
          <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-2 sm:px-3 py-1.5 sm:py-2 text-center">
            <div className="font-display text-[10px] uppercase tracking-wider text-blue-400">{leftName}</div>
            <div className="font-display text-lg sm:text-xl font-black text-foreground">{leftScore}</div>
            {leftCombo >= 2 && <motion.div className="text-[10px] font-display text-yellow-400" initial={{ scale: 0 }} animate={{ scale: 1 }}>🔥 {leftCombo}x</motion.div>}
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 px-2 sm:px-3 py-1.5 sm:py-2 text-center flex flex-col items-center justify-center">
            <div className="font-display text-xs text-muted-foreground">VS</div>
            <div className="font-display text-sm font-bold text-foreground">{leftScore} - {rightScore}</div>
          </div>
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-2 sm:px-3 py-1.5 sm:py-2 text-center">
            <div className="font-display text-[10px] uppercase tracking-wider text-red-400">{rightName}</div>
            <div className="font-display text-lg sm:text-xl font-black text-foreground">{rightScore}</div>
            {rightCombo >= 2 && <motion.div className="text-[10px] font-display text-yellow-400" initial={{ scale: 0 }} animate={{ scale: 1 }}>🔥 {rightCombo}x</motion.div>}
          </div>
        </div>

        {/* ═══ DESKTOP: 3-COLUMN LAYOUT (lg+) ═══ */}
        <div className="flex-1 hidden lg:grid lg:grid-cols-[1fr_1.2fr_1fr] gap-3 min-h-0">

          {/* ── LEFT: Blue Team Question + NumPad ── */}
          <motion.div
            className="rounded-2xl border-2 border-blue-500/40 overflow-hidden flex flex-col"
            animate={shakeLeft ? { x: [-8, 8, -8, 8, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-4 py-5 text-center flex-shrink-0">
              <div className="font-display text-xs font-bold uppercase tracking-[0.2em] text-blue-200 mb-1">{leftName}</div>
              <motion.div
                key={leftQuestion?.text}
                className="font-display text-4xl font-black text-white leading-tight"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                {leftQuestion?.text}
              </motion.div>
            </div>
            <div className="bg-card/80 p-4 flex-1 flex flex-col justify-center">
              <NumPad
                value={leftInput}
                onChange={setLeftInput}
                onSubmit={() => handleAnswer("left", leftInput)}
                color="blue"
              />
            </div>
          </motion.div>

          {/* ── CENTER: Tug Of War Arena ── */}
          <div className="rounded-2xl border border-white/10 bg-card/60 p-4 flex flex-col justify-center relative overflow-hidden min-h-[200px]">
            <AnimatePresence>
              {showPower && (
                <motion.div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
                  initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.5 }}>
                  <div className={`font-display text-2xl font-black ${showPower === "left" ? "text-blue-400" : "text-red-400"} drop-shadow-[0_0_20px_rgba(147,51,234,0.5)]`}>
                    {leftCombo >= COMBO_MEGA || rightCombo >= COMBO_MEGA ? "⚡ MEGA PULL! ⚡" : "💪 POWER PULL! 💪"}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex-1 flex flex-col items-center justify-center relative">
              <div className="w-full flex justify-between mb-2 px-2">
                <span className="font-display text-[10px] font-bold text-blue-400 uppercase tracking-wider">{leftName}</span>
                <span className="font-display text-[10px] font-bold text-red-400 uppercase tracking-wider">{rightName}</span>
              </div>

              <div className="w-full relative" style={{ height: "180px" }}>
                <motion.div
                  className="absolute left-[0%] bottom-[10%] z-20 flex items-end gap-[-8px]"
                  animate={{ x: ropePos * 0.7 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                  <motion.div animate={{ rotate: [0, -4, 0], y: [0, -2, 0] }} transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}>
                    <TugPerson color="blue" scale={1.3} />
                  </motion.div>
                  <motion.div className="-ml-3" animate={{ rotate: [0, -3, 0], y: [0, -2, 0] }} transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut", delay: 0.12 }}>
                    <TugPerson color="blue" scale={1.15} />
                  </motion.div>
                </motion.div>

                <motion.div
                  className="absolute right-[0%] bottom-[10%] z-20 flex items-end gap-[-8px]"
                  animate={{ x: ropePos * 0.7 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                  <motion.div className="-mr-3" animate={{ rotate: [0, 3, 0], y: [0, -2, 0] }} transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut", delay: 0.12 }}>
                    <TugPerson color="red" flip scale={1.15} />
                  </motion.div>
                  <motion.div animate={{ rotate: [0, 4, 0], y: [0, -2, 0] }} transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}>
                    <TugPerson color="red" flip scale={1.3} />
                  </motion.div>
                </motion.div>

                <motion.div
                  className="absolute z-15 pointer-events-none"
                  style={{ left: "-5%", right: "-5%", bottom: "46%", height: "8px", borderRadius: "4px",
                    background: "linear-gradient(180deg, #C9A96E 0%, #A0845C 30%, #8B7355 60%, #6B5B3E 100%)",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
                    backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(107,91,62,0.4) 8px, rgba(107,91,62,0.4) 10px)`,
                  }}
                  animate={{ x: ropePos * 1.2 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
                <motion.div
                  className="absolute z-15 pointer-events-none"
                  style={{ left: "-5%", right: "-5%", bottom: "48.5%", height: "2px", borderRadius: "1px", background: "rgba(201,169,110,0.35)" }}
                  animate={{ x: ropePos * 1.2 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />

                <motion.svg className="absolute left-[-8%] bottom-[20%] z-14 pointer-events-none" width="80" height="80" viewBox="0 0 80 80" fill="none"
                  animate={{ x: ropePos * 1.2 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}>
                  <path d="M80 20 Q60 20 45 28 Q30 38 20 52 Q14 62 18 68" stroke="#8B7355" strokeWidth="6" strokeLinecap="round" fill="none" />
                  <path d="M80 19 Q60 19 45 27" stroke="#C9A96E" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.3" />
                </motion.svg>
                <motion.svg className="absolute right-[-8%] bottom-[20%] z-14 pointer-events-none" width="80" height="80" viewBox="0 0 80 80" fill="none"
                  style={{ transform: "scaleX(-1)" }} animate={{ x: ropePos * 1.2 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}>
                  <path d="M80 20 Q60 20 45 28 Q30 38 20 52 Q14 62 18 68" stroke="#8B7355" strokeWidth="6" strokeLinecap="round" fill="none" />
                  <path d="M80 19 Q60 19 45 27" stroke="#C9A96E" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.3" />
                </motion.svg>

                <motion.div className="absolute z-30 pointer-events-none" style={{ left: "50%", bottom: "36%" }}
                  animate={{ x: ropePos * 1.2 - 16 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}>
                  <motion.svg width="32" height="45" viewBox="0 0 32 45" fill="none"
                    animate={{ rotate: [0, 4, -4, 0] }} transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}>
                    <ellipse cx="16" cy="5" rx="7" ry="5" fill="#DC2626" />
                    <ellipse cx="16" cy="5" rx="5" ry="3" fill="#EF4444" />
                    <path d="M9 8 L23 8 L25 20 L21 32 L16 40 L11 32 L7 20 Z" fill="#DC2626" />
                    <path d="M13 10 L19 10 L20 18 L16 26 L12 18 Z" fill="#EF4444" opacity="0.45" />
                    <path d="M10 16 L22 16 L21 21 L11 21 Z" fill="white" opacity="0.65" />
                    <path d="M13 34 L16 40 L19 34" fill="#B91C1C" />
                  </motion.svg>
                </motion.div>

                <div className="absolute left-1/2 -translate-x-1/2 top-[10%] bottom-[10%] w-[2px] bg-yellow-400/30 z-5 rounded-full" />
                {[...Array(8)].map((_, i) => (
                  <motion.div key={i} className="absolute bottom-[15%] w-1.5 h-1.5 rounded-full bg-white/10" style={{ left: `${8 + i * 11}%` }}
                    animate={{ y: [0, -12, 0], opacity: [0.15, 0, 0.15], x: ropePos * 0.3 }}
                    transition={{ duration: 0.8, delay: i * 0.1, repeat: Infinity }} />
                ))}
                <div className="absolute left-[1%] top-[15%] bottom-[15%] w-[3px] bg-blue-500/50 rounded-full" />
                <div className="absolute right-[1%] top-[15%] bottom-[15%] w-[3px] bg-red-500/50 rounded-full" />
              </div>

              <div className="w-full mt-3 relative h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div className="absolute top-0 bottom-0 rounded-full"
                  style={{ background: ropePos < 0 ? "linear-gradient(90deg, rgba(52,152,219,0.8), rgba(52,152,219,0.3))" : ropePos > 0 ? "linear-gradient(90deg, rgba(231,76,60,0.3), rgba(231,76,60,0.8))" : "linear-gradient(90deg, rgba(255,255,255,0.2), rgba(255,255,255,0.2))" }}
                  animate={{ left: ropePos < 0 ? `${ropePercent}%` : "50%", right: ropePos > 0 ? `${100 - ropePercent}%` : "50%" }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }} />
                <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 bg-white/30" />
              </div>

              {mode === "classroom" && (
                <div className="mt-2 flex gap-2 justify-center">
                  <span className="font-display text-[10px] uppercase tracking-[0.2em] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">Team A · Active</span>
                  <span className="font-display text-[10px] uppercase tracking-[0.2em] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">Team B · Active</span>
                </div>
              )}
              <div className="mt-2 flex gap-2 justify-center">
                <span className="px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-[10px] font-display text-muted-foreground uppercase tracking-wider">{difficulty}</span>
                <span className="px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-[10px] font-display text-muted-foreground uppercase tracking-wider">
                  {mode === "pvp" ? "PvP" : mode === "pvai" ? `AI ${aiDifficulty}` : "Classroom"}
                </span>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Red Team Question + NumPad (desktop) ── */}
          <motion.div
            className="rounded-2xl border-2 border-red-500/40 overflow-hidden flex flex-col"
            animate={shakeRight ? { x: [-8, 8, -8, 8, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
            <div className="bg-gradient-to-br from-red-600 to-red-700 px-4 py-5 text-center flex-shrink-0">
              <div className="font-display text-xs font-bold uppercase tracking-[0.2em] text-red-200 mb-1">
                {rightName} {mode === "pvai" && "🤖"}
              </div>
              <motion.div
                key={rightQuestion?.text}
                className="font-display text-4xl font-black text-white leading-tight"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                {rightQuestion?.text}
              </motion.div>
            </div>
            <div className="bg-card/80 p-4 flex-1 flex flex-col justify-center">
              {mode === "pvai" ? (
                <div className="space-y-3">
                  <div className="w-full h-11 rounded-lg border border-red-500/30 bg-red-500/10 flex items-center justify-center px-3 font-display text-xl font-bold text-foreground tabular-nums">
                    {rightInput || <span className="text-muted-foreground/40 text-base">🤔</span>}
                  </div>
                  <div className="text-center text-muted-foreground font-display text-xs py-4 space-y-1">
                    <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}>AI is thinking...</motion.div>
                    <div className="text-[10px] text-muted-foreground/50">Difficulty: {aiDifficulty}</div>
                  </div>
                </div>
              ) : mode === "classroom" ? (
                <NumPad value={rightInput} onChange={setRightInput} onSubmit={() => handleAnswer("right", rightInput)} color="red" />
              ) : (
                <NumPad value={rightInput} onChange={setRightInput} onSubmit={() => handleAnswer("right", rightInput)}
                  disabled={mode === "pvai" || (mode === "classroom" && classroomTurn !== "right")} color="red" />
              )}
            </div>
          </motion.div>
        </div>

        {/* ═══ MOBILE LAYOUT (< lg): Vertical stacked ═══ */}
        <div className="flex-1 flex flex-col gap-2 min-h-0 lg:hidden overflow-auto">

          {/* ── Question Panels: Side by Side ── */}
          <div className="grid grid-cols-2 gap-2 flex-shrink-0">
            {/* Blue question */}
            <motion.div
              className="rounded-xl border-2 border-blue-500/40 overflow-hidden"
              animate={shakeLeft ? { x: [-6, 6, -6, 6, 0] } : {}}
              transition={{ duration: 0.4 }}
            >
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-3 py-3 text-center">
                <div className="font-display text-[10px] font-bold uppercase tracking-[0.15em] text-blue-200 mb-0.5">{leftName}</div>
                <motion.div
                  key={leftQuestion?.text}
                  className="font-display text-xl sm:text-2xl font-black text-white leading-tight"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  {leftQuestion?.text}
                </motion.div>
              </div>
            </motion.div>
            {/* Red question */}
            <motion.div
              className="rounded-xl border-2 border-red-500/40 overflow-hidden"
              animate={shakeRight ? { x: [-6, 6, -6, 6, 0] } : {}}
              transition={{ duration: 0.4 }}
            >
              <div className="bg-gradient-to-br from-red-600 to-red-700 px-3 py-3 text-center">
                <div className="font-display text-[10px] font-bold uppercase tracking-[0.15em] text-red-200 mb-0.5">
                  {rightName} {mode === "pvai" && "🤖"}
                </div>
                <motion.div
                  key={rightQuestion?.text}
                  className="font-display text-xl sm:text-2xl font-black text-white leading-tight"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  {rightQuestion?.text}
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* ── Compact Arena ── */}
          <div className="rounded-xl border border-white/10 bg-card/60 px-2 py-2 flex flex-col justify-center relative overflow-hidden flex-shrink-0">
            <AnimatePresence>
              {showPower && (
                <motion.div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
                  initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.5 }}>
                  <div className={`font-display text-lg font-black ${showPower === "left" ? "text-blue-400" : "text-red-400"} drop-shadow-[0_0_20px_rgba(147,51,234,0.5)]`}>
                    {leftCombo >= COMBO_MEGA || rightCombo >= COMBO_MEGA ? "⚡ MEGA PULL! ⚡" : "💪 POWER PULL! 💪"}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-col items-center justify-center relative">
              <div className="w-full flex justify-between px-2">
                <span className="font-display text-[9px] font-bold text-blue-400 uppercase tracking-wider">{leftName}</span>
                <span className="font-display text-[9px] font-bold text-red-400 uppercase tracking-wider">{rightName}</span>
              </div>

              {/* Compact rope area */}
              <div className="w-full relative" style={{ height: "120px" }}>
                <motion.div
                  className="absolute left-[0%] bottom-[10%] z-20 flex items-end"
                  animate={{ x: ropePos * 0.5 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                  <motion.div animate={{ rotate: [0, -4, 0], y: [0, -2, 0] }} transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}>
                    <TugPerson color="blue" scale={0.9} />
                  </motion.div>
                  <motion.div className="-ml-2" animate={{ rotate: [0, -3, 0], y: [0, -2, 0] }} transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut", delay: 0.12 }}>
                    <TugPerson color="blue" scale={0.8} />
                  </motion.div>
                </motion.div>

                <motion.div
                  className="absolute right-[0%] bottom-[10%] z-20 flex items-end"
                  animate={{ x: ropePos * 0.5 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                  <motion.div className="-mr-2" animate={{ rotate: [0, 3, 0], y: [0, -2, 0] }} transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut", delay: 0.12 }}>
                    <TugPerson color="red" flip scale={0.8} />
                  </motion.div>
                  <motion.div animate={{ rotate: [0, 4, 0], y: [0, -2, 0] }} transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}>
                    <TugPerson color="red" flip scale={0.9} />
                  </motion.div>
                </motion.div>

                <motion.div className="absolute z-15 pointer-events-none"
                  style={{ left: "-5%", right: "-5%", bottom: "46%", height: "6px", borderRadius: "3px",
                    background: "linear-gradient(180deg, #C9A96E 0%, #A0845C 30%, #8B7355 60%, #6B5B3E 100%)",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
                    backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(107,91,62,0.4) 8px, rgba(107,91,62,0.4) 10px)`,
                  }}
                  animate={{ x: ropePos * 0.8 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />

                <motion.div className="absolute z-30 pointer-events-none" style={{ left: "50%", bottom: "32%" }}
                  animate={{ x: ropePos * 0.8 - 12 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}>
                  <motion.svg width="24" height="34" viewBox="0 0 32 45" fill="none"
                    animate={{ rotate: [0, 4, -4, 0] }} transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}>
                    <ellipse cx="16" cy="5" rx="7" ry="5" fill="#DC2626" />
                    <ellipse cx="16" cy="5" rx="5" ry="3" fill="#EF4444" />
                    <path d="M9 8 L23 8 L25 20 L21 32 L16 40 L11 32 L7 20 Z" fill="#DC2626" />
                    <path d="M10 16 L22 16 L21 21 L11 21 Z" fill="white" opacity="0.65" />
                    <path d="M13 34 L16 40 L19 34" fill="#B91C1C" />
                  </motion.svg>
                </motion.div>

                <div className="absolute left-1/2 -translate-x-1/2 top-[10%] bottom-[10%] w-[2px] bg-yellow-400/30 z-5 rounded-full" />
                <div className="absolute left-[1%] top-[15%] bottom-[15%] w-[2px] bg-blue-500/50 rounded-full" />
                <div className="absolute right-[1%] top-[15%] bottom-[15%] w-[2px] bg-red-500/50 rounded-full" />
              </div>

              {/* Progress bar */}
              <div className="w-full mt-1 relative h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div className="absolute top-0 bottom-0 rounded-full"
                  style={{ background: ropePos < 0 ? "linear-gradient(90deg, rgba(52,152,219,0.8), rgba(52,152,219,0.3))" : ropePos > 0 ? "linear-gradient(90deg, rgba(231,76,60,0.3), rgba(231,76,60,0.8))" : "linear-gradient(90deg, rgba(255,255,255,0.2), rgba(255,255,255,0.2))" }}
                  animate={{ left: ropePos < 0 ? `${ropePercent}%` : "50%", right: ropePos > 0 ? `${100 - ropePercent}%` : "50%" }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }} />
                <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 bg-white/30" />
              </div>

              <div className="mt-1 flex gap-1.5 justify-center">
                <span className="px-1.5 py-0.5 rounded-full border border-white/10 bg-white/5 text-[9px] font-display text-muted-foreground uppercase tracking-wider">{difficulty}</span>
                <span className="px-1.5 py-0.5 rounded-full border border-white/10 bg-white/5 text-[9px] font-display text-muted-foreground uppercase tracking-wider">
                  {mode === "pvp" ? "PvP" : mode === "pvai" ? `AI ${aiDifficulty}` : "Classroom"}
                </span>
              </div>
            </div>
          </div>

          {/* ── NumPads: Side by Side ── */}
          <div className="grid grid-cols-2 gap-2 flex-1 min-h-0">
            {/* Blue numpad */}
            <div className="rounded-xl border border-blue-500/30 bg-card/80 p-2 flex flex-col justify-center overflow-auto">
              <NumPad
                value={leftInput}
                onChange={setLeftInput}
                onSubmit={() => handleAnswer("left", leftInput)}
                color="blue"
              />
            </div>
            {/* Red numpad / AI display */}
            <div className="rounded-xl border border-red-500/30 bg-card/80 p-2 flex flex-col justify-center overflow-auto">
              {mode === "pvai" ? (
                <div className="space-y-2">
                  <div className="w-full h-9 rounded-lg border border-red-500/30 bg-red-500/10 flex items-center justify-center px-2 font-display text-lg font-bold text-foreground tabular-nums">
                    {rightInput || <span className="text-muted-foreground/40 text-sm">🤔</span>}
                  </div>
                  <div className="text-center text-muted-foreground font-display text-[10px] py-2 space-y-0.5">
                    <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}>AI is thinking...</motion.div>
                    <div className="text-[9px] text-muted-foreground/50">Difficulty: {aiDifficulty}</div>
                  </div>
                </div>
              ) : (
                <NumPad
                  value={rightInput}
                  onChange={setRightInput}
                  onSubmit={() => handleAnswer("right", rightInput)}
                  disabled={mode === "classroom" && classroomTurn !== "right"}
                  color="red"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MathsTugOfWar;
