'use client';

import type {
  LandingConsequenceExample,
  LandingFaqItem,
  LandingGeneral,
  LandingPricing,
} from '@epde/shared';
import { UserRole } from '@epde/shared';
import { Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { ErrorState } from '@/components/error-state';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageTransition } from '@/components/ui/page-transition';
import { SkeletonShimmer } from '@/components/ui/skeleton-shimmer';
import { Textarea } from '@/components/ui/textarea';
import { useLandingSettings, useUpdateLandingSetting } from '@/hooks/use-landing-settings';
import { useAuthStore } from '@/stores/auth-store';

const DEFAULT_PRICING: LandingPricing = {
  price: '$35.000',
  priceNote:
    'Válido para viviendas de tamaño estándar. Casas grandes o complejas pueden requerir evaluación adicional.',
  subscriptionMicrocopy:
    'Luego podés continuar con el monitoreo mensual si querés seguir manteniendo tu casa bajo control.',
  costDisclaimer:
    'Costos estimados en base a valores promedio de mercado en Paraná actualizados a marzo 2026. Los valores pueden variar según cada caso.',
};

const DEFAULT_FAQ: LandingFaqItem[] = [
  {
    question: '¿Cuánto dura el diagnóstico?',
    answer:
      'El relevamiento presencial lleva entre 2 y 4 horas, dependiendo del tamaño de la vivienda. El informe completo se entrega en 48-72 horas.',
  },
  {
    question: '¿Necesito estar presente durante la inspección?',
    answer:
      'Sí, es importante que estés durante el relevamiento para que podamos conversar sobre el historial de la vivienda y cualquier problema que hayas notado.',
  },
  {
    question: '¿El diagnóstico incluye reparaciones?',
    answer:
      'No. EPDE diagnostica y organiza. Si detectamos algo que requiere intervención, podés solicitar un presupuesto directamente desde la plataforma.',
  },
  {
    question: '¿Qué pasa después de los 6 meses de acceso?',
    answer:
      'Podés renovar la suscripción para seguir usando el sistema de seguimiento, recordatorios y actualización del ISV. El informe inicial es tuyo para siempre.',
  },
  {
    question: '¿Sirve para departamentos o solo casas?',
    answer:
      'Sirve para cualquier vivienda: casas, departamentos, dúplex y casas de campo. Adaptamos el diagnóstico a cada tipo de propiedad.',
  },
];

const DEFAULT_CONSEQUENCES: LandingConsequenceExample[] = [
  {
    problem: 'Filtración en techo',
    preventive: '$150.000 – $400.000',
    emergency: '$2.500.000 – $6.000.000',
  },
  {
    problem: 'Humedad de cimientos',
    preventive: '$300.000 – $800.000',
    emergency: '$3.500.000 – $9.000.000',
  },
  {
    problem: 'Falla eléctrica',
    preventive: '$80.000 – $180.000',
    emergency: '$1.200.000 – $3.500.000',
  },
];

const DEFAULT_GENERAL: LandingGeneral = {
  phone: '5493435043696',
  socialProof: 'Ya estamos trabajando con las primeras viviendas en Paraná',
};

// ─── General Card ──────────────────────────────────────────

function GeneralCard({
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

// ─── Pricing Card ──────────────────────────────────────────

function PricingCard({
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

// ─── FAQ Card ──────────────────────────────────────────────

function FaqCard({
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
              <Button variant="ghost" size="sm" onClick={() => removeItem(i)}>
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

// ─── Consequences Card ─────────────────────────────────────

function ConsequencesCard({
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
              <Button variant="ghost" size="sm" onClick={() => removeItem(i)}>
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

// ─── Main Page ─────────────────────────────────────────────

export default function LandingSettingsPage() {
  useEffect(() => {
    document.title = 'Landing | EPDE';
  }, []);

  const user = useAuthStore((s) => s.user);
  const { data: settings, isLoading, isError, refetch } = useLandingSettings();
  const updateSetting = useUpdateLandingSetting();

  if (user?.role !== UserRole.ADMIN) {
    return (
      <ErrorState message="Acceso denegado" onRetry={() => (window.location.href = '/dashboard')} />
    );
  }

  const general: LandingGeneral = (settings?.data?.general as LandingGeneral) ?? DEFAULT_GENERAL;
  const pricing: LandingPricing = (settings?.data?.pricing as LandingPricing) ?? DEFAULT_PRICING;
  const faq: LandingFaqItem[] = (settings?.data?.faq as LandingFaqItem[]) ?? DEFAULT_FAQ;
  const consequences: LandingConsequenceExample[] =
    (settings?.data?.consequences as LandingConsequenceExample[]) ?? DEFAULT_CONSEQUENCES;

  return (
    <PageTransition>
      <PageHeader
        title="Configuración de Landing"
        description="Editá el precio, las preguntas frecuentes y los costos de consecuencias de la landing page."
      />

      {isLoading ? (
        <div className="space-y-4">
          <SkeletonShimmer className="h-40 w-full" />
          <SkeletonShimmer className="h-60 w-full" />
          <SkeletonShimmer className="h-40 w-full" />
        </div>
      ) : isError ? (
        <ErrorState message="No se pudo cargar la configuración" onRetry={refetch} />
      ) : (
        <div className="space-y-6">
          <GeneralCard
            data={general}
            onSave={(value) => updateSetting.mutate({ key: 'general', value })}
            isPending={updateSetting.isPending}
          />
          <PricingCard
            data={pricing}
            onSave={(value) => updateSetting.mutate({ key: 'pricing', value })}
            isPending={updateSetting.isPending}
          />
          <FaqCard
            data={faq}
            onSave={(value) => updateSetting.mutate({ key: 'faq', value })}
            isPending={updateSetting.isPending}
          />
          <ConsequencesCard
            data={consequences}
            onSave={(value) => updateSetting.mutate({ key: 'consequences', value })}
            isPending={updateSetting.isPending}
          />
        </div>
      )}
    </PageTransition>
  );
}
