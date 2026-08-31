'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function SignInPage() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function signInWithEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        shouldCreateUser: false,
      },
    });
    setLoading(false);
    if (otpError) setError(otpError.message);
    else setSent(true);
  }

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4 py-16">
      <h1 className="text-center font-display text-2xl font-bold text-white">Sign in to RankUp Fantasy</h1>
      <p className="mt-1 text-center text-sm text-white/50">
        Voting and rankings don&apos;t require an account. Existing members can sign in to view their actions and saved players.
      </p>

      <button onClick={signInWithGoogle} className="btn-secondary mt-8 w-full">
        Continue with Google
      </button>

      <div className="my-6 flex items-center gap-3 text-xs text-white/30">
        <div className="h-px flex-1 bg-ink-700" />
        or
        <div className="h-px flex-1 bg-ink-700" />
      </div>

      {sent ? (
        <p className="text-center text-sm text-positive">Check your email for a sign-in link.</p>
      ) : (
        <form onSubmit={signInWithEmail} className="space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-ink-600 bg-ink-800 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-accent focus:outline-none"
          />
          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
            {loading ? 'Sending…' : 'Send Magic Link'}
          </button>
          {error && <p className="text-sm text-negative">{error}</p>}
        </form>
      )}
    </div>
  );
}
