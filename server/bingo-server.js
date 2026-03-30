import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Server } from "socket.io";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, "..", "dist");
const PORT = Number(process.env.PORT || process.env.BINGO_PORT || 4001);
const AUTO_DRAW_MS = Number(process.env.BINGO_AUTO_DRAW_MS || 4000);
const WORD_AUTO_CALL_MS = Number(process.env.WORD_AUTO_CALL_MS || 4000);
const MAX_NUM = 75;
const ENGLISH_VOCAB_SET_NAME = "English Vocabulary (IELTS + SAT)";
const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};
const WIN_LINES = (() => {
  const lines = [];
  for (let r = 0; r < 5; r += 1) {
    lines.push([0, 1, 2, 3, 4].map((c) => r * 5 + c));
  }
  for (let c = 0; c < 5; c += 1) {
    lines.push([0, 1, 2, 3, 4].map((r) => r * 5 + c));
  }
  lines.push([0, 6, 12, 18, 24]);
  lines.push([4, 8, 12, 16, 20]);
  return lines;
})();

/** @typedef {{ cardId: string, card: (number | null)[], marked: Set<number> }} CardState */
/** @typedef {{ socketId: string, name: string, cards: CardState[] }} PlayerState */
/** @typedef {{ id: string, status: "waiting"|"playing"|"finished", players: Map<string, PlayerState>, drawnNumbers: number[], remainingNumbers: number[], winnerSocketId: string | null, hostSocketId: string | null, drawTimer: NodeJS.Timeout | null, callMode: "auto"|"manual" }} RoomState */
/** @typedef {{ socketId: string, name: string, card: (string | null)[] | null, marked: Set<number> }} WordPlayerState */
/** @typedef {{ id: string, status: "waiting"|"playing"|"finished", players: Map<string, WordPlayerState>, calledWords: string[], drawPool: string[], winnerSocketId: string | null, hostSocketId: string | null, drawTimer: NodeJS.Timeout | null, categoryName: string | null, sourceWords: string[], callMode: "auto"|"manual", roundWordCount: number }} WordRoomState */

