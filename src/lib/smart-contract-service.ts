import {
  createPublicClient,
  createWalletClient,
  http,
  type Address,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import { env } from "../config/env";
import { BASE_CHECKMATES_ADDRESS } from "./contract-constants";
import { CHECKMATES_ABI } from "./abi";

/**
 * Backend smart contract service for game finalization
 */
export class BackendSmartContractService {
  /**
   * Finalize game on smart contract by setting the winner
   * This function transfers the total bet amount to the winner
   */
  static async setGameResult(
    contractGameId: string,
    game: {
      creator: { user?: { walletAddresses?: string | null } | null };
      opponent: { user?: { walletAddresses?: string | null } | null } | null;
      isWhite: "CREATOR" | "OPPONENT" | null;
    },
    gameResult: "WHITE_WON" | "BLACK_WON" | "DRAW"
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      // Determine the player winner number (0 = draw, 1 = player1, 2 = player2)
      const playerWinner = this.getPlayerWinnerNumber(game, gameResult);

      console.log(
        `[CONTRACT] Setting game result for contract game ${contractGameId}, playerWinner: ${playerWinner} (${gameResult})`
      );

      // Create account from private key
      const account = privateKeyToAccount(
        env.BACKEND_PRIVATE_KEY as `0x${string}`
      );
      if (!account) {
        throw new Error("No backend private key found");
      }

      // Create clients
      const publicClient = createPublicClient({
        chain: base,
        transport: http(),
      });

      const walletClient = createWalletClient({
        chain: base,
        transport: http(),
        account: account,
      });

      // Execute setGameWinner transaction with playerWinner as uint256
      const tx = await walletClient.writeContract({
        address: BASE_CHECKMATES_ADDRESS,
        abi: CHECKMATES_ABI,
        functionName: "setGameWinner",
        args: [BigInt(contractGameId), BigInt(playerWinner)], // Convert to BigInt for uint256
      });

      console.log(`[CONTRACT] Transaction submitted: ${tx}`);

      // Wait for transaction confirmation
      const txReceipt = await publicClient.waitForTransactionReceipt({
        hash: tx,
      });

      if (txReceipt.status === "success") {
        console.log(
          `[CONTRACT] Game ${contractGameId} finalized successfully. PlayerWinner: ${playerWinner} (${gameResult}). TX: ${tx}`
        );
        return { success: true, txHash: tx };
      } else {
        throw new Error("Transaction failed");
      }
    } catch (error) {
      console.error(
        `[CONTRACT] Error setting game result for ${contractGameId}:`,
        error
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get contract game details
   */
  static async getContractGame(contractGameId: string) {
    try {
      const publicClient = createPublicClient({
        chain: base,
        transport: http(),
      });

      const game = await publicClient.readContract({
        address: BASE_CHECKMATES_ADDRESS,
        abi: CHECKMATES_ABI,
        functionName: "getGame",
        args: [BigInt(contractGameId)],
      });

      return game as {
        player1: Address;
        player2: Address;
        betAmount: bigint;
        gameId: bigint;
        status: number;
        playerWinner: bigint; // ABI returns bigint, not number
      };
    } catch (error) {
      console.error(
        `[CONTRACT] Error getting contract game ${contractGameId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Determine winner address based on game participants and result
   */
  static getWinnerAddress(
    game: {
      creator: { user?: { walletAddresses?: string | null } | null };
      opponent: { user?: { walletAddresses?: string | null } | null } | null;
      isWhite: "CREATOR" | "OPPONENT" | null;
    },
    gameResult: "WHITE_WON" | "BLACK_WON" | "DRAW"
  ): Address | null {
    try {
      if (gameResult === "DRAW") {
        // For draws, we could return null or implement a different distribution logic
        // For now, return null to indicate no single winner
        return null;
      }

      // Determine who is white and who is black
      const creatorIsWhite = game.isWhite === "CREATOR";
      const isWhiteWinner = gameResult === "WHITE_WON";

      // Determine the winner participant
      const winnerParticipant =
        creatorIsWhite === isWhiteWinner ? game.creator : game.opponent;

      if (!winnerParticipant?.user?.walletAddresses) {
        console.error("[CONTRACT] Winner participant has no wallet addresses");
        return null;
      }

      // Parse wallet addresses and get the first one
      const walletAddresses = JSON.parse(
        winnerParticipant.user.walletAddresses
      ) as string[];
      if (walletAddresses.length === 0) {
        console.error(
          "[CONTRACT] Winner participant has empty wallet addresses"
        );
        return null;
      }

      return walletAddresses[0] as Address;
    } catch (error) {
      console.error("[CONTRACT] Error determining winner address:", error);
      return null;
    }
  }

  /**
   * Determine the player winner number for the smart contract
   * @param game Game data with participants and color assignment
   * @param gameResult The result of the game
   * @returns 0 for draw, 1 for player1 (creator), 2 for player2 (opponent)
   */
  static getPlayerWinnerNumber(
    game: {
      creator: { user?: { walletAddresses?: string | null } | null };
      opponent: { user?: { walletAddresses?: string | null } | null } | null;
      isWhite: "CREATOR" | "OPPONENT" | null;
    },
    gameResult: "WHITE_WON" | "BLACK_WON" | "DRAW"
  ): number {
    if (gameResult === "DRAW") {
      return 0; // Draw
    }

    // Determine who is white and who is black
    const creatorIsWhite = game.isWhite === "CREATOR";
    const isWhiteWinner = gameResult === "WHITE_WON";

    // Determine if creator won
    const creatorWon = creatorIsWhite === isWhiteWinner;

    // Return player number: 1 for creator (player1), 2 for opponent (player2)
    return creatorWon ? 1 : 2;
  }
}
