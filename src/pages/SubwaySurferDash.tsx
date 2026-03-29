import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Pause, Play, RotateCcw } from "lucide-react";

type GameStatus = "ready" | "running" | "paused" | "gameover";

interface Rocket {
  x: number;
}

interface Obstacle {
  id: number;
  x: number;
  y: number;
  size: number;
}

interface Crystal {
  id: number;
  x: number;
  y: number;
  size: number;
}

const GAME_WIDTH = 800;
const GAME_HEIGHT = 560;
const ROCKET_Y = 460;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const SpaceLaunchGame = () => {
  const navigate = useNavigate();

  const [status, setStatus] = useState<GameStatus>("ready");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [crystals, setCrystals] = useState(0);
  const [tick, setTick] = useState(0);

  const statusRef = useRef<GameStatus>("ready");
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef(0);
  const idRef = useRef(1);

  const rocketRef = useRef<Rocket>({ x: GAME_WIDTH / 2 });
  const obstaclesRef = useRef<Obstacle[]>([]);
  const crystalsRef = useRef<Crystal[]>([]);

  const speedRef = useRef(170);
  const spawnObstacleRef = useRef(0.9);
  const spawnCrystalRef = useRef(0.55);
  const scoreRef = useRef(0);
  const crystalsRefCount = useRef(0);

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const resetWorld = useCallback(() => {
    rocketRef.current = { x: GAME_WIDTH / 2 };
    obstaclesRef.current = [];
    crystalsRef.current = [];
    speedRef.current = 170;
    spawnObstacleRef.current = 0.9;
    spawnCrystalRef.current = 0.55;
    scoreRef.current = 0;
    crystalsRefCount.current = 0;
    setScore(0);
    setCrystals(0);
  }, []);

  const moveRocket = useCallback((direction: -1 | 1) => {
    const next = rocketRef.current.x + direction * 46;
    rocketRef.current.x = clamp(next, 70, GAME_WIDTH - 70);
  }, []);

  const spawnObstacle = useCallback(() => {
    const size = 34 + Math.random() * 26;
    const x = 70 + Math.random() * (GAME_WIDTH - 140);
    obstaclesRef.current.push({ id: idRef.current++, x, y: -80, size });
  }, []);

  const spawnCrystal = useCallback(() => {
    const size = 22 + Math.random() * 8;
    const x = 70 + Math.random() * (GAME_WIDTH - 140);
    crystalsRef.current.push({ id: idRef.current++, x, y: -60, size });
  }, []);

  const triggerGameOver = useCallback(() => {
    stopLoop();
    statusRef.current = "gameover";
    setStatus("gameover");
    setBest((prev) => Math.max(prev, scoreRef.current));
  }, [stopLoop]);

  const step = useCallback((ts: number) => {
    if (statusRef.current !== "running") return;

    const prev = lastTsRef.current || ts;
    const dt = Math.min((ts - prev) / 1000, 0.05);
    lastTsRef.current = ts;

    speedRef.current += dt * 3.6;

    spawnObstacleRef.current -= dt;
    spawnCrystalRef.current -= dt;

    if (spawnObstacleRef.current <= 0) {
      spawnObstacle();
      spawnObstacleRef.current = Math.max(0.42, 0.95 - speedRef.current * 0.0014 + Math.random() * 0.24);
    }

    if (spawnCrystalRef.current <= 0) {
      spawnCrystal();
      spawnCrystalRef.current = Math.max(0.28, 0.65 - speedRef.current * 0.001 + Math.random() * 0.2);
    }

    const travel = speedRef.current * dt;

    obstaclesRef.current = obstaclesRef.current
      .map((o) => ({ ...o, y: o.y + travel }))
      .filter((o) => o.y < GAME_HEIGHT + 80);

    crystalsRef.current = crystalsRef.current
      .map((c) => ({ ...c, y: c.y + travel * 0.92 }))
      .filter((c) => c.y < GAME_HEIGHT + 60);

    const rocketX = rocketRef.current.x;

    for (const o of obstaclesRef.current) {
      const closeY = Math.abs(o.y - ROCKET_Y) < 38;
      const closeX = Math.abs(o.x - rocketX) < (o.size * 0.45 + 24);
      if (closeY && closeX) {
        triggerGameOver();
        return;
      }
    }

    let picked = 0;
    crystalsRef.current = crystalsRef.current.filter((c) => {
      const closeY = Math.abs(c.y - ROCKET_Y) < 34;
      const closeX = Math.abs(c.x - rocketX) < 28;
      if (closeY && closeX) {
        picked += 1;
        return false;
      }
      return true;
    });

    if (picked > 0) {
      crystalsRefCount.current += picked;
      setCrystals(crystalsRefCount.current);
    }

    scoreRef.current += Math.floor(travel * 0.5) + picked * 50;
    setScore(scoreRef.current);

    setTick((v) => v + 1);
    rafRef.current = requestAnimationFrame(step);
  }, [spawnCrystal, spawnObstacle, triggerGameOver]);

  const startGame = useCallback(() => {
    resetWorld();
    statusRef.current = "running";
    setStatus("running");
    lastTsRef.current = 0;
    stopLoop();
    rafRef.current = requestAnimationFrame(step);
  }, [resetWorld, step, stopLoop]);

  const pauseGame = useCallback(() => {
    if (statusRef.current !== "running") return;
    statusRef.current = "paused";
    setStatus("paused");
    stopLoop();
  }, [stopLoop]);

  const resumeGame = useCallback(() => {
    if (statusRef.current !== "paused") return;
    statusRef.current = "running";
    setStatus("running");
    lastTsRef.current = 0;
    stopLoop();
    rafRef.current = requestAnimationFrame(step);
  }, [step, stopLoop]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (statusRef.current === "ready" && (e.code === "Space" || e.key === "Enter")) {
        e.preventDefault();
        startGame();
        return;
      }

      if (statusRef.current === "gameover" && e.key.toLowerCase() === "r") {
        startGame();
        return;
      }

      if (e.key.toLowerCase() === "p") {
        if (statusRef.current === "running") pauseGame();
        else if (statusRef.current === "paused") resumeGame();
        return;
      }

      if (statusRef.current !== "running") return;

      if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") moveRocket(-1);
      if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") moveRocket(1);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [moveRocket, pauseGame, resumeGame, startGame]);

  useEffect(() => () => stopLoop(), [stopLoop]);

  const hudLabel = useMemo(() => {
    if (status === "ready") return "Press Space to Launch";
    if (status === "paused") return "Paused";
    if (status === "gameover") return "Mission Failed";
    return "Ascending";
  }, [status]);

  const rocket = rocketRef.current;
  const obstacles = obstaclesRef.current;
  const crystalItems = crystalsRef.current;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#030617] via-[#050b1f] to-[#02040b] text-white px-4 py-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} /> Arena
          </button>

          <div className="flex items-center gap-2">
            {status === "running" ? (
              <button
                onClick={pauseGame}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm"
              >
                <Pause size={16} /> Pause
              </button>
            ) : status === "paused" ? (
              <button
                onClick={resumeGame}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/85 hover:bg-emerald-500 text-black text-sm font-semibold"
              >
                <Play size={16} /> Resume
              </button>
            ) : null}

            <button
              onClick={startGame}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/85 hover:bg-amber-500 text-black text-sm font-semibold"
            >
              <RotateCcw size={16} /> Restart
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4 text-center">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <div className="text-xs text-white/50 uppercase">Score</div>
            <div className="text-xl font-black text-amber-300">{score}</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <div className="text-xs text-white/50 uppercase">Crystals</div>
            <div className="text-xl font-black text-cyan-300">{crystals}</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <div className="text-xs text-white/50 uppercase">Best</div>
            <div className="text-xl font-black text-emerald-300">{best}</div>
          </div>
        </div>

        <div className="relative w-full h-[560px] rounded-2xl overflow-hidden border border-white/15 bg-gradient-to-b from-[#0a1130] to-[#02050d]">
          <div className="absolute inset-0 opacity-80">
            {Array.from({ length: 36 }).map((_, i) => {
              const x = (i * 73) % GAME_WIDTH;
              const y = (i * 91 + tick * 3) % GAME_HEIGHT;
              const size = (i % 4) + 1;
              return (
                <div
                  key={`star-${i}`}
                  className="absolute bg-white/70 rounded-full"
                  style={{ left: `${x}px`, top: `${y}px`, width: `${size}px`, height: `${size}px` }}
                />
              );
            })}
          </div>

          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-cyan-400/20 to-transparent" />

          {obstacles.map((o) => (
            <div
              key={`obs-${o.id}`}
              className="absolute rounded-full bg-rose-500/90 border border-rose-200/25"
              style={{
                left: `${o.x - o.size / 2}px`,
                top: `${o.y}px`,
                width: `${o.size}px`,
                height: `${o.size}px`,
                boxShadow: "0 0 24px rgba(244,63,94,0.35)",
              }}
            />
          ))}

          {crystalItems.map((c) => (
            <div
              key={`crystal-${c.id}`}
              className="absolute rotate-45 bg-cyan-300 border border-cyan-100/40"
              style={{
                left: `${c.x - c.size / 2}px`,
                top: `${c.y}px`,
                width: `${c.size}px`,
                height: `${c.size}px`,
                boxShadow: "0 0 20px rgba(34,211,238,0.45)",
              }}
            />
          ))}

          <div
            className="absolute"
            style={{
              left: `${rocket.x - 26}px`,
              top: `${ROCKET_Y}px`,
              width: "52px",
              height: "84px",
              transition: "left 120ms linear",
            }}
          >
            <div className="absolute inset-0 rounded-t-full rounded-b-lg bg-gradient-to-b from-white to-cyan-300 border border-cyan-100/40" />
            <div className="absolute left-1/2 -translate-x-1/2 top-2 w-4 h-4 rounded-full bg-sky-700/85 border border-sky-200/50" />
            <div className="absolute -left-2 top-8 w-3 h-7 rounded-l-md bg-cyan-200/80" />
            <div className="absolute -right-2 top-8 w-3 h-7 rounded-r-md bg-cyan-200/80" />
            {status === "running" && (
              <div className="absolute left-1/2 -translate-x-1/2 -bottom-5 w-4 h-6 bg-gradient-to-b from-yellow-300 to-orange-500 rounded-full blur-[1px]" />
            )}
          </div>

          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/35 border border-white/10 text-sm font-semibold tracking-wide">
            {hudLabel}
          </div>

          {status === "ready" && (
            <div className="absolute inset-0 bg-black/45 flex items-center justify-center p-4 text-center">
              <div>
                <h1 className="text-4xl font-black mb-3 text-cyan-300">Rocket Space Launch</h1>
                <p className="text-white/80 mb-2">Pilot your rocket through asteroid fields and collect crystals.</p>
                <p className="text-white/60 text-sm">Controls: A/D or Left/Right arrows. Press P to pause.</p>
                <button
                  onClick={startGame}
                  className="mt-5 px-6 py-3 rounded-xl bg-cyan-400 text-black font-bold hover:bg-cyan-300 transition-colors"
                >
                  Launch Mission
                </button>
              </div>
            </div>
          )}

          {status === "gameover" && (
            <div className="absolute inset-0 bg-black/55 flex items-center justify-center p-4 text-center">
              <div>
                <h2 className="text-4xl font-black text-rose-300 mb-3">Rocket Destroyed</h2>
                <p className="text-white/80">Score: <span className="font-bold text-amber-300">{score}</span> | Crystals: <span className="font-bold text-cyan-300">{crystals}</span></p>
                <button
                  onClick={startGame}
                  className="mt-5 px-6 py-3 rounded-xl bg-emerald-500 text-black font-bold hover:bg-emerald-400 transition-colors"
                >
                  Launch Again
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 md:hidden">
          <button
            onTouchStart={() => moveRocket(-1)}
            onMouseDown={() => moveRocket(-1)}
            className="py-3 rounded-lg bg-white/10 border border-white/15 text-sm"
          >
            Move Left
          </button>
          <button
            onTouchStart={() => moveRocket(1)}
            onMouseDown={() => moveRocket(1)}
            className="py-3 rounded-lg bg-white/10 border border-white/15 text-sm"
          >
            Move Right
          </button>
        </div>
      </div>
    </div>
  );
};

export default SpaceLaunchGame;
