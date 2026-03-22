import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
const keyMatch = env.match(/GEMINI_API_KEY=(.*)/);
const apiKey = keyMatch ? keyMatch[1].trim() : null;

async function diagnose() {
    if (!apiKey) {
        console.log("No API key found");
        return;
    }

    const testMessage = {
        contents: [{ parts: [{ text: "Hello" }] }]
    };

    console.log("Testing API Key:", apiKey.substring(0, 10) + "...");

    // List of endpoints and models to try
    const attempts = [
        { url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, name: "v1beta flash" },
        { url: `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`, name: "v1 flash" },
        { url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, name: "v1beta pro" },
        { url: `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`, name: "v1 pro" }
    ];

    for (const attempt of attempts) {
        try {
            console.log(`Trying ${attempt.name}...`);
            const res = await fetch(attempt.url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(testMessage)
            });
            const data = await res.json();
            console.log(`Status: ${res.status}`);
            console.log(`Response: ${JSON.stringify(data).substring(0, 200)}...`);
            if (res.ok) {
                console.log(`✅ ${attempt.name} WORKS!`);
            }
        } catch (e) {
            console.log(`Error ${attempt.name}: ${e.message}`);
        }
    }
}

diagnose();
