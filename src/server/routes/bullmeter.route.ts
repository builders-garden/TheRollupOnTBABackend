import express from "express";
import {
  cancelJob,
  checkJobStatus,
  handleVote,
} from "../bullboard/controllers/bullmeter.controller.js";
import { validateApiSecret } from "../../middleware/auth.middleware.js";

const router = express.Router();

// Apply authentication middleware to all BullMeter routes
router.use(validateApiSecret);

// BullMeter routes (now protected)
router.post("/vote", handleVote);
router.get("/vote/status/:jobId", checkJobStatus);
router.delete("/vote/cancel/:jobId", cancelJob);

export default router;
