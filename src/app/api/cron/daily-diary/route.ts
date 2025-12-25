import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { GoogleAuth } from 'google-auth-library';

// Shared Logic from generate-image (Ideally should be refactored into lib)
async function getGoogleToken() {
    let projectId = process.env.GOOGLE_PROJECT_ID;
    const authOptions: any = {
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    };

    if (process.env.GOOGLE_CREDENTIALS_JSON) {
        try {
            const jsonContent = process.env.GOOGLE_CREDENTIALS_JSON;
            const cleanedJson = jsonContent.startsWith("'") || jsonContent.startsWith('"')
                ? jsonContent.slice(1, -1)
                : jsonContent;

            const credentials = JSON.parse(cleanedJson);
            if (credentials.private_key) {
                credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
            }

            authOptions.credentials = credentials;
            authOptions.projectId = credentials.project_id || projectId;

            if (credentials.project_id) projectId = credentials.project_id;
        } catch (e: any) {
            console.error("Failed to parse GOOGLE_CREDENTIALS_JSON", e);
            throw new Error("Invalid GOOGLE_CREDENTIALS_JSON");
        }
    }

    const auth = new GoogleAuth(authOptions);
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();
    return { token: accessToken.token, projectId };
}

async function callGemini(prompt: string, token: string, projectId: string) {
    const location = 'us-central1';
    const modelId = 'gemini-2.0-flash-lite-preview-02-05'; // Use fast model
    const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:generateContent`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 512 }
        })
    });

    if (!response.ok) throw new Error(`Gemini Error: ${response.status} - ${await response.text()}`);
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
}

async function generateImageWithStabilityAI(prompt: string) {
    const engineId = 'stable-diffusion-xl-1024-v1-0';
    const apiKey = process.env.STABILITY_API_KEY;
    const apiHost = 'https://api.stability.ai';

    if (!apiKey) throw new Error("Missing STABILITY_API_KEY");

    const response = await fetch(`${apiHost}/v1/generation/${engineId}/text-to-image`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            text_prompts: [{
                text: `${prompt}, soft colored pencil style, crayon texture, child's drawing, warm, highly detailed, whimsical`,
                weight: 1
            }],
            cfg_scale: 7,
            height: 1024,
            width: 1024,
            samples: 1,
            steps: 30,
        }),
    });

    if (!response.ok) throw new Error(`Stability AI Error: ${response.status}`);
    const data = await response.json();
    return `data:image/png;base64,${data.artifacts[0].base64}`;
}

export async function GET(request: Request) {
    // 1. Verify Cron Secret (Security)
    // Vercel sends `Authorization: Bearer <CRON_SECRET>`
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const botUserId = process.env.BOT_USER_ID;
        if (!botUserId) return NextResponse.json({ error: 'Details: BOT_USER_ID not set' }, { status: 500 });

        // 2. Auth with Google
        const { token, projectId } = await getGoogleToken();
        if (!token || !projectId) throw new Error("Google Auth Failed");

        // 3. Generate Random Topic & Weather
        const weathers = ['Sunny', 'Cloudy', 'Rainy', 'Snowy', 'Windy'];
        const randomWeather = weathers[Math.floor(Math.random() * weathers.length)];
        const todayCommon = new Date().toISOString().split('T')[0];

        // 4. Generate Diary Content (Korean)
        const diaryPrompt = `
        You are a cute, sentimental AI diary bot.
        Write a short daily diary entry in Korean (Hangul).
        
        Requirements:
        - Date: Today (${todayCommon})
        - Weather: ${randomWeather}
        - Tone: Warm, nostalgic, innocent, like a fairytale or a child's diary.
        - Length: 3-5 sentences.
        - Topic: Pick a random daily life topic (e.g., watching flowers, baking cookies, reading a book, meeting a cat).
        - Output: ONLY the diary content string. No title, no date prefix.
        `;

        const diaryContent = await callGemini(diaryPrompt, token, projectId);
        if (!diaryContent) throw new Error("Failed to generate diary content");

        // 5. Generate Image Prompt
        const imagePromptInstruction = `
        Convert this Korean diary entry into a detailed English image prompt for an AI image generator.
        Style: Crayon drawing, colored pencil, hand-drawn, cute, warm.
        Diary: "${diaryContent}"
        Output: ONLY the English prompt.
        `;

        const refinedPrompt = await callGemini(imagePromptInstruction, token, projectId);
        if (!refinedPrompt) throw new Error("Failed to generate image prompt");

        // 6. Generate Image
        const imageUrl = await generateImageWithStabilityAI(refinedPrompt);

        // 7. Save to DB (Admin Mode)
        const supabase = createAdminClient();

        // Add a title line manually or let it be part of content?
        // App expects "Title\nContent". Let's fabricate a cute title.
        const titlePrompt = `Extract a very short, cute title (max 10 chars) from this diary: "${diaryContent}". Output ONLY the title in Korean.`;
        const title = await callGemini(titlePrompt, token, projectId);

        const safeTitle = title?.replace(/['"]/g, '').trim() || "오늘의 일기";
        const fullContent = `${safeTitle}\n${diaryContent}`;

        const { error } = await supabase.from('diaries').insert({
            user_id: botUserId,
            content: fullContent,
            image_url: imageUrl,
            prompt: refinedPrompt,
            created_at: new Date().toISOString()
        });

        if (error) throw error;

        return NextResponse.json({ success: true, title: safeTitle, date: todayCommon });

    } catch (error: any) {
        console.error("Cron Job Failed:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
