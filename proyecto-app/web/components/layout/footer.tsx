import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Instagram, Facebook, Twitter, MapPin, Phone, Mail } from 'lucide-react';

const footerLinks = {
  shop: {
    title: 'Comprar',
    links: [
      { name: 'Hombre', href: '/catalogo/hombre' },
      { name: 'Mujer', href: '/catalogo/mujer' },
      { name: 'Niños', href: '/catalogo/ninos' },
      { name: 'Promociones', href: '/promociones' },
    ],
  },
  help: {
    title: 'Ayuda',
    links: [
      { name: 'Contacto', href: '/contacto' },
      { name: 'Envíos', href: '#' },
      { name: 'Devoluciones', href: '#' },
      { name: 'Guía de Tallas', href: '#' },
    ],
  },
  company: {
    title: 'Empresa',
    links: [
      { name: 'Sobre Nosotros', href: '#' },
      { name: 'Tiendas', href: '#' },
      { name: 'Trabaja con Nosotros', href: '#' },
      { name: 'Sostenibilidad', href: '#' },
    ],
  },
};

const socialLinks = [
  { name: 'Instagram', icon: Instagram, href: '#' },
  { name: 'Facebook', icon: Facebook, href: '#' },
  { name: 'Twitter', icon: Twitter, href: '#' },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary" role="contentinfo">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8 lg:py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand & Newsletter */}
          <div className="lg:col-span-2">
            <Link href="/" className="font-serif text-2xl font-semibold tracking-widest">
              MODA
            </Link>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-sm">
              Moda premium para toda la familia. Descubre las últimas tendencias con calidad y estilo atemporal.
            </p>
            
            {/* Newsletter */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider">
                Suscríbete a nuestra newsletter
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Recibe un 10% de descuento en tu primera compra.
              </p>
              <form className="mt-4 flex gap-2">
                <label htmlFor="newsletter-email" className="sr-only">
                  Correo electrónico
                </label>
                <Input
                  id="newsletter-email"
                  type="email"
                  placeholder="tu@email.com"
                  className="flex-1"
                  required
                  aria-describedby="newsletter-description"
                />
                <Button type="submit">
                  Suscribirse
                </Button>
              </form>
              <p id="newsletter-description" className="sr-only">
                Introduce tu correo electrónico para recibir ofertas y novedades.
              </p>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([key, section]) => (
            <div key={key}>
              <h3 className="text-sm font-semibold uppercase tracking-wider">
                {section.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact Info */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 border-t border-border pt-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            <span>Quito, Ecuador</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4" aria-hidden="true" />
            <a href="tel:+593225551234" className="hover:text-foreground">
              +593 2 555 1234
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4" aria-hidden="true" />
            <a href="mailto:info@moda.com" className="hover:text-foreground">
              info@moda.com
            </a>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} MODA. Todos los derechos reservados.
          </p>
          
          {/* Social Links */}
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.href}
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label={`Síguenos en ${social.name}`}
              >
                <social.icon className="h-5 w-5" aria-hidden="true" />
              </a>
            ))}
          </div>

          {/* Legal Links */}
          <div className="flex gap-4 text-sm">
            <Link href="#" className="text-muted-foreground hover:text-foreground">
              Privacidad
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-foreground">
              Términos
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-foreground">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
