import "dotenv/config";
import express from "express";
import voiceRoutes from "./routes/voice.routes.js";

const app = express();
app.use(express.json({ limit: '50mb' }));

app.use("/api", voiceRoutes);

app.listen(5001, () => console.log("Server running on port 5001"));