/** @type {Map<string, RoomState>} */
const rooms = new Map();
/** @type {Map<string, WordRoomState>} */
const wordRooms = new Map();

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function getRange(start, end) {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

function pickUniqueFromRange(start, end, count) {
  return shuffle(getRange(start, end)).slice(0, count);
}

function createCard() {
  const columns = [
    pickUniqueFromRange(1, 15, 5),
    pickUniqueFromRange(16, 30, 5),
    pickUniqueFromRange(31, 45, 4),
    pickUniqueFromRange(46, 60, 5),
    pickUniqueFromRange(61, 75, 5),
  ];

  const card = Array(25).fill(null);
  for (let c = 0; c < 5; c += 1) {
    for (let r = 0; r < 5; r += 1) {
      const idx = r * 5 + c;
      if (idx === 12) {
        card[idx] = null;
        continue;
      }

      if (c === 2 && r > 1) {
        card[idx] = columns[c][r - 1];
      } else {
        card[idx] = columns[c][r];
      }
    }
  }

  return card;
}

function cardSignature(card) {
  return card.map((v) => (v === null ? "X" : String(v))).join("-");
}

function isWinningCard(card, calledSet) {
  for (const line of WIN_LINES) {
    const ok = line.every((idx) => {
      if (idx === 12) return true;
      const val = card[idx];
      return typeof val === "number" && calledSet.has(val);
    });

    if (ok) {
      return true;
    }
  }

  return false;
}

function createRoom(roomId, hostSocketId) {
  return {
    id: roomId,
    status: "waiting",
    players: new Map(),
    drawnNumbers: [],
    remainingNumbers: shuffle(Array.from({ length: MAX_NUM }, (_, i) => i + 1)),
    winnerSocketId: null,
    hostSocketId,
    drawTimer: null,
    callMode: "auto",
  };
}

function getOrCreateRoom(roomId, hostSocketId) {
  const existing = rooms.get(roomId);
  if (existing) return existing;
  const room = createRoom(roomId, hostSocketId);
  rooms.set(roomId, room);
  return room;
}

function sanitizeRoomId(roomId) {
  const normalized = String(roomId || "").trim().toUpperCase();
  return normalized || "MAIN";
}

function serializeRoom(room) {
  const winnerPlayer = room.winnerSocketId ? room.players.get(room.winnerSocketId) : null;

  return {
    roomId: room.id,
    status: room.status,
    drawnNumbers: room.drawnNumbers,
    callMode: room.callMode,
    winnerSocketId: room.winnerSocketId,
    winnerName: winnerPlayer ? winnerPlayer.name : null,
    players: [...room.players.values()].map((player) => ({
      socketId: player.socketId,
      name: player.name,
      isHost: room.hostSocketId === player.socketId,
    })),
  };
}

function emitRoomState(io, room) {
  io.to(room.id).emit("game_state", serializeRoom(room));
}

function createUniqueCardsForRoom(room, count) {
  const signatures = new Set();
  for (const player of room.players.values()) {
    for (const cardState of player.cards) {
      signatures.add(cardSignature(cardState.card));
    }
  }

  const cards = [];
  while (cards.length < count) {
    const card = createCard();
    const signature = cardSignature(card);
    if (signatures.has(signature)) {
      continue;
    }

    signatures.add(signature);
    cards.push(card);
  }

  return cards;
}

function stopAutoDraw(room) {
  if (room.drawTimer) {
    clearInterval(room.drawTimer);
    room.drawTimer = null;
  }
}

function drawNextNumber(io, room) {
  if (room.status !== "playing") {
    stopAutoDraw(room);
    return;
  }

  if (room.remainingNumbers.length === 0) {
    room.status = "finished";
    stopAutoDraw(room);
    emitRoomState(io, room);
    return;
  }

  const nextNumber = room.remainingNumbers.pop();
  if (typeof nextNumber !== "number") {
    return;
  }

  room.drawnNumbers.push(nextNumber);
  io.to(room.id).emit("number_called", {
    roomId: room.id,
    number: nextNumber,
    drawnNumbers: room.drawnNumbers,
  });

  emitRoomState(io, room);
}

function startAutoDraw(io, room) {
  stopAutoDraw(room);
  room.drawTimer = setInterval(() => drawNextNumber(io, room), AUTO_DRAW_MS);
}

function sanitizeWords(words) {
  const safeWords = Array.isArray(words) ? words : [];
  const deduped = new Set();
  for (const item of safeWords) {
    const cleaned = String(item || "").trim();
    if (!cleaned) continue;
    deduped.add(cleaned);
  }
  return [...deduped];
}

function createWordRoom(roomId, hostSocketId) {
  return {
    id: roomId,
    status: "waiting",
    players: new Map(),
    calledWords: [],
    drawPool: [],
    winnerSocketId: null,
    hostSocketId,
    drawTimer: null,
    categoryName: null,
    sourceWords: [],
    callMode: "auto",
    roundWordCount: 0,
  };
}

function getOrCreateWordRoom(roomId, hostSocketId) {
  const existing = wordRooms.get(roomId);
  if (existing) return existing;
  const room = createWordRoom(roomId, hostSocketId);
  wordRooms.set(roomId, room);
  return room;
}

function createWordCard(words) {
  const selected = shuffle(words).slice(0, 24);
  const card = [...selected];
  card.splice(12, 0, null);
  return card;
}

function wordCardSignature(card) {
  return card.map((w) => (w === null ? "FREE" : w)).join("|");
}

function createUniqueWordCards(room, words) {
  const signatures = new Set();
  for (const player of room.players.values()) {
    if (player.card) signatures.add(wordCardSignature(player.card));
  }

  /** @type {Map<string, (string | null)[]>} */
  const cardsByPlayer = new Map();
  for (const player of room.players.values()) {
    let card = createWordCard(words);
    while (signatures.has(wordCardSignature(card))) {
      card = createWordCard(words);
    }
    signatures.add(wordCardSignature(card));
    cardsByPlayer.set(player.socketId, card);
  }

  return cardsByPlayer;
}

function isWinningWordCard(card, calledSet) {
  if (!card) return false;
  for (const line of WIN_LINES) {
    const ok = line.every((idx) => {
      if (idx === 12) return true;
      const word = card[idx];
      return typeof word === "string" && calledSet.has(word);
    });
    if (ok) return true;
  }
  return false;
}

function serializeWordRoom(room) {
  const winner = room.winnerSocketId ? room.players.get(room.winnerSocketId) : null;
  return {
    roomId: room.id,
    status: room.status,
    players: [...room.players.values()].map((player) => ({
      socketId: player.socketId,
      name: player.name,
      isHost: room.hostSocketId === player.socketId,
    })),
    calledWords: room.calledWords,
    winnerSocketId: room.winnerSocketId,
    winnerName: winner ? winner.name : null,
    categoryName: room.categoryName,
    callMode: room.callMode,
    roundWordCount: room.roundWordCount,
  };
}

function emitWordRoomState(io, room) {
  io.to(room.id).emit("word_game_state", serializeWordRoom(room));
}

function stopWordAutoCall(room) {
  if (room.drawTimer) {
    clearInterval(room.drawTimer);
    room.drawTimer = null;
  }
}

function callNextWord(io, room) {
  if (room.status !== "playing") {
    stopWordAutoCall(room);
    return;
  }

  if (room.drawPool.length === 0) {
    room.status = "finished";
    stopWordAutoCall(room);
    emitWordRoomState(io, room);
    return;
  }

  const nextWord = room.drawPool.pop();
  if (typeof nextWord !== "string") return;

  room.calledWords.push(nextWord);
  io.to(room.id).emit("word_called", {
    roomId: room.id,
    word: nextWord,
    calledWords: room.calledWords,
  });

  emitWordRoomState(io, room);
}

function startWordAutoCall(io, room) {
  stopWordAutoCall(room);
  room.drawTimer = setInterval(() => callNextWord(io, room), WORD_AUTO_CALL_MS);
}

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeType = MIME_TYPES[ext] || "application/octet-stream";
  res.writeHead(200, { "content-type": mimeType });
  createReadStream(filePath).pipe(res);
}

