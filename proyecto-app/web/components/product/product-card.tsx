'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { addToCart } from '@/lib/services/cart';
import { Heart, ShoppingBag, Eye } from 'lucide-react';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const discountPercentage = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const productUrl = `/producto/${product.slug}`;

  const handleAddToCart = async () => {
    setIsAdding(true);
    await addToCart({
      productId: product.id,
      quantity: 1,
      sizeName: product.sizes.find((size) => size.available)?.name,
      colorName: product.colors.find((color) => color.available)?.name,
    });
    setIsAdding(false);
  };

  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-lg bg-card transition-shadow hover:shadow-lg',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        <Link href={productUrl} aria-label={`Ver detalles de ${product.name}`}>
          {/* Skeleton loader */}
          {!imageLoaded && (
            <div className="absolute inset-0 animate-pulse bg-muted" />
          )}
          
          <Image
            src={product.images[0] || '/images/placeholder-product.jpg'}
            alt={product.name}
            fill
            className={cn(
              'object-cover transition-transform duration-500 group-hover:scale-105',
              imageLoaded ? 'opacity-100' : 'opacity-0'
            )}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            onLoad={() => setImageLoaded(true)}
          />
          
          {/* Secondary image on hover */}
          {product.images[1] && (
            <Image
              src={product.images[1]}
              alt={`${product.name} - Vista alternativa`}
              fill
              className={cn(
                'object-cover transition-opacity duration-500',
                isHovered ? 'opacity-100' : 'opacity-0'
              )}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          )}
        </Link>

        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-col gap-2">
          {product.isNew && (
            <Badge className="bg-foreground text-background hover:bg-foreground/90">
              Nuevo
            </Badge>
          )}
          {discountPercentage > 0 && (
            <Badge className="bg-accent text-accent-foreground hover:bg-accent/90">
              -{discountPercentage}%
            </Badge>
          )}
        </div>

        {/* Wishlist Button */}
        <Button
          variant="secondary"
          size="icon"
          className={cn(
            'absolute right-3 top-3 h-9 w-9 rounded-full opacity-0 transition-opacity group-hover:opacity-100',
            isWishlisted && 'opacity-100'
          )}
          onClick={() => setIsWishlisted(!isWishlisted)}
          aria-label={isWishlisted ? 'Quitar de favoritos' : 'Añadir a favoritos'}
          aria-pressed={isWishlisted}
        >
          <Heart
            className={cn(
              'h-4 w-4 transition-colors',
              isWishlisted && 'fill-accent text-accent'
            )}
          />
        </Button>

        {/* Quick Actions */}
        <div
          className={cn(
            'absolute bottom-0 left-0 right-0 flex gap-2 bg-gradient-to-t from-foreground/80 to-transparent p-4 pt-8 transition-opacity duration-300',
            isHovered ? 'opacity-100' : 'opacity-0'
          )}
        >
          <Button
            className="flex-1 bg-background text-foreground hover:bg-background/90"
            size="sm"
            aria-label={`Añadir ${product.name} al carrito`}
            onClick={() => void handleAddToCart()}
            disabled={isAdding || product.stock < 1}
          >
            <ShoppingBag className="mr-2 h-4 w-4" aria-hidden="true" />
            {isAdding ? 'Añadiendo...' : 'Añadir'}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="bg-background/80 hover:bg-background"
            asChild
          >
            <Link href={productUrl} aria-label={`Ver detalles de ${product.name}`}>
              <Eye className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Product Info */}
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {product.category.name}
        </p>
        
        <Link href={productUrl} className="mt-1">
          <h3 className="font-medium text-foreground transition-colors hover:text-accent line-clamp-2">
            {product.name}
          </h3>
        </Link>

        {/* Colors */}
        <div className="mt-2 flex gap-1" aria-label={`Disponible en ${product.colors.filter(c => c.available).length} colores`}>
          {product.colors.filter(c => c.available).slice(0, 4).map((color) => (
            <span
              key={color.id}
              className="h-3 w-3 rounded-full border border-border"
              style={{ backgroundColor: color.hex }}
              title={color.name}
              aria-label={color.name}
            />
          ))}
          {product.colors.filter(c => c.available).length > 4 && (
            <span className="text-xs text-muted-foreground">
              +{product.colors.filter(c => c.available).length - 4}
            </span>
          )}
        </div>

        {/* Price */}
        <div className="mt-auto flex items-baseline gap-2 pt-3">
          <span className="text-lg font-semibold text-foreground">
            {product.price.toFixed(2)} €
          </span>
          {product.originalPrice && (
            <span className="text-sm text-muted-foreground line-through">
              {product.originalPrice.toFixed(2)} €
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
