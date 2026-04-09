'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/ui/spinner';
import { Eye, EyeOff, AlertCircle, Check } from 'lucide-react';
import type { LoginCredentials } from '@/types';
import { login, setAuthSession } from '@/lib/services/auth';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<LoginCredentials>({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const response = await login(formData.email, formData.password);
    if (!response.success || !response.data) {
      setError(response.message || 'Credenciales incorrectas. Por favor, verifica tu email y contraseña.');
      setIsLoading(false);
      return;
    }

    setAuthSession(response.data.token, response.data.user, response.data.refreshToken);
    setSuccess(true);

    setTimeout(() => {
      if (response.data.user.role === 'admin') {
        router.push('/admin/productos');
        return;
      }

      router.push('/');
    }, 700);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setError(null);
  };

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Iniciar Sesión
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Bienvenido de vuelta. Ingresa tus credenciales para continuar.
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

        {success && (
          <div
            className="flex items-start gap-3 rounded-md bg-green-500/10 p-4 text-sm text-green-700"
            role="status"
            aria-live="polite"
          >
            <Check className="h-5 w-5 shrink-0" aria-hidden="true" />
            <p>Inicio de sesión exitoso. Redirigiendo...</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="mt-2"
              placeholder="tu@email.com"
              disabled={isLoading || success}
              aria-describedby="email-description"
            />
            <p id="email-description" className="sr-only">
              Ingresa tu dirección de correo electrónico
            </p>
          </div>

          <div>
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative mt-2">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                minLength={6}
                value={formData.password}
                onChange={handleChange}
                className="pr-10"
                placeholder="Tu contraseña"
                disabled={isLoading || success}
                aria-describedby="password-description"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            <p id="password-description" className="sr-only">
              Ingresa tu contraseña, mínimo 6 caracteres
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox id="remember" />
            <Label htmlFor="remember" className="text-sm font-normal">
              Recordarme
            </Label>
          </div>
          <Link
            href="/recuperar-password"
            className="text-sm font-medium text-accent hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || success}
        >
          {isLoading ? (
            <>
              <Spinner className="mr-2" />
              Iniciando sesión...
            </>
          ) : success ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Sesión iniciada
            </>
          ) : (
            'Iniciar Sesión'
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          ¿No tienes una cuenta?{' '}
          <Link
            href="/registro"
            className="font-medium text-foreground hover:underline"
          >
            Regístrate aquí
          </Link>
        </p>
      </form>
    </>
  );
}
