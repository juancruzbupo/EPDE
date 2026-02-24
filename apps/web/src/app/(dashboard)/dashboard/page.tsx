'use client';

import { useAuthStore } from '@/stores/auth-store';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div>
      <h1 className="text-2xl font-bold">Bienvenido, {user?.name}</h1>
      <p className="text-muted-foreground mt-2">
        Acá vas a ver el resumen de tus propiedades y tareas de mantenimiento.
      </p>
    </div>
  );
}