const httpServer = createServer((req, res) => {
  const method = req.method || "GET";
  const rawUrl = req.url || "/";
  const pathname = rawUrl.split("?")[0];

  if (pathname === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (method !== "GET" && method !== "HEAD") {
    res.writeHead(404);
    res.end();
    return;
  }

  const safePath = path.normalize(pathname).replace(/^([.][.][/\\])+/, "");
  const requestedPath = safePath === "/" ? "index.html" : safePath.replace(/^[/\\]/, "");
  const staticPath = path.join(DIST_DIR, requestedPath);

  if (existsSync(staticPath) && statSync(staticPath).isFile()) {
    sendFile(res, staticPath);
    return;
  }

  const indexPath = path.join(DIST_DIR, "index.html");
  if (existsSync(indexPath)) {
    sendFile(res, indexPath);
    return;
  }

  res.writeHead(404);
  res.end("Build assets not found. Run npm run build before starting the server.");
});

const io = new Server(httpServer, {
  cors: {
    origin: process.env.BINGO_CORS_ORIGIN || "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  socket.on("join_game", (payload = {}) => {
    const roomId = sanitizeRoomId(payload.roomId);
    const name = String(payload.playerName || "Player").trim().slice(0, 24) || "Player";
    const requestedCardCount = Number(payload.cardCount || 1);
    const cardCount = Math.max(1, Math.min(3, requestedCardCount));

    const room = getOrCreateRoom(roomId, socket.id);
    socket.join(roomId);

    const cards = createUniqueCardsForRoom(room, cardCount).map((card, idx) => ({
      cardId: `${socket.id}-${idx + 1}`,
      card,
      marked: new Set([12]),
    }));

    room.players.set(socket.id, {
      socketId: socket.id,
      name,
      cards,
    });

    socket.emit(
      "your_card",
      cards.map((c) => ({ cardId: c.cardId, card: c.card, marked: [...c.marked] })),
    );

    emitRoomState(io, room);
  });

  socket.on("start_game", ({ roomId }) => {
    const room = rooms.get(sanitizeRoomId(roomId));
    if (!room || room.hostSocketId !== socket.id) return;

    if (room.status === "finished") {
      return;
    }

    room.status = "playing";
    emitRoomState(io, room);
    if (room.callMode === "auto") {
      startAutoDraw(io, room);
    } else {
      stopAutoDraw(room);
    }
  });

  socket.on("set_number_call_mode", (payload = {}) => {
    const room = rooms.get(sanitizeRoomId(payload.roomId));
    if (!room || room.hostSocketId !== socket.id) return;

    const mode = payload.mode === "manual" ? "manual" : "auto";
    room.callMode = mode;

    if (room.status === "playing") {
      if (mode === "auto") {
        startAutoDraw(io, room);
      } else {
        stopAutoDraw(room);
      }
    }

    emitRoomState(io, room);
  });

  socket.on("draw_number", ({ roomId }) => {
    const room = rooms.get(sanitizeRoomId(roomId));
    if (!room || room.hostSocketId !== socket.id) return;
    if (room.status === "finished") return;
    if (room.callMode !== "manual") return;
    room.status = "playing";
    drawNextNumber(io, room);
  });

  socket.on("mark_number", ({ roomId, cardId, index }) => {
    const room = rooms.get(sanitizeRoomId(roomId));
    if (!room) return;

    const player = room.players.get(socket.id);
    if (!player) return;

    const targetCard = player.cards.find((c) => c.cardId === cardId) || player.cards[0];
    if (!targetCard) return;

    const idx = Number(index);
    if (!Number.isInteger(idx) || idx < 0 || idx >= 25) return;

    if (idx === 12) {
      targetCard.marked.add(12);
      socket.emit("mark_updated", { cardId: targetCard.cardId, marked: [...targetCard.marked] });
      return;
    }

    const value = targetCard.card[idx];
    if (typeof value !== "number") return;

    const calledSet = new Set(room.drawnNumbers);
    if (!calledSet.has(value)) {
      socket.emit("mark_rejected", { cardId: targetCard.cardId, index: idx, reason: "Number has not been called yet." });
      return;
    }

    targetCard.marked.add(idx);
    socket.emit("mark_updated", { cardId: targetCard.cardId, marked: [...targetCard.marked] });
  });

  socket.on("bingo_claim", ({ roomId, cardId }) => {
    const room = rooms.get(sanitizeRoomId(roomId));
    if (!room) return;

    const player = room.players.get(socket.id);
    if (!player) return;

    const card = cardId ? player.cards.find((c) => c.cardId === cardId) : player.cards[0];
    if (!card) return;

    if (room.status !== "playing") {
      io.to(socket.id).emit("bingo_result", {
        valid: false,
        roomId: room.id,
        claimantSocketId: socket.id,
        claimantName: player.name,
        cardId: card.cardId,
        message: "Game is not in playing state.",
      });
      return;
    }

    const calledSet = new Set(room.drawnNumbers);
    const valid = isWinningCard(card.card, calledSet);

    if (!valid) {
      io.to(room.id).emit("bingo_result", {
        valid: false,
        roomId: room.id,
        claimantSocketId: socket.id,
        claimantName: player.name,
        cardId: card.cardId,
        message: `${player.name}'s Bingo claim was rejected.`,
      });
      return;
    }

    room.status = "finished";
    room.winnerSocketId = socket.id;
    stopAutoDraw(room);

    io.to(room.id).emit("bingo_result", {
      valid: true,
      roomId: room.id,
      claimantSocketId: socket.id,
      claimantName: player.name,
      winnerSocketId: socket.id,
      winnerName: player.name,
      cardId: card.cardId,
      message: `${player.name} has Bingo!`,
    });

    emitRoomState(io, room);
  });

  socket.on("restart_game", ({ roomId }) => {
    const room = rooms.get(sanitizeRoomId(roomId));
    if (!room || room.hostSocketId !== socket.id) return;

    stopAutoDraw(room);
    room.status = "waiting";
    room.drawnNumbers = [];
    room.remainingNumbers = shuffle(Array.from({ length: MAX_NUM }, (_, i) => i + 1));
    room.winnerSocketId = null;

    const signatures = new Set();
    for (const player of room.players.values()) {
      for (const cardState of player.cards) {
        let card = createCard();
        while (signatures.has(cardSignature(card))) {
          card = createCard();
        }
        signatures.add(cardSignature(card));
        cardState.card = card;
        cardState.marked = new Set([12]);
      }

      io.to(player.socketId).emit(
        "your_card",
        player.cards.map((c) => ({ cardId: c.cardId, card: c.card, marked: [...c.marked] })),
      );
    }

    emitRoomState(io, room);
  });

  socket.on("join_word_game", (payload = {}) => {
    const baseRoomId = sanitizeRoomId(payload.roomId);
    const roomId = `WORD_${baseRoomId}`;
    const name = String(payload.playerName || "Player").trim().slice(0, 24) || "Player";

    const room = getOrCreateWordRoom(roomId, socket.id);
    socket.join(roomId);

    room.players.set(socket.id, {
      socketId: socket.id,
      name,
      card: room.players.get(socket.id)?.card || null,
      marked: room.players.get(socket.id)?.marked || new Set([12]),
    });

    const existingPlayer = room.players.get(socket.id);
    if (existingPlayer?.card) {
      socket.emit("word_your_card", {
        card: existingPlayer.card,
        marked: [...existingPlayer.marked],
      });
    }

    emitWordRoomState(io, room);
  });

  socket.on("set_word_category", (payload = {}) => {
    const roomId = `WORD_${sanitizeRoomId(payload.roomId)}`;
    const room = wordRooms.get(roomId);
    if (!room || room.hostSocketId !== socket.id) return;
    if (room.status === "playing") return;

    const categoryName = String(payload.categoryName || "").trim() || "Custom Vocabulary";
    const sourceWords = sanitizeWords(payload.words);
    if (sourceWords.length < 24) {
      io.to(socket.id).emit("word_error", { message: "Need at least 24 unique words for a category." });
      return;
    }

    room.categoryName = categoryName;
    room.sourceWords = sourceWords;
    room.roundWordCount = categoryName === ENGLISH_VOCAB_SET_NAME
      ? Math.min(100, sourceWords.length)
      : sourceWords.length;
    emitWordRoomState(io, room);
  });

  socket.on("set_word_call_mode", (payload = {}) => {
    const roomId = `WORD_${sanitizeRoomId(payload.roomId)}`;
    const room = wordRooms.get(roomId);
    if (!room || room.hostSocketId !== socket.id) return;

    const mode = payload.mode === "manual" ? "manual" : "auto";
    room.callMode = mode;

    if (room.status === "playing") {
      if (mode === "auto") {
        startWordAutoCall(io, room);
      } else {
        stopWordAutoCall(room);
      }
    }

    emitWordRoomState(io, room);
  });

  socket.on("start_word_game", (payload = {}) => {
    const roomId = `WORD_${sanitizeRoomId(payload.roomId)}`;
    const room = wordRooms.get(roomId);
    if (!room || room.hostSocketId !== socket.id) return;

    const requestedCategoryName = String(payload.categoryName || "").trim();
    const categoryName = requestedCategoryName || room.categoryName || "Custom Vocabulary";
    const requestedWords = sanitizeWords(payload.words);
    const sourceWords = requestedWords.length >= 24 ? requestedWords : room.sourceWords;
    if (sourceWords.length < 24) {
      io.to(socket.id).emit("word_error", { message: "Need at least 24 unique words to start." });
      return;
    }

    room.categoryName = categoryName;
    room.sourceWords = sourceWords;

    const roundWords = categoryName === ENGLISH_VOCAB_SET_NAME
      ? shuffle(sourceWords).slice(0, Math.min(100, sourceWords.length))
      : sourceWords;
    if (roundWords.length < 24) {
      io.to(socket.id).emit("word_error", { message: "Round word pool is too small." });
      return;
    }

    room.calledWords = [];
    room.drawPool = shuffle([...roundWords]);
    room.winnerSocketId = null;
    room.status = "playing";
    room.callMode = payload.callMode === "manual" ? "manual" : room.callMode;
    room.roundWordCount = roundWords.length;

    const cardsByPlayer = createUniqueWordCards(room, roundWords);
    for (const player of room.players.values()) {
      const card = cardsByPlayer.get(player.socketId);
      if (!card) continue;
      player.card = card;
      player.marked = new Set([12]);
      io.to(player.socketId).emit("word_your_card", {
        card,
        marked: [...player.marked],
      });
    }

    emitWordRoomState(io, room);
    if (room.callMode === "auto") {
      startWordAutoCall(io, room);
    } else {
      stopWordAutoCall(room);
    }
  });

  socket.on("word_call_next", ({ roomId }) => {
    const resolvedRoomId = `WORD_${sanitizeRoomId(roomId)}`;
    const room = wordRooms.get(resolvedRoomId);
    if (!room || room.hostSocketId !== socket.id) return;
    if (room.status !== "playing" || room.callMode !== "manual") return;

    callNextWord(io, room);
  });

  socket.on("mark_word", ({ roomId, index }) => {
    const resolvedRoomId = `WORD_${sanitizeRoomId(roomId)}`;
    const room = wordRooms.get(resolvedRoomId);
    if (!room || room.status !== "playing") return;

    const player = room.players.get(socket.id);
    if (!player || !player.card) return;

    const idx = Number(index);
    if (!Number.isInteger(idx) || idx < 0 || idx >= 25) return;
    if (idx === 12) {
      player.marked.add(12);
      io.to(socket.id).emit("word_mark_updated", { marked: [...player.marked] });
      return;
    }

    const value = player.card[idx];
    if (typeof value !== "string") return;

    const calledSet = new Set(room.calledWords);
    if (!calledSet.has(value)) {
      io.to(socket.id).emit("word_mark_rejected", { reason: "Word has not been called yet." });
      return;
    }

    player.marked.add(idx);
    io.to(socket.id).emit("word_mark_updated", { marked: [...player.marked] });
  });

  socket.on("word_bingo_claim", ({ roomId }) => {
    const resolvedRoomId = `WORD_${sanitizeRoomId(roomId)}`;
    const room = wordRooms.get(resolvedRoomId);
    if (!room) return;

    const player = room.players.get(socket.id);
    if (!player) return;

    if (room.status !== "playing") {
      io.to(socket.id).emit("word_bingo_result", {
        valid: false,
        roomId: room.id,
        claimantSocketId: socket.id,
        claimantName: player.name,
        message: "Game is not in playing state.",
      });
      return;
    }

    const valid = isWinningWordCard(player.card, new Set(room.calledWords));
    if (!valid) {
      io.to(room.id).emit("word_bingo_result", {
        valid: false,
        roomId: room.id,
        claimantSocketId: socket.id,
        claimantName: player.name,
        message: `${player.name}'s Word Bingo claim was rejected.`,
      });
      return;
    }

    room.status = "finished";
    room.winnerSocketId = socket.id;
    stopWordAutoCall(room);

    io.to(room.id).emit("word_bingo_result", {
      valid: true,
      roomId: room.id,
      claimantSocketId: socket.id,
      claimantName: player.name,
      winnerSocketId: socket.id,
      winnerName: player.name,
      message: `${player.name} has Word Bingo!`,
    });

    emitWordRoomState(io, room);
  });

  socket.on("restart_word_game", ({ roomId }) => {
    const resolvedRoomId = `WORD_${sanitizeRoomId(roomId)}`;
    const room = wordRooms.get(resolvedRoomId);
    if (!room || room.hostSocketId !== socket.id) return;

    if (!room.categoryName || room.sourceWords.length < 24) {
      io.to(socket.id).emit("word_error", { message: "Start a game first to initialize words." });
      return;
    }

    stopWordAutoCall(room);

    const roundWords = room.categoryName === ENGLISH_VOCAB_SET_NAME
      ? shuffle(room.sourceWords).slice(0, Math.min(100, room.sourceWords.length))
      : room.sourceWords;

    room.calledWords = [];
    room.drawPool = shuffle([...roundWords]);
    room.winnerSocketId = null;
    room.status = "playing";
    room.roundWordCount = roundWords.length;

    const cardsByPlayer = createUniqueWordCards(room, roundWords);
    for (const player of room.players.values()) {
      const card = cardsByPlayer.get(player.socketId);
      if (!card) continue;
      player.card = card;
      player.marked = new Set([12]);
      io.to(player.socketId).emit("word_your_card", {
        card,
        marked: [...player.marked],
      });
    }

    emitWordRoomState(io, room);
    if (room.callMode === "auto") {
      startWordAutoCall(io, room);
    } else {
      stopWordAutoCall(room);
    }
  });

  socket.on("disconnect", () => {
    for (const [roomId, room] of rooms.entries()) {
      if (!room.players.has(socket.id)) {
        continue;
      }

      room.players.delete(socket.id);
      if (room.hostSocketId === socket.id) {
        const nextHost = room.players.values().next().value;
        room.hostSocketId = nextHost ? nextHost.socketId : null;
      }

      if (room.players.size === 0) {
        stopAutoDraw(room);
        rooms.delete(roomId);
      } else {
        emitRoomState(io, room);
      }
    }

    for (const [roomId, room] of wordRooms.entries()) {
      if (!room.players.has(socket.id)) {
        continue;
      }

      room.players.delete(socket.id);
      if (room.hostSocketId === socket.id) {
        const nextHost = room.players.values().next().value;
        room.hostSocketId = nextHost ? nextHost.socketId : null;
      }

      if (room.players.size === 0) {
        stopWordAutoCall(room);
        wordRooms.delete(roomId);
      } else {
        emitWordRoomState(io, room);
      }
    }
  });
});

httpServer.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Bingo server listening on port ${PORT}`);
});
