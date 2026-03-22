import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });
const apiKey = process.env.GEMINI_API_KEY;

async function run() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        if (data.error) {
            console.error("API Error:", data.error.message);
            return;
        }
        console.log("Your key has access to these models:");
        data.models.forEach(m => {
            if (m.supportedGenerationMethods.includes("generateContent")) {
                console.log(`- ${m.name.replace('models/', '')}`);
            }
        });
    } catch (e) {
        console.error("Error:", e.message);
    }
}
run();
