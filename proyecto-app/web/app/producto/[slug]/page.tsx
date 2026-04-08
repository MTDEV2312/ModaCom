'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Heart, ShoppingBag, Truck, RefreshCw, Shield, Minus, Plus, Check, AlertCircle } from 'lucide-react';
import { getProductBySlug } from '@/lib/services/products';
import { addToCart } from '@/lib/services/cart';
import type { Product } from '@/types';

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProduct() {
      setIsLoading(true);
      const response = await getProductBySlug(slug);
      if (response.success && response.data) {
        setProduct(response.data);
        if (response.data.sizes.length > 0) {
          setSelectedSize(response.data.sizes.find(s => s.available)?.name || '');
        }
        if (response.data.colors.length > 0) {
          setSelectedColor(response.data.colors.find(c => c.available)?.name || '');
        }
      }
      setIsLoading(false);
    }
    fetchProduct();
  }, [slug]);

  const handleAddToCart = async () => {
    if (!product || !selectedSize || !selectedColor) {
      setCartError('Por favor selecciona un tamaño y color.');
      return;
    }

    setCartError(null);
    setIsAdding(true);
    const response = await addToCart({
      productId: product.id,
      quantity,
      sizeName: selectedSize,
      colorName: selectedColor,
    });
    setIsAdding(false);

    if (!response.success) {
      setCartError(response.message || 'No se pudo agregar el producto al carrito.');
      return;
    }

    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const discountPercentage = product?.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  if (isLoading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen py-8 lg:py-12">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <ProductDetailSkeleton />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-semibold">Producto no encontrado</h1>
            <p className="mt-2 text-muted-foreground">
              El producto que buscas no existe o ha sido eliminado.
            </p>
            <Button asChild className="mt-6">
              <Link href="/">Volver al inicio</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen py-8 lg:py-12">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex items-center gap-2 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-foreground">
                  Inicio
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href={`/catalogo/${product.category.slug}`} className="hover:text-foreground">
                  {product.category.name}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <span className="text-foreground" aria-current="page">
                  {product.name}
                </span>
              </li>
            </ol>
          </nav>

          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-muted">
                <Image
                  src={product.images[activeImage] || '/images/placeholder-product.jpg'}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                
                {/* Badges */}
                <div className="absolute left-4 top-4 flex flex-col gap-2">
                  {product.isNew && (
                    <Badge className="bg-foreground text-background">Nuevo</Badge>
                  )}
                  {discountPercentage > 0 && (
                    <Badge className="bg-accent text-accent-foreground">
                      -{discountPercentage}%
                    </Badge>
                  )}
                </div>
              </div>

              {/* Thumbnails */}
              {product.images.length > 1 && (
                <div className="flex gap-3">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImage(index)}
                      className={cn(
                        'relative aspect-square w-20 overflow-hidden rounded-lg bg-muted transition-all',
                        activeImage === index
                          ? 'ring-2 ring-foreground ring-offset-2'
                          : 'opacity-70 hover:opacity-100'
                      )}
                      aria-label={`Ver imagen ${index + 1}`}
                      aria-current={activeImage === index ? 'true' : 'false'}
                    >
                      <Image
                        src={image}
                        alt={`${product.name} - Vista ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="flex flex-col">
              <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                {product.category.name}
              </p>
              
              <h1 className="mt-2 font-serif text-3xl font-semibold text-foreground lg:text-4xl">
                {product.name}
              </h1>

              {/* Price */}
              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-2xl font-semibold text-foreground">
                  {product.price.toFixed(2)} €
                </span>
                {product.originalPrice && (
                  <span className="text-lg text-muted-foreground line-through">
                    {product.originalPrice.toFixed(2)} €
                  </span>
                )}
              </div>

              <p className="mt-6 text-muted-foreground leading-relaxed">
                {product.description}
              </p>

              {/* Color Selection */}
              {product.colors.length > 0 && (
                <div className="mt-8">
                  <p className="text-sm font-medium">
                    Color: <span className="font-normal text-muted-foreground">{selectedColor}</span>
                  </p>
                  <div className="mt-3 flex gap-2" role="radiogroup" aria-label="Seleccionar color">
                    {product.colors.map((color) => (
                      <button
                        key={color.id}
                        onClick={() => color.available && setSelectedColor(color.name)}
                        disabled={!color.available}
                        className={cn(
                          'h-10 w-10 rounded-full border-2 transition-all',
                          selectedColor === color.name
                            ? 'border-foreground scale-110'
                            : 'border-border hover:border-muted-foreground',
                          !color.available && 'opacity-30 cursor-not-allowed'
                        )}
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                        aria-label={`${color.name}${!color.available ? ' - No disponible' : ''}`}
                        role="radio"
                        aria-checked={selectedColor === color.name}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Size Selection */}
              {product.sizes.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Talla</p>
                    <button className="text-sm text-accent hover:underline">
                      Guía de tallas
                    </button>
                  </div>
                  <Select value={selectedSize} onValueChange={setSelectedSize}>
                    <SelectTrigger className="mt-3">
                      <SelectValue placeholder="Selecciona una talla" />
                    </SelectTrigger>
                    <SelectContent>
                      {product.sizes.map((size) => (
                        <SelectItem
                          key={size.id}
                          value={size.name}
                          disabled={!size.available}
                        >
                          {size.name} {!size.available && '- Agotado'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Quantity */}
              <div className="mt-6">
                <p className="text-sm font-medium">Cantidad</p>
                <div className="mt-3 flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    aria-label="Reducir cantidad"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-medium" aria-live="polite">
                    {quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={quantity >= product.stock}
                    aria-label="Aumentar cantidad"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    ({product.stock} disponibles)
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-8 flex gap-3">
                <Button
                  size="lg"
                  className="flex-1"
                  onClick={() => void handleAddToCart()}
                  disabled={!selectedSize || !selectedColor || addedToCart || isAdding}
                >
                  {isAdding ? (
                    <>
                      <ShoppingBag className="mr-2 h-5 w-5" />
                      Añadiendo...
                    </>
                  ) : addedToCart ? (
                    <>
                      <Check className="mr-2 h-5 w-5" />
                      Añadido al carrito
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="mr-2 h-5 w-5" />
                      Añadir al carrito
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  aria-label={isWishlisted ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                  aria-pressed={isWishlisted}
                >
                  <Heart
                    className={cn(
                      'h-5 w-5',
                      isWishlisted && 'fill-accent text-accent'
                    )}
                  />
                </Button>
              </div>

              {cartError && (
                <div
                  className="mt-4 flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
                  role="alert"
                  aria-live="polite"
                >
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="font-medium">No se pudo agregar al carrito</p>
                    <p className="mt-1 text-sm">{cartError}</p>
                  </div>
                </div>
              )}

              {/* Features */}
              <div className="mt-10 grid gap-4 border-t border-border pt-8">
                {[
                  { icon: Truck, text: 'Envío gratis en pedidos +75€' },
                  { icon: RefreshCw, text: 'Devolución gratuita en 30 días' },
                  { icon: Shield, text: 'Pago 100% seguro' },
                ].map((feature) => (
                  <div key={feature.text} className="flex items-center gap-3 text-sm">
                    <feature.icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                    <span>{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
      <div className="space-y-4">
        <Skeleton className="aspect-[3/4] w-full rounded-xl" />
        <div className="flex gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-20 rounded-lg" />
          ))}
        </div>
      </div>
      <div className="space-y-6">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}
