'use client';

import type { LandingFaqItem } from '@epde/shared';
import { Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export function FaqCard({
  data,
  onSave,
  isPending,
}: {
  data: LandingFaqItem[];
  onSave: (value: LandingFaqItem[]) => void;
  isPending: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [items, setItems] = useState(data);

  useEffect(() => setItems(data), [data]);

  const startEditing = () => {
    setItems(data);
    setEditing(true);
  };
  const addItem = () => setItems([...items, { question: '', answer: '' }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: 'question' | 'answer', value: string) => {
    setItems((prev) => prev.map((item, idx) => (idx === i ? { ...item, [field]: value } : item)));
  };

  if (!editing) {
    return (
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Preguntas Frecuentes ({data.length})</CardTitle>
          <Button variant="outline" size="sm" onClick={startEditing}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.map((faq, i) => (
            <div key={i} className="border-border rounded-lg border p-3">
              <p className="font-medium">{faq.question}</p>
              <p className="type-body-sm text-muted-foreground mt-1">{faq.answer}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Editar FAQ</CardTitle>
        <Button variant="outline" size="sm" onClick={addItem}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((faq, i) => (
          <div key={i} className="border-border space-y-2 rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <Label>Pregunta {i + 1}</Label>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Eliminar pregunta"
                onClick={() => removeItem(i)}
              >
                <Trash2 className="text-destructive h-4 w-4" />
              </Button>
            </div>
            <Input
              value={faq.question}
              onChange={(e) => updateItem(i, 'question', e.target.value)}
              placeholder="Pregunta"
            />
            <Textarea
              value={faq.answer}
              onChange={(e) => updateItem(i, 'answer', e.target.value)}
              placeholder="Respuesta"
            />
          </div>
        ))}
        <div className="flex gap-2">
          <Button
            onClick={() => {
              onSave(items.filter((f) => f.question.trim()));
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
