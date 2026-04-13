'use client';

import { Pencil, Save, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { LandingGeneral } from '@/types/landing-settings';

export function GeneralCard({
  data,
  onSave,
  isPending,
}: {
  data: LandingGeneral;
  onSave: (value: LandingGeneral) => void;
  isPending: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(data);

  useEffect(() => setForm(data), [data]);

  const startEditing = () => {
    setForm(data);
    setEditing(true);
  };

  if (!editing) {
    return (
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>General</CardTitle>
          <Button variant="outline" size="sm" onClick={startEditing}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <p className="type-label-md text-muted-foreground">Teléfono</p>
            <p className="font-medium">{data.phone}</p>
          </div>
          <div>
            <p className="type-label-md text-muted-foreground">Prueba social (hero)</p>
            <p className="font-medium">{data.socialProof}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Editar General</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Teléfono (formato: 5493435043696)</Label>
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <p className="type-body-sm text-muted-foreground">
            Número completo con código de país (54) y código de área. Se muestra en header y footer.
          </p>
        </div>
        <div className="space-y-2">
          <Label>Texto de prueba social</Label>
          <Input
            value={form.socialProof}
            onChange={(e) => setForm({ ...form, socialProof: e.target.value })}
          />
          <p className="type-body-sm text-muted-foreground">
            Se muestra en el hero de la landing. Ej: &quot;3 viviendas diagnosticadas en
            Paraná&quot;, &quot;10 familias confían en EPDE&quot;
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              onSave(form);
              setEditing(false);
            }}
            disabled={isPending}
          >
            <Save className="mr-2 h-4 w-4" />
            Guardar
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setForm(data);
              setEditing(false);
            }}
          >
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
