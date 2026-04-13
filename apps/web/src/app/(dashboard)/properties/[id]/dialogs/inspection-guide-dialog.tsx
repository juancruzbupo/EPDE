'use client';

import type { InspectionChecklist, InspectionItemStatus, PropertySector } from '@epde/shared';
import { PROPERTY_SECTOR_LABELS } from '@epde/shared';
import { Eye } from 'lucide-react';

import { InspectionGuideRenderer } from '@/components/inspection-guide-renderer';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

import { STATUS_CONFIG } from '../inspection-status-config';

type InspectionItem = InspectionChecklist['items'][0];

interface InspectionGuideDialogProps {
  item: InspectionItem | null;
  onClose: () => void;
}

/**
 * Full-screen (on mobile) inspection guide viewer: sector/status badges,
 * rich markdown guide or legacy structured description, reference images,
 * and any previously-recorded finding.
 */
export function InspectionGuideDialog({ item, onClose }: InspectionGuideDialogProps) {
  return (
    <Dialog
      open={!!item}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            {item?.name}
          </DialogTitle>
          <div className="flex gap-2 pt-1">
            {item?.sector && (
              <Badge variant="outline" className="text-xs">
                {PROPERTY_SECTOR_LABELS[item.sector as PropertySector] ?? item.sector}
              </Badge>
            )}
            {item?.status && item.status !== 'PENDING' && (
              <Badge
                variant={STATUS_CONFIG[item.status as InspectionItemStatus]?.variant ?? 'secondary'}
                className="text-xs"
              >
                {STATUS_CONFIG[item.status as InspectionItemStatus]?.label ?? item.status}
              </Badge>
            )}
          </div>
        </DialogHeader>

        {/* Rich guide renderer or fallback to description */}
        {item?.inspectionGuide ? (
          <InspectionGuideRenderer content={item.inspectionGuide} />
        ) : item?.description ? (
          item.description.includes('##') ? (
            <InspectionGuideRenderer content={item.description} />
          ) : (
            <div className="space-y-3">
              <InspectionGuideContent description={item.description} />
            </div>
          )
        ) : null}

        {/* Guide images gallery */}
        {item?.guideImageUrls && item.guideImageUrls.length > 0 && (
          <>
            <Separator />
            <div>
              <p className="text-muted-foreground mb-2 text-xs font-semibold">
                Imágenes de referencia
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {item.guideImageUrls.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`Referencia ${i + 1} para ${item.name}`}
                    loading="lazy"
                    className="rounded-lg border object-cover"
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {item?.finding && (
          <>
            <Separator />
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                Hallazgo registrado
              </p>
              <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">{item.finding}</p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Parses legacy technicalDescription into formatted sections with highlighted criteria. */
function InspectionGuideContent({ description }: { description: string }) {
  // Split by "ATENCIÓN si:" and "PROFESIONAL si:" / "PROFESIONAL URGENTE si:"
  const attentionMatch = description.match(/ATENCIÓN si:\s*(.*?)(?=PROFESIONAL|$)/s);
  const professionalMatch = description.match(/PROFESIONAL(?:\s+URGENTE)?\s+si:\s*(.*?)$/s);

  // Main text is everything before "ATENCIÓN si:" or "PROFESIONAL si:"
  const mainText = description
    .replace(/ATENCIÓN si:.*$/s, '')
    .replace(/PROFESIONAL(?:\s+URGENTE)?\s+si:.*$/s, '')
    .trim();

  return (
    <>
      <p className="text-foreground text-sm leading-relaxed">{mainText}</p>

      {attentionMatch?.[1] && (
        <div className="border-warning/30 bg-warning/10 rounded-lg border p-3">
          <p className="type-label-sm text-warning font-semibold">
            ⚠️ Marcar &quot;Necesita atención&quot; si:
          </p>
          <p className="type-body-sm text-warning/90 mt-1">
            {attentionMatch[1].trim().replace(/\.\s*$/, '')}
          </p>
        </div>
      )}

      {professionalMatch?.[1] && (
        <div className="border-destructive/30 bg-destructive/10 rounded-lg border p-3">
          <p className="type-label-sm text-destructive font-semibold">
            🔴 Marcar &quot;Requiere profesional&quot; si:
          </p>
          <p className="type-body-sm text-destructive/90 mt-1">
            {professionalMatch[1].trim().replace(/\.\s*$/, '')}
          </p>
        </div>
      )}
    </>
  );
}
