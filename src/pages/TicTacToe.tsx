import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { io, type Socket } from "socket.io-client";
import ParticleBackground from "@/components/ParticleBackground";
import Confetti from "@/components/Confetti";

type CellValue = "X" | "O" | null;
type Difficulty = "easy" | "medium" | "hard";
type GameMode = null | "multiplayer" | "computer" | "online";
type GamePhase = "mode-select" | "room-join" | "waiting" | "playing" | "ended";

const isBrowser = typeof window !== "undefined";
const isLocalHost = isBrowser && ["localhost", "127.0.0.1"].includes(window.location.hostname);
const SERVER_URL = import.meta.env.VITE_BINGO_SERVER_URL
  || (isLocalHost ? "http://localhost:4001" : (isBrowser ? window.location.origin : "http://localhost:4001"));

const WIN_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

const checkWinner = (board: CellValue[]): { winner: CellValue; line: number[] | null } => {
  for (const combo of WIN_COMBOS) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: combo };
    }
  }
  return { winner: null, line: null };
};

const isDraw = (board: CellValue[]) => board.every((c) => c !== null);

// ===== MINIMAX AI =====
const minimax = (board: CellValue[], isMax: boolean, alpha: number, beta: number): number => {
  const { winner } = checkWinner(board);
  if (winner === "O") return 10;
  if (winner === "X") return -10;
  if (isDraw(board)) return 0;

  if (isMax) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (!board[i]) {
        board[i] = "O";
        best = Math.max(best, minimax(board, false, alpha, beta));
        board[i] = null;
        alpha = Math.max(alpha, best);
        if (beta <= alpha) break;
      }
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (!board[i]) {
        board[i] = "X";
        best = Math.min(best, minimax(board, true, alpha, beta));
        board[i] = null;
        beta = Math.min(beta, best);
        if (beta <= alpha) break;
      }
    }
    return best;
  }
};

const getAIMove = (board: CellValue[], difficulty: Difficulty): number => {
  const empty = board.map((v, i) => (v === null ? i : -1)).filter((i) => i >= 0);
  if (empty.length === 0) return -1;

  if (difficulty === "easy") {
    return empty[Math.floor(Math.random() * empty.length)];
  }

  if (difficulty === "medium") {
    // Block winning move or take winning move
    for (const mark of ["O", "X"] as CellValue[]) {
      for (const i of empty) {
        const test = [...board];
        test[i] = mark;
        if (checkWinner(test).winner) return i;
      }
    }
    // Take center or random
    if (board[4] === null) return 4;
    return empty[Math.floor(Math.random() * empty.length)];
  }

  // Hard — minimax
  let bestScore = -Infinity;
  let bestMove = empty[0];
  for (const i of empty) {
    board[i] = "O";
    const score = minimax(board, false, -Infinity, Infinity);
    board[i] = null;
    if (score > bestScore) {
      bestScore = score;
      bestMove = i;
    }
  }
  return bestMove;
};

// Sound
const playSound = (type: "place" | "win" | "draw") => {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    if (type === "place") {
      osc.type = "sine"; osc.frequency.value = 600; gain.gain.value = 0.06;
      osc.start(); setTimeout(() => { osc.stop(); ctx.close(); }, 80);
    } else if (type === "win") {
      osc.type = "sine"; osc.frequency.value = 523; gain.gain.value = 0.1;
      osc.start();
      setTimeout(() => { osc.frequency.value = 659; }, 120);
      setTimeout(() => { osc.frequency.value = 784; }, 240);
      setTimeout(() => { osc.stop(); ctx.close(); }, 450);
    } else {
      osc.type = "triangle"; osc.frequency.value = 300; gain.gain.value = 0.08;
      osc.start();
      setTimeout(() => { osc.frequency.value = 250; }, 150);
      setTimeout(() => { osc.stop(); ctx.close(); }, 350);
    }
  } catch {}
};

