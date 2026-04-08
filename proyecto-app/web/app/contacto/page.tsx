'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { MapPin, Phone, Mail, Clock, Check, AlertCircle, Send } from 'lucide-react';
import type { ContactForm } from '@/types';
import { createContactMessage } from '@/lib/services/contact';

const contactMethods = [
  {
    icon: MapPin,
    title: 'Visítanos',
    details: ['Calle Gran Vía 123', 'Madrid, España 28013'],
    action: {
      label: 'Ver en mapa',
      href: 'https://maps.google.com/?q=Gran+Via+123+Madrid',
    },
  },
  {
    icon: Phone,
    title: 'Llámanos',
    details: ['+34 900 123 456', 'Lunes a Sábado'],
    action: {
      label: 'Llamar ahora',
      href: 'tel:+34900123456',
    },
  },
  {
    icon: Mail,
    title: 'Escríbenos',
    details: ['info@moda.com', 'soporte@moda.com'],
    action: {
      label: 'Enviar email',
      href: 'mailto:info@moda.com',
    },
  },
  {
    icon: Clock,
    title: 'Horario',
    details: ['Lun - Sáb: 10:00 - 21:00', 'Dom: 11:00 - 20:00'],
  },
];

const subjects = [
  { value: 'general', label: 'Consulta general' },
  { value: 'order', label: 'Sobre mi pedido' },
  { value: 'return', label: 'Devoluciones' },
  { value: 'product', label: 'Información de producto' },
  { value: 'complaint', label: 'Reclamación' },
  { value: 'other', label: 'Otro' },
];

export default function ContactPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ContactForm>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.subject) {
      setError('Por favor selecciona un asunto');
      return;
    }

    setIsLoading(true);

    const response = await createContactMessage(formData);
    
    if (!response.success) {
      setError(response.message || 'No se pudo enviar el mensaje. Por favor intenta nuevamente.');
      setIsLoading(false);
      return;
    }

    setSuccess(true);
    setIsLoading(false);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setError(null);
  };

  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen">
        {/* Hero */}
        <section className="bg-secondary">
          <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8 lg:py-20">
            <div className="text-center">
              <h1 className="font-serif text-4xl font-semibold text-foreground lg:text-5xl">
                Contacto
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                Estamos aquí para ayudarte. Ponte en contacto con nosotros y te responderemos lo antes posible.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Methods */}
        <section className="py-12 lg:py-16">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {contactMethods.map((method) => (
                <div
                  key={method.title}
                  className="rounded-xl bg-card p-6 text-center shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                    <method.icon className="h-6 w-6 text-foreground" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 font-semibold text-foreground">
                    {method.title}
                  </h3>
                  <div className="mt-2 space-y-1">
                    {method.details.map((detail, i) => (
                      <p key={i} className="text-sm text-muted-foreground">
                        {detail}
                      </p>
                    ))}
                  </div>
                  {method.action && (
                    <a
                      href={method.action.href}
                      target={method.action.href.startsWith('http') ? '_blank' : undefined}
                      rel={method.action.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="mt-4 inline-block text-sm font-medium text-accent hover:underline"
                    >
                      {method.action.label}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section className="bg-secondary py-12 lg:py-16">
          <div className="mx-auto max-w-3xl px-4 lg:px-8">
            <div className="rounded-2xl bg-card p-6 shadow-sm sm:p-10">
              <div className="text-center">
                <h2 className="font-serif text-2xl font-semibold text-foreground lg:text-3xl">
                  Envíanos un mensaje
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Completa el formulario y te responderemos en menos de 24 horas.
                </p>
              </div>

              {success ? (
                <div className="mt-8 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                    <Check className="h-8 w-8 text-green-600" aria-hidden="true" />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold text-foreground">
                    Mensaje enviado
                  </h3>
                  <p className="mt-2 text-muted-foreground">
                    Gracias por contactarnos. Te responderemos lo antes posible.
                  </p>
                  <Button
                    onClick={() => {
                      setSuccess(false);
                      setFormData({
                        name: '',
                        email: '',
                        phone: '',
                        subject: '',
                        message: '',
                      });
                    }}
                    variant="outline"
                    className="mt-6"
                  >
                    Enviar otro mensaje
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                  {error && (
                    <div
                      className="flex items-start gap-3 rounded-md bg-destructive/10 p-4 text-sm text-destructive"
                      role="alert"
                      aria-live="polite"
                    >
                      <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
                      <p>{error}</p>
                    </div>
                  )}

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="name">Nombre completo *</Label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="mt-2"
                        placeholder="Tu nombre"
                        disabled={isLoading}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Correo electrónico *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="mt-2"
                        placeholder="tu@email.com"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="phone">Teléfono (opcional)</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        className="mt-2"
                        placeholder="+34 600 000 000"
                        disabled={isLoading}
                      />
                    </div>
                    <div>
                      <Label htmlFor="subject">Asunto *</Label>
                      <Select
                        value={formData.subject}
                        onValueChange={(value) => {
                          setFormData(prev => ({ ...prev, subject: value }));
                          setError(null);
                        }}
                        disabled={isLoading}
                      >
                        <SelectTrigger id="subject" className="mt-2">
                          <SelectValue placeholder="Selecciona un asunto" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map((subject) => (
                            <SelectItem key={subject.value} value={subject.value}>
                              {subject.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="message">Mensaje *</Label>
                    <Textarea
                      id="message"
                      name="message"
                      required
                      rows={5}
                      value={formData.message}
                      onChange={handleChange}
                      className="mt-2"
                      placeholder="Escribe tu mensaje aquí..."
                      disabled={isLoading}
                    />
                  </div>

                  <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Spinner className="mr-2" />
                        Enviando mensaje...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" aria-hidden="true" />
                        Enviar mensaje
                      </>
                    )}
                  </Button>

                  <p className="text-center text-xs text-muted-foreground">
                    Al enviar este formulario, aceptas nuestra{' '}
                    <a href="#" className="underline hover:text-foreground">
                      Política de Privacidad
                    </a>
                    .
                  </p>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* FAQ Teaser */}
        <section className="py-12 lg:py-16">
          <div className="mx-auto max-w-7xl px-4 text-center lg:px-8">
            <h2 className="font-serif text-2xl font-semibold text-foreground">
              ¿Tienes preguntas frecuentes?
            </h2>
            <p className="mt-2 text-muted-foreground">
              Consulta nuestra sección de preguntas frecuentes para encontrar respuestas rápidas.
            </p>
            <Button variant="outline" className="mt-6">
              Ver preguntas frecuentes
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
