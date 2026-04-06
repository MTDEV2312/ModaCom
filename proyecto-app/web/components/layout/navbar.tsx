'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { clearAuthSession, getStoredUser, resolveCurrentUser } from '@/lib/services/auth';
import { getCart } from '@/lib/services/cart';
import type { User as AppUser } from '@/types';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu, Search, ShoppingBag, User, X, Heart } from 'lucide-react';

const navigation = [
  { name: 'Hombre', href: '/catalogo/hombre' },
  { name: 'Mujer', href: '/catalogo/mujer' },
  { name: 'Niños', href: '/catalogo/ninos' },
  { name: 'Promociones', href: '/promociones' },
];

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<AppUser | null>(null);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    let active = true;

    const syncSession = async () => {
      const stored = getStoredUser();
      if (active) {
        setUser(stored);
      }

      const current = await resolveCurrentUser();
      if (!active) return;
      setUser(current);

      if (current?.role === 'customer') {
        const cartResponse = await getCart();
        if (!active) return;
        if (cartResponse.success && cartResponse.data) {
          const count = cartResponse.data.items.reduce((acc, item) => acc + item.quantity, 0);
          setCartCount(count);
        }
      } else {
        setCartCount(0);
      }
    };

    void syncSession();

    return () => {
      active = false;
    };
  }, [pathname]);

  const handleLogout = () => {
    clearAuthSession();
    setUser(null);
    setCartCount(0);
    router.push('/');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/catalogo/hombre?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8" aria-label="Navegación principal">
        {/* Mobile menu */}
        <Sheet>
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="ghost" size="icon" aria-label="Abrir menú de navegación">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <SheetHeader>
              <SheetTitle className="font-serif text-2xl tracking-wide">MODA</SheetTitle>
            </SheetHeader>
            <div className="mt-8 flex flex-col gap-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'text-lg font-medium transition-colors hover:text-accent',
                    pathname === item.href || pathname.startsWith(item.href)
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  )}
                >
                  {item.name}
                </Link>
              ))}
              <hr className="my-4" />
              <Link href="/login" className="text-lg font-medium text-muted-foreground hover:text-accent">
                Iniciar Sesión
              </Link>
              <Link href="/registro" className="text-lg font-medium text-muted-foreground hover:text-accent">
                Registrarse
              </Link>
              <Link href="/contacto" className="text-lg font-medium text-muted-foreground hover:text-accent">
                Contacto
              </Link>
              {user?.role === 'customer' && (
                <>
                  <Link href="/carrito" className="text-lg font-medium text-muted-foreground hover:text-accent">
                    Carrito
                  </Link>
                  <Link href="/mi-cuenta/pedidos" className="text-lg font-medium text-muted-foreground hover:text-accent">
                    Mis pedidos
                  </Link>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Link
          href="/"
          className="font-serif text-2xl font-semibold tracking-widest text-foreground transition-opacity hover:opacity-80 lg:absolute lg:left-1/2 lg:-translate-x-1/2"
          aria-label="MODA - Ir a inicio"
        >
          MODA
        </Link>

        {/* Desktop navigation */}
        <div className="hidden lg:flex lg:items-center lg:gap-8">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'text-sm font-medium uppercase tracking-wider transition-colors hover:text-accent',
                pathname === item.href || pathname.startsWith(item.href)
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              )}
            >
              {item.name}
            </Link>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Search */}
          {isSearchOpen ? (
            <form onSubmit={handleSearch} className="relative hidden md:flex">
              <Input
                type="search"
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 pr-8 lg:w-64"
                autoFocus
                aria-label="Buscar productos"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0"
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchQuery('');
                }}
                aria-label="Cerrar búsqueda"
              >
                <X className="h-4 w-4" />
              </Button>
            </form>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSearchOpen(true)}
              className="hidden md:flex"
              aria-label="Abrir búsqueda"
            >
              <Search className="h-5 w-5" />
            </Button>
          )}

          {/* Mobile search */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" aria-label="Buscar">
                <Search className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="top" className="h-auto">
              <SheetHeader>
                <SheetTitle>Buscar productos</SheetTitle>
              </SheetHeader>
              <form onSubmit={handleSearch} className="mt-4">
                <Input
                  type="search"
                  placeholder="¿Qué estás buscando?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                  aria-label="Buscar productos"
                />
                <Button type="submit" className="mt-4 w-full">
                  Buscar
                </Button>
              </form>
            </SheetContent>
          </Sheet>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Menú de usuario">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {!user ? (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/login">Iniciar Sesión</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/registro">Registrarse</Link>
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  {user.role === 'admin' ? (
                    <DropdownMenuItem asChild>
                      <Link href="/admin/productos">Panel Admin</Link>
                    </DropdownMenuItem>
                  ) : (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/carrito">Carrito</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/mi-cuenta/pedidos">Mis pedidos</Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>Cerrar sesión</DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Wishlist */}
          <Button variant="ghost" size="icon" aria-label="Lista de deseos" className="hidden sm:flex">
            <Heart className="h-5 w-5" />
          </Button>

          {/* Cart */}
          <Button variant="ghost" size="icon" className="relative" aria-label="Carrito de compras" asChild>
            <Link href="/carrito">
              <ShoppingBag className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-medium text-accent-foreground">
                {cartCount}
              </span>
            </Link>
          </Button>
        </div>
      </nav>
    </header>
  );
}
