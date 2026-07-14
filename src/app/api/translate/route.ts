import { NextResponse } from 'next/server';
import { getGoogleTokenEdge } from '@/utils/google-auth-edge';

// 1. AI Studio (Gemini Free tier)
async function translateWithAIStudio(text: string, targetLang: 'ko' | 'en', apiKey: string) {
    const model = 'gemini-2.5-flash-lite';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const languageName = targetLang === 'ko' ? 'Korean' : 'English';
    const instruction = `Translate the user text into ${languageName}. Output ONLY the raw translated text, with no wrappers, explanations, quotes, or markdown.`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: `${instruction}\n\nText to translate: "${text}"` }] }]
        })
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(`AI Studio translation failed: ${response.status}`);
    }

    const result = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!result) throw new Error("AI Studio returned empty translation");
    return result;
}

// 2. Vertex AI (Gemini Fallback)
async function translateWithVertexAI(text: string, targetLang: 'ko' | 'en', token: string, projectId: string) {
    const location = 'us-central1';
    const modelId = 'gemini-1.5-flash-001';
    const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:generateContent`;
    const languageName = targetLang === 'ko' ? 'Korean' : 'English';
    const instruction = `Translate the user text into ${languageName}. Output ONLY the raw translated text.`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: `${instruction}\n\nText: "${text}"` }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 512 }
        })
    });

    if (!response.ok) {
        throw new Error(`Vertex AI translation failed: ${response.status} - ${await response.text()}`);
    }

    const data = await response.json();
    const result = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!result) throw new Error("Vertex AI returned empty translation");
    return result;
}

export async function POST(request: Request) {
    try {
        const { text, targetLang } = await request.json();
        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }
        
        let translatedText = "";
        
        // 1순위: AI Studio (Gemini API Key)
        const geminiApiKey = process.env.GEMINI_API_KEY;
        if (geminiApiKey) {
            try {
                translatedText = await translateWithAIStudio(text, targetLang, geminiApiKey);
            } catch (e: any) {
                console.warn(`[Translation] AI Studio failed, falling back to Vertex AI:`, e.message);
            }
        }
        
        // 2순위: Vertex AI (Google Cloud Token)
        if (!translatedText) {
            try {
                const { token, projectId } = await getGoogleTokenEdge();
                if (token && projectId) {
                    translatedText = await translateWithVertexAI(text, targetLang, token, projectId);
                }
            } catch (vertexError: any) {
                console.error("[Translation] All translation attempts failed:", vertexError.message);
            }
        }
        
        if (!translatedText) {
            return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
        }
        
        return NextResponse.json({ translatedText });
    } catch (error: any) {
        console.error("[Translation API Error]:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
