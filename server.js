import express from "express";
import dotenv from "dotenv";
import voiceRoutes from "./routes/voice.routes.js";

dotenv.config();

const app = express();
app.use(express.json());

app.use("/api", voiceRoutes);

app.listen(5001, () => console.log("Server running on port 5000"));
