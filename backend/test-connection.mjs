import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("GEMINI_API_KEY not found in .env");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey.trim());

async function listModels() {
    try {
        console.log("Checking available models for your API key...");
        // The listModels method may not be available on all versions of the SDK or may require specific permissions
        // But let's try a simpler connectivity test with a different model string
        const models = ["gemini-pro", "gemini-1.5-flash", "gemini-1.0-pro"];

        for (const modelName of models) {
            try {
                console.log(`Testing ${modelName}...`);
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent("Say 'Ping'");
                const response = await result.response;
                console.log(`✅ ${modelName} works! Response: ${response.text()}`);
                return; // Stop if one works
            } catch (err) {
                console.log(`❌ ${modelName} failed: ${err.message}`);
            }
        }
    } catch (err) {
        console.error("Critical Error:", err.message);
    }
}

listModels();
