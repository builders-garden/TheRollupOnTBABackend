import { SocketHandler } from "./socket-handler";

export class DisconnectParticipantHandler extends SocketHandler {
  async handle(): Promise<void> {
    console.log(`[CONNECTION] Disconnecting participant: ${this.socket.id}`);

    console.log(`[CONNECTION] Disconnected participant: ${this.socket.id}`);
  }
}
// retrieve game by socket id
// if game is not found or game already ended, return
// else notify participant in the game
