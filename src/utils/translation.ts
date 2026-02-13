/**
 * Simple & Robust Translation Service
 * Directly calls the server-side translation API to ensure reliability.
 */

export async function translateText(text: string, targetLang: 'ko' | 'en'): Promise<string> {
    try {
        console.log(`[Translation] Requesting translation to ${targetLang}...`);

        const response = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, targetLang })
        });

        const data = await response.json();

        if (!response.ok) {
            const errorMsg = data.error || `HTTP Error ${response.status}`;
            console.error(`[Translation] API Error:`, errorMsg);
            throw new Error(errorMsg);
        }

        if (data.error) {
            throw new Error(data.error);
        }

        if (!data.translatedText) {
            throw new Error("Empty translation result received.");
        }

        console.log(`[Translation] Success! Result length: ${data.translatedText.length}`);
        return data.translatedText;
    } catch (e: any) {
        console.error("[Translation] Error in translateText:", e);
        throw e; // Rethrow to handle in the UI
    }
}
