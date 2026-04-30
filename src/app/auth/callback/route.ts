export const runtime = 'edge';

export async function GET(request: Request) {
    return new Response("Hello! If you see this, the server is alive. Code: " + new URL(request.url).searchParams.get("code"), {
        headers: { "Content-Type": "text/plain" }
    });
}
