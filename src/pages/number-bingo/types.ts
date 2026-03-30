export type GameStatus = "waiting" | "playing" | "finished";
export type NumberCallMode = "auto" | "manual";

export interface BingoCardState {
  cardId: string;
  card: (number | null)[];
  marked: number[];
}

export interface GamePlayer {
  socketId: string;
  name: string;
  isHost: boolean;
}

export interface GameStatePayload {
  roomId: string;
  status: GameStatus;
  drawnNumbers: number[];
  callMode: NumberCallMode;
  players: GamePlayer[];
  winnerSocketId: string | null;
  winnerName: string | null;
}

export interface NumberCalledPayload {
  roomId: string;
  number: number;
  drawnNumbers: number[];
}

export interface BingoResultPayload {
  valid: boolean;
  roomId: string;
  winnerSocketId?: string;
  winnerName?: string;
  claimantSocketId: string;
  claimantName: string;
  cardId?: string;
  message: string;
}
