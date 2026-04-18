'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push('/');
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
          Create your account
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark mb-1" htmlFor="fullName">
              Full name
            </label>
            <input
              id="fullName"
              type="text"
              autoComplete="name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-[#D0CEC8] bg-surface text-dark text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              placeholder="Jane Smith"
            />
          </div>

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
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-[#D0CEC8] bg-surface text-dark text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              placeholder="8+ characters"
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
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted">
          Already have an account?{' '}
          <Link href="/login" className="text-brand font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
