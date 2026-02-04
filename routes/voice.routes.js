import express from "express";
import multer from "multer";
import { detectVoice } from "../controllers/voice.controller.js";
import { verifyApiKey } from "../middleware/auth.js";

const router = express.Router();

const upload = multer({ dest: "uploads/" });

router.post(
  "/voice-detection",
  verifyApiKey,
  upload.single("audio"),   // 👈 this handles file
  detectVoice
);

export default router;
