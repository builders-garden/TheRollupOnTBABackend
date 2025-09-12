import { Hex } from "viem";
import { getBullMeterByPollId } from "../lib/database/queries/bull-meter.query";
import { VoteCastedEvent } from "../types";
import { PopupPositions, ServerToClientSocketEvents } from "../types/enums";
import { SocketHandler } from "./socket-handler";

export class VoteCastedHandler extends SocketHandler {
  async handle({
    username,
    profilePicture,
    voteAmount,
    isBull,
    promptId,
    position,
    endTime,
  }: VoteCastedEvent) {
    try {
      this.emitToStream(ServerToClientSocketEvents.VOTE_RECEIVED, {
        username,
        profilePicture,
        voteAmount,
        isBull,
        promptId,
        position,
      });

      // get bullmeter from pollId
      const bullmeter = await getBullMeterByPollId(promptId as Hex);
      if (bullmeter) {
        const totalVotes =
          (bullmeter.totalYesVotes || 0) + (bullmeter.totalNoVotes || 0);

        this.emitToStream(ServerToClientSocketEvents.UPDATE_SENTIMENT_POLL, {
          id: bullmeter.pollId,
          endTime: endTime,
          position: PopupPositions.TOP_CENTER,
          votes: totalVotes || 0,
          voters: totalVotes || 0,
          results: {
            bullPercent: (bullmeter.totalYesVotes || 0) / totalVotes,
            bearPercent: (bullmeter.totalNoVotes || 0) / totalVotes,
          },
        });
      }
    } catch (e) {
      this.emitToStream(ServerToClientSocketEvents.ERROR, {
        code: 500,
        message: "Error sending vote casted",
      });
    }
  }
}
