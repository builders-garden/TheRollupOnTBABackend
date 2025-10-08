import express from "express";
import {
  cancelJob,
  checkJobStatus,
  handleVote,
} from "../bullboard/controllers/bullmeter.controller.js";

const router = express.Router();

// handle copy trade route
router.post("/vote", handleVote);
router.get("/vote/status/:jobId", checkJobStatus);
router.delete("/vote/cancel/:jobId", cancelJob);

export default router;
