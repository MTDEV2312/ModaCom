"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import type { Address, CartItem } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { clearAuthSession, ensureCustomerUser } from '@/lib/services/auth';
import { getCart, updateCartItem, removeCartItem, clearCart, createOrderFromCart } from '@/lib/services/cart';
import { getMyAddresses } from '@/lib/services/addresses';
import type { Cart } from '@/types';
import { AlertCircle, CheckCircle, InfoIcon } from 'lucide-react';

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');

  const itemCount = useMemo(
    () => cart?.items.reduce((acc: number, item: CartItem) => acc + item.quantity, 0) ?? 0,
    [cart],
  );

  useEffect(() => {
    let active = true;

    const validateSession = async () => {
      const user = await ensureCustomerUser();
      if (!active) return;

      if (!user) {
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

  useEffect(() => {
    if (isChecking) return;

    const fetchCart = async () => {
      setIsLoading(true);
      const response = await getCart();
      if (response.success && response.data) {
        setCart(response.data);
      }
      setIsLoading(false);
    };

    void fetchCart();
  }, [isChecking]);

  useEffect(() => {
    if (isChecking) return;

    const fetchAddresses = async () => {
      const response = await getMyAddresses();
      if (!response.success || !Array.isArray(response.data)) {
        setAddresses([]);
        setSelectedAddressId('');
        return;
      }

      setAddresses(response.data);
      const preferred = response.data.find((address) => address.isDefault) ?? response.data[0];
      setSelectedAddressId(preferred?.id ?? '');
    };

    void fetchAddresses();
  }, [isChecking]);

  const handleQtyChange = async (itemId: string, quantity: number) => {
    if (quantity < 1) return;

    const response = await updateCartItem(itemId, quantity);
    if (response.success) {
      setCart(response.data);
      setFeedback({ message: 'Cantidad actualizada.', type: 'success' });
    } else {
      setFeedback({ message: response.message || 'No se pudo actualizar la cantidad.', type: 'error' });
    }
  };

  const handleRemove = async (itemId: string) => {
    const response = await removeCartItem(itemId);
    if (response.success) {
      setCart(response.data);
      setFeedback({ message: 'Producto eliminado del carrito.', type: 'success' });
    } else {
      setFeedback({ message: response.message || 'No se pudo eliminar el producto.', type: 'error' });
    }
  };

  const handleClear = async () => {
    const response = await clearCart();
    if (response.success) {
      const refreshed = await getCart();
      if (refreshed.success) setCart(refreshed.data);
      setFeedback({ message: 'Carrito vaciado correctamente.', type: 'success' });
    } else {
      setFeedback({ message: response.message || 'No se pudo vaciar el carrito.', type: 'error' });
    }
  };

  const handleCheckout = async () => {
    if (!selectedAddressId) {
      setFeedback({ message: 'Seleccioná una dirección para continuar con el pedido.', type: 'info' });
      return;
    }

    setIsSubmitting(true);
    const response = await createOrderFromCart(selectedAddressId);
    setIsSubmitting(false);

    if (response.success) {
      const refreshed = await getCart();
      if (refreshed.success) setCart(refreshed.data);
      setFeedback({ message: 'Pedido creado exitosamente. Podés verlo en Mi Cuenta > Pedidos.', type: 'success' });
      return;
    }

    setFeedback({ message: response.message || 'No se pudo crear el pedido.', type: 'error' });
  };

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
        <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
          <div className="mb-8">
            <h1 className="font-serif text-3xl font-semibold">Tu carrito</h1>
            <p className="mt-2 text-muted-foreground">
              {isLoading ? 'Cargando carrito...' : `${itemCount} artículo(s) en tu carrito`}
            </p>
          </div>

          {feedback ? (
            <div
              className={`mb-4 flex items-start gap-3 rounded-md p-4 ${
                feedback.type === 'error'
                  ? 'border border-destructive/30 bg-destructive/10 text-destructive'
                  : feedback.type === 'success'
                    ? 'border border-green-200/50 bg-green-500/10 text-green-700'
                    : 'border border-blue-200/50 bg-blue-500/10 text-blue-700'
              }`}
              role={feedback.type === 'error' ? 'alert' : 'status'}
              aria-live="polite"
            >
              {feedback.type === 'error' ? (
                <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
              ) : feedback.type === 'success' ? (
                <CheckCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
              ) : (
                <InfoIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
              )}
              <p className="text-sm">{feedback.message}</p>
            </div>
          ) : null}

          {isLoading ? (
            <p className="text-muted-foreground">Cargando...</p>
          ) : !cart || cart.items.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Tu carrito está vacío</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Agregá productos para comenzar tu compra.</p>
                <Button asChild className="mt-4">
                  <Link href="/catalogo/mujer">Ir al catálogo</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
              <div className="space-y-4">
                {cart.items.map((item: CartItem) => (
                  <Card key={item.id}>
                    <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium">{item.product?.name || 'Producto'}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.colorName ? `Color: ${item.colorName} ` : ''}
                          {item.sizeName ? `| Talla: ${item.sizeName}` : ''}
                        </p>
                        <p className="text-sm text-muted-foreground">{item.unitPrice.toFixed(2)} EUR c/u</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(event: ChangeEvent<HTMLInputElement>) => {
                            const value = Number(event.target.value);
                            if (!Number.isFinite(value) || value < 1) return;
                            void handleQtyChange(item.id, value);
                          }}
                          className="w-20"
                          aria-label={`Cantidad para ${item.product?.name || 'producto'}`}
                        />
                        <Button variant="outline" onClick={() => void handleRemove(item.id)}>
                          Quitar
                        </Button>
                      </div>

                      <p className="text-right font-semibold">{item.subtotal.toFixed(2)} EUR</p>
                    </CardContent>
                  </Card>
                ))}

                <Button variant="ghost" onClick={() => void handleClear()}>
                  Vaciar carrito
                </Button>
              </div>

              <Card className="h-fit">
                <CardHeader>
                  <CardTitle>Resumen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="space-y-2 pb-2">
                    <Label htmlFor="shipping-address">Dirección de envío</Label>
                    {addresses.length > 0 ? (
                      <Select value={selectedAddressId} onValueChange={setSelectedAddressId}>
                        <SelectTrigger id="shipping-address" aria-label="Seleccionar dirección de envío">
                          <SelectValue placeholder="Seleccioná una dirección" />
                        </SelectTrigger>
                        <SelectContent>
                          {addresses.map((address) => (
                            <SelectItem key={address.id} value={address.id}>
                              {`${address.street}, ${address.city} (${address.country})${address.isDefault ? ' - Predeterminada' : ''}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No tenés direcciones guardadas. Cargá una en{' '}
                        <Link href="/mi-cuenta" className="underline underline-offset-4">
                          Mi Cuenta
                        </Link>
                        .
                      </p>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{cart.summary.subtotal.toFixed(2)} EUR</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Envío</span>
                    <span>{cart.summary.shippingTotal.toFixed(2)} EUR</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
                    <span>Total</span>
                    <span>{cart.summary.total.toFixed(2)} EUR</span>
                  </div>
                  <Button className="mt-4 w-full" onClick={() => void handleCheckout()} disabled={isSubmitting || addresses.length === 0 || !selectedAddressId}>
                    {isSubmitting ? 'Procesando...' : 'Crear pedido'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
