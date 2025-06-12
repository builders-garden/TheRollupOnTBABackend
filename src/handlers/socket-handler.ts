import type { Server, Socket } from "socket.io";
import type { ServerToClientSocketEvents } from "../types/enums";
import type { ServerToClientEvents } from "../types/socket";

export class SocketHandler {
  protected socket: Socket;
  protected io: Server;

  constructor(socket: Socket, io: Server) {
    this.socket = socket;
    this.io = io;
  }

  protected emitToGame<E extends ServerToClientSocketEvents>(
    gameId: string,
    event: E,
    data: ServerToClientEvents[E]
  ) {
    console.log(`[EMIT TO GAME] ${event} to ${gameId}`);
    this.io.to(gameId).emit(event, data);
  }
}
