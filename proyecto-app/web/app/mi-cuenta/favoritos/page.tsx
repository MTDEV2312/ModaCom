"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/product/product-card';
import { getProducts } from '@/lib/services/products';
import { getFavoriteProducts } from '@/lib/services/favorites';
import type { Product } from '@/types';

export default function FavoritesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [favorites, setFavorites] = useState<Product[]>([]);

  useEffect(() => {
    const loadFavorites = async () => {
      setIsLoading(true);
      const response = await getProducts({}, 1, 200);
      if (response.success) {
        setFavorites(getFavoriteProducts(response.data));
      } else {
        setFavorites([]);
      }
      setIsLoading(false);
    };

    void loadFavorites();
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 lg:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-semibold">Mis favoritos</h1>
          <p className="mt-2 text-muted-foreground">Tus productos guardados para comprar más tarde.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/catalogo/todos">Seguir comprando</Link>
        </Button>
      </div>

      {isLoading ? (
        <Card>
          <CardHeader>
            <CardTitle>Cargando favoritos...</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Estamos preparando tu lista.</p>
          </CardContent>
        </Card>
      ) : favorites.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No tenés favoritos guardados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Marcá productos con el icono de corazón para verlos acá.</p>
            <Button asChild className="mt-4">
              <Link href="/catalogo/todos">Explorar catálogo</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {favorites.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
