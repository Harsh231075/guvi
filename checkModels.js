import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
  const models = await genAI.listModels();
  console.log("Available Models:\n");
  models.forEach(m => {
    console.log(m.name, "— supports:", m.supportedGenerationMethods);
  });
}

listModels();
