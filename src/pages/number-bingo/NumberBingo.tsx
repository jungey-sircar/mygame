import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, SkipForward } from "lucide-react";
import { io, type Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import ParticleBackground from "@/components/ParticleBackground";
import Confetti from "@/components/Confetti";
import type { BingoCardState, BingoResultPayload, GameStatePayload, NumberCallMode, NumberCalledPayload } from "./types";

const isBrowser = typeof window !== "undefined";
const isLocalHost = isBrowser && ["localhost", "127.0.0.1"].includes(window.location.hostname);
const SERVER_URL = import.meta.env.VITE_BINGO_SERVER_URL
  || (isLocalHost ? "http://localhost:4001" : (isBrowser ? window.location.origin : "http://localhost:4001"));
const BINGO_HEADERS = ["B", "I", "N", "G", "O"];

const playCallSound = () => {
  try {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.type = "sine";
    oscillator.frequency.value = 640;
    gain.gain.value = 0.08;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.22);
  } catch {
    // Browsers can block audio until explicit user interaction.
  }
};

const playWinSound = () => {
  try {
    const ctx = new AudioContext();
    const gain = ctx.createGain();
    gain.gain.value = 0.09;
    gain.connect(ctx.destination);

    const notes = [523.25, 659.25, 783.99, 1046.5];
    const now = ctx.currentTime;
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + i * 0.09);
      osc.connect(gain);
      osc.start(now + i * 0.09);
      osc.stop(now + i * 0.09 + 0.16);
    });

    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    setTimeout(() => {
      void ctx.close();
    }, 760);
  } catch {
    // Non-blocking sound effect failure should not affect gameplay.
  }
};

