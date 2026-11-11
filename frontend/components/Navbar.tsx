'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Sprite from '@/components/pixel/Sprite';
import { ITEMS } from '@/components/pixel/sprites';

const LINKS = [
  { href: '/', label: 'Status' },
  { href: '/quests', label: 'Quests' },
  { href: '/leaderboard', label: 'Ranks' },
  { href: '/teams', label: 'Guild' },
  { href: '/profile', label: 'Profile' },
];

export default function Navbar() {
  const [loggedIn, setLoggedIn] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setLoggedIn(!!localStorage.getItem('token'));
  }, []);

  return (
    <header className="max-w-5xl mx-auto px-4 pt-5">
      <nav className="window py-3 px-5 flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-3">
          <Sprite rows={ITEMS.focus.rows} palette={ITEMS.focus.palette} size={26} />
          <span className="font-display text-2xl text-gold">QuestForge</span>
        </Link>

        {loggedIn && (
          <ul className="flex flex-wrap items-center gap-x-7 gap-y-2 pl-4 font-display text-xl">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={pathname === link.href ? 'page' : undefined}
                  className={`cursor-item ${pathname === link.href ? 'text-gold' : 'text-ink hover:text-gold'}`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <button
                onClick={() => {
                  api.clearToken();
                  setLoggedIn(false);
                  window.location.href = '/';
                }}
                className="cursor-item text-ink-mist hover:text-ruby"
              >
                Log out
              </button>
            </li>
          </ul>
        )}
      </nav>
    </header>
  );
}
