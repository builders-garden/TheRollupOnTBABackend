import type { Server, Socket } from "socket.io";

export class SocketHandler {
  protected socket: Socket;
  protected io: Server;

  constructor(socket: Socket, io: Server) {
    this.socket = socket;
    this.io = io;
  }

  protected emitToGame(gameId: string, event: string, data: unknown) {
    console.log(`[EMIT TO GAME] ${event} to ${gameId}`);
    this.io.to(gameId).emit(event, data);
  }
}
