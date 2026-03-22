import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

// Disable console logs from dotenv if any
dotenv.config({ path: './.env' });

const apiKey = process.env.GEMINI_API_KEY;

async function run() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        // Filter and print only the names of models that support generateContent
        const names = data.models
            ? data.models.filter(m => m.supportedGenerationMethods.includes("generateContent")).map(m => m.name)
            : data;
        process.stdout.write(JSON.stringify(names));
    } catch (e) {
        process.stdout.write(JSON.stringify({ error: e.message }));
    }
}

run();
