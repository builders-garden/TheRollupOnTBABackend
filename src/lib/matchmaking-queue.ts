import {
  GameMode,
  GameOption,
  GameType,
  GameParticipantStatus,
  GameIsWhite,
  GameState,
} from "@prisma/client";
import { ulid } from "ulid";
import { getIOInstance } from "./socket";
import { ServerToClientSocketEvents } from "../types/enums";
import { getUserByFid } from "./prisma/queries/user";
import { prisma } from "./prisma/client";
import { getGameOptionTime } from "./utils";

export interface QueuePlayer {
  userId: string;
  userFid: number;
  username: string;
  socketId: string;
  gameMode: GameMode;
  gameOption: GameOption;
  wageAmount: string; // Bet amount in USDC (as string to match Prisma decimal)
  queuedAt: number;
}

export interface MatchmakingResult {
  gameId: string;
  player1: QueuePlayer;
  player2: QueuePlayer;
}

export class MatchmakingQueue {
  private static instance: MatchmakingQueue;
  private queue: Map<string, QueuePlayer[]> = new Map();

  private constructor() {}

  public static getInstance(): MatchmakingQueue {
    if (!MatchmakingQueue.instance) {
      MatchmakingQueue.instance = new MatchmakingQueue();
    }
    return MatchmakingQueue.instance;
  }

  /**
   * Add a player to the matchmaking queue
   */
  public addToQueue(player: QueuePlayer): void {
    const queueKey = this.getQueueKey(player.gameMode, player.gameOption);

    if (!this.queue.has(queueKey)) {
      this.queue.set(queueKey, []);
    }

    const queueForGameMode = this.queue.get(queueKey)!;

    // Check if player is already in queue
    const existingPlayerIndex = queueForGameMode.findIndex(
      (p) => p.userId === player.userId
    );
    if (existingPlayerIndex !== -1) {
      // Update existing player's socket ID
      queueForGameMode[existingPlayerIndex].socketId = player.socketId;
      console.log(
        `[MATCHMAKING] Updated player ${player.username} in queue for ${queueKey}`
      );
      return;
    }

    queueForGameMode.push(player);
    console.log(
      `[MATCHMAKING] Added player ${player.username} to queue for ${queueKey}. Queue size: ${queueForGameMode.length}`
    );

    // Emit queue status update to the player
    this.emitQueueStatus(player);

    // Try to find a match
    this.tryToMatch(queueKey);
  }

  /**
   * Remove a player from the matchmaking queue
   */
  public removeFromQueue(userId: string): boolean {
    for (const [queueKey, players] of this.queue.entries()) {
      const playerIndex = players.findIndex((p) => p.userId === userId);
      if (playerIndex !== -1) {
        const removedPlayer = players.splice(playerIndex, 1)[0];
        console.log(
          `[MATCHMAKING] Removed player ${removedPlayer.username} from queue for ${queueKey}`
        );

        // Update queue status for remaining players
        this.emitQueueStatusToAll(queueKey);
        return true;
      }
    }
    return false;
  }

  /**
   * Remove a player from queue by socket ID (for disconnections)
   */
  public removeFromQueueBySocketId(socketId: string): boolean {
    for (const [queueKey, players] of this.queue.entries()) {
      const playerIndex = players.findIndex((p) => p.socketId === socketId);
      if (playerIndex !== -1) {
        const removedPlayer = players.splice(playerIndex, 1)[0];
        console.log(
          `[MATCHMAKING] Removed player ${removedPlayer.username} from queue for ${queueKey} (socket disconnect)`
        );

        // Update queue status for remaining players
        this.emitQueueStatusToAll(queueKey);
        return true;
      }
    }
    return false;
  }

