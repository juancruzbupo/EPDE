'use client';

import type { ProfessionalAttachmentPublic, ProfessionalAttachmentType } from '@epde/shared';
import { PROFESSIONAL_ATTACHMENT_TYPE_LABELS } from '@epde/shared';
import { CheckCircle, Download, FileText, Trash2, Upload } from 'lucide-react';
import { useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useCreateAttachment,
  useDeleteAttachment,
  useVerifyAttachment,
} from '@/hooks/use-professionals';
import { useUploadFile } from '@/hooks/use-upload';

function AttachmentCard({
  attachment,
  professionalId,
}: {
  attachment: ProfessionalAttachmentPublic;
  professionalId: string;
}) {
  const verify = useVerifyAttachment(professionalId);
  const remove = useDeleteAttachment(professionalId);

  const now = Date.now();
  const expiresAt = attachment.expiresAt ? new Date(attachment.expiresAt).getTime() : null;
  const isExpired = expiresAt !== null && expiresAt < now;
  const isExpiring =
    expiresAt !== null && expiresAt >= now && (expiresAt - now) / (1000 * 60 * 60 * 24) <= 30;

  return (
    <Card className={isExpired ? 'border-destructive/30' : isExpiring ? 'border-warning/30' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <FileText className="text-muted-foreground h-4 w-4" />
              <p className="truncate text-sm font-medium">
                {PROFESSIONAL_ATTACHMENT_TYPE_LABELS[attachment.type]}
              </p>
              {attachment.verifiedAt && (
                <Badge variant="success" className="text-xs">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Verificado
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground truncate text-xs">{attachment.fileName}</p>
            {attachment.expiresAt && (
              <p
                className={`mt-1 text-xs ${
                  isExpired
                    ? 'text-destructive'
                    : isExpiring
                      ? 'text-warning'
                      : 'text-muted-foreground'
                }`}
              >
                {isExpired ? 'Vencida' : isExpiring ? 'Próxima a vencer' : 'Vence'}:{' '}
                {new Date(attachment.expiresAt).toLocaleDateString('es-AR')}
              </p>
            )}
          </div>
        </div>
        <div className="mt-3 flex gap-1.5">
          <Button asChild size="sm" variant="outline" className="text-xs">
            <a href={attachment.url} target="_blank" rel="noopener noreferrer">
              <Download className="mr-1 h-3 w-3" />
              Ver
            </a>
          </Button>
          {!attachment.verifiedAt && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={() => verify.mutate(attachment.id)}
              disabled={verify.isPending}
            >
              Verificar
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive text-xs"
            onClick={() => remove.mutate(attachment.id)}
            disabled={remove.isPending}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function AttachmentsTab({
  professionalId,
  attachments,
}: {
  professionalId: string;
  attachments: ProfessionalAttachmentPublic[];
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [type, setType] = useState<ProfessionalAttachmentType>('MATRICULA');
  const [fileName, setFileName] = useState('');
  const [url, setUrl] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const upload = useUploadFile();
  const create = useCreateAttachment(professionalId);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const resultUrl = await upload.mutateAsync({ file, folder: 'uploads' });
    setUrl(resultUrl);
  };

  const handleSubmit = () => {
    if (!url || !fileName) return;
    if (type === 'MATRICULA' && !expiresAt) return;
    create.mutate(
      {
        type,
        url,
        fileName,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      },
      {
        onSuccess: () => {
          setDialogOpen(false);
          setFileName('');
          setUrl('');
          setExpiresAt('');
          setType('MATRICULA');
        },
      },
    );
  };

  const sortedAttachments = [...attachments].sort((a, b) => {
    const order: Record<ProfessionalAttachmentType, number> = {
      MATRICULA: 0,
      SEGURO_RC: 1,
      DNI: 2,
      CERTIFICADO_CURSO: 3,
      OTRO: 4,
    };
    return (order[a.type] ?? 9) - (order[b.type] ?? 9);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          Matrícula y seguro RC obligatorios con fecha de vencimiento.
        </p>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Upload className="mr-1.5 h-4 w-4" />
          Subir
        </Button>
      </div>

      {sortedAttachments.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
            <p className="text-muted-foreground text-sm">Sin documentos todavía</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {sortedAttachments.map((a) => (
            <AttachmentCard key={a.id} attachment={a} professionalId={professionalId} />
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Subir documento</DialogTitle>
            <DialogDescription>
              Matrícula y seguro RC requieren fecha de vencimiento.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="type">Tipo</Label>
              <Select value={type} onValueChange={(v) => setType(v as ProfessionalAttachmentType)}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PROFESSIONAL_ATTACHMENT_TYPE_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="file">Archivo</Label>
              <Input
                id="file"
                type="file"
                onChange={handleFileSelect}
                disabled={upload.isPending}
              />
              {upload.isPending && (
                <p className="text-muted-foreground mt-1 text-xs">Subiendo...</p>
              )}
              {url && <p className="text-success mt-1 text-xs">✓ {fileName}</p>}
            </div>
            {(type === 'MATRICULA' || type === 'SEGURO_RC') && (
              <div>
                <Label htmlFor="expires">Fecha de vencimiento *</Label>
                <Input
                  id="expires"
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>
            )}
            {type === 'MATRICULA' && !expiresAt && (
              <Alert>
                <AlertDescription className="text-xs">
                  La matrícula requiere fecha de vencimiento.
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={create.isPending || !url || (type === 'MATRICULA' && !expiresAt)}
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
