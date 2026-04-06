'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { AlertCircle, Check, ArrowLeft, Mail } from 'lucide-react';
import { recoverPassword } from '@/lib/services/auth';

export default function RecoverPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.includes('@')) {
      setError('Por favor ingresa un email válido');
      return;
    }

    setIsLoading(true);

    const response = await recoverPassword({ email });
    if (!response.success) {
      setError(response.message || 'No se pudo enviar el enlace de recuperación');
      setIsLoading(false);
      return;
    }

    setSuccess(true);
    setIsLoading(false);
  };

  if (success) {
    return (
      <>
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
            <Mail className="h-8 w-8 text-green-600" aria-hidden="true" />
          </div>
          <h1 className="mt-6 text-2xl font-semibold text-foreground">
            Revisa tu correo
          </h1>
          <p className="mt-3 text-muted-foreground">
            Hemos enviado un enlace de recuperación a{' '}
            <span className="font-medium text-foreground">{email}</span>
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            ¿No recibiste el correo? Revisa tu carpeta de spam o{' '}
            <button
              onClick={() => {
                setSuccess(false);
                setEmail('');
              }}
              className="font-medium text-accent hover:underline"
            >
              intenta con otro email
            </button>
          </p>

          <Button asChild variant="outline" className="w-full">
            <Link href="/login">
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
              Volver al inicio de sesión
            </Link>
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <div>
        <Link
          href="/login"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
          Volver
        </Link>
        <h1 className="mt-6 text-2xl font-semibold text-foreground">
          Recuperar Contraseña
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
        </p>
      </div>

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

        <div>
          <Label htmlFor="email">Correo electrónico</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
            className="mt-2"
            placeholder="tu@email.com"
            disabled={isLoading}
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Spinner className="mr-2" />
              Enviando enlace...
            </>
          ) : (
            'Enviar enlace de recuperación'
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          ¿Recordaste tu contraseña?{' '}
          <Link
            href="/login"
            className="font-medium text-foreground hover:underline"
          >
            Inicia sesión
          </Link>
        </p>
      </form>
    </>
  );
}
