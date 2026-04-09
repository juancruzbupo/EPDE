'use client';

import { getErrorMessage, updateProfileSchema } from '@epde/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateProfile } from '@/lib/auth';

const profileSchema = updateProfileSchema;
type ProfileFormData = z.infer<typeof profileSchema>;

export function ProfileForm({
  user,
  onSuccess,
}: {
  user: { name: string; phone: string | null };
  onSuccess: () => Promise<void>;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name,
      phone: user.phone ?? '',
    },
  });

  async function onSubmit(data: ProfileFormData) {
    setIsLoading(true);
    try {
      await updateProfile(data);
      await onSuccess();
      toast.success('Perfil actualizado');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Error al actualizar perfil'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Editar perfil</CardTitle>
        <CardDescription>Modificá tu nombre y teléfono de contacto.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Nombre <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Tu nombre completo"
              required
              aria-describedby={errors.name ? 'profile-name-error' : undefined}
              {...register('name')}
            />
            {errors.name && (
              <p id="profile-name-error" role="alert" className="text-destructive text-sm">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-muted-foreground">
              Teléfono
            </Label>
            <Input
              id="phone"
              placeholder="+54 11 1234-5678"
              aria-describedby={errors.phone ? 'profile-phone-error' : undefined}
              {...register('phone')}
            />
            {errors.phone && (
              <p id="profile-phone-error" role="alert" className="text-destructive text-sm">
                {errors.phone.message}
              </p>
            )}
          </div>

          <Button type="submit" disabled={isLoading || !isDirty}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar cambios
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
