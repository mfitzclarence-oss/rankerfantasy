import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// Handles both the OAuth (Google) redirect and the email magic-link redirect.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next');
  const destination = next?.startsWith('/') && !next.startsWith('//') ? next : '/profile';

  if (code) {
    const supabase = createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return NextResponse.redirect(`${origin}/auth/sign-in?error=callback`);
  }

  return NextResponse.redirect(`${origin}${destination}`);
}
