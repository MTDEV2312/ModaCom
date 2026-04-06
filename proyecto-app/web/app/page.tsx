import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { ProductCard } from '@/components/product/product-card';
import { CategoryCard } from '@/components/category/category-card';
import { OfferCard } from '@/components/offer/offer-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, Truck, RefreshCw, Shield, Clock } from 'lucide-react';
import { getFeaturedProducts, getNewArrivals, getCategories } from '@/lib/services/products';
import { getOffers } from '@/lib/services/offers';

export default async function HomePage() {
  const [featuredResponse, newArrivalsResponse, categoriesResponse, offersResponse] = await Promise.all([
    getFeaturedProducts(),
    getNewArrivals(),
    getCategories(),
    getOffers(),
  ]);

  const featuredProducts = featuredResponse.data;
  const newArrivals = newArrivalsResponse.data;
  const categories = categoriesResponse.data;
  const offers = offersResponse.data;

  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-secondary">
          <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8 lg:py-24">
            <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
              <div className="text-center lg:text-left">
                <span className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
                  Nueva Colección 2026
                </span>
                <h1 className="mt-4 font-serif text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl text-balance">
                  Estilo atemporal para toda la familia
                </h1>
                <p className="mt-6 text-lg text-muted-foreground max-w-lg mx-auto lg:mx-0 text-pretty">
                  Descubre nuestra selección de moda premium. Calidad, diseño y confort en cada prenda para hombre, mujer y niños.
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
                  <Button asChild size="lg" className="min-w-40">
                    <Link href="/catalogo/mujer">
                      Comprar Ahora
                      <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="min-w-40">
                    <Link href="/promociones">
                      Ver Ofertas
                    </Link>
                  </Button>
                </div>
              </div>
              
              <div className="relative">
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-muted">
                  <Image
                    src="/images/hero-fashion.jpg"
                    alt="Colección de moda primavera 2026"
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
                {/* Floating badge */}
                <div className="absolute -bottom-4 -left-4 rounded-xl bg-card p-4 shadow-lg sm:-left-8">
                  <p className="text-sm font-medium text-muted-foreground">Desde</p>
                  <p className="text-2xl font-semibold text-foreground">24,99 €</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Bar */}
        <section className="border-y border-border bg-card">
          <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {[
                { icon: Truck, title: 'Envío Gratis', subtitle: 'En pedidos +75€' },
                { icon: RefreshCw, title: 'Devolución Fácil', subtitle: '30 días para devolver' },
                { icon: Shield, title: 'Pago Seguro', subtitle: 'Transacción 100% segura' },
                { icon: Clock, title: 'Soporte 24/7', subtitle: 'Atención personalizada' },
              ].map((feature) => (
                <div key={feature.title} className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
                    <feature.icon className="h-5 w-5 text-foreground" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{feature.title}</p>
                    <p className="text-xs text-muted-foreground">{feature.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="text-center">
              <h2 className="font-serif text-3xl font-semibold text-foreground lg:text-4xl">
                Compra por Categoría
              </h2>
              <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
                Explora nuestras colecciones diseñadas para cada miembro de la familia
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="bg-secondary py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <h2 className="font-serif text-3xl font-semibold text-foreground lg:text-4xl">
                  Destacados
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Nuestras piezas más populares esta temporada
                </p>
              </div>
              <Button asChild variant="outline">
                <Link href="/catalogo/mujer">
                  Ver todo
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>

            <Suspense fallback={<ProductGridSkeleton />}>
              <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
                {featuredProducts.slice(0, 4).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </Suspense>
          </div>
        </section>

        {/* Promo Banner */}
        {offers.length > 0 && (
          <section className="py-16 lg:py-24">
            <div className="mx-auto max-w-7xl px-4 lg:px-8">
              <OfferCard offer={offers[0]} variant="featured" />
            </div>
          </section>
        )}

        {/* New Arrivals */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <span className="text-sm font-medium uppercase tracking-widest text-accent">
                  Lo más nuevo
                </span>
                <h2 className="mt-2 font-serif text-3xl font-semibold text-foreground lg:text-4xl">
                  Recién Llegados
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Las últimas incorporaciones a nuestra colección
                </p>
              </div>
              <Button asChild variant="outline">
                <Link href="/catalogo/hombre">
                  Explorar
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>

            <Suspense fallback={<ProductGridSkeleton />}>
              <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
                {newArrivals.slice(0, 4).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </Suspense>
          </div>
        </section>

        {/* More Offers */}
        {offers.length > 1 && (
          <section className="bg-secondary py-16 lg:py-24">
            <div className="mx-auto max-w-7xl px-4 lg:px-8">
              <h2 className="font-serif text-3xl font-semibold text-foreground lg:text-4xl text-center">
                Más Promociones
              </h2>
              <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {offers.slice(1, 4).map((offer) => (
                  <OfferCard key={offer.id} offer={offer} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Newsletter Section */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="rounded-2xl bg-foreground px-6 py-12 text-center text-background sm:px-12 lg:py-16">
              <h2 className="font-serif text-3xl font-semibold lg:text-4xl">
                Únete a nuestra comunidad
              </h2>
              <p className="mt-4 text-background/80 max-w-xl mx-auto">
                Suscríbete para recibir las últimas novedades, ofertas exclusivas y un 10% de descuento en tu primera compra.
              </p>
              <form className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
                <label htmlFor="newsletter-hero" className="sr-only">
                  Correo electrónico
                </label>
                <input
                  id="newsletter-hero"
                  type="email"
                  placeholder="tu@email.com"
                  className="flex-1 rounded-md border-0 bg-background/10 px-4 py-3 text-background placeholder:text-background/50 focus:outline-none focus:ring-2 focus:ring-background/50"
                  required
                />
                <Button type="submit" className="bg-background text-foreground hover:bg-background/90">
                  Suscribirme
                </Button>
              </form>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function ProductGridSkeleton() {
  return (
    <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex flex-col overflow-hidden rounded-lg bg-card">
          <Skeleton className="aspect-[3/4] w-full" />
          <div className="p-4">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="mt-2 h-5 w-full" />
            <Skeleton className="mt-4 h-6 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}
