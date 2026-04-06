"use client";

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  createAddress,
  getMyAddresses,
  removeAddress,
  setDefaultAddress,
  type AddressInput,
} from '@/lib/services/addresses';
import type { Address } from '@/types';

const emptyForm: AddressInput = {
  street: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'España',
  isDefault: false,
};

export default function MyAccountPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [form, setForm] = useState<AddressInput>(emptyForm);

  const loadAddresses = async () => {
    setIsLoading(true);
    const response = await getMyAddresses();
    if (response.success && Array.isArray(response.data)) {
      setAddresses(response.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    void loadAddresses();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);

    const response = await createAddress(form);
    setIsSaving(false);

    if (!response.success) {
      setFeedback(response.message || 'No se pudo guardar la dirección.');
      return;
    }

    setFeedback('Dirección creada correctamente.');
    setForm(emptyForm);
    await loadAddresses();
  };

  const handleDefault = async (id: string) => {
    const response = await setDefaultAddress(id);
    if (!response.success) {
      setFeedback(response.message || 'No se pudo definir la dirección principal.');
      return;
    }

    setFeedback('Dirección principal actualizada.');
    await loadAddresses();
  };

  const handleDelete = async (id: string) => {
    const response = await removeAddress(id);
    if (!response.success) {
      setFeedback(response.message || 'No se pudo eliminar la dirección.');
      return;
    }

    setFeedback('Dirección eliminada.');
    await loadAddresses();
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 lg:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-semibold">Mi cuenta</h1>
          <p className="mt-2 text-muted-foreground">Gestioná tus direcciones y revisá tus pedidos.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/mi-cuenta/pedidos">Ver mis pedidos</Link>
        </Button>
      </div>

      {feedback ? (
        <p className="mb-4 rounded-md border border-border bg-card px-3 py-2 text-sm text-muted-foreground">{feedback}</p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Direcciones guardadas</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Cargando direcciones...</p>
            ) : addresses.length === 0 ? (
              <p className="text-sm text-muted-foreground">Todavía no registraste direcciones.</p>
            ) : (
              <div className="space-y-3">
                {addresses.map((address) => (
                  <div key={address.id} className="rounded-md border border-border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">{address.street}</p>
                      {address.isDefault ? <Badge variant="secondary">Predeterminada</Badge> : null}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {address.city}, {address.state}, {address.postalCode}, {address.country}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={address.isDefault}
                        onClick={() => void handleDefault(address.id)}
                      >
                        Marcar principal
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => void handleDelete(address.id)}>
                        Eliminar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nueva dirección</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={handleSubmit}>
              <Input
                value={form.street}
                onChange={(event) => setForm((prev) => ({ ...prev, street: event.target.value }))}
                placeholder="Calle y número"
                required
              />
              <Input
                value={form.city}
                onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
                placeholder="Ciudad"
                required
              />
              <Input
                value={form.state}
                onChange={(event) => setForm((prev) => ({ ...prev, state: event.target.value }))}
                placeholder="Provincia / Estado"
                required
              />
              <Input
                value={form.postalCode}
                onChange={(event) => setForm((prev) => ({ ...prev, postalCode: event.target.value }))}
                placeholder="Código postal"
                required
              />
              <Input
                value={form.country}
                onChange={(event) => setForm((prev) => ({ ...prev, country: event.target.value }))}
                placeholder="País"
                required
              />
              <Button type="submit" className="w-full" disabled={isSaving}>
                {isSaving ? 'Guardando...' : 'Guardar dirección'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
