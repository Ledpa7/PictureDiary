import { getGoogleTokenEdge } from "@/utils/google-auth-edge";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
 
export const runtime = 'edge';

// === [1순위] AI Studio용 무료 번역/정제 헬퍼 ===
async function refinePromptWithAIStudio(originalPrompt: string, apiKey: string) {
    const model = 'gemini-2.5-flash-lite';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const instructions = `You are an expert art director. Convert the diary entry into a detailed English image prompt.
    CRITICAL: Output ONLY the English prompt in one paragraph.
    Style: Soft, hand-drawn art style using colored pencils, warm texture.`;

    console.log(`[DEBUG] 🟢 1순위: AI Studio(${model}) 시도...`);

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: `${instructions}\n\nDiary Entry: "${originalPrompt}"` }] }]
        })
    });

    const data = await response.json();

    if (!response.ok) {
        console.warn(`[AI Studio Failed]: ${response.status}`, JSON.stringify(data));
        throw new Error(`AI Studio Error ${response.status}`);
    }

    const result = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!result) throw new Error("AI Studio generated empty text");
    return result;
}

// === [2순위] Vertex AI용 유료/비상용 헬퍼 ===
async function refinePromptWithVertexAI(originalPrompt: string, accessToken: string, projectId: string) {
    const location = 'us-central1';
    const modelsToTry = [
        'gemini-1.0-pro-001', 
        'gemini-2.0-flash-lite',
        'gemini-pro'
    ];

    const instructions = `Convert diary to English image prompt. Soft hand-drawn style. Output only prompt.`;

    console.log('[DEBUG] 🟡 2순위: Vertex AI(Fallback) 시도...');

    let lastError = null;

    for (const modelId of modelsToTry) {
        const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:generateContent`;

        try {
            console.log(`[Vertex AI] Trying model: ${modelId}...`);
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{ role: 'user', parts: [{ text: `${instructions}\n\nDiary Entry: "${originalPrompt}"` }] }],
                    generationConfig: { temperature: 0.3, maxOutputTokens: 256 }
                })
            });

            if (!response.ok) {
                console.warn(`[Vertex AI] ${modelId} Failed: ${response.status}`);
                continue;
            }

            const data = await response.json();
            const result = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            if (result) {
                console.log(`✅ [Vertex AI] Success with ${modelId}!`);
                return result;
            }
        } catch (e: any) {
            lastError = e.message;
        }
    }

    throw new Error(`All Vertex AI models failed. Last Error: ${lastError}`);
}

// === [최종] Stability AI 이미지 생성 헬퍼 ===
async function generateImageWithStabilityAI(prompt: string) {
    const engineId = 'stable-diffusion-xl-1024-v1-0';
    const apiKey = process.env.STABILITY_API_KEY;
    if (!apiKey) throw new Error("STABILITY_API_KEY Missing");

    console.log(`[DEBUG] 🚀 Stability AI Generation...`);

    const response = await fetch(`https://api.stability.ai/v1/generation/${engineId}/text-to-image`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            text_prompts: [{ text: `${prompt}, soft colored pencil style, crayon texture`, weight: 1 }],
            cfg_scale: 7,
            height: 1024,
            width: 1024,
            samples: 1,
            steps: 25,
        }),
    });

    if (!response.ok) {
        throw new Error(`Stability AI Error ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    return `data:image/png;base64,${data.artifacts[0].base64}`;
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { prompt: imagePrompt, preRefinedPrompt } = await request.json();
        let finalPrompt = "";

        if (preRefinedPrompt && preRefinedPrompt.trim().length > 5) {
            finalPrompt = preRefinedPrompt;
        }

        if (!finalPrompt) {
            const aiStudioKey = process.env.GEMINI_API_KEY;
            if (aiStudioKey) {
                try {
                    finalPrompt = await refinePromptWithAIStudio(imagePrompt, aiStudioKey);
                } catch (e: any) {
                    console.warn(`⚠️AI Studio Failed, trying fallback...`);
                }
            }
        }

        if (!finalPrompt) {
            try {
                const { token, projectId } = await getGoogleTokenEdge();
                if (token && projectId) {
                    finalPrompt = await refinePromptWithVertexAI(imagePrompt, token, projectId);
                }
            } catch (vertexError: any) {
                console.error("❌ All AI Refinement attempts failed:", vertexError.message);
            }
        }

        if (!finalPrompt) {
            return NextResponse.json({ error: "프롬프트 생성 실패" }, { status: 500 });
        }

        const imageUrl = await generateImageWithStabilityAI(finalPrompt);
        return NextResponse.json({ imageUrl, refinedPrompt: finalPrompt });

    } catch (error: any) {
        console.error('[API GLOBAL ERROR]:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
