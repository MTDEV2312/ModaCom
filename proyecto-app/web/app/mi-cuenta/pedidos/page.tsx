"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getMyOrders } from '@/lib/services/cart';
import type { Order } from '@/types';
import { formatCurrency } from '@/lib/format';

const statusLabel: Record<Order['status'], string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
};

const paymentLabel: Record<Order['paymentStatus'], string> = {
  pending: 'Pendiente',
  paid: 'Pagado',
  failed: 'Fallido',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      const response = await getMyOrders();
      if (response.success && response.data) {
        setOrders(response.data);
      }
      setIsLoading(false);
    };

    void fetchOrders();
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 lg:px-8">
      <h1 className="font-serif text-3xl font-semibold">Mis pedidos</h1>
      <p className="mt-2 text-muted-foreground">Seguí el estado de tus compras recientes.</p>

      {isLoading ? (
        <p className="mt-6 text-muted-foreground">Cargando pedidos...</p>
      ) : orders.length === 0 ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Aún no tenés pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Cuando completes una compra, aparecerá acá.</p>
            <Button asChild className="mt-4">
              <Link href="/catalogo/hombre">Explorar catálogo</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle className="text-lg">Pedido #{order.id}</CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="outline">{statusLabel[order.status]}</Badge>
                    <Badge variant="secondary">Pago: {paymentLabel[order.paymentStatus]}</Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {new Date(order.createdAt).toLocaleString('es-ES')}
                </p>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                    <div>
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-muted-foreground">
                        Cantidad: {item.quantity}
                        {item.sizeName ? ` | Talla: ${item.sizeName}` : ''}
                        {item.colorName ? ` | Color: ${item.colorName}` : ''}
                      </p>
                    </div>
                    <p className="font-medium">{formatCurrency(item.subtotal)}</p>
                  </div>
                ))}

                <div className="flex justify-end border-t border-border pt-3 text-base font-semibold">
                  Total: {formatCurrency(order.total)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
