'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';
import type { Category } from '@/types';

interface CategoryCardProps {
  category: Category;
  className?: string;
}

export function CategoryCard({ category, className }: CategoryCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <Link
      href={`/catalogo/${category.slug}`}
      className={cn(
        'group relative block overflow-hidden rounded-xl bg-muted',
        className
      )}
      aria-label={`Ver colección de ${category.name}`}
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        {!imageLoaded && (
          <div className="absolute inset-0 animate-pulse bg-muted" />
        )}
        <Image
          src={category.image || '/images/placeholder-category.jpg'}
          alt={`Colección ${category.name}`}
          fill
          className={cn(
            'object-cover transition-transform duration-700 group-hover:scale-105',
            imageLoaded ? 'opacity-100' : 'opacity-0'
          )}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          onLoad={() => setImageLoaded(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6">
        <h3 className="font-serif text-2xl font-semibold text-background lg:text-3xl">
          {category.name}
        </h3>
        {category.description && (
          <p className="mt-1 text-sm text-background/80">
            {category.description}
          </p>
        )}
        <div className="mt-3 flex items-center gap-2 text-sm font-medium text-background transition-transform group-hover:translate-x-1">
          Explorar colección
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </div>
      </div>
    </Link>
  );
}
