'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  Sparkles,
  Layers,
  LogOut,
  Store,
  Settings,
  Shirt,
  FolderOpen,
  Lightbulb,
  Package,
  TrendingUp,
  Tags,
  Menu,
  X,
} from 'lucide-react';

const menuItems = [
  { href: '/', label: 'Generador', icon: Sparkles },
  { href: '/ideas', label: 'Ideas', icon: Lightbulb },
  { href: '/studio', label: 'Design Studio', icon: Shirt },
  { href: '/collections', label: 'Colecciones', icon: FolderOpen },
  { href: '/automatizaciones', label: 'Batch', icon: Layers },
  { href: '/settings', label: 'Configuracion', icon: Settings },
];

const adminItems = [
  { href: '/admin/orders', label: 'Pedidos', icon: Package },
  { href: '/admin/profitability', label: 'Rentabilidad', icon: TrendingUp },
  { href: '/admin/products', label: 'Productos', icon: Tags },
];

const externalLinks = [
  { href: 'https://www.printful.com/dashboard', label: 'Printful Dashboard', icon: Store },
];

function NavLink({
  href,
  label,
  Icon,
  active,
  external,
}: {
  href: string;
  label: string;
  Icon: typeof Sparkles;
  active?: boolean;
  external?: boolean;
}) {
  const cls = `relative flex items-center gap-3 rounded-btn px-3 py-2.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
    active
      ? 'bg-panel-2 text-accent font-medium'
      : 'text-on-panel-muted hover:bg-panel-2 hover:text-on-panel'
  }`;
  const inner = (
    <>
      {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-accent" aria-hidden="true" />}
      <Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
      {label}
    </>
  );
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} aria-current={active ? 'page' : undefined} className={cls}>
      {inner}
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  // Close the mobile drawer on navigation.
  useEffect(() => setOpen(false), [pathname]);

  // Close on Escape when the drawer is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-panel-border bg-panel px-4 text-on-panel md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          aria-expanded={open}
          className="rounded-btn p-2 hover:bg-panel-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
        <span className="flex items-center gap-2 font-black tracking-tight">
          <Sparkles className="h-5 w-5 text-accent" aria-hidden="true" />
          Sifrok Admin
        </span>
      </div>

      {/* Backdrop (mobile, when open) */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          aria-hidden="true"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer / sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-panel-border bg-panel text-on-panel transition-transform duration-200 ease-out md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-start justify-between gap-2 border-b border-panel-border p-6">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight">
              <Sparkles className="h-7 w-7 text-accent" aria-hidden="true" />
              Sifrok Admin
            </h1>
            <p className="mt-1 text-sm text-on-panel-muted">Panel de Administración</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Cerrar menú"
            className="rounded-btn p-2 hover:bg-panel-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:hidden"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          <p className="mb-2 px-3 text-xs font-bold uppercase tracking-wider text-on-panel-muted">Menu Principal</p>
          {menuItems.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} Icon={item.icon} active={pathname === item.href} />
          ))}

          <div className="my-4 border-t border-panel-border" />

          <p className="mb-2 px-3 text-xs font-bold uppercase tracking-wider text-on-panel-muted">Administracion</p>
          {adminItems.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} Icon={item.icon} active={pathname === item.href} />
          ))}

          <div className="my-4 border-t border-panel-border" />

          <p className="mb-2 px-3 text-xs font-bold uppercase tracking-wider text-on-panel-muted">Enlaces Externos</p>
          {externalLinks.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} Icon={item.icon} external />
          ))}
        </nav>

        <div className="border-t border-panel-border p-4">
          {session?.user ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent font-bold text-accent-ink">
                  {session.user.name?.[0] || session.user.email?.[0] || 'A'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{session.user.name || 'Admin'}</p>
                  <p className="truncate text-xs text-on-panel-muted">{session.user.email}</p>
                </div>
              </div>
              <button
                onClick={() => signOut()}
                className="flex w-full items-center justify-center gap-2 rounded-btn bg-panel-2 px-3 py-2 text-sm transition-colors hover:bg-panel-border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Cerrar Sesión
              </button>
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="block w-full rounded-btn bg-accent px-3 py-2 text-center font-semibold text-accent-ink transition-colors hover:bg-accent-hover"
            >
              Iniciar Sesión
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
