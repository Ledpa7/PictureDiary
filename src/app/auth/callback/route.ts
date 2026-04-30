export const runtime = 'edge';

export async function GET(request: Request) {
    return new Response("Edge Worker Status: OK. If you see this, routing is working.", {
        status: 200,
        headers: { "Content-Type": "text/plain" }
    });
}
