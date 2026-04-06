'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  AlertCircle,
  Check,
  X,
  Package,
} from 'lucide-react';
import { createProduct, deleteProduct, getCategories, getProducts, updateProduct } from '@/lib/services/products';
import type { Product, Category } from '@/types';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    category: '',
    stock: '',
    featured: false,
    isNew: false,
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    const response = await getProducts({}, 1, 100);
    setProducts(response.data);
    setIsLoading(false);
  };

  const fetchCategories = async () => {
    const response = await getCategories();
    if (response.success) {
      setCategories(response.data);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category.slug === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleCreate = async () => {
    setFormError(null);
    
    if (!formData.name || !formData.price || !formData.category) {
      setFormError('Por favor completa todos los campos requeridos');
      return;
    }

    setFormLoading(true);

    const category = categories.find((item) => item.slug === formData.category);
    if (!category) {
      setFormLoading(false);
      setFormError('Categoría inválida');
      return;
    }

    const result = await createProduct({
      name: formData.name,
      slug: '',
      description: formData.description,
      price: Number(formData.price),
      originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
      images: ['/images/placeholder-product.jpg'],
      category,
      sizes: [
        { id: 's', name: 'S', available: true },
        { id: 'm', name: 'M', available: true },
        { id: 'l', name: 'L', available: true },
      ],
      colors: [
        { id: 'black', name: 'Negro', hex: '#1a1a1a', available: true },
        { id: 'white', name: 'Blanco', hex: '#ffffff', available: true },
      ],
      stock: Number(formData.stock || 0),
      featured: formData.featured,
      isNew: formData.isNew,
    });

    if (!result.success) {
      setFormLoading(false);
      setFormError(result.message || 'No se pudo crear el producto');
      return;
    }

    setFormSuccess(true);
    setFormLoading(false);
    setTimeout(() => {
      setIsCreateOpen(false);
      setFormSuccess(false);
      resetForm();
      fetchProducts();
    }, 800);
  };

  const handleEdit = async () => {
    setFormError(null);
    
    if (!formData.name || !formData.price) {
      setFormError('Por favor completa todos los campos requeridos');
      return;
    }

    setFormLoading(true);

    if (!selectedProduct) {
      setFormLoading(false);
      setFormError('Producto inválido');
      return;
    }

    const category = categories.find((item) => item.slug === formData.category);
    const result = await updateProduct(selectedProduct.id, {
      name: formData.name,
      description: formData.description,
      price: Number(formData.price),
      originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
      category,
      stock: Number(formData.stock || 0),
      featured: formData.featured,
      isNew: formData.isNew,
    });

    if (!result.success) {
      setFormLoading(false);
      setFormError(result.message || 'No se pudo actualizar el producto');
      return;
    }

    setFormSuccess(true);
    setFormLoading(false);
    setTimeout(() => {
      setIsEditOpen(false);
      setFormSuccess(false);
      setSelectedProduct(null);
      resetForm();
      fetchProducts();
    }, 800);
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;
    
    setFormLoading(true);
    await deleteProduct(selectedProduct.id);
    
    setProducts(prev => prev.filter(p => p.id !== selectedProduct.id));
    setIsDeleteOpen(false);
    setSelectedProduct(null);
    setFormLoading(false);
  };

  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      originalPrice: product.originalPrice?.toString() || '',
      category: product.category.slug,
      stock: product.stock.toString(),
      featured: product.featured,
      isNew: product.isNew,
    });
    setIsEditOpen(true);
  };

  const openPreviewModal = (product: Product) => {
    setSelectedProduct(product);
    setIsPreviewOpen(true);
  };

  const openDeleteModal = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      originalPrice: '',
      category: '',
      stock: '',
      featured: false,
      isNew: false,
    });
    setFormError(null);
    setFormLoading(false);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Productos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestiona tu catálogo de productos
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          Nuevo Producto
        </Button>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-col gap-4 rounded-lg bg-card p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            type="search"
            placeholder="Buscar productos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            aria-label="Buscar productos"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48" aria-label="Filtrar por categoría">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.slug} value={cat.slug}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="mt-6 rounded-lg border border-border bg-card shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner className="h-8 w-8" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
            <h3 className="mt-4 font-semibold text-foreground">No hay productos</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchQuery || categoryFilter !== 'all'
                ? 'No se encontraron productos con esos filtros'
                : 'Comienza agregando tu primer producto'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Imagen</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="text-center">Stock</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="relative h-12 w-12 overflow-hidden rounded-md bg-muted">
                        <Image
                          src={product.images[0] || '/images/placeholder-product.jpg'}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground line-clamp-1">
                          {product.name}
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {product.slug}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{product.category.name}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div>
                        <p className="font-medium">{product.price.toFixed(2)} €</p>
                        {product.originalPrice && (
                          <p className="text-sm text-muted-foreground line-through">
                            {product.originalPrice.toFixed(2)} €
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={
                          product.stock > 10
                            ? 'text-green-600'
                            : product.stock > 0
                            ? 'text-amber-600'
                            : 'text-red-600'
                        }
                      >
                        {product.stock}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {product.featured && (
                          <Badge variant="outline" className="text-xs">
                            Destacado
                          </Badge>
                        )}
                        {product.isNew && (
                          <Badge className="text-xs">Nuevo</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openPreviewModal(product)}
                          aria-label={`Vista previa de ${product.name}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditModal(product)}
                          aria-label={`Editar ${product.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteModal(product)}
                          aria-label={`Eliminar ${product.name}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
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

      {/* Stats */}
      <div className="mt-4 text-sm text-muted-foreground">
        Mostrando {filteredProducts.length} de {products.length} productos
      </div>

      {/* Create Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo Producto</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {formError && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {formError}
              </div>
            )}
            
            {formSuccess && (
              <div className="flex items-center gap-2 rounded-md bg-green-500/10 p-3 text-sm text-green-700">
                <Check className="h-4 w-4" />
                Producto creado exitosamente
              </div>
            )}

            <div>
              <Label htmlFor="create-name">Nombre *</Label>
              <Input
                id="create-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1"
                disabled={formLoading || formSuccess}
              />
            </div>

            <div>
              <Label htmlFor="create-description">Descripción</Label>
              <Textarea
                id="create-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="mt-1"
                rows={3}
                disabled={formLoading || formSuccess}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="create-price">Precio *</Label>
                <Input
                  id="create-price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  className="mt-1"
                  disabled={formLoading || formSuccess}
                />
              </div>
              <div>
                <Label htmlFor="create-original-price">Precio original</Label>
                <Input
                  id="create-original-price"
                  type="number"
                  step="0.01"
                  value={formData.originalPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, originalPrice: e.target.value }))}
                  className="mt-1"
                  disabled={formLoading || formSuccess}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="create-category">Categoría *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  disabled={formLoading || formSuccess}
                >
                  <SelectTrigger id="create-category" className="mt-1">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.slug} value={cat.slug}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="create-stock">Stock</Label>
                <Input
                  id="create-stock"
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                  className="mt-1"
                  disabled={formLoading || formSuccess}
                />
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="create-featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, featured: checked as boolean }))}
                  disabled={formLoading || formSuccess}
                />
                <Label htmlFor="create-featured" className="font-normal">
                  Destacado
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="create-new"
                  checked={formData.isNew}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isNew: checked as boolean }))}
                  disabled={formLoading || formSuccess}
                />
                <Label htmlFor="create-new" className="font-normal">
                  Nuevo
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false);
                resetForm();
              }}
              disabled={formLoading}
            >
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={formLoading || formSuccess}>
              {formLoading ? (
                <>
                  <Spinner className="mr-2" />
                  Creando...
                </>
              ) : (
                'Crear producto'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Producto</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {formError && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {formError}
              </div>
            )}
            
            {formSuccess && (
              <div className="flex items-center gap-2 rounded-md bg-green-500/10 p-3 text-sm text-green-700">
                <Check className="h-4 w-4" />
                Producto actualizado exitosamente
              </div>
            )}

            <div>
              <Label htmlFor="edit-name">Nombre *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1"
                disabled={formLoading || formSuccess}
              />
            </div>

            <div>
              <Label htmlFor="edit-description">Descripción</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="mt-1"
                rows={3}
                disabled={formLoading || formSuccess}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-price">Precio *</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  className="mt-1"
                  disabled={formLoading || formSuccess}
                />
              </div>
              <div>
                <Label htmlFor="edit-original-price">Precio original</Label>
                <Input
                  id="edit-original-price"
                  type="number"
                  step="0.01"
                  value={formData.originalPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, originalPrice: e.target.value }))}
                  className="mt-1"
                  disabled={formLoading || formSuccess}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-category">Categoría *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  disabled={formLoading || formSuccess}
                >
                  <SelectTrigger id="edit-category" className="mt-1">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.slug} value={cat.slug}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-stock">Stock</Label>
                <Input
                  id="edit-stock"
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                  className="mt-1"
                  disabled={formLoading || formSuccess}
                />
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="edit-featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, featured: checked as boolean }))}
                  disabled={formLoading || formSuccess}
                />
                <Label htmlFor="edit-featured" className="font-normal">
                  Destacado
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="edit-new"
                  checked={formData.isNew}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isNew: checked as boolean }))}
                  disabled={formLoading || formSuccess}
                />
                <Label htmlFor="edit-new" className="font-normal">
                  Nuevo
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditOpen(false);
                setSelectedProduct(null);
                resetForm();
              }}
              disabled={formLoading}
            >
              Cancelar
            </Button>
            <Button onClick={handleEdit} disabled={formLoading || formSuccess}>
              {formLoading ? (
                <>
                  <Spinner className="mr-2" />
                  Guardando...
                </>
              ) : (
                'Guardar cambios'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Vista Previa</DialogTitle>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="py-4">
              <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                <Image
                  src={selectedProduct.images[0] || '/images/placeholder-product.jpg'}
                  alt={selectedProduct.name}
                  fill
                  className="object-cover"
                />
                <div className="absolute left-3 top-3 flex gap-2">
                  {selectedProduct.isNew && (
                    <Badge>Nuevo</Badge>
                  )}
                  {selectedProduct.originalPrice && (
                    <Badge variant="secondary">
                      -{Math.round(((selectedProduct.originalPrice - selectedProduct.price) / selectedProduct.originalPrice) * 100)}%
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="mt-4">
                <Badge variant="outline">{selectedProduct.category.name}</Badge>
                <h3 className="mt-2 text-lg font-semibold">{selectedProduct.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedProduct.description}
                </p>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-xl font-semibold">
                    {selectedProduct.price.toFixed(2)} €
                  </span>
                  {selectedProduct.originalPrice && (
                    <span className="text-muted-foreground line-through">
                      {selectedProduct.originalPrice.toFixed(2)} €
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Stock: {selectedProduct.stock} unidades
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El producto &ldquo;{selectedProduct?.name}&rdquo; será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={formLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={formLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {formLoading ? (
                <>
                  <Spinner className="mr-2" />
                  Eliminando...
                </>
              ) : (
                'Eliminar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
