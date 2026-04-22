export const runtime = 'edge';

export async function GET(request: Request) {
    const url = new URL(request.url);
    return new Response(JSON.stringify({
        message: 'callback route works',
        code: url.searchParams.get('code') ? 'EXISTS' : 'MISSING',
        params: Object.fromEntries(url.searchParams.entries()),
    }), {
        headers: { 'Content-Type': 'application/json' },
    });
}
