import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');
        
        return new NextResponse(`Route Hit (Edge)! Code: ${code ? 'Found' : 'Missing'}`, {
            status: 200,
            headers: { 'Content-Type': 'text/plain' }
        });
    } catch (error: any) {
        return new NextResponse(`Internal Error in Route: ${error.message}`, { status: 500 });
    }
}
