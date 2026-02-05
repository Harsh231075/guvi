import "dotenv/config";
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Helper to get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = 'http://localhost:5001/api/voice-detection';

// Minimal 1-second silent MP3 base64
const FALLBACK_AUDIO = "SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwM//" + 
"OEAAAAAAAAAAAAAAAAAAAAAAAAMGF2YzU4LjI5LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwM" +
"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"; // Truncated/Dummy for brevity, actually let's use a real minimal header or just rely on file.

// Better fallback: A very short valid MP3 frame or just log error if file missing.
// Actually, sending garbage base64 might trigger ffmpeg error in previous version, but now we send to Gemini.
// Gemini might reject invalid audio.
// Let's stick to reading file, but warn if missing.

const testVoiceDetection = async () => {
    const sampleFile = path.resolve("sample voice 1.mp3"); // Start looking in current dir or root

    let audioBase64 = "";
    
    if (fs.existsSync(sampleFile)) {
        console.log(`Reading audio file: ${sampleFile}`);
        audioBase64 = fs.readFileSync(sampleFile).toString('base64');
    } else {
        console.warn("⚠️ No 'sample voice 1.mp3' found. Using a dummy placeholder (may fail at Gemini).");
        console.warn("Please ensure you have an MP3 file to test.");
        // This is just a placeholder string
        audioBase64 = "SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwM";
    }

    const payload = {
        language: "English",
        audioFormat: "mp3",
        audioBase64: `data:audio/mp3;base64,${audioBase64}` 
    };

    const apiKey = process.env.VOICE_API_KEY || "12345";
    console.log(`Using API Key: ${apiKey}`);

    try {
        console.log("Sending request to:", API_URL);
        const response = await axios.post(API_URL, payload, {
            headers: {
                'x-api-key': apiKey
            }
        });
        
        console.log("Response Status:", response.status);
        console.log("Response Data:", JSON.stringify(response.data, null, 2));

    } catch (error) {
        if (error.response) {
            console.error("Server Error:", error.response.status, error.response.data);
        } else {
            console.error("Error:", error.message);
        }
    }
};

testVoiceDetection();
