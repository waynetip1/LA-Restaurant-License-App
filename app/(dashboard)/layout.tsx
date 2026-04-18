'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// ── Bottom nav tabs ────────────────────────────────────────────────────────
const NAV_TABS = [
  {
    label: 'Home',
    href: '/dashboard',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#C8391A' : '#6B6B6B'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.75L12 3l9 6.75V21a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.75z" />
        <path d="M9 22V12h6v10" />
      </svg>
    ),
  },
  {
    label: 'Permits',
    href: '/permits',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#C8391A' : '#6B6B6B'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="9" y1="13" x2="15" y2="13" />
        <line x1="9" y1="17" x2="13" y2="17" />
      </svg>
    ),
  },
  {
    label: 'Staff',
    href: '/staff',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#C8391A' : '#6B6B6B'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    label: 'Vendors',
    href: '/vendors',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#C8391A' : '#6B6B6B'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" />
        <path d="M3 9l2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9" />
        <line x1="12" y1="3" x2="12" y2="9" />
      </svg>
    ),
  },
  {
    label: 'Finance',
    href: '/account',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#C8391A' : '#6B6B6B'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-surface2 flex flex-col">
      {/* Top header */}
      <header className="bg-surface border-b border-[#D0CEC8] px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <span
          className="text-xl font-semibold tracking-tight"
          style={{ fontFamily: 'Playfair Display, serif', color: '#C8391A' }}
        >
          PermitReady
        </span>
        <button
          onClick={handleSignOut}
          className="w-8 h-8 rounded-full bg-surface2 border border-[#D0CEC8] flex items-center justify-center hover:bg-[#e8e6e0] transition-colors"
          aria-label="Account"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B6B6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </button>
      </header>

      {/* Page content — padded above bottom nav */}
      <main className="flex-1 pb-20 px-4 pt-4 max-w-2xl w-full mx-auto">
        {children}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-[#D0CEC8] z-30">
        <div className="flex items-stretch max-w-2xl mx-auto">
          {NAV_TABS.map((tab) => {
            const isActive = tab.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 min-h-[56px]"
              >
                {tab.icon(isActive)}
                <span
                  className="text-[10px] font-medium"
                  style={{ color: isActive ? '#C8391A' : '#6B6B6B' }}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
