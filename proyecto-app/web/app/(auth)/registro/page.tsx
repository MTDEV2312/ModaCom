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
import type { RegisterData } from '@/types';
import { register } from '@/lib/services/auth';

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<RegisterData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    acceptTerms: false,
  });

  const validateForm = (): string | null => {
    if (!formData.firstName.trim()) {
      return 'El nombre es requerido';
    }
    if (!formData.lastName.trim()) {
      return 'El apellido es requerido';
    }
    if (!formData.email.includes('@')) {
      return 'Por favor ingresa un email válido';
    }
    if (formData.password.length < 8) {
      return 'La contraseña debe tener al menos 8 caracteres';
    }
    if (formData.password !== formData.confirmPassword) {
      return 'Las contraseñas no coinciden';
    }
    if (!formData.acceptTerms) {
      return 'Debes aceptar los términos y condiciones';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    const response = await register(formData);
    if (!response.success) {
      setError(response.message || 'No se pudo crear la cuenta');
      setIsLoading(false);
      return;
    }

    setSuccess(true);
    setIsLoading(false);
    setTimeout(() => {
      router.push('/login');
    }, 1200);
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
          Crear Cuenta
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Únete a MODA y disfruta de beneficios exclusivos.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
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
            <p>Cuenta creada exitosamente. Redirigiendo al inicio de sesión...</p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="firstName">Nombre</Label>
            <Input
              id="firstName"
              name="firstName"
              type="text"
              autoComplete="given-name"
              required
              value={formData.firstName}
              onChange={handleChange}
              className="mt-2"
              placeholder="Tu nombre"
              disabled={isLoading || success}
            />
          </div>
          <div>
            <Label htmlFor="lastName">Apellido</Label>
            <Input
              id="lastName"
              name="lastName"
              type="text"
              autoComplete="family-name"
              required
              value={formData.lastName}
              onChange={handleChange}
              className="mt-2"
              placeholder="Tu apellido"
              disabled={isLoading || success}
            />
          </div>
        </div>

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
          />
        </div>

        <div>
          <Label htmlFor="password">Contraseña</Label>
          <div className="relative mt-2">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              minLength={8}
              value={formData.password}
              onChange={handleChange}
              className="pr-10"
              placeholder="Mínimo 8 caracteres"
              disabled={isLoading || success}
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
        </div>

        <div>
          <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            value={formData.confirmPassword}
            onChange={handleChange}
            className="mt-2"
            placeholder="Repite tu contraseña"
            disabled={isLoading || success}
          />
        </div>

        <div className="flex items-start gap-2">
          <Checkbox
            id="acceptTerms"
            checked={formData.acceptTerms}
            onCheckedChange={(checked) => {
              setFormData(prev => ({ ...prev, acceptTerms: checked as boolean }));
              setError(null);
            }}
            disabled={isLoading || success}
            className="mt-1"
          />
          <Label htmlFor="acceptTerms" className="text-sm font-normal leading-relaxed">
            Acepto los{' '}
            <Link href="#" className="font-medium text-accent hover:underline">
              Términos y Condiciones
            </Link>{' '}
            y la{' '}
            <Link href="#" className="font-medium text-accent hover:underline">
              Política de Privacidad
            </Link>
          </Label>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || success}
        >
          {isLoading ? (
            <>
              <Spinner className="mr-2" />
              Creando cuenta...
            </>
          ) : success ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Cuenta creada
            </>
          ) : (
            'Crear Cuenta'
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          ¿Ya tienes una cuenta?{' '}
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
