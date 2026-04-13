'use client';

import { Pencil, Save, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { LandingPricing } from '@/types/landing-settings';

export function PricingCard({
  data,
  onSave,
  isPending,
}: {
  data: LandingPricing;
  onSave: (value: LandingPricing) => void;
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
          <CardTitle>Precio</CardTitle>
          <Button variant="outline" size="sm" onClick={startEditing}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-2xl font-bold">{data.price}</p>
          <p className="type-body-sm text-muted-foreground">{data.priceNote}</p>
          <p className="type-body-sm text-muted-foreground">{data.subscriptionMicrocopy}</p>
          <p className="type-body-sm text-muted-foreground/70">{data.costDisclaimer}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Editar Precio</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Precio</Label>
          <Input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Nota de precio</Label>
          <Textarea
            value={form.priceNote}
            onChange={(e) => setForm({ ...form, priceNote: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Microcopy de suscripción</Label>
          <Textarea
            value={form.subscriptionMicrocopy}
            onChange={(e) => setForm({ ...form, subscriptionMicrocopy: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Disclaimer de costos</Label>
          <Textarea
            value={form.costDisclaimer}
            onChange={(e) => setForm({ ...form, costDisclaimer: e.target.value })}
          />
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
