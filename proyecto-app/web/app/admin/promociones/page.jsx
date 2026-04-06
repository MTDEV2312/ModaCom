'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Search, Tags } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getAdminCategories } from '@/lib/services/products';
import { createOffer, deleteOffer, getAllOffers, updateOffer } from '@/lib/services/offers';

const toDatetimeLocal = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
};

const toIso = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
};

const emptyForm = {
  title: '',
  description: '',
  discountPercentage: '',
  code: '',
  image: '',
  validFrom: '',
  validUntil: '',
  active: true,
  applicableCategories: [],
};

export default function AdminOffersPage() {
  const [offers, setOffers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const loadData = async () => {
    setIsLoading(true);
    const [offersResponse, categoriesResponse] = await Promise.all([getAllOffers(), getAdminCategories()]);

    if (offersResponse.success) setOffers(offersResponse.data);
    if (categoriesResponse.success) setCategories(categoriesResponse.data);

    setIsLoading(false);
  };

  useEffect(() => {
    void loadData();
  }, []);

  const filtered = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return offers;

    return offers.filter((offer) => {
      return (
        offer.title.toLowerCase().includes(query) ||
        offer.description.toLowerCase().includes(query) ||
        (offer.code || '').toLowerCase().includes(query)
      );
    });
  }, [offers, search]);

  const resetForm = () => {
    setFormData(emptyForm);
    setFormError(null);
    setFormLoading(false);
  };

  const validateForm = () => {
    if (!formData.title || !formData.description || !formData.discountPercentage || !formData.image) {
      setFormError('Completá título, descripción, descuento e imagen.');
      return false;
    }

    if (!formData.validFrom || !formData.validUntil) {
      setFormError('Completá las fechas de vigencia.');
      return false;
    }

    const discount = Number(formData.discountPercentage);
    if (!Number.isFinite(discount) || discount < 0 || discount > 100) {
      setFormError('El descuento debe estar entre 0 y 100.');
      return false;
    }

    if (new Date(formData.validFrom) > new Date(formData.validUntil)) {
      setFormError('La fecha de inicio debe ser menor o igual a la fecha de fin.');
      return false;
    }

    return true;
  };

  const handleCreate = async () => {
    setFormError(null);
    if (!validateForm()) return;

    setFormLoading(true);
    const response = await createOffer({
      title: formData.title,
      description: formData.description,
      discountPercentage: Number(formData.discountPercentage),
      code: formData.code || undefined,
      image: formData.image,
      validFrom: toIso(formData.validFrom),
      validUntil: toIso(formData.validUntil),
      active: formData.active,
      applicableCategories: formData.applicableCategories,
    });

    if (!response.success) {
      setFormLoading(false);
      setFormError(response.message || 'No se pudo crear la promoción.');
      return;
    }

    setIsCreateOpen(false);
    resetForm();
    await loadData();
  };

  const handleEdit = async () => {
    if (!selected) return;

    setFormError(null);
    if (!validateForm()) return;

    setFormLoading(true);
    const response = await updateOffer(selected.id, {
      title: formData.title,
      description: formData.description,
      discountPercentage: Number(formData.discountPercentage),
      code: formData.code || undefined,
      image: formData.image,
      validFrom: toIso(formData.validFrom),
      validUntil: toIso(formData.validUntil),
      active: formData.active,
      applicableCategories: formData.applicableCategories,
    });

    if (!response.success) {
      setFormLoading(false);
      setFormError(response.message || 'No se pudo actualizar la promoción.');
      return;
    }

    setIsEditOpen(false);
    setSelected(null);
    resetForm();
    await loadData();
  };

  const handleDelete = async () => {
    if (!selected) return;

    setFormLoading(true);
    const response = await deleteOffer(selected.id);
    setFormLoading(false);

    if (!response.success) {
      setFormError(response.message || 'No se pudo eliminar la promoción.');
      return;
    }

    setIsDeleteOpen(false);
    setSelected(null);
    await loadData();
  };

  const setFromOffer = (offer) => {
    setFormData({
      title: offer.title,
      description: offer.description,
      discountPercentage: String(offer.discountPercentage),
      code: offer.code || '',
      image: offer.image,
      validFrom: toDatetimeLocal(offer.validFrom),
      validUntil: toDatetimeLocal(offer.validUntil),
      active: offer.active,
      applicableCategories: offer.applicableCategories || [],
    });
  };

  const toggleCategory = (slug) => {
    setFormData((prev) => {
      if (prev.applicableCategories.includes(slug)) {
        return {
          ...prev,
          applicableCategories: prev.applicableCategories.filter((item) => item !== slug),
        };
      }

      return {
        ...prev,
        applicableCategories: [...prev.applicableCategories, slug],
      };
    });
  };

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Promociones</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gestioná descuentos y campañas activas.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva promoción
        </Button>
      </div>

      <div className="mt-6 rounded-lg bg-card p-4 shadow-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por título o código" className="pl-10" />
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner className="h-8 w-8" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Tags className="h-10 w-10 text-muted-foreground" />
            <h2 className="mt-3 text-base font-semibold text-foreground">No hay promociones</h2>
            <p className="mt-1 text-sm text-muted-foreground">Creá una campaña para empezar a vender más.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Descuento</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Vigencia</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((offer) => (
                  <TableRow key={offer.id}>
                    <TableCell>
                      <p className="font-medium">{offer.title}</p>
                      <p className="line-clamp-1 text-sm text-muted-foreground">{offer.description}</p>
                    </TableCell>
                    <TableCell><Badge>{offer.discountPercentage}%</Badge></TableCell>
                    <TableCell>{offer.code || 'Sin código'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(offer.validFrom).toLocaleDateString()} - {new Date(offer.validUntil).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {offer.active ? <Badge className="bg-green-600 text-white hover:bg-green-600">Activa</Badge> : <Badge variant="outline">Inactiva</Badge>}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="icon" onClick={() => { setSelected(offer); setFromOffer(offer); setFormError(null); setIsEditOpen(true); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="text-destructive" onClick={() => { setSelected(offer); setFormError(null); setIsDeleteOpen(true); }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-h-[88vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nueva promoción</DialogTitle></DialogHeader>
          <OfferForm formData={formData} setFormData={setFormData} categories={categories} toggleCategory={toggleCategory} formError={formError} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={formLoading}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={formLoading}>{formLoading ? <Spinner className="mr-2 h-4 w-4" /> : null}Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={(open) => { setIsEditOpen(open); if (!open) { setSelected(null); resetForm(); } }}>
        <DialogContent className="max-h-[88vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar promoción</DialogTitle></DialogHeader>
          <OfferForm formData={formData} setFormData={setFormData} categories={categories} toggleCategory={toggleCategory} formError={formError} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={formLoading}>Cancelar</Button>
            <Button onClick={handleEdit} disabled={formLoading}>{formLoading ? <Spinner className="mr-2 h-4 w-4" /> : null}Guardar cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar promoción</AlertDialogTitle>
            <AlertDialogDescription>Esta acción elimina la promoción y sus asociaciones de categorías.</AlertDialogDescription>
          </AlertDialogHeader>
          {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={formLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={(event) => { event.preventDefault(); void handleDelete(); }} disabled={formLoading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {formLoading ? <Spinner className="mr-2 h-4 w-4" /> : null}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function OfferForm({ formData, setFormData, categories, toggleCategory, formError }) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="offer-title">Título</Label>
        <Input id="offer-title" value={formData.title} onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))} />
      </div>

      <div>
        <Label htmlFor="offer-description">Descripción</Label>
        <Input id="offer-description" value={formData.description} onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="offer-discount">Descuento (%)</Label>
          <Input id="offer-discount" type="number" min={0} max={100} value={formData.discountPercentage} onChange={(event) => setFormData((prev) => ({ ...prev, discountPercentage: event.target.value }))} />
        </div>
        <div>
          <Label htmlFor="offer-code">Código (opcional)</Label>
          <Input id="offer-code" value={formData.code} onChange={(event) => setFormData((prev) => ({ ...prev, code: event.target.value }))} />
        </div>
      </div>

      <div>
        <Label htmlFor="offer-image">Imagen (URL)</Label>
        <Input id="offer-image" value={formData.image} onChange={(event) => setFormData((prev) => ({ ...prev, image: event.target.value }))} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="offer-valid-from">Válida desde</Label>
          <Input id="offer-valid-from" type="datetime-local" value={formData.validFrom} onChange={(event) => setFormData((prev) => ({ ...prev, validFrom: event.target.value }))} />
        </div>
        <div>
          <Label htmlFor="offer-valid-until">Válida hasta</Label>
          <Input id="offer-valid-until" type="datetime-local" value={formData.validUntil} onChange={(event) => setFormData((prev) => ({ ...prev, validUntil: event.target.value }))} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox id="offer-active" checked={formData.active} onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, active: checked === true }))} />
        <Label htmlFor="offer-active" className="font-normal">Promoción activa</Label>
      </div>

      <div className="space-y-2">
        <Label>Categorías aplicables</Label>
        <div className="grid gap-2 sm:grid-cols-2">
          {categories.map((category) => (
            <label key={category.id} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
              <Checkbox checked={formData.applicableCategories.includes(category.slug)} onCheckedChange={() => toggleCategory(category.slug)} />
              <span>{category.name}</span>
            </label>
          ))}
        </div>
      </div>

      {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
    </div>
  );
}
