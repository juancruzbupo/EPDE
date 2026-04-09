'use client';

import type { LandingConsequenceExample } from '@epde/shared';
import { Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ConsequencesCard({
  data,
  onSave,
  isPending,
}: {
  data: LandingConsequenceExample[];
  onSave: (value: LandingConsequenceExample[]) => void;
  isPending: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [items, setItems] = useState(data);

  useEffect(() => setItems(data), [data]);

  const startEditing = () => {
    setItems(data);
    setEditing(true);
  };
  const addItem = () => setItems([...items, { problem: '', preventive: '', emergency: '' }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof LandingConsequenceExample, value: string) => {
    setItems((prev) => prev.map((item, idx) => (idx === i ? { ...item, [field]: value } : item)));
  };

  if (!editing) {
    return (
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Costos de Consecuencias ({data.length})</CardTitle>
          <Button variant="outline" size="sm" onClick={startEditing}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.map((ex, i) => (
              <div
                key={i}
                className="border-border flex items-center justify-between rounded-lg border p-3"
              >
                <span className="font-medium">{ex.problem}</span>
                <div className="flex gap-4 text-sm">
                  <span className="text-success">{ex.preventive}</span>
                  <span className="text-destructive">{ex.emergency}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Editar Costos</CardTitle>
        <Button variant="outline" size="sm" onClick={addItem}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((ex, i) => (
          <div key={i} className="border-border space-y-2 rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <Label>Ejemplo {i + 1}</Label>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Eliminar ejemplo"
                onClick={() => removeItem(i)}
              >
                <Trash2 className="text-destructive h-4 w-4" />
              </Button>
            </div>
            <Input
              value={ex.problem}
              onChange={(e) => updateItem(i, 'problem', e.target.value)}
              placeholder="Problema (ej: Filtración en techo)"
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={ex.preventive}
                onChange={(e) => updateItem(i, 'preventive', e.target.value)}
                placeholder="Costo preventivo"
              />
              <Input
                value={ex.emergency}
                onChange={(e) => updateItem(i, 'emergency', e.target.value)}
                placeholder="Costo sin prevención"
              />
            </div>
          </div>
        ))}
        <div className="flex gap-2">
          <Button
            onClick={() => {
              onSave(items.filter((e) => e.problem.trim()));
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
              setItems(data);
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
