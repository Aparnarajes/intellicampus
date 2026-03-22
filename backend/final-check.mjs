import fs from 'fs';
import { GoogleGenerativeAI } from "@google/generative-ai";

const env = fs.readFileSync('.env', 'utf8');
const keyMatch = env.match(/GEMINI_API_KEY=(.*)/);
if (!keyMatch) {
    console.error("No API key found in .env");
    process.exit(1);
}
const apiKey = keyMatch[1].trim();

async function run() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        if (data.models) {
            const models = data.models
                .filter(m => m.supportedGenerationMethods.includes("generateContent"))
                .map(m => m.name.replace('models/', ''));
            console.log("MODELS_START");
            console.log(JSON.stringify(models));
            console.log("MODELS_END");
        } else {
            console.log("ERROR_START");
            console.log(JSON.stringify(data));
            console.log("ERROR_END");
        }
    } catch (e) {
        console.error(e);
    }
}
run();