// Scoreboard from localStorage
interface Scoreboard { xWins: number; oWins: number; draws: number; }
const STORAGE_KEY = "tictactoe_score";
const loadScore = (): Scoreboard => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { xWins: 0, oWins: 0, draws: 0 };
  } catch { return { xWins: 0, oWins: 0, draws: 0 }; }
};
const saveScore = (s: Scoreboard) => localStorage.setItem(STORAGE_KEY, JSON.stringify(s));

// ===== CELL COMPONENT =====
const Cell = ({
  value, index, onClick, isWinCell, disabled,
}: {
  value: CellValue; index: number; onClick: (i: number) => void;
  isWinCell: boolean; disabled: boolean;
}) => (
  <motion.button
    className={`
      relative w-full aspect-square rounded-lg border-2 font-display text-3xl sm:text-4xl font-black
      flex items-center justify-center transition-colors duration-200
      ${isWinCell
        ? "border-neon-green/60 bg-neon-green/10 shadow-[0_0_20px_hsl(150_80%_50%/0.3)]"
        : "border-border/60 bg-muted/30 hover:border-neon-purple/40 hover:bg-muted/50"
      }
      ${disabled ? "cursor-default" : "cursor-pointer"}
    `}
    onClick={() => !disabled && !value && onClick(index)}
    whileHover={!disabled && !value ? { scale: 1.05 } : {}}
    whileTap={!disabled && !value ? { scale: 0.95 } : {}}
  >
    <AnimatePresence>
      {value && (
        <motion.span
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          className={value === "X" ? "text-neon-cyan" : "text-neon-pink"}
          style={{ textShadow: value === "X"
            ? "0 0 12px hsl(185 80% 50% / 0.6)"
            : "0 0 12px hsl(320 80% 58% / 0.6)"
          }}
        >
          {value}
        </motion.span>
      )}
    </AnimatePresence>
  </motion.button>
);

