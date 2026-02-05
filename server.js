import "dotenv/config";
import express from "express";
import cors from "cors";
import voiceRoutes from "./routes/voice.routes.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.get("/", (req, res) => {
  res.send({ status: "running", version: "v7-debug-auth" });
});

import axios from "axios";
app.get("/check-auth", async (req, res) => {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY;
  try {
    const response = await axios.get("https://openrouter.ai/api/v1/auth/key", {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    res.json({ status: "valid", key_prefix: apiKey ? apiKey.substring(0, 8) : "none", data: response.data });
  } catch (error) {
    res.status(500).json({ 
      status: "invalid", 
      key_prefix: apiKey ? apiKey.substring(0, 8) : "none",
      error: error.response ? error.response.data : error.message 
    });
  }
});

app.use("/api", voiceRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
