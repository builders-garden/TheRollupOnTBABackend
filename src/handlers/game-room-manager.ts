import type { GameRoom, Participant } from "../types";
import {
  createGameParticipant,
  updateGameParticipant,
} from "../lib/prisma/queries/game-participants";
import { updateGame } from "../lib/prisma/queries/games";
import { GameStatus } from "../types/enums";

export class GameRoomManager {
  private static instance: GameRoomManager;
  private gameRooms: Map<string, GameRoom>;

  private constructor() {
    this.gameRooms = new Map();
  }

  public static getInstance(): GameRoomManager {
    if (!GameRoomManager.instance) {
      GameRoomManager.instance = new GameRoomManager();
    }
    return GameRoomManager.instance;
  }

  public async createGameRoom(
    gameId: string,
    participant: Participant
  ): Promise<GameRoom> {
    const room: GameRoom = {
      participants: new Map(),
      board: Array(10)
        .fill(null)
        .map(() => Array(10).fill("")),
      timer: null,
      timeRemaining: 300, // 5 minutes
    };
    console.log("room", room);
    this.gameRooms.set(gameId, room);
    return room;
  }

  public getGameRoom(gameId: string): GameRoom | undefined {
    return this.gameRooms.get(gameId);
  }

  public async addParticipant(
    gameId: string,
    participant: Participant
  ): Promise<void> {
    const room = this.getGameRoom(gameId);
    if (room) {
      room.participants.set(participant.participantId, participant);
      await createGameParticipant({
        fid: Number(participant.participantId),
        gameId,
        joined: true,
        paid: true,
        winner: false,
        paymentHash: "",
      });
    }
  }

  public removeParticipant(gameId: string, participantId: string): void {
    const room = this.getGameRoom(gameId);
    if (room) {
      room.participants.delete(participantId);

      // Clean up empty rooms
      if (room.participants.size === 0) {
        this.endGame(gameId);
      }
    }
  }

  public async updateParticipantReady(
    gameId: string,
    participantID: string,
    ready: boolean
  ): Promise<void> {
    const room = this.getGameRoom(gameId);
    if (room) {
      const participant = room.participants.get(participantID);
      if (participant) {
        participant.ready = ready;
        room.participants.set(participantID, participant);
        await updateGameParticipant(Number(participantID), gameId, {
          paid: true,
        });
      }
    }
  }

  public updateParticipantBoard(
    gameId: string,
    participantID: string,
    board: string[][]
  ): void {
    const room = this.getGameRoom(gameId);
    if (room) {
      const participant = room.participants.get(participantID);
      if (participant) {
        participant.board = board;
        room.participants.set(participantID, participant);
      }
    }
  }

  public updateParticipantScore(
    gameId: string,
    participantId: string,
    score: number
  ): void {
    const room = this.getGameRoom(gameId);
    if (room) {
      const participant = room.participants.get(participantId);
      if (participant) {
        participant.score = score;
      }
    }
  }

  public async endGame(gameId: string): Promise<void> {
    const room = this.getGameRoom(gameId);
    if (room) {
      // Clear any existing timer
      if (room.timer) {
        clearInterval(room.timer);
      }

      // Update game status in DB
      await updateGame(gameId, {
        status: GameStatus.FINISHED,
        totalFunds: Array.from(room.participants.values()).reduce(
          (sum, participant) => sum + participant.score,
          0
        ),
      });

      // Remove from memory
      this.gameRooms.delete(gameId);
    }
  }

  public startGameTimer(
    gameId: string,
    onTick: (timeRemaining: number) => void,
    onEnd: () => void
  ): void {
    const room = this.getGameRoom(gameId);
    if (room) {
      // Clear any existing timer
      if (room.timer) {
        clearInterval(room.timer);
      }

      room.timer = setInterval(() => {
        room.timeRemaining--;
        onTick(room.timeRemaining);

        if (room.timeRemaining <= 0) {
          clearInterval(room.timer?.toString());
          onEnd();
        }
      }, 1000);
    }
  }

  public initBoard(gameId: string): void {
    const room = this.getGameRoom(gameId);
    if (!room) {
      throw new Error("Room not found");
    }
    room.board = Array.from({ length: 10 }, () => Array(10).fill(""));
    const randomWord = "CHECKMATES";
    const center = Math.floor(room.board.length / 2);

    // Place each letter of the word horizontally starting from center
    for (let i = 0; i < randomWord.length; i++) {
      room.board[center][center - Math.floor(randomWord.length / 2) + i] =
        randomWord[i];
    }
  }

  public updateBoard(
    gameId: string,
    x: number,
    y: number,
    letter: string
  ): void {
    const room = this.getGameRoom(gameId);
    if (room) {
      room.board[x][y] = letter;
    }
  }

  public getActiveGames(): string[] {
    return Array.from(this.gameRooms.keys());
  }

  public getGameParticipants(gameId: string): Participant[] {
    const room = this.getGameRoom(gameId);
    return room ? Array.from(room.participants.values()) : [];
  }

  public async disconnectParticipant(
    gameId: string,
    socketId: string
  ): Promise<void> {
    const room = this.getGameRoom(gameId);
    if (room) {
      room.participants.forEach((participant, participantId) => {
        if (participant.socketId === socketId) {
          this.removeParticipant(gameId, participantId);
        }
      });
    }
  }
}

// Export a singleton instance
export const gameRoomManager = GameRoomManager.getInstance();