  /**
   * Comprehensive removal of a player from all queues by both userId and socketId
   * Used after successful match creation to ensure no stale entries
   */
  public removePlayerFromAllQueues(userId: string, socketId?: string): boolean {
    let removed = false;
    for (const [queueKey, players] of this.queue.entries()) {
      // Remove by userId
      let playerIndex = players.findIndex((p) => p.userId === userId);
      while (playerIndex !== -1) {
        const removedPlayer = players.splice(playerIndex, 1)[0];
        console.log(
          `[MATCHMAKING] Removed player ${removedPlayer.username} from queue for ${queueKey} (userId cleanup)`
        );
        removed = true;
        playerIndex = players.findIndex((p) => p.userId === userId);
      }

      // Also remove by socketId if provided (for extra safety)
      if (socketId) {
        playerIndex = players.findIndex((p) => p.socketId === socketId);
        while (playerIndex !== -1) {
          const removedPlayer = players.splice(playerIndex, 1)[0];
          console.log(
            `[MATCHMAKING] Removed player ${removedPlayer.username} from queue for ${queueKey} (socketId cleanup)`
          );
          removed = true;
          playerIndex = players.findIndex((p) => p.socketId === socketId);
        }
      }

      if (removed) {
        // Update queue status for remaining players
        this.emitQueueStatusToAll(queueKey);
      }
    }
    return removed;
  }

  /**
   * Get the current queue status for a specific game mode/option
   */
  public getQueueStatus(
    gameMode: GameMode,
    gameOption: GameOption
  ): { playersInQueue: number; estimatedWaitTime: number } {
    const queueKey = this.getQueueKey(gameMode, gameOption);
    const queueForGameMode = this.queue.get(queueKey) || [];

    // Simple estimation: if queue is empty, longer wait time
    const estimatedWaitTime = queueForGameMode.length === 0 ? 60 : 10; // seconds

    return {
      playersInQueue: queueForGameMode.length,
      estimatedWaitTime,
    };
  }

  /**
   * Try to match players in a specific queue
   */
  private async tryToMatch(queueKey: string): Promise<void> {
    const queueForGameMode = this.queue.get(queueKey);
    if (!queueForGameMode || queueForGameMode.length < 2) {
      return;
    }

    // Take the first two players (FIFO)
    const player1 = queueForGameMode.shift()!;
    const player2 = queueForGameMode.shift()!;

    console.log(
      `[MATCHMAKING] Matching players ${player1.username} vs ${player2.username}`
    );

    try {
      // Create the game
      const gameId = await this.createMatchedGame(player1, player2);

      console.log(
        `[MATCHMAKING] Game ${gameId} created successfully. Cleaning up players from all queues.`
      );

      // Explicitly remove both players from ALL queues to prevent stale matches
      this.removePlayerFromAllQueues(player1.userId, player1.socketId);
      this.removePlayerFromAllQueues(player2.userId, player2.socketId);

      // Update queue status for remaining players
      this.emitQueueStatusToAll(queueKey);
    } catch (error) {
      console.error(`[MATCHMAKING] Error creating matched game:`, error);

      // Re-add players to queue if game creation failed
      queueForGameMode.unshift(player2, player1);

      // Notify players of the error
      const io = getIOInstance();
      if (io) {
        io.to(player1.socketId).emit(ServerToClientSocketEvents.ERROR, {
          code: 500,
          message: "Failed to create game. Please try again.",
        });
        io.to(player2.socketId).emit(ServerToClientSocketEvents.ERROR, {
          code: 500,
          message: "Failed to create game. Please try again.",
        });
      }
    }
  }

