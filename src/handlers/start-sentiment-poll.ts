import { env } from "../config/env";
import { StartSentimentPollEvent } from "../types";
import { ServerToClientSocketEvents } from "../types/enums";
import { SocketHandler } from "./socket-handler";
import { ulid } from "ulid";

export class StartSentimentPollHandler extends SocketHandler {
	async handle({
		username,
		profilePicture,
		pollQuestion,
		endTime,
		guests,
	}: StartSentimentPollEvent) {
		try {
			const id = ulid();
			// TODO save poll to db
			console.log("poll saved to db", {
				id,
				pollQuestion,
				endTime,
				guests,
				username,
				profilePicture,
			});
			this.emitToStream(ServerToClientSocketEvents.START_SENTIMENT_POLL, {
				id,
				pollQuestion,
				endTime,
				votes: 0,
				voters: 0,
				qrCodeUrl: `https://${env.APP_URL}/poll/${id}`,
				position: "",
				results: undefined,
			});
		} catch (e) {
			this.emitToStream(ServerToClientSocketEvents.ERROR, {
				code: 500,
				message: "Error sending start sentiment poll",
			});
		}
	}
}
