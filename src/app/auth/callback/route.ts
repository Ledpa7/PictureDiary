export const runtime = 'edge';

export async function GET(request: Request) {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    
    return new Response(`Route Hit (Edge)! Code: ${code ? 'Found' : 'Missing'}`, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
    });
}
