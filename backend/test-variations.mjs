import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });
const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey.trim());

async function test() {
    const models = ["gemini-1.5-flash", "models/gemini-1.5-flash", "gemini-pro", "models/gemini-pro"];
    for (const m of models) {
        try {
            console.log(`Testing model: ${m}`);
            const model = genAI.getGenerativeModel({ model: m });
            const result = await model.generateContent("Hi");
            console.log(`✅ Success with ${m}: ${result.response.text()}`);
            return;
        } catch (e) {
            console.log(`❌ Failed with ${m}: ${e.message}`);
        }
    }
}
test();
