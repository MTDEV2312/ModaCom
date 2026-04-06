"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Grid2x2, Package, Tag, LayoutDashboard, LogOut } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { clearAuthSession, logout, me } from '@/lib/services/auth';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Productos', href: '/admin/productos', icon: Package },
  { name: 'Categorias', href: '/admin/categorias', icon: Grid2x2 },
  { name: 'Promociones', href: '/admin/promociones', icon: Tag },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let active = true;

    const validateSession = async () => {
      const response = await me();
      if (!active) return;

      if (!response.success || !response.data || response.data.role !== 'admin') {
        clearAuthSession();
        router.replace('/login');
        return;
      }

      setIsChecking(false);
    };

    void validateSession();

    return () => {
      active = false;
    };
  }, [router]);

  const handleLogout = async () => {
    await logout();
    clearAuthSession();
    router.push('/');
  };

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          <Spinner className="h-5 w-5" />
          Validando sesión admin...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col border-r border-border bg-card lg:flex">
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-border px-6">
          <Link href="/admin" className="font-serif text-xl font-semibold tracking-widest">
            MODA
          </Link>
          <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
            Admin
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4" aria-label="Navegación admin">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                pathname === item.href
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <item.icon className="h-5 w-5" aria-hidden="true" />
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-4">
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <LogOut className="h-5 w-5" aria-hidden="true" />
            Salir del panel
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:hidden">
        <Link href="/admin" className="font-serif text-xl font-semibold tracking-widest">
          MODA
          <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
            Admin
          </span>
        </Link>
        <nav className="flex gap-2">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-label={item.name}
            >
              <item.icon className="h-5 w-5" />
            </Link>
          ))}
        </nav>
      </header>

      {/* Main content */}
      <main className="lg:pl-64">
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
