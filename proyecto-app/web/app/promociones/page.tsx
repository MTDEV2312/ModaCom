import type { Metadata } from 'next';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { OfferCard } from '@/components/offer/offer-card';
import { ProductCard } from '@/components/product/product-card';
import { getAllOffers } from '@/lib/services/offers';
import { getProducts } from '@/lib/services/products';

export const metadata: Metadata = {
  title: 'Promociones',
  description: 'Descubre las mejores ofertas y descuentos en moda para toda la familia. Promociones exclusivas en MODA.',
  openGraph: {
    title: 'Promociones | MODA',
    description: 'Descubre las mejores ofertas y descuentos en moda para toda la familia.',
  },
};

export default async function PromotionsPage() {
  const [offersResponse, productsResponse] = await Promise.all([
    getAllOffers(),
    getProducts({}, 1, 8),
  ]);

  const offers = offersResponse.data;
  const discountedProducts = productsResponse.data.filter(p => p.originalPrice);

  // Get featured offer (largest discount)
  const featuredOffer = offers.reduce((max, offer) => 
    offer.discountPercentage > max.discountPercentage ? offer : max
  , offers[0]);

  const otherOffers = offers.filter(o => o.id !== featuredOffer?.id);

  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen">
        {/* Hero */}
        <section className="bg-foreground text-background">
          <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8 lg:py-24">
            <div className="text-center">
              <span className="text-sm font-medium uppercase tracking-widest text-background/70">
                Ofertas Especiales
              </span>
              <h1 className="mt-4 font-serif text-4xl font-semibold lg:text-5xl text-balance">
                Promociones Exclusivas
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-background/80">
                Aprovecha nuestras ofertas por tiempo limitado. Descuentos increíbles en las mejores marcas de moda.
              </p>
            </div>
          </div>
        </section>

        {/* Featured Offer */}
        {featuredOffer && (
          <section className="py-12 lg:py-16">
            <div className="mx-auto max-w-7xl px-4 lg:px-8">
              <h2 className="sr-only">Oferta Destacada</h2>
              <OfferCard offer={featuredOffer} variant="featured" />
            </div>
          </section>
        )}

        {/* All Offers */}
        {otherOffers.length > 0 && (
          <section className="bg-secondary py-12 lg:py-16">
            <div className="mx-auto max-w-7xl px-4 lg:px-8">
              <h2 className="font-serif text-2xl font-semibold text-foreground lg:text-3xl">
                Todas las Promociones
              </h2>
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {otherOffers.map((offer) => (
                  <OfferCard key={offer.id} offer={offer} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Discounted Products */}
        {discountedProducts.length > 0 && (
          <section className="py-12 lg:py-16">
            <div className="mx-auto max-w-7xl px-4 lg:px-8">
              <div className="text-center">
                <h2 className="font-serif text-2xl font-semibold text-foreground lg:text-3xl">
                  Productos en Oferta
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Descubre productos con descuentos exclusivos
                </p>
              </div>
              <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
                {discountedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Terms Banner */}
        <section className="border-t border-border bg-muted py-8">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="text-center text-sm text-muted-foreground">
              <p>
                * Las promociones son válidas hasta agotar existencias. 
                Los descuentos no son acumulables con otras ofertas. 
                Consulta las condiciones específicas de cada promoción.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
