import "dotenv/config";
import express from "express";
import cors from "cors";
import voiceRoutes from "./routes/voice.routes.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.get("/", (req, res) => {
  res.send({ status: "running", version: "v5-debug-dataUrl" });
});

app.use("/api", voiceRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
