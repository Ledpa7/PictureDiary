import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const { text, targetLang } = await request.json();

        // 🚀 Use Google Translate Free Endpoint (GTX)
        // No API Key required, completely free.
        // This is the public endpoint used by browser extensions.
        const sourceLang = 'auto'; // Auto-detect source language

        // Encode text properly for URL params
        const encodedText = encodeURIComponent(text);

        // Google Translate expects 'ko' or 'en' directly
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodedText}`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Translation failed: ${response.statusText}`);
        }

        const data = await response.json();

        // Parse Google Translate structure: [[["Translated Text", "Original Text", ...], ...], ...]
        // Combine all translated parts
        const translatedText = data[0].map((item: any) => item[0]).join('');

        if (!translatedText) {
            return NextResponse.json({ error: "No translation result" }, { status: 500 });
        }

        return NextResponse.json({ translatedText });
    } catch (error: any) {
        console.error("Free Translation error:", error);
        return NextResponse.json({ error: error.message || "Failed to translate" }, { status: 500 });
    }
}
