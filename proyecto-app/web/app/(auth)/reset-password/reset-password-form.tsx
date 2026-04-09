'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Eye, EyeOff, AlertCircle, Check } from 'lucide-react';
import type { ResetPasswordData } from '@/types';
import { resetPassword } from '@/lib/services/auth';

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [tokenError, setTokenError] = useState(false);
  const [formData, setFormData] = useState<ResetPasswordData>({
    token: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (!token) {
      setTokenError(true);
      return;
    }
    setFormData(prev => ({
      ...prev,
      token: token,
    }));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validación de contraseña
    if (formData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);

    const response = await resetPassword(formData);
    if (!response.success) {
      setError(response.message || 'No se pudo restablecer la contraseña. Verifica que el token sea válido.');
      setIsLoading(false);
      return;
    }

    setSuccess(true);

    // Redirigir a login después de 2 segundos
    setTimeout(() => {
      router.push('/login?reset=success');
    }, 2000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setError(null);
  };

  // Si no hay token, mostrar error
  if (tokenError) {
    return (
      <>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Restablecer Contraseña
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Se requiere un token válido para restablecer tu contraseña.
          </p>
        </div>

        <div className="mt-8">
          <div
            className="flex items-start gap-3 rounded-md bg-destructive/10 p-4 text-sm text-destructive"
            role="alert"
            aria-live="polite"
          >
            <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
            <p>El token no es válido o ha expirado. Por favor, solicita un nuevo enlace de recuperación.</p>
          </div>

          <Button variant="outline" className="mt-6 w-full" asChild>
            <Link href="/recuperar-password">
              Solicitar nuevo enlace
            </Link>
          </Button>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            ¿Recordaste tu contraseña?{' '}
            <Link
              href="/login"
              className="font-medium text-foreground hover:underline"
            >
              Vuelve a iniciar sesión
            </Link>
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Restablecer Contraseña
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ingresa tu nueva contraseña para restablecer el acceso a tu cuenta.
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
            <p>Contraseña actualizada exitosamente. Redirigiendo a inicio de sesión...</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <Label htmlFor="password">Nueva Contraseña</Label>
            <div className="relative mt-2">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={formData.password}
                onChange={handleChange}
                className="pr-10"
                placeholder="Mínimo 8 caracteres"
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
              Ingresa una nueva contraseña con mínimo 8 caracteres
            </p>
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
            <div className="relative mt-2">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={formData.confirmPassword}
                onChange={handleChange}
                className="pr-10"
                placeholder="Confirma tu contraseña"
                disabled={isLoading || success}
                aria-describedby="confirm-password-description"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            <p id="confirm-password-description" className="sr-only">
              Confirma que ambas contraseñas sean iguales
            </p>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || success}
        >
          {isLoading ? (
            <>
              <Spinner className="mr-2" />
              Restableciendo contraseña...
            </>
          ) : success ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Contraseña actualizada
            </>
          ) : (
            'Restablecer Contraseña'
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          ¿Recordaste tu contraseña?{' '}
          <Link
            href="/login"
            className="font-medium text-foreground hover:underline"
          >
            Inicia sesión aquí
          </Link>
        </p>
      </form>
    </>
  );
}
