'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { SlidersHorizontal, X, Search } from 'lucide-react';
import type { ProductFilters } from '@/types';

interface FilterBarProps {
  totalProducts: number;
  categorySlug?: string;
}

const sizes = ['XS', 'S', 'M', 'L', 'XL'];
const colors = [
  { name: 'Negro', hex: '#1a1a1a' },
  { name: 'Blanco', hex: '#ffffff' },
  { name: 'Azul Marino', hex: '#1e3a5f' },
  { name: 'Beige', hex: '#d4c5b0' },
  { name: 'Gris', hex: '#6b7280' },
];

const sortOptions = [
  { value: 'newest', label: 'Más recientes' },
  { value: 'price-asc', label: 'Precio: Menor a mayor' },
  { value: 'price-desc', label: 'Precio: Mayor a menor' },
  { value: 'name', label: 'Nombre A-Z' },
];

export function FilterBar({ totalProducts, categorySlug }: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [priceRange, setPriceRange] = useState<[number, number]>([
    Number(searchParams.get('minPrice')) || 0,
    Number(searchParams.get('maxPrice')) || 500,
  ]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>(
    searchParams.get('sizes')?.split(',').filter(Boolean) || []
  );
  const [selectedColors, setSelectedColors] = useState<string[]>(
    searchParams.get('colors')?.split(',').filter(Boolean) || []
  );
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'newest');

  const updateFilters = (newFilters: Partial<ProductFilters>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
        params.delete(key);
      } else if (Array.isArray(value)) {
        params.set(key, value.join(','));
      } else {
        params.set(key, String(value));
      }
    });

    const basePath = categorySlug ? `/catalogo/${categorySlug}` : '/catalogo';
    router.push(`${basePath}?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchQuery });
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    updateFilters({ sortBy: value as ProductFilters['sortBy'] });
  };

  const handleSizeToggle = (size: string) => {
    const newSizes = selectedSizes.includes(size)
      ? selectedSizes.filter(s => s !== size)
      : [...selectedSizes, size];
    setSelectedSizes(newSizes);
  };

  const handleColorToggle = (color: string) => {
    const newColors = selectedColors.includes(color)
      ? selectedColors.filter(c => c !== color)
      : [...selectedColors, color];
    setSelectedColors(newColors);
  };

  const applyFilters = () => {
    updateFilters({
      sizes: selectedSizes,
      colors: selectedColors,
      minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
      maxPrice: priceRange[1] < 500 ? priceRange[1] : undefined,
    });
    setIsOpen(false);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setPriceRange([0, 500]);
    setSelectedSizes([]);
    setSelectedColors([]);
    setSortBy('newest');
    
    const basePath = categorySlug ? `/catalogo/${categorySlug}` : '/catalogo';
    router.push(basePath);
    setIsOpen(false);
  };

  const activeFiltersCount = [
    selectedSizes.length > 0,
    selectedColors.length > 0,
    priceRange[0] > 0 || priceRange[1] < 500,
    searchQuery.length > 0,
  ].filter(Boolean).length;

  return (
    <div className="flex flex-col gap-4 border-b border-border pb-4">
      {/* Top bar with search and sort */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <form onSubmit={handleSearch} className="relative flex-1 sm:max-w-xs">
          <Label htmlFor="product-search" className="sr-only">
            Buscar productos
          </Label>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            id="product-search"
            type="search"
            placeholder="Buscar productos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </form>

        <div className="flex items-center gap-4">
          {/* Results count */}
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{totalProducts}</span> productos
          </p>

          {/* Sort */}
          <div className="hidden sm:flex sm:items-center sm:gap-2">
            <Label htmlFor="sort-select" className="text-sm text-muted-foreground">
              Ordenar:
            </Label>
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger id="sort-select" className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filter button */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="relative">
                <SlidersHorizontal className="mr-2 h-4 w-4" aria-hidden="true" />
                Filtros
                {activeFiltersCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs font-medium text-accent-foreground">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filtros</SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Mobile sort */}
                <div className="sm:hidden">
                  <Label htmlFor="mobile-sort" className="text-sm font-medium">
                    Ordenar por
                  </Label>
                  <Select value={sortBy} onValueChange={handleSortChange}>
                    <SelectTrigger id="mobile-sort" className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sortOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range */}
                <div>
                  <Label className="text-sm font-medium">
                    Rango de precio
                  </Label>
                  <div className="mt-4 px-2">
                    <Slider
                      value={priceRange}
                      onValueChange={(value) => setPriceRange(value as [number, number])}
                      min={0}
                      max={500}
                      step={10}
                      aria-label="Seleccionar rango de precio"
                    />
                    <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
                      <span>{priceRange[0]} €</span>
                      <span>{priceRange[1]} €</span>
                    </div>
                  </div>
                </div>

                {/* Sizes */}
                <fieldset>
                  <legend className="text-sm font-medium">Tallas</legend>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {sizes.map((size) => (
                      <Button
                        key={size}
                        type="button"
                        variant={selectedSizes.includes(size) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleSizeToggle(size)}
                        aria-pressed={selectedSizes.includes(size)}
                      >
                        {size}
                      </Button>
                    ))}
                  </div>
                </fieldset>

                {/* Colors */}
                <fieldset>
                  <legend className="text-sm font-medium">Colores</legend>
                  <div className="mt-3 space-y-3">
                    {colors.map((color) => (
                      <div key={color.name} className="flex items-center gap-3">
                        <Checkbox
                          id={`color-${color.name}`}
                          checked={selectedColors.includes(color.name)}
                          onCheckedChange={() => handleColorToggle(color.name)}
                        />
                        <span
                          className="h-5 w-5 rounded-full border border-border"
                          style={{ backgroundColor: color.hex }}
                          aria-hidden="true"
                        />
                        <Label
                          htmlFor={`color-${color.name}`}
                          className="text-sm font-normal"
                        >
                          {color.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </fieldset>
              </div>

              <SheetFooter className="mt-8 flex gap-2">
                <Button variant="outline" onClick={clearFilters} className="flex-1">
                  <X className="mr-2 h-4 w-4" aria-hidden="true" />
                  Limpiar
                </Button>
                <Button onClick={applyFilters} className="flex-1">
                  Aplicar filtros
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Active filters */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtros activos:</span>
          {searchQuery && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                updateFilters({ search: undefined });
              }}
            >
              Búsqueda: {searchQuery}
              <X className="ml-1 h-3 w-3" aria-hidden="true" />
            </Button>
          )}
          {selectedSizes.map((size) => (
            <Button
              key={size}
              variant="secondary"
              size="sm"
              onClick={() => {
                const newSizes = selectedSizes.filter(s => s !== size);
                setSelectedSizes(newSizes);
                updateFilters({ sizes: newSizes });
              }}
            >
              {size}
              <X className="ml-1 h-3 w-3" aria-hidden="true" />
            </Button>
          ))}
          {selectedColors.map((color) => (
            <Button
              key={color}
              variant="secondary"
              size="sm"
              onClick={() => {
                const newColors = selectedColors.filter(c => c !== color);
                setSelectedColors(newColors);
                updateFilters({ colors: newColors });
              }}
            >
              {color}
              <X className="ml-1 h-3 w-3" aria-hidden="true" />
            </Button>
          ))}
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Limpiar todo
          </Button>
        </div>
      )}
    </div>
  );
}
