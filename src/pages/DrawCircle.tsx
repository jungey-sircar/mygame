import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "@/components/Confetti";

interface Point {
  x: number;
  y: number;
}

type Phase = "idle" | "drawing" | "result";

const DrawCircle = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<Point[]>([]);
  const animFrameRef = useRef<number>(0);

  const [phase, setPhase] = useState<Phase>("idle");
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    const s = localStorage.getItem("circle-best");
    return s ? parseFloat(s) : 0;
  });
  const [attempts, setAttempts] = useState(() => {
    const a = localStorage.getItem("circle-attempts");
    return a ? parseInt(a) : 0;
  });
  const [avgScore, setAvgScore] = useState(() => {
    const a = localStorage.getItem("circle-avg");
    return a ? parseFloat(a) : 0;
  });
  const [showConfetti, setShowConfetti] = useState(false);
  const [classroomMode, setClassroomMode] = useState(false);
  const [idealCircle, setIdealCircle] = useState<{ cx: number; cy: number; r: number } | null>(null);
  const [showIdeal, setShowIdeal] = useState(false);
  const [ruleViolation, setRuleViolation] = useState(false);
  const [violationMessage, setViolationMessage] = useState<string | null>(null);

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
  }, []);

  useEffect(() => {
    setupCanvas();
    window.addEventListener("resize", setupCanvas);
    return () => window.removeEventListener("resize", setupCanvas);
  }, [setupCanvas]);

  const getScoreColor = (s: number) => {
    if (s >= 90) return "hsl(150, 80%, 50%)";
    if (s >= 70) return "hsl(50, 90%, 55%)";
    if (s >= 50) return "hsl(30, 90%, 55%)";
    return "hsl(0, 80%, 55%)";
  };

  const getScoreLabel = (s: number) => {
    if (s >= 98) return "INHUMAN PRECISION";
    if (s >= 95) return "Nearly Perfect!";
    if (s >= 90) return "Excellent!";
    if (s >= 80) return "Great Job!";
    if (s >= 70) return "Not Bad!";
    if (s >= 50) return "Keep Practicing";
    if (s >= 30) return "Needs Work";
    return "Try Again...";
  };

  const drawStroke = useCallback((points: Point[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx || points.length < 2) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    // Calculate current center and radius for real-time color feedback
    let cx = 0, cy = 0;
    points.forEach(p => { cx += p.x; cy += p.y; });
    cx /= points.length;
    cy /= points.length;
    const distances = points.map(p => Math.sqrt((p.x - cx) ** 2 + (p.y - cy) ** 2));
    const meanR = distances.reduce((a, b) => a + b, 0) / distances.length;

    for (let i = 1; i < points.length; i++) {
      const p0 = points[i - 1];
      const p1 = points[i];

      // Color based on deviation from mean radius
      const dist = Math.sqrt((p1.x - cx) ** 2 + (p1.y - cy) ** 2);
      const dev = Math.abs(dist - meanR) / (meanR || 1);
      const hue = Math.max(0, 150 - dev * 600); // green → red

      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.strokeStyle = `hsl(${hue}, 85%, 55%)`;
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.shadowColor = `hsl(${hue}, 85%, 55%)`;
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }, []);

  const drawIdealOverlay = useCallback((cx: number, cy: number, r: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = "hsla(185, 80%, 50%, 0.4)";
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.stroke();
    ctx.setLineDash([]);
  }, []);

  const drawHeatmap = useCallback((points: Point[], cx: number, cy: number, meanR: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    points.forEach(p => {
      const dist = Math.sqrt((p.x - cx) ** 2 + (p.y - cy) ** 2);
      const dev = Math.abs(dist - meanR);
      const intensity = Math.min(1, dev / (meanR * 0.3));
      const radius = 6 + intensity * 10;

      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${Math.max(0, 60 - intensity * 60)}, 90%, 50%, ${0.1 + intensity * 0.3})`;
      ctx.fill();
    });
  }, []);

  const fitCircle = useCallback((points: Point[]) => {
    let meanX = 0;
    let meanY = 0;
    points.forEach((p) => {
      meanX += p.x;
      meanY += p.y;
    });
    meanX /= points.length;
    meanY /= points.length;

    let suu = 0;
    let svv = 0;
    let suv = 0;
    let suuu = 0;
    let svvv = 0;
    let suvv = 0;
    let svuu = 0;

    for (const p of points) {
      const u = p.x - meanX;
      const v = p.y - meanY;
      const uu = u * u;
      const vv = v * v;

      suu += uu;
      svv += vv;
      suv += u * v;
      suuu += uu * u;
      svvv += vv * v;
      suvv += u * vv;
      svuu += v * uu;
    }

    const det = suu * svv - suv * suv;
    if (Math.abs(det) < 1e-6) {
      const radius =
        points.reduce((sum, p) => sum + Math.hypot(p.x - meanX, p.y - meanY), 0) / points.length;
      return { cx: meanX, cy: meanY, r: radius };
    }

    const uc = (0.5 * (suuu + suvv) * svv - 0.5 * (svvv + svuu) * suv) / det;
    const vc = (0.5 * (svvv + svuu) * suu - 0.5 * (suuu + suvv) * suv) / det;

    const cx = uc + meanX;
    const cy = vc + meanY;
    const r = points.reduce((sum, p) => sum + Math.hypot(p.x - cx, p.y - cy), 0) / points.length;

    return { cx, cy, r };
  }, []);

  const smoothPoints = useCallback((points: Point[]) => {
    if (points.length < 8) return points;
    const windowRadius = 2;
    const smoothed: Point[] = [];

    for (let i = 0; i < points.length; i++) {
      let sx = 0;
      let sy = 0;
      let count = 0;
      for (let j = i - windowRadius; j <= i + windowRadius; j++) {
        const k = Math.max(0, Math.min(points.length - 1, j));
        sx += points[k].x;
        sy += points[k].y;
        count += 1;
      }
      smoothed.push({ x: sx / count, y: sy / count });
    }

    return smoothed;
  }, []);

  const segmentsIntersect = useCallback((a: Point, b: Point, c: Point, d: Point) => {
    const EPS = 1e-4;
    const orient = (p: Point, q: Point, r: Point) =>
      (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);

    const onSegment = (p: Point, q: Point, r: Point) =>
      Math.min(p.x, r.x) <= q.x && q.x <= Math.max(p.x, r.x) &&
      Math.min(p.y, r.y) <= q.y && q.y <= Math.max(p.y, r.y);

    const o1 = orient(a, b, c);
    const o2 = orient(a, b, d);
    const o3 = orient(c, d, a);
    const o4 = orient(c, d, b);

    if ((o1 > 0) !== (o2 > 0) && (o3 > 0) !== (o4 > 0)) return true;
    if (Math.abs(o1) < EPS && onSegment(a, c, b)) return true;
    if (Math.abs(o2) < EPS && onSegment(a, d, b)) return true;
    if (Math.abs(o3) < EPS && onSegment(c, a, d)) return true;
    if (Math.abs(o4) < EPS && onSegment(c, b, d)) return true;
    return false;
  }, []);

  const playViolationSound = useCallback(() => {
    try {
      const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextCtor) return;
      const ctx = new AudioContextCtor();
      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sawtooth";
      osc2.type = "triangle";
      osc1.frequency.setValueAtTime(740, now);
      osc1.frequency.exponentialRampToValueAtTime(280, now + 0.25);
      osc2.frequency.setValueAtTime(520, now);
      osc2.frequency.exponentialRampToValueAtTime(210, now + 0.25);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.3);
      osc2.stop(now + 0.3);

      setTimeout(() => {
        void ctx.close();
      }, 380);
    } catch {
      // Non-blocking sound effect failure should not affect gameplay.
    }
  }, []);

  const getViolationInfo = useCallback((points: Point[]) => {
    if (points.length < 10) {
      return { violated: true, message: "Too short - draw a full circle" };
    }

    const scoredPoints = smoothPoints(points);
    const { cx, cy, r } = fitCircle(scoredPoints);
    if (r < 20) return { violated: true, message: "Circle is too small" };

    const first = points[0];
    const last = points[points.length - 1];
    const closureRatio = Math.hypot(first.x - last.x, first.y - last.y) / r;

    let totalSigned = 0;
    let totalAbs = 0;
    let prev = Math.atan2(scoredPoints[0].y - cy, scoredPoints[0].x - cx);
    for (let i = 1; i < scoredPoints.length; i++) {
      const current = Math.atan2(scoredPoints[i].y - cy, scoredPoints[i].x - cx);
      let delta = current - prev;
      while (delta > Math.PI) delta -= 2 * Math.PI;
      while (delta < -Math.PI) delta += 2 * Math.PI;
      totalSigned += delta;
      totalAbs += Math.abs(delta);
      prev = current;
    }

    const revolutions = Math.abs(totalSigned) / (2 * Math.PI);
    const turnRatio = totalAbs / (Math.abs(totalSigned) + 1e-6);

    const sampleStep = Math.max(1, Math.floor(scoredPoints.length / 160));
    const sampled = scoredPoints.filter((_, i) => i % sampleStep === 0);
    if (sampled[sampled.length - 1] !== scoredPoints[scoredPoints.length - 1]) {
      sampled.push(scoredPoints[scoredPoints.length - 1]);
    }

    let intersections = 0;
    for (let i = 0; i < sampled.length - 1; i++) {
      const a = sampled[i];
      const b = sampled[i + 1];
      for (let j = i + 2; j < sampled.length - 1; j++) {
        if (i === 0 && j === sampled.length - 2) continue;
        const c = sampled[j];
        const d = sampled[j + 1];
        if (segmentsIntersect(a, b, c, d)) {
          intersections += 1;
          if (intersections >= 3) break;
        }
      }
      if (intersections >= 3) break;
    }

    if (intersections > 0) {
      return { violated: true, message: "Path crossed itself - circle rule violated" };
    }
    if (revolutions < 0.72) {
      return { violated: true, message: "Semi circle / incomplete loop" };
    }
    if (revolutions > 1.35 || turnRatio > 1.5) {
      return { violated: true, message: "Spiral or scribble detected" };
    }
    if (closureRatio > 0.45) {
      return { violated: true, message: "Circle not closed" };
    }

    return { violated: false, message: null as string | null };
  }, [fitCircle, smoothPoints, segmentsIntersect]);

  const calculateScore = useCallback((points: Point[]) => {
    if (points.length < 10) return 0;

    const scoredPoints = smoothPoints(points);
    const { cx, cy, r: meanRadius } = fitCircle(scoredPoints);
    const distances = scoredPoints.map((p) => Math.hypot(p.x - cx, p.y - cy));

    if (meanRadius < 20) return 0;

    const avgError = distances.reduce((sum, d) => sum + Math.abs(d - meanRadius), 0) / distances.length;
    const rmsError = Math.sqrt(
      distances.reduce((sum, d) => sum + (d - meanRadius) * (d - meanRadius), 0) / distances.length
    );

    // Blend MAE/RMSE to better reflect perceived circularity and remain scale-independent.
    const normalizedError = Math.min(1, (0.65 * avgError + 0.35 * rmsError) / meanRadius);
    const rawScore = Math.max(0, 100 * (1 - 1.35 * normalizedError));

    // Detect radial outliers so inward spikes / dents are penalized more strongly.
    const absErrors = distances
      .map((d) => Math.abs(d - meanRadius))
      .sort((a, b) => a - b);
    const p90Error = absErrors[Math.floor((absErrors.length - 1) * 0.9)] ?? 0;
    const p90Ratio = p90Error / meanRadius;
    const outlierPenalty = Math.max(0, (p90Ratio - 0.24) * 30);

    // Count self-intersections (sampled for performance). A true circle should have none.
    const sampleStep = Math.max(1, Math.floor(scoredPoints.length / 160));
    const sampled = scoredPoints.filter((_, i) => i % sampleStep === 0);
    if (sampled[sampled.length - 1] !== scoredPoints[scoredPoints.length - 1]) {
      sampled.push(scoredPoints[scoredPoints.length - 1]);
    }

    let intersections = 0;
    for (let i = 0; i < sampled.length - 1; i++) {
      const a = sampled[i];
      const b = sampled[i + 1];
      for (let j = i + 2; j < sampled.length - 1; j++) {
        // Skip neighboring segments and the first-last wrap adjacency.
        if (i === 0 && j === sampled.length - 2) continue;
        const c = sampled[j];
        const d = sampled[j + 1];
        if (segmentsIntersect(a, b, c, d)) {
          intersections += 1;
          if (intersections >= 6) break;
        }
      }
      if (intersections >= 6) break;
    }
    const intersectionPenalty = Math.max(0, intersections - 1) * 6;

    // Track angular sweep quality around fitted center.
    let totalSigned = 0;
    let totalAbs = 0;
    let prev = Math.atan2(scoredPoints[0].y - cy, scoredPoints[0].x - cx);
    for (let i = 1; i < scoredPoints.length; i++) {
      const current = Math.atan2(scoredPoints[i].y - cy, scoredPoints[i].x - cx);
      let delta = current - prev;
      while (delta > Math.PI) delta -= 2 * Math.PI;
      while (delta < -Math.PI) delta += 2 * Math.PI;
      totalSigned += delta;
      totalAbs += Math.abs(delta);
      prev = current;
    }

    const revolutions = Math.abs(totalSigned) / (2 * Math.PI);
    const turnRatio = totalAbs / (Math.abs(totalSigned) + 1e-6);
    const revolutionPenalty = Math.min(12, Math.abs(revolutions - 1) * 16);
    const backtrackPenalty = Math.max(0, (turnRatio - 1.35) * 8);

    // Bonus: check if shape is closed
    const first = points[0];
    const last = points[points.length - 1];
    const closeDist = Math.hypot(first.x - last.x, first.y - last.y);
    const closureRatio = closeDist / meanRadius;
    const closureBonus = closureRatio < 0.18 ? 2 : -Math.min(3, closureRatio * 2.4);

    const shapePenalty = intersectionPenalty + revolutionPenalty + backtrackPenalty + outlierPenalty;
    const technicalScore = Math.max(0, Math.min(100, rawScore + closureBonus - shapePenalty));

    const maxAbsError = absErrors[absErrors.length - 1] ?? 0;

    // 100 is reserved for truly near-errorless circles only.
    const perfectLike =
      normalizedError < 0.006 &&
      p90Ratio < 0.03 &&
      closureRatio < 0.03 &&
      intersections === 0 &&
      Math.abs(revolutions - 1) < 0.01 &&
      turnRatio < 1.02 &&
      maxAbsError < 1.2;
    if (perfectLike) return 100;

    const finalScore = Math.max(0, Math.min(99.9, technicalScore));
    return Math.round(finalScore * 10) / 10;
  }, [fitCircle, smoothPoints, segmentsIntersect]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (phase !== "idle") return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    pointsRef.current = [{ x, y }];
    setPhase("drawing");
    setShowConfetti(false);
    setIdealCircle(null);
    setShowIdeal(false);

    const ctx = canvas.getContext("2d");
    if (ctx) {
      const dpr = window.devicePixelRatio || 1;
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    }
  }, [phase]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (phase !== "drawing") return;
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    pointsRef.current.push({ x, y });

    cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(() => {
      drawStroke(pointsRef.current);
    });
  }, [phase, drawStroke]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (phase !== "drawing") return;
    e.preventDefault();

    const points = pointsRef.current;
    const violation = getViolationInfo(points);
    const s = calculateScore(points);
    const finalAttemptScore = violation.violated ? Math.min(s, 35) : s;
    setScore(finalAttemptScore);
    setRuleViolation(violation.violated);
    setViolationMessage(violation.message);
    if (violation.violated) playViolationSound();

    // Compute ideal circle with the same fit used by scoring.
    const { cx, cy, r: meanR } = fitCircle(points);
    setIdealCircle({ cx, cy, r: meanR });

    // Heatmap
    drawHeatmap(points, cx, cy, meanR);

    // Stats
    const newAttempts = attempts + 1;
    const newAvg = ((avgScore * attempts) + finalAttemptScore) / newAttempts;
    const newBest = Math.max(bestScore, finalAttemptScore);

    setAttempts(newAttempts);
    setAvgScore(Math.round(newAvg * 10) / 10);
    setBestScore(newBest);

    localStorage.setItem("circle-attempts", String(newAttempts));
    localStorage.setItem("circle-avg", String(Math.round(newAvg * 10) / 10));
    localStorage.setItem("circle-best", String(newBest));

    if (!violation.violated && finalAttemptScore >= 95) setShowConfetti(true);

    setPhase("result");
  }, [phase, getViolationInfo, calculateScore, playViolationSound, drawHeatmap, attempts, avgScore, bestScore, fitCircle]);

  useEffect(() => {
    if (phase === "result" && showIdeal && idealCircle) {
      drawStroke(pointsRef.current);
      drawHeatmap(pointsRef.current, idealCircle.cx, idealCircle.cy, idealCircle.r);
      drawIdealOverlay(idealCircle.cx, idealCircle.cy, idealCircle.r);
    }
  }, [showIdeal, phase, idealCircle, drawStroke, drawHeatmap, drawIdealOverlay]);

  const reset = () => {
    setPhase("idle");
    setScore(0);
    setShowConfetti(false);
    setIdealCircle(null);
    setShowIdeal(false);
    setRuleViolation(false);
    setViolationMessage(null);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const dpr = window.devicePixelRatio || 1;
        ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-background overflow-hidden select-none" style={{ touchAction: "none" }}>
      {showConfetti && <Confetti />}

      {/* Subtle bg texture */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: "radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)",
        backgroundSize: "32px 32px"
      }} />

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ cursor: phase === "idle" ? "crosshair" : phase === "drawing" ? "none" : "default" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />

      {/* Top bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20 pointer-events-none">
        <button
          onClick={() => navigate("/")}
          className="pointer-events-auto font-display text-sm tracking-wider text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
        >
          ← ARENA
        </button>

        {classroomMode && (
          <div className="flex gap-4 font-body text-sm text-muted-foreground">
            <span>Attempts: <span className="text-foreground font-semibold">{attempts}</span></span>
            <span>Best: <span className="text-neon-green font-semibold">{bestScore}%</span></span>
            <span>Avg: <span className="text-neon-cyan font-semibold">{avgScore}%</span></span>
          </div>
        )}

        <button
          onClick={() => setClassroomMode(!classroomMode)}
          className={`pointer-events-auto font-display text-xs tracking-wider px-3 py-1.5 rounded-full border transition-all ${
            classroomMode
              ? "border-neon-green/50 text-neon-green bg-neon-green/10"
              : "border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          🎓 {classroomMode ? "CLASS ON" : "CLASS OFF"}
        </button>
      </div>

      {/* Idle screen */}
      <AnimatePresence>
        {phase === "idle" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none"
          >
            <motion.p
              className="font-display text-xl sm:text-2xl text-muted-foreground/70 mb-8 tracking-wider"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              Can you draw a <span className="text-foreground">PERFECT</span> circle?
            </motion.p>

            {/* Pulsing ring */}
            <div className="relative w-32 h-32 sm:w-40 sm:h-40">
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-neon-purple/40"
                animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.1, 0.4] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              />
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-neon-cyan/40"
                animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.05, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-display text-lg text-muted-foreground/50 tracking-widest">DRAW</span>
              </div>
            </div>

            <p className="mt-8 font-body text-sm text-muted-foreground/40">
              Click and drag to draw
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result overlay */}
      <AnimatePresence>
        {phase === "result" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-x-0 top-6 sm:top-10 flex flex-col items-center z-20 pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 15 }}
              className={`text-center pointer-events-auto ${score < 40 ? "animate-[rickroll-shake_0.3s_ease-in-out_3]" : ""}`}
            >
              <div
                className="glass-panel px-10 py-8 sm:px-14 sm:py-10 rounded-2xl"
                style={{ boxShadow: `0 0 60px ${getScoreColor(score)}33` }}
              >
                <motion.p
                  className="font-display text-5xl sm:text-7xl font-black tracking-tight"
                  style={{ color: getScoreColor(score) }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.1, damping: 10 }}
                >
                  {score}%
                </motion.p>
                <p className="font-display text-sm sm:text-base tracking-widest text-muted-foreground mt-2 uppercase">
                  {ruleViolation ? "CIRCLE RULE VIOLATED" : getScoreLabel(score)}
                </p>

                {ruleViolation && violationMessage && (
                  <p className="font-display text-[11px] sm:text-xs tracking-wider text-red-400 mt-2 uppercase">
                    {violationMessage}
                  </p>
                )}

                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <button
                    onClick={() => setShowIdeal(!showIdeal)}
                    className="px-4 py-2 rounded-lg font-display text-xs tracking-wider border border-border text-muted-foreground hover:text-foreground hover:border-neon-cyan/50 transition-all"
                  >
                    {showIdeal ? "HIDE" : "SHOW"} IDEAL
                  </button>
                  <button
                    onClick={reset}
                    className="px-6 py-2 rounded-lg font-display text-sm tracking-wider bg-neon-purple/20 border border-neon-purple/40 text-foreground hover:bg-neon-purple/30 transition-all"
                  >
                    TRY AGAIN
                  </button>
                  <button
                    onClick={() => navigate("/")}
                    className="px-4 py-2 rounded-lg font-display text-xs tracking-wider border border-border text-muted-foreground hover:text-foreground transition-all"
                  >
                    BACK
                  </button>
                </div>
              </div>
            </motion.div>

            {ruleViolation && (
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 220, damping: 14 }}
                className="absolute top-[16%] sm:top-[18%] text-red-500/95 font-black leading-none select-none"
                style={{
                  fontSize: "clamp(80px, 20vw, 220px)",
                  textShadow: "0 0 25px rgba(239, 68, 68, 0.6), 0 0 55px rgba(239, 68, 68, 0.35)",
                }}
              >
                X
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DrawCircle;
