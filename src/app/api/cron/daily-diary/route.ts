import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { getGoogleTokenEdge } from '@/utils/google-auth-edge';

async function callGemini(prompt: string, token: string, projectId: string) {
    const location = 'us-central1';
    const modelId = 'gemini-1.5-flash-001'; 
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

// Cloudflare Edge Runtime
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    console.log("[Cron] Starting Daily Diary Generation...");

    // 1. Verify Cron Secret (Security)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        console.error("[Cron] Unauthorized attempt");
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const botUserId = process.env.BOT_USER_ID;
        if (!botUserId) {
            throw new Error("Configuration Error: BOT_USER_ID missing");
        }

        // 2. Auth with Google (Edge Compatible)
        console.log("[Cron] Authenticating with Google...");
        const { token, projectId } = await getGoogleTokenEdge();
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
