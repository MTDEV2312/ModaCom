import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { FilterBar } from '@/components/product/filter-bar';
import { ProductGrid } from '@/components/product/product-grid';
import { getProducts, getCategories } from '@/lib/services/products';
import type { ProductFilters, Category } from '@/types';

interface CatalogPageProps {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const categoryTitles: Record<string, { title: string; description: string }> = {
  hombre: {
    title: 'Colección Hombre',
    description: 'Descubre nuestra selección de moda masculina. Desde looks casuales hasta elegancia formal.',
  },
  mujer: {
    title: 'Colección Mujer',
    description: 'Explora las últimas tendencias en moda femenina. Estilo, elegancia y confort.',
  },
  ninos: {
    title: 'Colección Niños',
    description: 'Moda infantil cómoda, divertida y duradera para los más pequeños de la casa.',
  },
};

export async function generateMetadata({ params }: CatalogPageProps): Promise<Metadata> {
  const { category } = await params;
  const categoryInfo = categoryTitles[category];
  
  if (!categoryInfo) {
    return {
      title: 'Catálogo',
    };
  }

  return {
    title: categoryInfo.title,
    description: categoryInfo.description,
    openGraph: {
      title: `${categoryInfo.title} | MODA`,
      description: categoryInfo.description,
    },
  };
}

export async function generateStaticParams() {
  return [
    { category: 'hombre' },
    { category: 'mujer' },
    { category: 'ninos' },
  ];
}

export default async function CatalogPage({ params, searchParams }: CatalogPageProps) {
  const { category } = await params;
  const resolvedSearchParams = await searchParams;
  
  // Validate category
  const validCategories = ['hombre', 'mujer', 'ninos'];
  if (!validCategories.includes(category)) {
    notFound();
  }

  const categoryInfo = categoryTitles[category as keyof typeof categoryTitles];

  // Build filters from search params
  const filters: ProductFilters = {
    category: category as Category['slug'],
    search: typeof resolvedSearchParams.search === 'string' ? resolvedSearchParams.search : undefined,
    sortBy: typeof resolvedSearchParams.sortBy === 'string' ? resolvedSearchParams.sortBy as ProductFilters['sortBy'] : undefined,
    sizes: typeof resolvedSearchParams.sizes === 'string' ? resolvedSearchParams.sizes.split(',') : undefined,
    colors: typeof resolvedSearchParams.colors === 'string' ? resolvedSearchParams.colors.split(',') : undefined,
    minPrice: typeof resolvedSearchParams.minPrice === 'string' ? Number(resolvedSearchParams.minPrice) : undefined,
    maxPrice: typeof resolvedSearchParams.maxPrice === 'string' ? Number(resolvedSearchParams.maxPrice) : undefined,
  };

  const productsResponse = await getProducts(filters);
  const products = productsResponse.data;

  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen">
        {/* Hero Header */}
        <section className="bg-secondary">
          <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8 lg:py-16">
            <nav aria-label="Breadcrumb" className="mb-4">
              <ol className="flex items-center gap-2 text-sm text-muted-foreground">
                <li>
                  <a href="/" className="hover:text-foreground">
                    Inicio
                  </a>
                </li>
                <li aria-hidden="true">/</li>
                <li>
                  <span className="text-foreground" aria-current="page">
                    {categoryInfo.title}
                  </span>
                </li>
              </ol>
            </nav>
            <h1 className="font-serif text-3xl font-semibold text-foreground lg:text-4xl">
              {categoryInfo.title}
            </h1>
            <p className="mt-3 text-muted-foreground max-w-2xl">
              {categoryInfo.description}
            </p>
          </div>
        </section>

        {/* Products Section */}
        <section className="py-8 lg:py-12">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <Suspense fallback={<FilterBarSkeleton />}>
              <FilterBar 
                totalProducts={productsResponse.pagination.totalItems} 
                categorySlug={category}
              />
            </Suspense>

            <div className="mt-8">
              <Suspense fallback={<ProductGrid products={[]} isLoading />}>
                <ProductGrid products={products} />
              </Suspense>
            </div>

            {/* Pagination info */}
            {productsResponse.pagination.totalPages > 1 && (
              <div className="mt-12 text-center text-sm text-muted-foreground">
                Mostrando {products.length} de {productsResponse.pagination.totalItems} productos
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function FilterBarSkeleton() {
  return (
    <div className="flex flex-col gap-4 border-b border-border pb-4">
      <div className="flex items-center justify-between">
        <div className="h-10 w-48 animate-pulse rounded-md bg-muted" />
        <div className="flex items-center gap-4">
          <div className="h-5 w-24 animate-pulse rounded bg-muted" />
          <div className="h-10 w-32 animate-pulse rounded-md bg-muted" />
        </div>
      </div>
    </div>
  );
}
