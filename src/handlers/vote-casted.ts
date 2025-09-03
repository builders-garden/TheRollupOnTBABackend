import { VoteCastedEvent } from "../types";
import { ServerToClientSocketEvents } from "../types/enums";
import { SocketHandler } from "./socket-handler";

export class VoteCastedHandler extends SocketHandler {
	async handle({ username, profilePicture, voteAmount, isBull, promptId }: VoteCastedEvent) {
		try {
			this.emitToStream(ServerToClientSocketEvents.VOTE_RECEIVED, {
				username,
				profilePicture,
				voteAmount,
				isBull, 
				promptId,
			});
		} catch (e) {
			this.emitToStream(ServerToClientSocketEvents.ERROR, {
				code: 500,
				message: "Error sending vote casted",
			});
		}
	}
}