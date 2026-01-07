'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  Palette,
  Sparkles,
  Layers,
  Tag,
  LogOut,
  Store,
  Settings,
  Bot,
} from 'lucide-react';

const menuItems = [
  { href: '/', label: 'Generador', icon: Palette },
  { href: '/ideas', label: 'Ideas', icon: Bot },
  { href: '/automatizaciones', label: 'Batch', icon: Layers },
  { href: '/settings', label: 'Configuración', icon: Settings },
];

const externalLinks = [
  {
    href: 'https://dashboard.gelato.com',
    label: 'Gelato Dashboard',
    icon: Store,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-purple-900 to-purple-800 text-white flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-purple-700">
        <h1 className="text-2xl font-black flex items-center gap-2">
          <Sparkles className="w-7 h-7 text-yellow-400" />
          Sifrok Admin
        </h1>
        <p className="text-purple-300 text-sm mt-1">Panel de Administración</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="text-purple-400 text-xs uppercase font-bold mb-2 px-3">
          Menu Principal
        </p>
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                isActive
                  ? 'bg-purple-700 text-white'
                  : 'text-purple-200 hover:bg-purple-700/50 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}

        <div className="my-4 border-t border-purple-700" />

        <p className="text-purple-400 text-xs uppercase font-bold mb-2 px-3">
          Enlaces Externos
        </p>
        {externalLinks.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.href}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-purple-200 hover:bg-purple-700/50 hover:text-white transition-all"
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </a>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-purple-700">
        {session?.user ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center font-bold">
                {session.user.name?.[0] || session.user.email?.[0] || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {session.user.name || 'Admin'}
                </p>
                <p className="text-purple-300 text-xs truncate">
                  {session.user.email}
                </p>
              </div>
            </div>
            <button
              onClick={() => signOut()}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-700 hover:bg-purple-600 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>
          </div>
        ) : (
          <Link
            href="/auth/login"
            className="block w-full text-center px-3 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors"
          >
            Iniciar Sesión
          </Link>
        )}
      </div>
    </aside>
  );
}
