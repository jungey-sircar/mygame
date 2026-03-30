import { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, SkipForward } from "lucide-react";
import { io, type Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import ParticleBackground from "@/components/ParticleBackground";
import Confetti from "@/components/Confetti";
import BingoBoard from "./components/BingoBoard";
import WordCaller from "./components/WordCaller";
import { wordSets, type WordSet } from "./data/wordSets";
import type {
  WordBingoResultPayload,
  WordCallMode,
  WordCalledPayload,
  WordCardPayload,
  WordGameStatePayload,
} from "./types";

const isBrowser = typeof window !== "undefined";
const isLocalHost = isBrowser && ["localhost", "127.0.0.1"].includes(window.location.hostname);
const SERVER_URL = import.meta.env.VITE_BINGO_SERVER_URL
  || (isLocalHost ? "http://localhost:4001" : (isBrowser ? window.location.origin : "http://localhost:4001"));

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

const WordBingo = () => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [roomIdInput, setRoomIdInput] = useState("MAIN");
  const [joined, setJoined] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<WordSet>(wordSets[0]);
  const [card, setCard] = useState<(string | null)[]>([]);
  const [markedIndices, setMarkedIndices] = useState<number[]>([12]);
  const [calledWords, setCalledWords] = useState<string[]>([]);
  const [gameState, setGameState] = useState<WordGameStatePayload | null>(null);
  const [resultBanner, setResultBanner] = useState<WordBingoResultPayload | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const calledSet = useMemo(() => new Set(calledWords), [calledWords]);
  const selectedCells = useMemo(() => new Set(markedIndices), [markedIndices]);
  const amIHost = Boolean(gameState?.players.find((p) => p.socketId === socketRef.current?.id)?.isHost);
  const displayRoomId = roomId.replace(/^WORD_/, "");
  const activeCategoryName = gameState?.categoryName || selectedCategory.name;
  const callMode: WordCallMode = gameState?.callMode || "auto";
  const effectiveRoundWordCount = gameState?.roundWordCount
    || (activeCategoryName === "English Vocabulary (IELTS + SAT)"
      ? Math.min(100, selectedCategory.words.length)
      : selectedCategory.words.length);

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
      setErrorMsg(`Cannot connect to server at ${SERVER_URL}`);
    });

    socket.on("word_game_state", (payload: WordGameStatePayload) => {
      setGameState(payload);
      setRoomId(payload.roomId);
      setCalledWords(payload.calledWords || []);
      if (payload.categoryName) {
        const syncedCategory = wordSets.find((set) => set.name === payload.categoryName);
        if (syncedCategory) {
          setSelectedCategory(syncedCategory);
        }
      }
      const me = payload.players.some((player) => player.socketId === socket.id);
      if (me) setJoined(true);
    });

    socket.on("word_your_card", (payload: WordCardPayload) => {
      setCard(payload.card || []);
      setMarkedIndices(payload.marked || [12]);
      setJoined(true);
    });

    socket.on("word_called", (payload: WordCalledPayload) => {
      setCalledWords(payload.calledWords || []);
    });

    socket.on("word_mark_updated", ({ marked }: { marked: number[] }) => {
      setMarkedIndices(marked || [12]);
    });

    socket.on("word_mark_rejected", ({ reason }: { reason: string }) => {
      setErrorMsg(reason || "Invalid mark");
      setTimeout(() => setErrorMsg(""), 1600);
    });

    socket.on("word_bingo_result", (payload: WordBingoResultPayload) => {
      setResultBanner(payload);
    });

    socket.on("word_error", ({ message }: { message: string }) => {
      setErrorMsg(message || "Unable to process request");
    });

    return () => {
      socket.disconnect();
    };
  }, []);

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

  const joinRoom = () => {
    const normalizedRoom = roomIdInput.trim().toUpperCase() || "MAIN";
    const normalizedName = playerName.trim() || "Player";
    setErrorMsg("");
    setResultBanner(null);
    setShowConfetti(false);

    socketRef.current?.emit("join_word_game", {
      roomId: normalizedRoom,
      playerName: normalizedName,
    });
  };

  const startMatch = () => {
    setErrorMsg("");
    setResultBanner(null);
    setShowConfetti(false);
    socketRef.current?.emit("start_word_game", {
      roomId: displayRoomId || roomIdInput,
      categoryName: selectedCategory.name,
      words: selectedCategory.words,
      callMode,
    });
  };

  const changeCategory = (categoryName: string) => {
    const found = wordSets.find((set) => set.name === categoryName);
    if (!found) return;

    setSelectedCategory(found);

    if (!amIHost) return;

    socketRef.current?.emit("set_word_category", {
      roomId: displayRoomId || roomIdInput,
      categoryName: found.name,
      words: found.words,
    });
  };

  const restartMatch = () => {
    setResultBanner(null);
    setShowConfetti(false);
    socketRef.current?.emit("restart_word_game", {
      roomId: displayRoomId || roomIdInput,
    });
  };

  const changeCallMode = (mode: WordCallMode) => {
    if (!amIHost) return;
    socketRef.current?.emit("set_word_call_mode", {
      roomId: displayRoomId || roomIdInput,
      mode,
    });
  };

  const callNextWord = () => {
    if (!amIHost || callMode !== "manual") return;
    socketRef.current?.emit("word_call_next", {
      roomId: displayRoomId || roomIdInput,
    });
  };

  const markCell = (index: number) => {
    if (!card.length || markedIndices.includes(index) || gameState?.status !== "playing") return;
    if (index !== 12) {
      const word = card[index];
      if (typeof word !== "string" || !calledSet.has(word)) {
        setErrorMsg("You can only mark called words.");
        setTimeout(() => setErrorMsg(""), 1400);
        return;
      }
    }

    socketRef.current?.emit("mark_word", {
      roomId: displayRoomId || roomIdInput,
      index,
    });
  };

  const claimBingo = () => {
    socketRef.current?.emit("word_bingo_claim", {
      roomId: displayRoomId || roomIdInput,
    });
  };

  const boardForUi = card.map((word) => word ?? "★ FREE");

  return (
    <div className="min-h-screen relative overflow-hidden">
      <ParticleBackground />
      {showConfetti && <Confetti />}
      <div className="relative z-10 flex flex-col items-center px-4 py-6 sm:py-10 gap-5 sm:gap-6 max-w-6xl mx-auto">
        <div className="w-full max-w-5xl flex items-center justify-between">
          <Link to="/">
            <Button variant="ghost" size="sm" className="font-display text-xs tracking-wider">
              <ArrowLeft className="w-4 h-4 mr-1" /> Home
            </Button>
          </Link>
          <h1 className="font-display text-xl sm:text-2xl font-black text-foreground">
            🔤 Multiplayer Word Bingo
          </h1>
          <ThemeToggle />
        </div>

        {!joined ? (
          <div className="w-full max-w-md rounded-2xl border border-border bg-card/70 backdrop-blur p-6 space-y-4">
            <h2 className="font-display text-xl font-black text-foreground text-center">Join Word Bingo Room</h2>

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

            <Button className="w-full font-display tracking-wider" disabled={!isConnected} onClick={joinRoom}>
              {isConnected ? "Join Room" : "Connecting..."}
            </Button>

            {errorMsg && <p className="text-sm text-destructive font-medium">{errorMsg}</p>}
          </div>
        ) : (
          <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-card/70 backdrop-blur p-4 sm:p-5 space-y-3">
                <div className="flex flex-wrap items-center gap-3 justify-between">
                  <div>
                    <p className="font-body text-xs uppercase tracking-wider text-muted-foreground">Room</p>
                    <p className="font-display text-xl font-black text-foreground">{displayRoomId}</p>
                  </div>
                  <div>
                    <p className="font-body text-xs uppercase tracking-wider text-muted-foreground">Status</p>
                    <p className="font-display text-lg font-bold text-foreground">{gameState?.status || "waiting"}</p>
                  </div>
                  <div>
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

                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2 items-center">
                  <select
                    className="h-10 rounded-md border border-border bg-background px-2 text-sm"
                    value={activeCategoryName}
                    onChange={(e) => changeCategory(e.target.value)}
                    disabled={!amIHost || gameState?.status === "playing"}
                    aria-label="Word category"
                  >
                    {wordSets.map((set) => (
                      <option key={set.name} value={set.name}>{set.name}</option>
                    ))}
                  </select>
                  <Button onClick={startMatch} disabled={!amIHost}>Start</Button>
                  <Button variant="outline" onClick={restartMatch} disabled={!amIHost}>Restart</Button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant={callMode === "auto" ? "default" : "outline"}
                    onClick={() => changeCallMode("auto")}
                    disabled={!amIHost}
                  >
                    Auto
                  </Button>
                  <Button
                    variant={callMode === "manual" ? "default" : "outline"}
                    onClick={() => changeCallMode("manual")}
                    disabled={!amIHost}
                  >
                    Manual
                  </Button>
                  <Button
                    variant="outline"
                    onClick={callNextWord}
                    disabled={!amIHost || callMode !== "manual" || gameState?.status !== "playing"}
                  >
                    <SkipForward className="w-4 h-4 mr-1" /> Next Word
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                  {amIHost
                    ? `Host controls category and call mode (${callMode.toUpperCase()}).`
                    : `Host selected category: ${activeCategoryName} • Mode: ${callMode.toUpperCase()}`}
                </p>

                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={claimBingo}
                    disabled={gameState?.status !== "playing" || !card.length}
                    className="font-display tracking-wider"
                  >
                    Claim Bingo
                  </Button>
                </div>

                {errorMsg && <p className="text-sm text-destructive font-medium">{errorMsg}</p>}
              </div>

              <WordCaller
                currentWord={calledWords.length > 0 ? calledWords[calledWords.length - 1] : null}
                calledWords={calledWords}
                totalWords={Math.max(calledWords.length, effectiveRoundWordCount)}
              />

              {card.length > 0 ? (
                <BingoBoard
                  board={boardForUi}
                  selectedCells={selectedCells}
                  calledWords={calledSet}
                  winningCells={new Set<number>()}
                  onCellClick={markCell}
                />
              ) : (
                <div className="rounded-xl border border-border p-5 text-center text-muted-foreground">
                  Waiting for host to start the match...
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-card/70 backdrop-blur p-4">
                <p className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-2">Called Words</p>
                <div className="max-h-[420px] overflow-y-auto flex flex-wrap gap-2">
                  {calledWords.map((word) => (
                    <span key={word} className="text-xs px-2 py-1 rounded-full border border-primary/40 bg-primary/10 text-primary">
                      {word}
                    </span>
                  ))}
                  {calledWords.length === 0 && <p className="text-sm text-muted-foreground">No words called yet.</p>}
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
        )}
      </div>
    </div>
  );
};

export default WordBingo;
