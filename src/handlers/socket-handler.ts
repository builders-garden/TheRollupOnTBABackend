import type { Server, Socket } from "socket.io";
import type { ServerToClientSocketEvents } from "../types/enums";
import type { ServerToClientEvents } from "../types/socket";

export class SocketHandler {
	protected socket: Socket;
	protected io: Server;
	protected roomId: string;

	constructor(socket: Socket, io: Server) {
		this.socket = socket;
		this.io = io;
		this.roomId = "stream";
	}

	protected emitToStream<E extends ServerToClientSocketEvents>(
		event: E,
		data: ServerToClientEvents[E],
	) {
		console.log(`[EMIT TO STREAM] ${event} to ${this.roomId}`);
		this.io.to(this.roomId).emit(event, data);
	}

	protected joinStream() {
		this.socket.join(this.roomId);
	}
}
