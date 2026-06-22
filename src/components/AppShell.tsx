'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';

/**
 * Renders the admin shell (sidebar + offset main) on app routes, but a bare
 * full-bleed layout on /auth/* so the login page isn't trapped behind the
 * sidebar chrome.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const bare = pathname?.startsWith('/auth');

  if (bare) return <>{children}</>;

  return (
    <>
      <Sidebar />
      <main className="min-h-screen md:ml-64">{children}</main>
    </>
  );
}
