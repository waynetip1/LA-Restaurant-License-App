import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createSessionClient } from '@/lib/supabase/server';

// ── Sample data — replaced with live DB queries in a future session ─────────

const SAMPLE_PERMITS = [
  {
    id: 1,
    name: 'Business Tax Certificate',
    agency: 'LA Office of Finance',
    status: 'active' as const,
  },
  {
    id: 2,
    name: 'Public Health Permit',
    agency: 'LA County EHD',
    status: 'expiring' as const,
  },
  {
    id: 3,
    name: 'LAFD Fire Clearance',
    agency: 'LA Fire Department',
    status: 'active' as const,
  },
];

const SAMPLE_FEED = [
  {
    id: 1,
    tag: 'Health code',
    tagColor: 'bg-[var(--status-err-bg)] text-[var(--status-err)]',
    headline: 'LA County updates food handler card renewal requirements for 2026',
    date: 'Apr 14, 2026',
  },
  {
    id: 2,
    tag: 'Wage law',
    tagColor: 'bg-[var(--status-warn-bg)] text-[var(--status-warn)]',
    headline: 'California minimum wage for restaurant workers increases July 1',
    date: 'Apr 10, 2026',
  },
];

// ── Status badge ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: 'active' | 'expiring' | 'expired' }) {
  const styles = {
    active: 'bg-[var(--status-ok-bg)] text-[var(--status-ok)]',
    expiring: 'bg-[var(--status-warn-bg)] text-[var(--status-warn)]',
    expired: 'bg-[var(--status-err-bg)] text-[var(--status-err)]',
  };
  const labels = { active: 'Active', expiring: 'Expiring soon', expired: 'Expired' };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default async function DashboardHome() {
  const supabase = createSessionClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Fetch profile for full name — falls back to email if not set
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();

  const displayName = profile?.full_name
    ? profile.full_name.split(' ')[0]
    : user.email?.split('@')[0] ?? 'there';

  return (
    <div className="space-y-5">

      {/* Page heading */}
      <div>
        <h1
          className="text-2xl font-semibold text-dark"
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          Good morning, {displayName}
        </h1>
        <p className="text-sm text-muted mt-0.5">Here&apos;s your compliance overview</p>
      </div>

      {/* ── SECTION A — Alert bar ────────────────────────────────────────── */}
      <div className="border-l-4 border-[var(--brand)] bg-[var(--brand-light)] rounded-r-xl px-4 py-3 flex items-start gap-3">
        <span className="mt-0.5 w-2 h-2 rounded-full bg-[var(--brand)] flex-shrink-0 mt-1.5" />
        <div>
          <p className="text-sm font-medium text-[var(--status-err)]">Action needed</p>
          <p className="text-sm text-dark mt-0.5">
            Public Health Permit expires in{' '}
            <span className="font-medium">14 days</span>.{' '}
            <Link href="/permits" className="underline font-medium text-[var(--brand)]">
              Start renewal now
            </Link>
          </p>
        </div>
      </div>

      {/* ── SECTION B — Stats row ────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface2 rounded-xl p-4 text-center">
          <p className="text-2xl font-semibold text-[var(--status-ok)]">7</p>
          <p className="text-[11px] text-muted mt-1 leading-tight">Active<br />licenses</p>
        </div>
        <div className="bg-surface2 rounded-xl p-4 text-center">
          <p className="text-2xl font-semibold text-[var(--brand)]">1</p>
          <p className="text-[11px] text-muted mt-1 leading-tight">Expiring<br />soon</p>
        </div>
        <div className="bg-surface2 rounded-xl p-4 text-center">
          <p className="text-2xl font-semibold text-dark">100%</p>
          <p className="text-[11px] text-muted mt-1 leading-tight">Compliance<br />rate</p>
        </div>
      </div>

      {/* ── SECTION C — License tracker ──────────────────────────────────── */}
      <div>
        <p className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2">
          License Tracker
        </p>
        <div className="bg-surface rounded-xl border border-[var(--border)] overflow-hidden divide-y divide-[var(--border)]">
          {SAMPLE_PERMITS.map((permit) => (
            <div key={permit.id} className="flex items-center gap-3 px-4 py-3">
              {/* Icon */}
              <div className="w-9 h-9 rounded-full bg-[var(--brand-light)] flex-shrink-0 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="9" y1="13" x2="15" y2="13" />
                  <line x1="9" y1="17" x2="13" y2="17" />
                </svg>
              </div>
              {/* Name + agency */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-dark truncate">{permit.name}</p>
                <p className="text-xs text-muted truncate">{permit.agency}</p>
              </div>
              {/* Status */}
              <StatusBadge status={permit.status} />
            </div>
          ))}
          <Link
            href="/permits"
            className="flex items-center justify-center gap-1 px-4 py-2.5 text-sm text-[var(--brand)] font-medium hover:bg-[var(--brand-light)] transition-colors"
          >
            View all permits
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        </div>
      </div>

      {/* ── SECTION D — Quick actions ─────────────────────────────────────── */}
      <div>
        <p className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2">
          Quick Actions
        </p>
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              label: 'New permit packet',
              href: '/permits/wizard',
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--dark)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
              ),
            },
            {
              label: 'Book appointment',
              href: '/directory',
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--dark)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              ),
            },
            {
              label: 'Office directory',
              href: '/directory',
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--dark)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              ),
            },
            {
              label: 'Law updates',
              href: '/compliance',
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--dark)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              ),
            },
          ].map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="bg-surface2 rounded-xl p-4 flex flex-col gap-2.5 hover:bg-[var(--border)] transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center border border-[var(--border)]">
                {action.icon}
              </div>
              <span className="text-sm font-medium text-dark leading-tight">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── SECTION E — Compliance feed preview ─────────────────────────── */}
      <div>
        <p className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2">
          Compliance Feed
        </p>
        <div className="bg-surface rounded-xl border border-[var(--border)] overflow-hidden divide-y divide-[var(--border)]">
          {SAMPLE_FEED.map((item) => (
            <div key={item.id} className="px-4 py-3">
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${item.tagColor}`}>
                  {item.tag}
                </span>
              </div>
              <p className="text-sm font-medium text-dark leading-snug">{item.headline}</p>
              <p className="text-xs text-muted mt-1">{item.date}</p>
            </div>
          ))}
          <Link
            href="/compliance"
            className="flex items-center justify-center gap-1 px-4 py-2.5 text-sm text-[var(--brand)] font-medium hover:bg-[var(--brand-light)] transition-colors"
          >
            View all updates
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        </div>
      </div>

    </div>
  );
}
