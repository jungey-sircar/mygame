import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Confetti from "@/components/Confetti";
import ParticleBackground from "@/components/ParticleBackground";

type Mode = "single" | "multi" | null;

const BEST_SCORE_KEY = "random_number_guess_best_attempts";

const getStoredBestScore = (): number | null => {
  try {
    const raw = localStorage.getItem(BEST_SCORE_KEY);
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const makeSecret = () => Math.floor(Math.random() * 501);

const RandomNumberDuel = () => {
  const [mode, setMode] = useState<Mode>(null);
  const [secret, setSecret] = useState<number>(makeSecret);

  const [guess, setGuess] = useState("");
  const [message, setMessage] = useState("Pick a mode to start.");
  const [isWon, setIsWon] = useState(false);

  const [attempts, setAttempts] = useState(0);
  const [bestScore, setBestScore] = useState<number | null>(getStoredBestScore);

  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [attemptsP1, setAttemptsP1] = useState(0);
  const [attemptsP2, setAttemptsP2] = useState(0);
  const [winner, setWinner] = useState<1 | 2 | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiTimerRef = useRef<number | null>(null);

  const triggerConfetti = () => {
    setShowConfetti(true);
    if (confettiTimerRef.current) {
      clearTimeout(confettiTimerRef.current);
    }
    confettiTimerRef.current = window.setTimeout(() => {
      setShowConfetti(false);
      confettiTimerRef.current = null;
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (confettiTimerRef.current) {
        clearTimeout(confettiTimerRef.current);
      }
    };
  }, []);

  const gameLabel = useMemo(() => {
    if (mode === "single") return "Single Player";
    if (mode === "multi") return "Multiplayer Duel";
    return "Ready";
  }, [mode]);

  const startMode = (nextMode: Exclude<Mode, null>) => {
    setMode(nextMode);
    setSecret(makeSecret());
    setGuess("");
    setIsWon(false);
    setShowConfetti(false);
    setAttempts(0);
    setAttemptsP1(0);
    setAttemptsP2(0);
    setCurrentPlayer(1);
    setWinner(null);
    setMessage(
      nextMode === "single"
        ? "Guess a number from 0 to 500. Fewer attempts means a better score."
        : "Player 1 starts. Guess a number from 0 to 500. First correct guess wins."
    );
  };

  const newRound = () => {
    if (!mode) return;
    setSecret(makeSecret());
    setGuess("");
    setIsWon(false);
    setShowConfetti(false);
    setWinner(null);
    setAttempts(0);
    setAttemptsP1(0);
    setAttemptsP2(0);
    setCurrentPlayer(1);
    setMessage(
      mode === "single"
        ? "New round started. Guess a number from 0 to 500."
        : "New duel started. Player 1 starts."
    );
  };

  const parseGuess = (): number | null => {
    const trimmed = guess.trim();
    if (!trimmed) {
      setMessage("Enter a number between 0 and 500.");
      return null;
    }

    const value = Number(trimmed);
    if (!Number.isFinite(value) || !Number.isInteger(value) || value < 0 || value > 500) {
      setMessage("Only whole numbers from 0 to 500 are allowed.");
      return null;
    }

    return value;
  };

  const submitGuess = () => {
    if (!mode || isWon || winner) return;

    const value = parseGuess();
    if (value === null) return;

    if (mode === "single") {
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);

      if (value === secret) {
        setIsWon(true);
        triggerConfetti();
        if (bestScore === null || nextAttempts < bestScore) {
          setBestScore(nextAttempts);
          localStorage.setItem(BEST_SCORE_KEY, String(nextAttempts));
          setMessage(`Correct. You found it in ${nextAttempts} attempts. New high score.`);
        } else {
          setMessage(`Correct. You found it in ${nextAttempts} attempts.`);
        }
        return;
      }

      setMessage(value < secret ? "Too low. Try a higher number." : "Too high. Try a lower number.");
      return;
    }

    if (currentPlayer === 1) {
      const next = attemptsP1 + 1;
      setAttemptsP1(next);
      if (value === secret) {
        setWinner(1);
        triggerConfetti();
        setMessage(`Player 1 wins by guessing correctly in ${next} attempts.`);
      } else {
        setCurrentPlayer(2);
        setMessage(
          `${value < secret ? "Too low" : "Too high"}. Player 2, your turn.`
        );
      }
      return;
    }

    const next = attemptsP2 + 1;
    setAttemptsP2(next);
    if (value === secret) {
      setWinner(2);
      triggerConfetti();
      setMessage(`Player 2 wins by guessing correctly in ${next} attempts.`);
    } else {
      setCurrentPlayer(1);
      setMessage(
        `${value < secret ? "Too low" : "Too high"}. Player 1, your turn.`
      );
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <ParticleBackground />
      {showConfetti && <Confetti />}

      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-neon-purple/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-neon-cyan/8 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center px-4 sm:px-6 py-12 sm:py-20">
        <Link
          to="/"
          className="absolute top-4 left-4 sm:top-6 sm:left-6 font-display text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back
        </Link>

        <div className="text-center max-w-2xl mx-auto mb-8 animate-fade-in">
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground mb-3 text-glow-purple">
            🔢 Random Number Duel
          </h1>
          <p className="font-body text-base sm:text-lg text-muted-foreground">
            Guess the hidden number between 0 and 500.
          </p>
          <div className="mt-4 mx-auto w-48 h-[2px] bg-gradient-to-r from-transparent via-neon-purple to-transparent opacity-60" />
        </div>

        <div className="w-full max-w-2xl glass-panel p-5 sm:p-7 space-y-6 animate-fade-in">
          <div className="flex flex-wrap gap-3 items-center justify-center">
            <button
              onClick={() => startMode("single")}
              className={`px-4 py-2 rounded-lg font-display text-sm border transition-all ${
                mode === "single"
                  ? "bg-neon-cyan/20 border-neon-cyan text-neon-cyan"
                  : "bg-muted/30 border-border/60 hover:border-neon-cyan/60"
              }`}
            >
              Single Player
            </button>
            <button
              onClick={() => startMode("multi")}
              className={`px-4 py-2 rounded-lg font-display text-sm border transition-all ${
                mode === "multi"
                  ? "bg-neon-pink/20 border-neon-pink text-neon-pink"
                  : "bg-muted/30 border-border/60 hover:border-neon-pink/60"
              }`}
            >
              Multiplayer
            </button>
            {mode && (
              <button
                onClick={newRound}
                className="px-4 py-2 rounded-lg font-display text-sm border border-neon-purple/60 bg-neon-purple/20 hover:bg-neon-purple/30 transition-all"
              >
                New Round
              </button>
            )}
          </div>

          <div className="text-center font-display text-sm text-muted-foreground tracking-wide uppercase">
            {gameLabel}
          </div>

          {mode === "single" && (
            <div className="grid grid-cols-2 gap-3 text-sm font-body">
              <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                Attempts: <span className="font-semibold text-foreground">{attempts}</span>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                Best Score: <span className="font-semibold text-foreground">{bestScore ?? "--"}</span>
              </div>
            </div>
          )}

          {mode === "multi" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm font-body">
              <div
                className={`rounded-lg border p-3 transition-all ${
                  currentPlayer === 1 && !winner
                    ? "border-neon-cyan/70 bg-neon-cyan/10"
                    : "border-border/60 bg-muted/20"
                }`}
              >
                Player 1 Attempts: <span className="font-semibold text-foreground">{attemptsP1}</span>
              </div>
              <div
                className={`rounded-lg border p-3 transition-all ${
                  currentPlayer === 2 && !winner
                    ? "border-neon-pink/70 bg-neon-pink/10"
                    : "border-border/60 bg-muted/20"
                }`}
              >
                Player 2 Attempts: <span className="font-semibold text-foreground">{attemptsP2}</span>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitGuess();
              }}
              type="number"
              min={0}
              max={500}
              placeholder="Enter your guess (0-500)"
              className="flex-1 bg-muted/30 border border-border/60 rounded-lg px-4 py-2 outline-none focus:border-neon-purple/70"
              disabled={!mode || isWon || winner !== null}
            />
            <button
              onClick={submitGuess}
              disabled={!mode || isWon || winner !== null}
              className="px-5 py-2 rounded-lg font-display text-sm bg-neon-purple/20 border border-neon-purple/60 hover:bg-neon-purple/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Guess
            </button>
          </div>

          <div className="rounded-lg border border-border/60 bg-muted/20 p-3 font-body text-sm text-foreground min-h-[48px] flex items-center">
            {message}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RandomNumberDuel;
