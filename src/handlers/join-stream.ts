import { ServerToClientSocketEvents } from "../types/enums";
import { JoinStreamEvent } from "../types/socket/client-to-server";
import { SocketHandler } from "./socket-handler";

export class JoinStreamHandler extends SocketHandler {
	async handle({ username, profilePicture }: JoinStreamEvent) {
		try {
			this.joinStream();
			console.log(`[JOIN STREAM] ${username} joined the stream`);
			if (username === "Overlay") {
				return;
			}
			this.emitToStream(ServerToClientSocketEvents.STREAM_JOINED, {
				username,
				profilePicture,
			});
		} catch (e) {
			console.error(`[CREATE GAME] Error creating game: ${e}`);
			this.emitToStream(ServerToClientSocketEvents.ERROR, {
				code: 500,
				message: "Error creating game",
			});
		}
	}
}
