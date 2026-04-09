'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Copy, Check } from 'lucide-react';
import type { Offer } from '@/types';

interface OfferCardProps {
  offer: Offer;
  variant?: 'default' | 'featured';
  className?: string;
}

export function OfferCard({ offer, variant = 'default', className }: OfferCardProps) {
  const [copied, setCopied] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const copyCode = async () => {
    if (offer.code) {
      await navigator.clipboard.writeText(offer.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const validUntil = new Date(offer.validUntil);
  const daysRemaining = Math.ceil((validUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  if (variant === 'featured') {
    return (
      <article
        className={cn(
          'group relative overflow-hidden rounded-xl bg-foreground text-background',
          className
        )}
      >
        <div className="absolute inset-0">
          {!imageLoaded && (
            <div className="absolute inset-0 animate-pulse bg-muted" />
          )}
          <Image
            src={offer.image || '/images/placeholder-offer.jpg'}
            alt=""
            fill
            className={cn(
              'object-cover transition-transform duration-700 group-hover:scale-105',
              imageLoaded ? 'opacity-40' : 'opacity-0'
            )}
            onLoad={() => setImageLoaded(true)}
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/70 to-transparent" />
        </div>

        <div className="relative flex min-h-[400px] flex-col justify-end p-6 lg:p-8">
          <Badge className="mb-4 w-fit bg-accent text-accent-foreground">
            {offer.discountPercentage > 0 ? `${offer.discountPercentage}% OFF` : 'Oferta Especial'}
          </Badge>
          
          <h3 className="font-serif text-3xl font-semibold lg:text-4xl text-balance">
            {offer.title}
          </h3>
          
          <p className="mt-3 text-background/80 max-w-md text-pretty">
            {offer.description}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            {offer.code && (
              <Button
                variant="secondary"
                onClick={copyCode}
                className="bg-background text-foreground hover:bg-background/90"
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" aria-hidden="true" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" aria-hidden="true" />
                    {offer.code}
                  </>
                )}
              </Button>
            )}
            <Button asChild variant="outline" className="border-background/30 text-background hover:bg-background/10">
              <Link href="/promociones">
                Ver promoción
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>

          {daysRemaining > 0 && daysRemaining <= 7 && (
            <p className="mt-4 text-sm text-background/60">
              Termina en {daysRemaining} {daysRemaining === 1 ? 'día' : 'días'}
            </p>
          )}
        </div>
      </article>
    );
  }

  return (
    <article
      className={cn(
        'group relative overflow-hidden rounded-lg bg-card transition-shadow hover:shadow-md',
        className
      )}
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
        {!imageLoaded && (
          <div className="absolute inset-0 animate-pulse bg-muted" />
        )}
        <Image
          src={offer.image || '/images/placeholder-offer.jpg'}
          alt=""
          fill
          className={cn(
            'object-cover transition-transform duration-500 group-hover:scale-105',
            imageLoaded ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={() => setImageLoaded(true)}
          aria-hidden="true"
        />
        
        {offer.discountPercentage > 0 && (
          <Badge className="absolute left-3 top-3 bg-accent text-accent-foreground">
            {offer.discountPercentage}% OFF
          </Badge>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-foreground">
          {offer.title}
        </h3>
        
        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
          {offer.description}
        </p>

        <div className="mt-4 flex items-center justify-between">
          {offer.code ? (
            <Button
              variant="outline"
              size="sm"
              onClick={copyCode}
            >
              {copied ? (
                <>
                  <Check className="mr-1 h-3 w-3" aria-hidden="true" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="mr-1 h-3 w-3" aria-hidden="true" />
                  {offer.code}
                </>
              )}
            </Button>
          ) : (
            <span className="text-sm text-muted-foreground">Sin código necesario</span>
          )}
          
          <Link
            href="/promociones"
            className="text-sm font-medium text-accent hover:underline"
          >
            Ver más
          </Link>
        </div>
      </div>
    </article>
  );
}
