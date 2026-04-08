'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Package, Grid2x2, Tag, ShoppingBag, Sparkles, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { getProducts, getCategories } from '@/lib/services/products';
import { getOffers } from '@/lib/services/offers';

export default function AdminHomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [productCount, setProductCount] = useState(0);
  const [categoryCount, setCategoryCount] = useState(0);
  const [offerCount, setOfferCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    const loadDashboard = async () => {
      setIsLoading(true);
      const [productsResponse, categoriesResponse, offersResponse] = await Promise.all([
        getProducts({}, 1, 100),
        getCategories(),
        getOffers(),
      ]);

      const products = productsResponse.success ? productsResponse.data : [];
      const categories = categoriesResponse.success ? categoriesResponse.data : [];
      const offers = offersResponse.success ? offersResponse.data : [];

      setProductCount(products.length);
      setCategoryCount(categories.length);
      setOfferCount(offers.length);
      setLowStockCount(products.filter((product) => product.stock > 0 && product.stock <= 5).length);
      setIsLoading(false);
    };

    void loadDashboard();
  }, []);

  const quickActions = useMemo(() => [
    { label: 'Ver productos', href: '/admin/productos', icon: Package },
    { label: 'Gestionar categorías', href: '/admin/categorias', icon: Grid2x2 },
    { label: 'Ver promociones', href: '/admin/promociones', icon: Tag },
  ], []);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          <Spinner className="h-5 w-5" />
          Cargando dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-linear-to-br from-foreground to-foreground/80 p-8 text-background shadow-sm lg:p-10">
        <div className="max-w-3xl space-y-4">
          <p className="text-sm uppercase tracking-[0.3em] text-background/70">Dashboard administrativo</p>
          <h1 className="font-serif text-3xl font-semibold lg:text-5xl">Resumen operativo de MODA</h1>
          <p className="max-w-2xl text-background/80">
            Revisa el estado general del catálogo, promociones y el volumen de productos con stock bajo desde un único panel.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild variant="secondary">
              <Link href="/admin/productos">
                Ir a productos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-background/30 bg-transparent text-background hover:bg-background/10 hover:text-background">
              <Link href="/admin/categorias">Abrir categorías</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { title: 'Productos', value: productCount, icon: ShoppingBag, tone: 'bg-blue-500/10 text-blue-700' },
          { title: 'Categorías', value: categoryCount, icon: Grid2x2, tone: 'bg-emerald-500/10 text-emerald-700' },
          { title: 'Promociones', value: offerCount, icon: Tag, tone: 'bg-amber-500/10 text-amber-700' },
          { title: 'Stock bajo', value: lowStockCount, icon: AlertTriangle, tone: 'bg-rose-500/10 text-rose-700' },
        ].map((item) => (
          <Card key={item.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{item.title}</CardTitle>
              <div className={`rounded-full p-2 ${item.tone}`}>
                <item.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{item.value}</div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Acciones rápidas</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            {quickActions.map((action) => (
              <Button key={action.href} asChild variant="outline" className="h-auto justify-start p-4 text-left">
                <Link href={action.href}>
                  <action.icon className="mr-3 h-5 w-5" />
                  <span>{action.label}</span>
                </Link>
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ubicación y enfoque</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Operación localizada en Quito, Ecuador, con precios en dólares estadounidenses.
            </p>
            <p>
              Usa este panel para entrar al catálogo, revisar promociones y mantener el stock ordenado.
            </p>
            <div className="rounded-lg border border-border bg-secondary p-4 text-foreground">
              <p className="flex items-center gap-2 font-medium">
                <Sparkles className="h-4 w-4" />
                Panel activo
              </p>
              <p className="mt-1 text-sm text-muted-foreground">El dashboard ya no redirige a productos: ahora muestra una vista real de operación.</p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
