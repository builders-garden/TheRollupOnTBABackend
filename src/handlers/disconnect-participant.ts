import { gameRoomManager } from "./game-room-manager";
import { SocketHandler } from "./socket-handler";

export class DisconnectParticipantHandler extends SocketHandler {
  async handle(): Promise<void> {
    console.log(`[CONNECTION] Disconnecting participant: ${this.socket.id}`);
    await this.disconnectParticipant(this.socket.id);
    console.log(`[CONNECTION] Disconnected participant: ${this.socket.id}`);
  }

  private async disconnectParticipant(socketId: string): Promise<void> {
    // Get all rooms the socket is in
    const rooms = Array.from(this.socket.rooms);

    // Remove the socket's own room (which is the socket ID)
    const gameRooms = rooms.filter((room) => room !== socketId);

    // Disconnect from each game room
    for (const gameId of gameRooms) {
      const room = await gameRoomManager.getGameRoom(gameId);
      if (room) {
        // Find and remove the participant with matching socketId
        for (const [
          participantId,
          participant,
        ] of room.participants.entries()) {
          if (participant.socketId === socketId) {
            // Use GameRoomManager to remove the participant
            await gameRoomManager.removeParticipant(gameId, participantId);

            // Notify other participants
            this.emitToGame(gameId, "participant_left", {
              participantId: socketId,
            });
            this.emitToGame(gameId, "game_update", {
              participants: Array.from(room.participants.values()),
            });
            break; // Break since a participant can only be in one room
          }
        }
      }
    }
  }
}
// retrieve game by socket id
// if game is not found or game already ended, return
// else notify participant in the game