  /**
   * Create a game between two matched players
   */
  private async createMatchedGame(
    player1: QueuePlayer,
    player2: QueuePlayer
  ): Promise<string> {
    console.log("[MATCHMAKING] Creating game for players:", {
      player1: {
        userId: player1.userId,
        userFid: player1.userFid,
        username: player1.username,
      },
      player2: {
        userId: player2.userId,
        userFid: player2.userFid,
        username: player2.username,
      },
    });

    // Verify user FIDs are valid numbers
    if (
      typeof player1.userFid !== "number" ||
      typeof player2.userFid !== "number"
    ) {
      throw new Error(
        `Invalid userFid types: player1=${typeof player1.userFid}, player2=${typeof player2.userFid}`
      );
    }

    const user1 = await getUserByFid(player1.userFid);
    const user2 = await getUserByFid(player2.userFid);

    if (!user1 || !user2) {
      throw new Error("Failed to find user data for matched players");
    }

    // Get game time settings
    const { duration } = getGameOptionTime(
      player1.gameMode,
      player1.gameOption
    );

    // Calculate minimum wage amount between the two players
    const player1Wage = parseFloat(player1.wageAmount);
    const player2Wage = parseFloat(player2.wageAmount);
    const finalWageAmount = Math.min(player1Wage, player2Wage).toString();

    console.log(
      `[MATCHMAKING] Player1 bet: $${player1.wageAmount}, Player2 bet: $${player2.wageAmount}, Final bet: $${finalWageAmount}`
    );

    // Randomly assign colors
    const randomNumber = Math.random();
    const isWhite =
      randomNumber < 0.5 ? GameIsWhite.CREATOR : GameIsWhite.OPPONENT;

    const gameId = ulid();

    // Create the game directly with Prisma
    // For matchmaking games, we need payment flow - start in WAITING state
    const newGame = await prisma.game.create({
      data: {
        id: gameId,
        gameType: GameType.RANDOM,
        gameMode: player1.gameMode,
        gameOption: player1.gameOption,
        wageAmount: finalWageAmount, // Use the minimum bet amount
        isWhite: isWhite,
        gameState: GameState.WAITING, // Wait for both players to pay
        currentFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        // Don't set startedAt until the game is actually active
        creator: {
          create: {
            gameId: gameId,
            userId: user1.id,
            status: GameParticipantStatus.JOINED,
            paid: false, // Creator needs to pay via smart contract
            timeLeft: duration,
          },
        },
        opponent: {
          create: {
            gameId: gameId,
            userId: user2.id,
            status: GameParticipantStatus.JOINED,
            paid: false, // Opponent needs to pay via smart contract
            timeLeft: duration,
          },
        },
      },
    });

    // Notify both players that a match was found
    const io = getIOInstance();
    if (io) {
      // Player1 is the creator (will create the smart contract game)
      io.to(player1.socketId).emit(ServerToClientSocketEvents.MATCH_FOUND, {
        gameId: newGame.id,
        opponent: {
          userId: player2.userId,
          username: player2.username,
          userFid: player2.userFid,
          avatarUrl: user2.avatarUrl,
        },
        finalWageAmount,
        playerRole: "creator", // Player1 creates the game
        isMatchmaking: true,
      });

      // Player2 is the opponent (will join the smart contract game after creator creates it)
      io.to(player2.socketId).emit(ServerToClientSocketEvents.MATCH_FOUND, {
        gameId: newGame.id,
        opponent: {
          userId: player1.userId,
          username: player1.username,
          userFid: player1.userFid,
          avatarUrl: user1.avatarUrl,
        },
        finalWageAmount,
        playerRole: "opponent", // Player2 joins the game
        isMatchmaking: true,
      });
    }

    return newGame.id;
  }

  /**
   * Emit queue status to a specific player
   */
  private emitQueueStatus(player: QueuePlayer): void {
    const queueStatus = this.getQueueStatus(player.gameMode, player.gameOption);
    const io = getIOInstance();
    if (io) {
      io.to(player.socketId).emit(
        ServerToClientSocketEvents.QUEUE_STATUS_UPDATE,
        {
          playersInQueue: queueStatus.playersInQueue,
          estimatedWaitTime: queueStatus.estimatedWaitTime,
          position: this.getPlayerPosition(player),
        }
      );
    }
  }

  /**
   * Emit queue status to all players in a specific queue
   */
  private emitQueueStatusToAll(queueKey: string): void {
    const queueForGameMode = this.queue.get(queueKey);
    if (!queueForGameMode) return;

    queueForGameMode.forEach((player) => {
      this.emitQueueStatus(player);
    });
  }

  /**
   * Get a player's position in the queue
   */
  private getPlayerPosition(player: QueuePlayer): number {
    const queueKey = this.getQueueKey(player.gameMode, player.gameOption);
    const queueForGameMode = this.queue.get(queueKey) || [];
    const position = queueForGameMode.findIndex(
      (p) => p.userId === player.userId
    );
    return position === -1 ? 0 : position + 1;
  }

  /**
   * Generate a queue key for a specific game mode and option
   */
  private getQueueKey(gameMode: GameMode, gameOption: GameOption): string {
    return `${gameMode}_${gameOption}`;
  }

  /**
   * Get all queues for debugging/monitoring
   */
  public getAllQueues(): Map<string, QueuePlayer[]> {
    return this.queue;
  }

  /**
   * Clean up empty queues
   */
  public cleanup(): void {
    for (const [queueKey, players] of this.queue.entries()) {
      if (players.length === 0) {
        this.queue.delete(queueKey);
      }
    }
  }
}
