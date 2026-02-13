
const fs = require('fs');
const path = require('path');
const { GoogleAuth } = require('google-auth-library');

// Manual .env parser
function loadEnv() {
    const envPath = path.resolve(__dirname, '.env.local');
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        content.split('\n').forEach(line => {
            const [key, val] = line.split('=');
            if (key && val) process.env[key.trim()] = val.trim();
        });
    }
}

loadEnv();

async function testAI() {
    console.log('--- AI DIAGNOSTIC START ---');

    // 1. AI Studio Test
    console.log('\n[1] Testing AI Studio (Free Tier)...');
    const aiKey = process.env.GEMINI_API_KEY;
    if (!aiKey) console.error('❌ Missing GEMINI_API_KEY');
    else {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${aiKey}`;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: "Hello" }] }] })
            });
            if (res.ok) console.log('✅ AI Studio OK (200)');
            else console.error(`❌ AI Studio FAILED: ${res.status} ${res.statusText} - ${await res.text()}`);
        } catch (e) { console.error('❌ AI Studio Error:', e.message); }
    }

    // 2. Vertex AI Test
    console.log('\n[2] Testing Vertex AI (Paid/Fallback)...');
    try {
        const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
        const client = await auth.getClient();
        const projectId = await auth.getProjectId();
        const token = (await client.getAccessToken()).token;
        console.log(`ℹ️  Project ID detected: ${projectId}`);

        // Try gemini-1.5-flash-001
        const modelId = 'gemini-1.5-flash-001';
        const url = `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/publishers/google/models/${modelId}:generateContent`;

        console.log(`ℹ️  Testing Model: ${modelId}`);
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: "Hello" }] }] })
        });

        if (res.ok) console.log(`✅ Vertex AI (${modelId}) OK (200)`);
        else console.error(`❌ Vertex AI (${modelId}) FAILED: ${res.status} - ${await res.text()}`);

    } catch (e) { console.error('❌ Vertex AI Auth Error:', e.message); }

    console.log('\n--- DIAGNOSTIC END ---');
}

testAI();
