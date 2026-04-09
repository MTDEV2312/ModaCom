// @ts-nocheck
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Search, FolderTree } from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Category } from '@/types';
import { createCategory, deleteCategory, getAdminCategories, updateCategory } from '@/lib/services/products';

type AdminCategory = Category & {
  isActive?: boolean;
};

const categoryOptions: Array<{ value: Category['slug']; label: string }> = [
  { value: 'hombre', label: 'Hombre' },
  { value: 'mujer', label: 'Mujer' },
  { value: 'ninos', label: 'Niños' },
];

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<AdminCategory | null>(null);

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '' as '' | Category['slug'],
    description: '',
    image: '',
    isActive: true,
  });

  const loadCategories = async () => {
    setIsLoading(true);
    const response = await getAdminCategories();
    if (response.success) {
      setCategories(response.data as AdminCategory[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    void loadCategories();
  }, []);

  const filtered = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return categories;

    return categories.filter((item) => {
      return (
        item.name.toLowerCase().includes(query) ||
        item.slug.toLowerCase().includes(query) ||
        (item.description || '').toLowerCase().includes(query)
      );
    });
  }, [categories, search]);

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      image: '',
      isActive: true,
    });
    setFormError(null);
    setFormLoading(false);
  };

  const openEdit = (category: AdminCategory) => {
    setSelected(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      image: category.image || '',
      isActive: category.isActive ?? true,
    });
    setFormError(null);
    setIsEditOpen(true);
  };

  const handleCreate = async () => {
    setFormError(null);

    if (!formData.name || !formData.slug) {
      setFormError('Nombre y slug son obligatorios.');
      return;
    }

    setFormLoading(true);
    const response = await createCategory({
      name: formData.name,
      slug: formData.slug,
      description: formData.description || undefined,
      image: formData.image || undefined,
      isActive: formData.isActive,
    });

    if (!response.success) {
      setFormLoading(false);
      setFormError(response.message || 'No se pudo crear la categoría.');
      return;
    }

    setIsCreateOpen(false);
    resetForm();
    await loadCategories();
  };

  const handleEdit = async () => {
    if (!selected) return;

    setFormError(null);
    setFormLoading(true);

    const response = await updateCategory(selected.id, {
      name: formData.name,
      slug: formData.slug || undefined,
      description: formData.description || undefined,
      image: formData.image || undefined,
      isActive: formData.isActive,
    });

    if (!response.success) {
      setFormLoading(false);
      setFormError(response.message || 'No se pudo actualizar la categoría.');
      return;
    }

    setIsEditOpen(false);
    setSelected(null);
    resetForm();
    await loadCategories();
  };

  const handleDelete = async () => {
    if (!selected) return;

    setFormLoading(true);
    const response = await deleteCategory(selected.id);
    setFormLoading(false);

    if (!response.success) {
      setFormError(response.message || 'No se pudo eliminar la categoría.');
      return;
    }

    setIsDeleteOpen(false);
    setSelected(null);
    await loadCategories();
  };

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Categorías</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gestioná las categorías del catálogo.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva categoría
        </Button>
      </div>

      <div className="mt-6 rounded-lg bg-card p-4 shadow-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre o slug"
            className="pl-10"
          />
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner className="h-8 w-8" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FolderTree className="h-10 w-10 text-muted-foreground" />
            <h2 className="mt-3 text-base font-semibold text-foreground">No hay categorías</h2>
            <p className="mt-1 text-sm text-muted-foreground">Probá con otro filtro o creá una nueva categoría.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{category.slug}</Badge>
                    </TableCell>
                    <TableCell>
                      {(category.isActive ?? true) ? (
                        <Badge className="bg-green-600 text-white hover:bg-green-600">Activa</Badge>
                      ) : (
                        <Badge variant="outline">Inactiva</Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[380px] text-sm text-muted-foreground">
                      <p className="line-clamp-1">{category.description || 'Sin descripción'}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="icon" onClick={() => openEdit(category)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-destructive"
                          onClick={() => {
                            setSelected(category);
                            setFormError(null);
                            setIsDeleteOpen(true);
                          }}
                        >
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

      <Dialog open={isCreateOpen} onOpenChange={(open) => {
        setIsCreateOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva categoría</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="create-name">Nombre</Label>
              <Input
                id="create-name"
                value={formData.name}
                onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="create-slug">Slug</Label>
              <Select
                value={formData.slug}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, slug: value as Category['slug'] }))}
              >
                <SelectTrigger id="create-slug">
                  <SelectValue placeholder="Seleccioná una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="create-description">Descripción</Label>
              <Input
                id="create-description"
                value={formData.description}
                onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="create-image">Imagen (URL)</Label>
              <Input
                id="create-image"
                value={formData.image}
                onChange={(event) => setFormData((prev) => ({ ...prev, image: event.target.value }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="create-active"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isActive: checked === true }))}
              />
              <Label htmlFor="create-active" className="font-normal">Categoría activa</Label>
            </div>
            {formError && <p className="text-sm text-destructive">{formError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={formLoading}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={formLoading}>
              {formLoading ? <Spinner className="mr-2 h-4 w-4" /> : null}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={(open) => {
        setIsEditOpen(open);
        if (!open) {
          setSelected(null);
          resetForm();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar categoría</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nombre</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit-slug">Slug</Label>
              <Select
                value={formData.slug}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, slug: value as Category['slug'] }))}
              >
                <SelectTrigger id="edit-slug">
                  <SelectValue placeholder="Seleccioná una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-description">Descripción</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit-image">Imagen (URL)</Label>
              <Input
                id="edit-image"
                value={formData.image}
                onChange={(event) => setFormData((prev) => ({ ...prev, image: event.target.value }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="edit-active"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isActive: checked === true }))}
              />
              <Label htmlFor="edit-active" className="font-normal">Categoría activa</Label>
            </div>
            {formError && <p className="text-sm text-destructive">{formError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={formLoading}>Cancelar</Button>
            <Button onClick={handleEdit} disabled={formLoading}>
              {formLoading ? <Spinner className="mr-2 h-4 w-4" /> : null}
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar categoría</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Si la categoría tiene productos, el backend va a bloquear la eliminación.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {formError && <p className="text-sm text-destructive">{formError}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={formLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
              disabled={formLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {formLoading ? <Spinner className="mr-2 h-4 w-4" /> : null}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