// ===== MAIN PAGE =====
const TicTacToe = () => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [mode, setMode] = useState<GameMode>(null);
  const [phase, setPhase] = useState<GamePhase>("mode-select");
  const [board, setBoard] = useState<CellValue[]>(Array(9).fill(null));
  const [isXTurn, setIsXTurn] = useState(true);
  const [winLine, setWinLine] = useState<number[] | null>(null);
  const [winner, setWinner] = useState<CellValue>(null);
  const [draw, setDraw] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [score, setScore] = useState<Scoreboard>(loadScore);
  const [showConfetti, setShowConfetti] = useState(false);
  const [moveCount, setMoveCount] = useState(0);
  const aiTimerRef = useRef<number | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [roomIdInput, setRoomIdInput] = useState("MAIN");
  const [roomId, setRoomId] = useState("");
  const [joined, setJoined] = useState(false);
  const [playerSymbol, setPlayerSymbol] = useState<"X" | "O" | null>(null);
  const [opponentName, setOpponentName] = useState("");
  const [gameStarted, setGameStarted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const gameOver = winner !== null || draw;

  // Initialize Socket.IO
  useEffect(() => {
    const socket = io(SERVER_URL, {
      transports: ["websocket", "polling"],
      timeout: 5000,
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      setErrorMsg("");
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("connect_error", () => {
      setIsConnected(false);
      setErrorMsg(`Cannot connect to server at ${SERVER_URL}.`);
    });

    socket.on("game_state", (data: { board: CellValue[]; isXTurn: boolean; playerSymbol: "X" | "O"; opponentName: string; gameStarted: boolean }) => {
      setBoard(data.board);
      setIsXTurn(data.isXTurn);
      setPlayerSymbol(data.playerSymbol);
      setOpponentName(data.opponentName);
      setGameStarted(data.gameStarted);
      setPhase("playing");
    });

    socket.on("move_made", (data: { board: CellValue[]; isXTurn: boolean }) => {
      setBoard(data.board);
      setIsXTurn(data.isXTurn);
      setMoveCount((c) => c + 1);
      playSound("place");

      const result = checkWinner(data.board);
      if (result.winner) {
        setWinner(result.winner);
        setWinLine(result.line);
        setPhase("ended");
        playSound("win");
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 4000);
        const ns = { ...score };
        if (result.winner === playerSymbol) ns.xWins++;
        else ns.oWins++;
        setScore(ns);
        saveScore(ns);
      } else if (isDraw(data.board)) {
        setDraw(true);
        setPhase("ended");
        playSound("draw");
        const ns = { ...score, draws: score.draws + 1 };
        setScore(ns);
        saveScore(ns);
      }
    });

    socket.on("room_full", () => {
      setErrorMsg("This room is full. Try another room ID.");
      setTimeout(() => setErrorMsg(""), 3000);
    });

    socket.on("game_result", (data: { winner: CellValue; line: number[] | null }) => {
      setWinner(data.winner);
      setWinLine(data.line);
      setPhase("ended");
    });

    return () => {
      socket.disconnect();
    };
  }, [score, playerSymbol]);

  const resetGame = useCallback(() => {
    setBoard(Array(9).fill(null));
    setIsXTurn(true);
    setWinLine(null);
    setWinner(null);
    setDraw(false);
    setShowConfetti(false);
    setMoveCount(0);
    setPhase("playing");
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
  }, []);

  const backToModes = useCallback(() => {
    resetGame();
    setMode(null);
    setPhase("mode-select");
    setJoined(false);
    setPlayerSymbol(null);
    setOpponentName("");
    setGameStarted(false);
  }, [resetGame]);

  const handleMove = useCallback((index: number) => {
    if (board[index] || gameOver) return;
    
    if (mode === "online") {
      if (!isXTurn && playerSymbol === "X") return;
      if (isXTurn && playerSymbol === "O") return;
      
      socketRef.current?.emit("make_move", { roomId, index });
    } else if (mode === "computer" && !isXTurn) {
      return;
    } else {
      const next = [...board];
      next[index] = isXTurn ? "X" : "O";
      setBoard(next);
      setMoveCount((c) => c + 1);
      playSound("place");

      const result = checkWinner(next);
      if (result.winner) {
        setWinner(result.winner);
        setWinLine(result.line);
        setPhase("ended");
        playSound("win");
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 4000);
        const ns = { ...score };
        if (result.winner === "X") ns.xWins++;
        else ns.oWins++;
        setScore(ns);
        saveScore(ns);
        return;
      }
      if (isDraw(next)) {
        setDraw(true);
        setPhase("ended");
        playSound("draw");
        const ns = { ...score, draws: score.draws + 1 };
        setScore(ns);
        saveScore(ns);
        return;
      }
      setIsXTurn(!isXTurn);
    }
  }, [board, gameOver, isXTurn, mode, score, roomId, playerSymbol]);

  // AI move
  useEffect(() => {
    if (mode !== "computer" || isXTurn || gameOver || phase !== "playing") return;

    aiTimerRef.current = window.setTimeout(() => {
      const move = getAIMove([...board], difficulty);
      if (move >= 0) {
        const next = [...board];
        next[move] = "O";
        setBoard(next);
        setMoveCount((c) => c + 1);
        playSound("place");

        const result = checkWinner(next);
        if (result.winner) {
          setWinner(result.winner);
          setWinLine(result.line);
          setPhase("ended");
          playSound("win");
          const ns = { ...score, oWins: score.oWins + 1 };
          setScore(ns);
          saveScore(ns);
          return;
        }
        if (isDraw(next)) {
          setDraw(true);
          setPhase("ended");
          playSound("draw");
          const ns = { ...score, draws: score.draws + 1 };
          setScore(ns);
          saveScore(ns);
          return;
        }
        setIsXTurn(true);
      }
    }, 500 + Math.random() * 300);

    return () => { if (aiTimerRef.current) clearTimeout(aiTimerRef.current); };
  }, [isXTurn, mode, gameOver, phase, board, difficulty, score]);

  const selectMode = useCallback((m: GameMode) => {
    setMode(m);
    if (m === "online") {
      setPhase("room-join");
    } else {
      resetGame();
    }
  }, [resetGame]);

  const handleJoinRoom = () => {
    const normalizedRoom = roomIdInput.trim().toUpperCase() || "MAIN";
    const normalizedName = playerName.trim() || "Player";
    setErrorMsg("");

    socketRef.current?.emit("join_tictactoe_game", {
      roomId: normalizedRoom,
      playerName: normalizedName,
    });
    
    setRoomId(normalizedRoom);
    setPhase("waiting");
  };

  const winSet = useMemo(() => new Set(winLine || []), [winLine]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <ParticleBackground />
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-neon-purple/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-neon-cyan/8 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center px-4 sm:px-6 py-12 sm:py-20">
        <Link to="/" className="absolute top-4 left-4 sm:top-6 sm:left-6 font-display text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Back
        </Link>

        <div className="text-center max-w-2xl mx-auto mb-8 animate-fade-in">
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground mb-3 text-glow-purple">
            ❌⭕ Tic-Tac-Toe
          </h1>
          <p className="font-body text-base sm:text-lg text-muted-foreground">
            Think ahead. Control the board.
          </p>
          <div className="mt-4 mx-auto w-48 h-[2px] bg-gradient-to-r from-transparent via-neon-purple to-transparent opacity-60" />
        </div>

        {showConfetti && <Confetti />}

        <div className="w-full max-w-md glass-panel p-6 sm:p-8">
          <AnimatePresence mode="wait">
            {/* ===== MODE SELECT ===== */}
            {phase === "mode-select" && (
              <motion.div
                key="mode-select"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center gap-6"
              >
                <h2 className="font-display text-xl font-bold text-foreground">Choose Game Mode</h2>

                <div className="flex flex-col sm:flex-row gap-4 w-full">
                  <button
                    onClick={() => selectMode("multiplayer")}
                    className="flex-1 px-6 py-4 rounded-xl font-display text-sm font-bold bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/25 transition-all hover:shadow-[0_0_20px_hsl(185_80%_50%/0.2)]"
                  >
                    <span className="text-2xl block mb-2">👥</span>
                    Multiplayer
                    <span className="block text-xs font-body text-muted-foreground mt-1">2 Players (Local)</span>
                  </button>
                  <button
                    onClick={() => selectMode("computer")}
                    className="flex-1 px-6 py-4 rounded-xl font-display text-sm font-bold bg-neon-purple/15 text-neon-purple border border-neon-purple/30 hover:bg-neon-purple/25 transition-all hover:shadow-[0_0_20px_hsl(270_80%_60%/0.2)]"
                  >
                    <span className="text-2xl block mb-2">🤖</span>
                    vs Computer
                    <span className="block text-xs font-body text-muted-foreground mt-1">AI Opponent</span>
                  </button>
                  <button
                    onClick={() => selectMode("online")}
                    className={`flex-1 px-6 py-4 rounded-xl font-display text-sm font-bold border transition-all ${
                      isConnected
                        ? "bg-neon-green/15 text-neon-green border-neon-green/30 hover:bg-neon-green/25 hover:shadow-[0_0_20px_hsl(150_80%_50%/0.2)]"
                        : "bg-muted/10 text-muted-foreground border-border/30 cursor-not-allowed opacity-50"
                    }`}
                    disabled={!isConnected}
                  >
                    <span className="text-2xl block mb-2">🌐</span>
                    Online
                    <span className="block text-xs font-body text-muted-foreground mt-1">{isConnected ? "Remote Player" : "Connecting..."}</span>
                  </button>
                </div>

                <p className="font-body text-xs text-muted-foreground/60 italic">
                  "Strategy beats luck."
                </p>

                {/* Scoreboard */}
                <div className="w-full pt-4 border-t border-border/30">
                  <div className="flex justify-center gap-6 text-center">
                    <div>
                      <p className="font-display text-lg font-black text-neon-cyan">{score.xWins}</p>
                      <p className="font-display text-[10px] tracking-widest text-muted-foreground">X WINS</p>
                    </div>
                    <div>
                      <p className="font-display text-lg font-black text-muted-foreground">{score.draws}</p>
                      <p className="font-display text-[10px] tracking-widest text-muted-foreground">DRAWS</p>
                    </div>
                    <div>
                      <p className="font-display text-lg font-black text-neon-pink">{score.oWins}</p>
                      <p className="font-display text-[10px] tracking-widest text-muted-foreground">O WINS</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ===== ROOM JOIN ===== */}
            {phase === "room-join" && (
              <motion.div
                key="room-join"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center gap-4"
              >
                <h2 className="font-display text-xl font-bold text-foreground">Join Online Game</h2>

                <div className="w-full space-y-3">
                  <div>
                    <label className="font-display text-sm font-bold text-muted-foreground block mb-1">Your Name</label>
                    <input
                      type="text"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full px-4 py-2 rounded-lg bg-muted/30 border border-border/60 text-foreground placeholder-muted-foreground focus:outline-none focus:border-neon-cyan/40"
                      onKeyPress={(e) => e.key === "Enter" && handleJoinRoom()}
                    />
                  </div>
                  <div>
                    <label className="font-display text-sm font-bold text-muted-foreground block mb-1">Room ID</label>
                    <input
                      type="text"
                      value={roomIdInput}
                      onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
                      placeholder="e.g., MAIN, GAME1"
                      className="w-full px-4 py-2 rounded-lg bg-muted/30 border border-border/60 text-foreground placeholder-muted-foreground focus:outline-none focus:border-neon-cyan/40"
                      onKeyPress={(e) => e.key === "Enter" && handleJoinRoom()}
                    />
                  </div>
                </div>

                {errorMsg && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-red-400 text-center"
                  >
                    {errorMsg}
                  </motion.p>
                )}

                <div className="flex gap-3 w-full">
                  <button
                    onClick={handleJoinRoom}
                    className="flex-1 px-4 py-2 rounded-lg font-display text-sm font-bold bg-neon-green/20 text-neon-green border border-neon-green/30 hover:bg-neon-green/30 transition-all"
                  >
                    Join Room
                  </button>
                  <button
                    onClick={backToModes}
                    className="flex-1 px-4 py-2 rounded-lg font-display text-sm font-bold bg-muted text-muted-foreground border border-border hover:bg-muted/80 transition-all"
                  >
                    Back
                  </button>
                </div>
              </motion.div>
            )}

            {/* ===== WAITING FOR OPPONENT ===== */}
            {phase === "waiting" && (
              <motion.div
                key="waiting"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center gap-4"
              >
                <h2 className="font-display text-lg font-bold text-foreground">Waiting for Opponent...</h2>
                <p className="font-body text-sm text-muted-foreground text-center">
                  Room: <span className="font-display font-bold text-neon-cyan">{roomId}</span>
                </p>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="text-3xl"
                >
                  ⏳
                </motion.div>
                <button
                  onClick={backToModes}
                  className="px-6 py-2 rounded-lg font-display text-sm font-bold bg-muted text-muted-foreground border border-border hover:bg-muted/80 transition-all"
                >
                  Cancel
                </button>
              </motion.div>
            )}

            {/* ===== GAME BOARD ===== */}
            {(phase === "playing" || phase === "ended") && (
              <motion.div
                key="game"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center gap-5"
              >
                {/* Online opponent info */}
                {mode === "online" && (
                  <div className="text-center text-sm font-body">
                    <p className="text-muted-foreground">
                      You: <span className={playerSymbol === "X" ? "text-neon-cyan font-bold" : "text-neon-pink font-bold"}>{playerSymbol}</span>
                    </p>
                    <p className="text-muted-foreground">
                      Opponent (<span className={playerSymbol === "X" ? "text-neon-pink font-bold" : "text-neon-cyan font-bold"}>{playerSymbol === "X" ? "O" : "X"}</span>): {opponentName}
                    </p>
                  </div>
                )}

                {/* Difficulty selector for computer mode */}
                {mode === "computer" && phase === "playing" && moveCount === 0 && (
                  <div className="flex gap-2 mb-2">
                    {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
                      <button
                        key={d}
                        onClick={() => setDifficulty(d)}
                        className={`px-3 py-1 rounded-lg font-display text-xs font-bold tracking-wider transition-all border ${
                          difficulty === d
                            ? "bg-neon-purple/20 text-neon-purple border-neon-purple/40"
                            : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                        }`}
                      >
                        {d.charAt(0).toUpperCase() + d.slice(1)}
                      </button>
                    ))}
                  </div>
                )}

                {/* Turn / Result indicator */}
                <motion.div
                  key={gameOver ? "result" : isXTurn ? "x" : "o"}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center"
                >
                  {gameOver ? (
                    <p className="font-display text-lg font-bold">
                      {draw ? (
                        <span className="text-muted-foreground">It's a Draw.</span>
                      ) : (
                        <span className={winner === "X" ? "text-neon-cyan" : "text-neon-pink"}
                          style={{ textShadow: winner === "X"
                            ? "0 0 10px hsl(185 80% 50% / 0.5)"
                            : "0 0 10px hsl(320 80% 58% / 0.5)"
                          }}
                        >
                          {mode === "online"
                            ? (winner === playerSymbol ? "You Win!" : "You Lose!")
                            : `Player ${winner} Wins!`}
                        </span>
                      )}
                    </p>
                  ) : (
                    <p className="font-display text-sm font-bold">
                      <span className={isXTurn ? "text-neon-cyan" : "text-neon-pink"}>
                        {mode === "computer" && !isXTurn 
                          ? "🤖 Computer thinking..." 
                          : mode === "online"
                          ? (isXTurn === (playerSymbol === "X") ? "Your Turn" : `${opponentName}'s Turn`)
                          : `Player ${isXTurn ? "X" : "O"}'s Turn`}
                      </span>
                    </p>
                  )}
                </motion.div>

                {/* Board */}
                <div className="grid grid-cols-3 gap-2.5 w-full max-w-[260px]">
                  {board.map((cell, i) => (
                    <Cell
                      key={i}
                      value={cell}
                      index={i}
                      onClick={handleMove}
                      isWinCell={winSet.has(i)}
                      disabled={gameOver || (mode === "computer" && !isXTurn) || (mode === "online" && (isXTurn !== (playerSymbol === "X")))}
                    />
                  ))}
                </div>

                {/* Move counter */}
                <p className="font-display text-xs text-muted-foreground/60 tracking-widest">
                  MOVES: {moveCount}
                </p>

                {/* Scoreboard mini */}
                <div className="flex gap-5 text-center">
                  <div>
                    <p className="font-display text-sm font-black text-neon-cyan">{score.xWins}</p>
                    <p className="font-display text-[9px] tracking-widest text-muted-foreground">X</p>
                  </div>
                  <div>
                    <p className="font-display text-sm font-black text-muted-foreground">{score.draws}</p>
                    <p className="font-display text-[9px] tracking-widest text-muted-foreground">DRAW</p>
                  </div>
                  <div>
                    <p className="font-display text-sm font-black text-neon-pink">{score.oWins}</p>
                    <p className="font-display text-[9px] tracking-widest text-muted-foreground">O</p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 flex-wrap justify-center">
                  <button
                    onClick={resetGame}
                    className="px-5 py-2 rounded-lg font-display text-sm font-bold bg-neon-green/20 text-neon-green border border-neon-green/30 hover:bg-neon-green/30 transition-all"
                  >
                    🔄 Restart
                  </button>
                  <button
                    onClick={backToModes}
                    className="px-5 py-2 rounded-lg font-display text-sm font-bold bg-muted text-muted-foreground border border-border hover:bg-muted/80 transition-all"
                  >
                    🔙 Modes
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default TicTacToe;
