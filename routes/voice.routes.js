import express from "express";
import { detectVoice } from "../controllers/voice.controller.js";
import { verifyApiKey } from "../middleware/auth.js";

const router = express.Router();

// verifyApiKey is preserved, but upload.single("audio") is removed
router.post(
  "/voice-detection",
  verifyApiKey,
  detectVoice
);

export default router;
