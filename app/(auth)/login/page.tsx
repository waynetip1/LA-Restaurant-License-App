'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm">
      {/* Logo */}
      <div className="text-center mb-8">
        <span
          className="text-3xl font-semibold tracking-tight"
          style={{ fontFamily: 'Playfair Display, serif', color: '#C8391A' }}
        >
          PermitReady
        </span>
        <p className="mt-1 text-sm text-muted">LA Restaurant Compliance</p>
      </div>

      {/* Card */}
      <div className="bg-surface rounded-2xl border border-[#D0CEC8] p-6 shadow-sm">
        <h1
          className="text-xl font-semibold text-dark mb-6"
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          Sign in to your account
        </h1>

        {/* Google OAuth */}
        <button
          type="button"
          onClick={() => {
            const supabase = createClient();
            supabase.auth.signInWithOAuth({
              provider: 'google',
              options: { redirectTo: `${window.location.origin}/auth/callback` },
            });
          }}
          className="w-full flex items-center justify-center gap-3 bg-surface border border-[#D0CEC8] text-dark text-sm font-medium py-2.5 rounded-lg hover:bg-surface2 transition-colors mb-5"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-[#D0CEC8]" />
          <span className="text-xs text-muted">or</span>
          <div className="flex-1 h-px bg-[#D0CEC8]" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark mb-1" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-[#D0CEC8] bg-surface text-dark text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              placeholder="you@restaurant.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark mb-1" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-[#D0CEC8] bg-surface text-dark text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-[#FBEAE6] border-l-4 border-brand px-4 py-3 text-sm text-[#8B1A06]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand text-white font-medium text-sm py-2.5 rounded-lg hover:bg-[#b03016] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-brand font-medium hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
