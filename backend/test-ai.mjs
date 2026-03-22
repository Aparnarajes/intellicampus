import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("GEMINI_API_KEY not found in .env");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey.trim());

async function testAI() {
    try {
        console.log("Testing with API Key:", apiKey.substring(0, 10) + "...");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Hello, who are you?");
        const response = await result.response;
        console.log("Response:", response.text());
    } catch (err) {
        console.error("Error:", err.message);
    }
}

testAI();
