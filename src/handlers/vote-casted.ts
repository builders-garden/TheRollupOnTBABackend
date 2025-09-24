import { Hex } from "viem";
import { getBullMeterByPollId } from "../lib/database/queries/bull-meter.query";
import { VoteCastedEvent } from "../types";
import { PopupPositions, ServerToClientSocketEvents } from "../types/enums";
import { SocketHandler } from "./socket-handler";
import { getBrandById } from "../lib/database/queries";

export class VoteCastedHandler extends SocketHandler {
  async handle({
    brandId,
    username,
    profilePicture,
    voteAmount,
    isBull,
    promptId,
    position,
    endTimeMs,
  }: VoteCastedEvent) {
    try {
      const brand = await getBrandById(brandId);
      if (!brand) throw new Error("Brand not found");

      this.emitToStream(brandId, ServerToClientSocketEvents.VOTE_RECEIVED, {
        brandId,
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

        this.emitToStream(
          brandId,
          ServerToClientSocketEvents.UPDATE_SENTIMENT_POLL,
          {
            brandId,
            id: bullmeter.pollId,
            endTimeMs: endTimeMs,
            position: PopupPositions.TOP_CENTER,
            votes: totalVotes || 0,
            voters: totalVotes || 0,
            results: {
              bullPercent: (bullmeter.totalYesVotes || 0) / totalVotes,
              bearPercent: (bullmeter.totalNoVotes || 0) / totalVotes,
            },
          }
        );
      }
    } catch (e) {
      this.emitToStream(brandId, ServerToClientSocketEvents.ERROR, {
        brandId,
        code: 500,
        message: "Error sending vote casted",
      });
    }
  }
}
