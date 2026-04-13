'use client';

import type { CreateTaskTemplateInput } from '@epde/shared';
import { useState } from 'react';
import { Controller, type UseFormReturn } from 'react-hook-form';

import { InspectionGuideRenderer } from '@/components/inspection-guide-renderer';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// ─── Markdown ↔ Structured Fields ────────────────────

interface GuideFields {
  whatToLook: string;
  criteriaOk: string;
  criteriaAttention: string;
  criteriaProfessional: string;
  procedure: string;
  normative: string;
  notes: string;
}

const EMPTY_FIELDS: GuideFields = {
  whatToLook: '',
  criteriaOk: '',
  criteriaAttention: '',
  criteriaProfessional: '',
  procedure: '',
  normative: '',
  notes: '',
};

export function parseGuideToFields(md: string | undefined): GuideFields {
  if (!md) return { ...EMPTY_FIELDS };

  const sections = md.split(/^## /m).filter(Boolean);
  const fields: GuideFields = { ...EMPTY_FIELDS };

  for (const block of sections) {
    const lines = block.trim().split('\n');
    const title = (lines[0] ?? '').toLowerCase();
    const body = lines.slice(1).join('\n').trim();
    const items = body
      .split('\n')
      .map((l) =>
        l
          .replace(/^[-*]\s+/, '')
          .replace(/^\d+\.\s+/, '')
          .trim(),
      )
      .filter((l) => l && !l.startsWith('|') && !l.startsWith('---'));

    if (title.includes('qué buscar') || title.includes('que buscar')) {
      fields.whatToLook = items.join('\n');
    } else if (title.includes('cómo evaluar') || title.includes('como evaluar')) {
      const tableLines = body.split('\n').filter((l) => l.includes('|') && !l.includes('---'));
      for (const line of tableLines) {
        const cells = line
          .split('|')
          .map((c) => c.trim())
          .filter(Boolean);
        if (cells.length >= 2) {
          const st = cells[0] ?? '';
          const cr = cells[1] ?? '';
          if (st.toLowerCase() === 'estado') continue;
          if (st.includes('OK') || st.includes('✅')) fields.criteriaOk = cr;
          else if (st.includes('Atención') || st.includes('⚠')) fields.criteriaAttention = cr;
          else if (st.includes('Profesional') || st.includes('🔴'))
            fields.criteriaProfessional = cr;
        }
      }
    } else if (title.includes('procedimiento')) {
      fields.procedure = items.join('\n');
    } else if (title.includes('normativa')) {
      fields.normative = items.join('\n');
    } else if (
      title.includes('tip') ||
      title.includes('nota') ||
      title.includes('importante') ||
      title.includes('peligro')
    ) {
      fields.notes = (fields.notes ? fields.notes + '\n' : '') + body.replace(/\*\*/g, '');
    }
  }
  return fields;
}

export function fieldsToMarkdown(f: GuideFields): string {
  const parts: string[] = [];
  if (f.whatToLook.trim()) {
    parts.push(
      '## Qué buscar\n' +
        f.whatToLook
          .split('\n')
          .filter((l) => l.trim())
          .map((l) => `- ${l.trim()}`)
          .join('\n'),
    );
  }
  if (f.criteriaOk.trim() || f.criteriaAttention.trim() || f.criteriaProfessional.trim()) {
    parts.push(
      '## Cómo evaluar\n| Estado | Criterio |\n|--------|----------|\n' +
        (f.criteriaOk.trim() ? `| ✅ OK | ${f.criteriaOk.trim()} |\n` : '') +
        (f.criteriaAttention.trim() ? `| ⚠️ Atención | ${f.criteriaAttention.trim()} |\n` : '') +
        (f.criteriaProfessional.trim()
          ? `| 🔴 Profesional | ${f.criteriaProfessional.trim()} |`
          : ''),
    );
  }
  if (f.procedure.trim()) {
    parts.push(
      '## Procedimiento\n' +
        f.procedure
          .split('\n')
          .filter((l) => l.trim())
          .map((l, i) => `${i + 1}. ${l.trim()}`)
          .join('\n'),
    );
  }
  if (f.normative.trim()) {
    parts.push(
      '## Normativa\n' +
        f.normative
          .split('\n')
          .filter((l) => l.trim())
          .map((l) => `- ${l.trim()}`)
          .join('\n'),
    );
  }
  if (f.notes.trim()) {
    parts.push('## Nota\n' + f.notes.trim());
  }
  return parts.join('\n\n');
}

// ─── Guide Editor Component ─────────────────────────

export function GuideEditorSection({
  control,
}: {
  control: UseFormReturn<CreateTaskTemplateInput>['control'];
}) {
  const [previewMode, setPreviewMode] = useState(false);

  return (
    <Controller
      name="inspectionGuide"
      control={control}
      render={({ field }) => {
        const fields = parseGuideToFields(field.value);

        const updateField = (key: keyof GuideFields, value: string) => {
          const updated = { ...fields, [key]: value };
          field.onChange(fieldsToMarkdown(updated));
        };

        const hasContent = field.value && field.value.trim().length > 0;

        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Guía de inspección</Label>
              {hasContent && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => setPreviewMode(!previewMode)}
                >
                  {previewMode ? 'Editar' : 'Vista previa'}
                </Button>
              )}
            </div>

            {previewMode && field.value ? (
              <div className="border-border max-h-60 overflow-y-auto rounded-md border p-3">
                <InspectionGuideRenderer content={field.value} />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">
                    🔍 Qué buscar (uno por línea)
                  </Label>
                  <Textarea
                    value={fields.whatToLook}
                    onChange={(e) => updateField('whatToLook', e.target.value)}
                    rows={3}
                    placeholder="Fisuras diagonales en uniones&#10;Manchas blancas (eflorescencias)&#10;Armadura expuesta u oxidada"
                    className="text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <div className="space-y-1">
                    <Label className="type-label-sm text-success">✅ Criterio OK</Label>
                    <input
                      value={fields.criteriaOk}
                      onChange={(e) => updateField('criteriaOk', e.target.value)}
                      placeholder="Sin fisuras nuevas, estructura firme"
                      className="border-input bg-background w-full rounded-md border px-3 py-1.5 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="type-label-sm text-warning">
                      ⚠️ Criterio Necesita atención
                    </Label>
                    <input
                      value={fields.criteriaAttention}
                      onChange={(e) => updateField('criteriaAttention', e.target.value)}
                      placeholder="Fisura <2mm o nueva desde última visita"
                      className="border-input bg-background w-full rounded-md border px-3 py-1.5 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="type-label-sm text-destructive">
                      🔴 Criterio Requiere profesional
                    </Label>
                    <input
                      value={fields.criteriaProfessional}
                      onChange={(e) => updateField('criteriaProfessional', e.target.value)}
                      placeholder="Fisura >2mm, armadura oxidada, deformación"
                      className="border-input bg-background w-full rounded-md border px-3 py-1.5 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">
                    📝 Procedimiento (uno por línea, se numera automático)
                  </Label>
                  <Textarea
                    value={fields.procedure}
                    onChange={(e) => updateField('procedure', e.target.value)}
                    rows={3}
                    placeholder="Marcar fisuras con cinta y fecha&#10;Medir ancho con regla milimetrada&#10;Fotografiar con referencia de escala"
                    className="text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">
                    📋 Normativa (una por línea)
                  </Label>
                  <Textarea
                    value={fields.normative}
                    onChange={(e) => updateField('normative', e.target.value)}
                    rows={2}
                    placeholder="CIRSOC 200 — estructuras de hormigón&#10;AEA 90364 — instalaciones eléctricas"
                    className="text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">
                    💡 Notas adicionales (opcional)
                  </Label>
                  <Textarea
                    value={fields.notes}
                    onChange={(e) => updateField('notes', e.target.value)}
                    rows={2}
                    placeholder="Usar linterna en zonas oscuras"
                    className="text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        );
      }}
    />
  );
}
