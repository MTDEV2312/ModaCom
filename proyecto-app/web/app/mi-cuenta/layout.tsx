"use client";

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Spinner } from '@/components/ui/spinner';
import { clearAuthSession, ensureCustomerUser, logout } from '@/lib/services/auth';

export default function CustomerProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let active = true;

    const validateSession = async () => {
      const user = await ensureCustomerUser();
      if (!active) return;

      if (!user) {
        await logout();
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

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          <Spinner className="h-5 w-5" />
          Validando sesión...
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen">
        {children}
      </main>
      <Footer />
    </>
  );
}
