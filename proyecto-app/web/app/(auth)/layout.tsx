import Link from 'next/link';
import Image from 'next/image';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      {/* Left side - Form */}
      <div className="flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-sm">
          <Link
            href="/"
            className="mb-8 block font-serif text-2xl font-semibold tracking-widest text-foreground"
            aria-label="MODA - Ir a inicio"
          >
            MODA
          </Link>
          {children}
        </div>
      </div>

      {/* Right side - Image */}
      <div className="hidden lg:block relative">
        <Image
          src="/images/auth-fashion.jpg"
          alt="Moda elegante"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-foreground/40" />
        <div className="absolute bottom-12 left-12 right-12 text-background">
          <blockquote className="font-serif text-2xl font-medium italic leading-relaxed">
            &ldquo;La moda es la armadura para sobrevivir la realidad de la vida cotidiana.&rdquo;
          </blockquote>
          <p className="mt-4 text-background/80">Bill Cunningham</p>
        </div>
      </div>
    </div>
  );
}
