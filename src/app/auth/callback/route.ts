import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    
    return new Response(`Route Hit! Code: ${code ? 'Found' : 'Missing'}`, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
    });
}
