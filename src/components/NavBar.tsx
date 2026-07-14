'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCurrentUser } from '@/lib/auth/AuthProvider';
import { signOut } from '@/lib/auth/authActions';

const LINKS = [
  { href: '/', label: 'Dashboard' },
  { href: '/colleges', label: 'Colleges' },
  { href: '/board', label: 'Stream Board' },
  { href: '/interactions/new', label: 'Log Interaction' },
  { href: '/follow-ups', label: 'Follow-ups' },
];

export function NavBar() {
  const pathname = usePathname();
  const user = useCurrentUser();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.replace('/login');
    router.refresh();
  }

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/" className="text-sm font-semibold tracking-tight text-slate-900">
          BTL CRM
        </Link>
        <nav className="flex flex-wrap items-center gap-x-1 text-sm">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                isActive(l.href)
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3 text-sm">
          {user && (
            <span className="text-slate-500">
              {user.name} <span className="text-slate-300">·</span>{' '}
              <span className="text-slate-400">{user.role}</span>
            </span>
          )}
          <button
            onClick={handleSignOut}
            className="rounded-md border border-slate-200 px-2.5 py-1 font-medium text-slate-600 hover:bg-slate-50"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
