import { GoogleAuth } from "google-auth-library";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// ... (existing helper functions) ...

async function refinePromptWithPaLM(instructions: string, originalPrompt: string, accessToken: string, projectId: string) {
    const location = 'us-central1';
    const modelId = 'text-bison';
    const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:predict`;

    console.log('Falling back to PaLM 2 (text-bison)...');

    const fullPrompt = `${instructions}\n\nDiary Entry: "${originalPrompt}"\n\nImage Prompt:`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            instances: [{ content: fullPrompt }],
            parameters: {
                temperature: 0.3,
                maxOutputTokens: 256,
                topK: 40,
                topP: 0.95
            }
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`PaLM 2 Failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const refinedPrompt = data.predictions?.[0]?.content;

    if (!refinedPrompt) throw new Error("PaLM 2 returned empty content");

    return refinedPrompt.trim();
}

async function refinePromptWithGemini(originalPrompt: string, accessToken: string, projectId: string) {
    const location = 'us-central1';
    // List of models to try in order of preference (Prioritizing Flash Lite as requested)
    // Confirmed enabled in user project: gemini-2.0-flash-lite
    const modelsToTry = [
        'gemini-2.0-flash-lite',
        'gemini-2.0-flash-lite-preview-02-05',
        'gemini-1.5-flash-001'
    ];

    const instructions = `
    You are an expert art director optimizing prompts for AI image generation.
    Your task is to convert a user's diary entry into a detailed English image prompt.

    CRITICAL REQUIREMENTS:
    1. **Action fidelity is Key:** The image MUST show the main action described in the diary. (e.g., If the diary says "eating watermelon", the character MUST be eating watermelon).
    2. **Atmosphere:** Use the 'Weather' info to set the lighting and mood (e.g., Rainy = cozy or gloomy, Sunny = bright).
    3. **Character:** Use "a cute illustrated character" (keep it simple and safe) but ensure they are performing the diary's action.
    4. **Setting:** Infer the setting from the text (e.g., school, home, playground).
    5. **Style:** Soft, hand-drawn art style using colored pencils or crayons. Warm and nostalgic texture.

    Output ONLY the English prompt.
    `;

    let lastError = null;

    // 1. Try Gemini Models
    console.log(`[DEBUG] Gemini Project ID: ${projectId}`);
    for (const modelId of modelsToTry) {
        try {
            const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:generateContent`;

            // console.log(`[DEBUG] Attempting URL: ${url}`); 

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    // 'x-goog-user-project': projectId // Sometimes needed?
                },
                body: JSON.stringify({
                    contents: [{
                        role: 'user',
                        parts: [{ text: `${instructions}\n\nDiary Entry: "${originalPrompt}"\n\nImage Prompt:` }]
                    }],
                    generationConfig: {
                        temperature: 0.3,
                        maxOutputTokens: 256,
                    },
                    safetySettings: [
                        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
                    ]
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.warn(`Gemini (${modelId}) Failed: ${response.status} - ${errorText}`);
                lastError = `${modelId}: ${response.status} - ${errorText.substring(0, 100)}...`; // Log partial error
                continue;
            }

            const data = await response.json();
            const refinedPrompt = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (refinedPrompt) {
                console.log(`Success with Gemini Model: ${modelId}`);
                return refinedPrompt.trim();
            }
        } catch (e: any) {
            console.error(`Error with Gemini Model ${modelId}:`, e);
            lastError = e.message;
        }
    }

    // 2. Fallback to PaLM 2 (text-bison) if Gemini fails
    try {
        return await refinePromptWithPaLM(instructions, originalPrompt, accessToken, projectId);
    } catch (palmError: any) {
        console.error("All Text Models Failed (Gemini & PaLM).");
        console.error("Gemini Last Error:", lastError);
        console.error("PaLM Error:", palmError.message);

        // Strict Mode during development: Fail if prompt generation fails
        console.error("Critical Failure: Unable to generate prompt.");
        throw new Error(`Text Generation Failed. Please enable Vertex AI API and grant permissions. Last Status: ${lastError}`);
    }
}

// Helper: Generate Image with Imagen 2 (Stable)
// Helper: Generate Image with Stability AI (Cost-effective)
async function generateImageWithStabilityAI(prompt: string) {
    const engineId = 'stable-diffusion-xl-1024-v1-0';
    const apiKey = process.env.STABILITY_API_KEY;
    const apiHost = 'https://api.stability.ai';

    if (!apiKey) throw new Error("Missing STABILITY_API_KEY");

    console.log(`[DEBUG] Generating with Stability AI (${engineId})...`);

    const response = await fetch(`${apiHost}/v1/generation/${engineId}/text-to-image`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            text_prompts: [
                {
                    text: `${prompt}, soft colored pencil style, crayon texture, child's drawing, warm highly detailed`,
                    weight: 1
                }
            ],
            cfg_scale: 7,
            height: 1024,
            width: 1024,
            samples: 1,
            steps: 30,
        }),
    });

    if (!response.ok) {
        throw new Error(`Stability AI Error: ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    const image = data.artifacts[0];
    return `data:image/png;base64,${image.base64}`;
}

// ARTIFACT: Imagen Code Preserved (Commented Out)
// async function generateImageWithImagen(prompt: string, accessToken: string, projectId: string) {
//     const location = 'us-central1';
//
//     // 1. Try Imagen 3 Fast (Preferred)
//     try {
//         const modelId = 'imagen-3.0-fast-generate-001';
//         console.log(`[DEBUG] Trying Image Model: ${modelId}`);
//         const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:predict`;
//
//         const response = await fetch(url, {
//             method: 'POST',
//             headers: {
//                 'Authorization': `Bearer ${accessToken}`,
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({
//                 instances: [{ prompt: `${prompt}, drawn in a soft, hand-drawn colored pencil and crayon style, detailed texture on paper, warm and nostalgic.` }],
//                 // Imagen 3 Parameters (Strict)
//                 parameters: {
//                     aspectRatio: "1:1",
//                     sampleCount: 1
//                 }
//             }),
//         });
//
//         if (!response.ok) {
//             const err = await response.text();
//             console.warn(`Imagen 3 Failed (${response.status}): ${err}`);
//             throw new Error(`Imagen 3 Error: ${response.status}`);
//         }
//
//         const data = await response.json();
//         if (data.predictions && data.predictions.length > 0 && data.predictions[0].bytesBase64Encoded) {
//             return `data:image/png;base64,${data.predictions[0].bytesBase64Encoded}`;
//         }
//         console.warn("Imagen 3 returned no predictions.");
//     } catch (e) {
//         console.log("Falling back to Imagen 2...");
//     }
//
//     // 2. Fallback to Imagen 2 (Legacy Stable)
//     try {
//         const modelId = 'imagegeneration@002';
//         console.log(`[DEBUG] Trying Image Model: ${modelId}`);
//         const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:predict`;
//
//         const response = await fetch(url, {
//             method: 'POST',
//             headers: {
//                 'Authorization': `Bearer ${accessToken}`,
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({
//                 instances: [{ prompt: `${prompt}, must be drawn with a high-quality, professional, and polished colored pencil texture.` }],
//                 // Imagen 2 Parameters (Legacy)
//                 parameters: {
//                     sampleCount: 1
//                 }
//             }),
//         });
//
//         if (!response.ok) {
//             const errorText = await response.text();
//             throw new Error(`Imagen 2 API Error: ${response.status} - ${errorText}`);
//         }
//
//         const data = await response.json();
//         const predictions = data.predictions;
//         if (!predictions || predictions.length === 0) {
//             throw new Error('No image generated');
//         }
//
//         const base64Image = predictions[0].bytesBase64Encoded;
//         return `data:image/png;base64,${base64Image}`;
//     } catch (e) {
//         console.error("All Image Models Failed:", e);
//         throw e;
//     }
// }

export async function POST(request: Request) {
    try {
        // 1. Authenticate User
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Security Check: Rate Limiting (Prevent Cost Abuse)
        const todayCommon = new Date().toISOString().split('T')[0]; // UTC Date YYYY-MM-DD

        // Fetch User Level & Today's Usage
        const { data: profile } = await supabase
            .from('profiles')
            .select('level')
            .eq('id', user.id)
            .single();

        const { count } = await supabase
            .from('diaries')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gte('created_at', `${todayCommon}T00:00:00.000Z`)
            .lte('created_at', `${todayCommon}T23:59:59.999Z`);

        const isPremium = profile && profile.level >= 100;

        // Strict Limit: Only 1 per day for non-premium
        // Note: This checks 'saved' diaries. If a user generates but doesn't save, they can generate again.
        // For stricter control, we would need a separate 'generation_logs' table.
        // But this is a good first layer of defense.
        if (!isPremium && count !== null && count > 0) {
            return NextResponse.json({ error: 'Daily limit reached (1 diary per day). Upgrade to Level 100+ for more!' }, { status: 403 });
        }

        const { prompt } = await request.json();
        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        const projectId = process.env.GOOGLE_PROJECT_ID;
        if (!projectId) {
            return NextResponse.json({ error: 'GOOGLE_PROJECT_ID is not configured' }, { status: 500 });
        }

        // Support Vercel Deployment with Environment Variable for Credentials
        const authOptions: any = {
            scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        };

        if (process.env.GOOGLE_CREDENTIALS_JSON) {
            try {
                const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
                authOptions.credentials = credentials;
                console.log(`[DEBUG] Authenticating as Service Account: ${credentials.client_email}`);
                if (credentials.project_id !== projectId) {
                    console.warn(`[WARNING] Mismatch: Env GOOGLE_PROJECT_ID (${projectId}) vs JSON project_id (${credentials.project_id})`);
                }
            } catch (e) {
                console.error("Failed to parse GOOGLE_CREDENTIALS_JSON", e);
                throw new Error("Invalid GOOGLE_CREDENTIALS_JSON format");
            }
        }

        const auth = new GoogleAuth(authOptions);
        const client = await auth.getClient();
        const accessToken = await client.getAccessToken();
        const token = accessToken.token;

        if (!token) throw new Error("Failed to retrieve access token");

        console.log('Original Prompt:', prompt);

        // 1. Refine Prompt (Try Flash Lite, Fallback to others)
        let refinedPrompt;
        try {
            refinedPrompt = await refinePromptWithGemini(prompt, token, projectId);
            console.log('Refined Prompt:', refinedPrompt);
        } catch (e) {
            console.error('Prompt Refinement Failed:', e);
            throw e; // Hard fail as requested
        }

        // 2. Generate Image (Switched to Stability AI for cost)
        let imageUrl;
        try {
            // === STABILITY AI (Active) ===
            imageUrl = await generateImageWithStabilityAI(refinedPrompt);
            console.log('Image Generated (Stability AI)');

            // === IMAGEN (Commented Out) ===
            // imageUrl = await generateImageWithImagen(refinedPrompt, token, projectId);
            // console.log('Image Generated (Imagen)');
        } catch (e) {
            console.error('Image Generation Failed:', e);
            throw e;
        }

        return NextResponse.json({ imageUrl, refinedPrompt });
    }
    catch (error: any) {
        console.error('API Handler Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to generate image' }, { status: 500 });
    }
}
