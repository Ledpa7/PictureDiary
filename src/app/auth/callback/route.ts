import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const runtime = 'edge';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/gallery';

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            return NextResponse.redirect(`${origin}${next}`);
        }
    }

    // 인증 실패 시 메인 페이지로 이동
    return NextResponse.redirect(`${origin}/`);
}
