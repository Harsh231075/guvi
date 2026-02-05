import "dotenv/config";
import express from "express";
import voiceRoutes from "./routes/voice.routes.js";

const app = express();
app.use(express.json({ limit: '50mb' }));

app.get("/", (req, res) => {
  res.send({ status: "running", version: "gemini-2.0-flash-fix" });
});

app.use("/api", voiceRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