const NumberBingo = () => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [roomIdInput, setRoomIdInput] = useState("MAIN");
  const [cardCount, setCardCount] = useState(1);
  const [roomId, setRoomId] = useState("");
  const [joined, setJoined] = useState(false);
  const [cards, setCards] = useState<BingoCardState[]>([]);
  const [calledNumbers, setCalledNumbers] = useState<number[]>([]);
  const [gameState, setGameState] = useState<GameStatePayload | null>(null);
  const [resultBanner, setResultBanner] = useState<BingoResultPayload | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [autoMark, setAutoMark] = useState(false);
  const [activeCardId, setActiveCardId] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const calledSet = useMemo(() => new Set(calledNumbers), [calledNumbers]);
  const latestCalled = calledNumbers.length > 0 ? calledNumbers[calledNumbers.length - 1] : null;
  const amIHost = Boolean(gameState?.players.find((p) => p.socketId === socketRef.current?.id)?.isHost);
  const callMode: NumberCallMode = gameState?.callMode || "auto";

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
      setErrorMsg(`Cannot connect to Bingo server at ${SERVER_URL}. Run: npm run bingo:server`);
    });

    socket.on("your_card", (serverCards: BingoCardState[]) => {
      setCards(serverCards);
      if (serverCards.length > 0) {
        setActiveCardId((prev) => prev || serverCards[0].cardId);
      }
      setJoined(true);
    });

    socket.on("game_state", (payload: GameStatePayload) => {
      setGameState(payload);
      setRoomId(payload.roomId);
      setCalledNumbers(payload.drawnNumbers || []);
    });

    socket.on("number_called", (payload: NumberCalledPayload) => {
      setCalledNumbers(payload.drawnNumbers || []);
      playCallSound();
    });

    socket.on("mark_updated", ({ cardId, marked }: { cardId: string; marked: number[] }) => {
      setCards((prev) => prev.map((card) => (card.cardId === cardId ? { ...card, marked } : card)));
    });

    socket.on("mark_rejected", ({ reason }: { reason: string }) => {
      setErrorMsg(reason || "Invalid mark.");
      setTimeout(() => setErrorMsg(""), 1800);
    });

    socket.on("bingo_result", (payload: BingoResultPayload) => {
      setResultBanner(payload);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!autoMark || !latestCalled || gameState?.status !== "playing") return;

    for (const card of cards) {
      const idx = card.card.findIndex((value) => value === latestCalled);
      if (idx >= 0 && !card.marked.includes(idx)) {
        socketRef.current?.emit("mark_number", { roomId, cardId: card.cardId, index: idx });
      }
    }
  }, [autoMark, latestCalled, cards, roomId, gameState?.status]);

  useEffect(() => {
    if (!resultBanner?.valid) return;
    if (resultBanner.winnerSocketId !== socketRef.current?.id) return;

    setShowConfetti(true);
    playWinSound();

    const timeoutId = window.setTimeout(() => {
      setShowConfetti(false);
    }, 3200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [resultBanner]);

  const handleJoin = () => {
    const normalizedRoom = roomIdInput.trim().toUpperCase() || "MAIN";
    const normalizedName = playerName.trim() || "Player";
    setErrorMsg("");

    socketRef.current?.emit("join_game", {
      roomId: normalizedRoom,
      playerName: normalizedName,
      cardCount,
    });
  };

  const handleCellClick = (cardId: string, index: number) => {
    if (gameState?.status !== "playing") return;
    const card = cards.find((c) => c.cardId === cardId);
    if (!card || card.marked.includes(index)) return;

    const value = card.card[index];
    if (index !== 12 && (typeof value !== "number" || !calledSet.has(value))) {
      setErrorMsg("You can only mark called numbers.");
      setTimeout(() => setErrorMsg(""), 1500);
      return;
    }

    socketRef.current?.emit("mark_number", { roomId, cardId, index });
  };

  const claimBingo = () => {
    if (!activeCardId) return;
    socketRef.current?.emit("bingo_claim", { roomId, cardId: activeCardId });
  };

  const startGame = () => socketRef.current?.emit("start_game", { roomId });
  const restartGame = () => {
    setResultBanner(null);
    setShowConfetti(false);
    socketRef.current?.emit("restart_game", { roomId });
  };
  const changeCallMode = (mode: NumberCallMode) => {
    if (!amIHost) return;
    socketRef.current?.emit("set_number_call_mode", { roomId, mode });
  };
  const callNextNumber = () => {
    if (!amIHost || callMode !== "manual" || gameState?.status !== "playing") return;
    socketRef.current?.emit("draw_number", { roomId });
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <ParticleBackground />
      {showConfetti && <Confetti />}
      <div className="relative z-10 flex flex-col items-center px-4 py-6 sm:py-10 gap-5 sm:gap-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="w-full max-w-5xl flex items-center justify-between">
          <Link to="/">
            <Button variant="ghost" size="sm" className="font-display text-xs tracking-wider">
              <ArrowLeft className="w-4 h-4 mr-1" /> Home
            </Button>
          </Link>
          <h1 className="font-display text-xl sm:text-2xl font-black text-foreground">
            🎱 Multiplayer 75-Ball Bingo
          </h1>
          <ThemeToggle />
        </div>

        {!joined ? (
          <div className="w-full max-w-md rounded-2xl border border-border bg-card/70 backdrop-blur p-6 space-y-4">
            <h2 className="font-display text-xl font-black text-foreground text-center">Join A Bingo Room</h2>
            <div className="space-y-2">
              <label className="font-body text-xs uppercase tracking-wider text-muted-foreground">Your Name</label>
              <input
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={24}
                className="w-full h-11 rounded-lg border border-border bg-background px-3 text-foreground"
                placeholder="Player name"
              />
            </div>

            <div className="space-y-2">
              <label className="font-body text-xs uppercase tracking-wider text-muted-foreground">Room ID</label>
              <input
                value={roomIdInput}
                onChange={(e) => setRoomIdInput(e.target.value)}
                maxLength={20}
                className="w-full h-11 rounded-lg border border-border bg-background px-3 text-foreground uppercase"
                placeholder="MAIN"
              />
            </div>

            <div className="space-y-2">
              <label className="font-body text-xs uppercase tracking-wider text-muted-foreground">Cards</label>
              <select
                value={cardCount}
                onChange={(e) => setCardCount(Number(e.target.value))}
                className="w-full h-11 rounded-lg border border-border bg-background px-3 text-foreground"
              >
                <option value={1}>1 card</option>
                <option value={2}>2 cards</option>
                <option value={3}>3 cards</option>
              </select>
            </div>

            <Button className="w-full font-display tracking-wider" disabled={!isConnected} onClick={handleJoin}>
              {isConnected ? "Join Game" : "Connecting..."}
            </Button>

            {errorMsg && (
              <p className="text-sm text-destructive font-medium">{errorMsg}</p>
            )}
          </div>
        ) : (
          <>
            <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
              <div className="space-y-4">
                <div className="rounded-2xl border border-border bg-card/70 backdrop-blur p-4 sm:p-5 space-y-3">
                  <div className="flex flex-wrap items-center gap-3 justify-between">
                    <div>
                      <p className="font-body text-xs uppercase tracking-wider text-muted-foreground">Room</p>
                      <p className="font-display text-xl font-black text-foreground">{roomId}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-body text-xs uppercase tracking-wider text-muted-foreground">Status</p>
                      <p className="font-display text-lg font-bold text-foreground">{gameState?.status || "waiting"}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-body text-xs uppercase tracking-wider text-muted-foreground">Players</p>
                      <p className="font-display text-lg font-bold text-foreground">{gameState?.players.length || 0}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {gameState?.players.map((player) => (
                      <span
                        key={player.socketId}
                        className={`px-2.5 py-1 rounded-full text-xs border ${
                          player.isHost
                            ? "border-primary/50 text-primary bg-primary/10"
                            : "border-border text-muted-foreground bg-background/60"
                        }`}
                      >
                        {player.name}
                        {player.isHost ? " (Host)" : ""}
                      </span>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => setAutoMark((p) => !p)}>
                      {autoMark ? "Auto-Mark On" : "Auto-Mark Off"}
                    </Button>
                    <Button size="sm" onClick={claimBingo} disabled={gameState?.status !== "playing" || !activeCardId}>
                      Claim Bingo
                    </Button>
                    {amIHost && (
                      <>
                        <Button size="sm" onClick={startGame} disabled={gameState?.status === "playing"}>
                          Start Game
                        </Button>
                        <Button variant="outline" size="sm" onClick={restartGame}>
                          Restart
                        </Button>
                      </>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant={callMode === "auto" ? "default" : "outline"}
                      size="sm"
                      onClick={() => changeCallMode("auto")}
                      disabled={!amIHost}
                    >
                      Auto
                    </Button>
                    <Button
                      variant={callMode === "manual" ? "default" : "outline"}
                      size="sm"
                      onClick={() => changeCallMode("manual")}
                      disabled={!amIHost}
                    >
                      Manual
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={callNextNumber}
                      disabled={!amIHost || callMode !== "manual" || gameState?.status !== "playing"}
                    >
                      <SkipForward className="w-4 h-4 mr-1" /> Next Number
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {amIHost
                      ? `Host controls call mode (${callMode.toUpperCase()}).`
                      : `Host selected mode: ${callMode.toUpperCase()}`}
                  </p>

                  {cards.length > 1 && (
                    <div className="space-y-1">
                      <label className="font-body text-xs uppercase tracking-wider text-muted-foreground">Claim With Card</label>
                      <select
                        className="h-9 rounded-md border border-border bg-background px-2 text-sm"
                        value={activeCardId}
                        onChange={(e) => setActiveCardId(e.target.value)}
                      >
                        {cards.map((card, idx) => (
                          <option key={card.cardId} value={card.cardId}>Card {idx + 1}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {errorMsg && <p className="text-destructive text-sm font-medium">{errorMsg}</p>}
                </div>

                <div className="space-y-4">
                  {cards.map((card, cardIdx) => (
                    <div key={card.cardId} className="rounded-2xl border border-border bg-card/70 backdrop-blur p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-display text-lg font-bold text-foreground">Card {cardIdx + 1}</h3>
                        <Button size="sm" variant="outline" onClick={() => setActiveCardId(card.cardId)}>
                          Use For Claim
                        </Button>
                      </div>

                      <div className="grid grid-cols-5 gap-2">
                        {BINGO_HEADERS.map((header) => (
                          <div
                            key={header}
                            className="h-8 rounded-md bg-primary/15 text-primary font-display text-sm font-black flex items-center justify-center"
                          >
                            {header}
                          </div>
                        ))}

                        {card.card.map((value, index) => {
                          const isFree = index === 12;
                          const marked = card.marked.includes(index);
                          const isCalled = typeof value === "number" && calledSet.has(value);

                          return (
                            <motion.button
                              key={`${card.cardId}-${index}`}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleCellClick(card.cardId, index)}
                              className={`aspect-square rounded-lg border text-sm sm:text-base font-display font-bold transition-colors ${
                                marked
                                  ? "bg-emerald-500/25 border-emerald-400 text-emerald-200"
                                  : isCalled
                                    ? "bg-amber-500/20 border-amber-300 text-amber-100"
                                    : "bg-background/40 border-border text-foreground"
                              }`}
                            >
                              {isFree ? "FREE" : value}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-border bg-card/70 backdrop-blur p-4 text-center">
                  <p className="font-body text-xs uppercase tracking-wider text-muted-foreground">Latest Call</p>
                  <div className="mt-2 w-24 h-24 mx-auto rounded-full border-2 border-primary/50 bg-primary/10 flex items-center justify-center">
                    <span className="font-display text-4xl font-black text-foreground">{latestCalled ?? "-"}</span>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">Total Called: {calledNumbers.length}</p>
                </div>

                <div className="rounded-2xl border border-border bg-card/70 backdrop-blur p-4">
                  <p className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-2">Called Numbers</p>
                  <div className="max-h-[320px] overflow-y-auto flex flex-wrap gap-2">
                    {calledNumbers.map((num) => (
                      <span key={num} className="w-9 h-9 rounded-full border border-primary/40 bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                        {num}
                      </span>
                    ))}
                    {calledNumbers.length === 0 && <p className="text-sm text-muted-foreground">No numbers called yet.</p>}
                  </div>
                </div>

                {resultBanner && (
                  <div className={`rounded-2xl border p-4 ${resultBanner.valid ? "border-emerald-400/50 bg-emerald-500/15" : "border-destructive/40 bg-destructive/10"}`}>
                    <p className="font-display text-base font-bold text-foreground">{resultBanner.message}</p>
                    {resultBanner.valid && <p className="text-sm text-muted-foreground mt-1">Winner: {resultBanner.winnerName}</p>}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default NumberBingo;
