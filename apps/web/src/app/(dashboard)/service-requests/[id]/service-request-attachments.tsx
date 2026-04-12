'use client';

import type { ServiceRequestAttachmentPublic } from '@epde/shared';
import { formatRelativeDate, isServiceRequestTerminal } from '@epde/shared';
import { Download, Loader2, Paperclip, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAddServiceRequestAttachments } from '@/hooks/use-service-requests';
import { useUploadFile } from '@/hooks/use-upload';

function AttachmentItem({ attachment }: { attachment: ServiceRequestAttachmentPublic }) {
  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className="hover:bg-muted/50 flex items-center gap-3 rounded-lg p-2 transition-colors"
    >
      <Paperclip className="text-muted-foreground h-4 w-4 shrink-0" />
      <div className="flex-1 overflow-hidden">
        <p className="truncate text-sm font-medium" title={attachment.fileName}>
          {attachment.fileName}
        </p>
        <p className="text-muted-foreground text-xs">
          {formatRelativeDate(new Date(attachment.createdAt))}
        </p>
      </div>
      <Download className="text-muted-foreground h-4 w-4 shrink-0" />
    </a>
  );
}

interface ServiceRequestAttachmentsProps {
  serviceRequestId: string;
  attachments: ServiceRequestAttachmentPublic[];
  serviceRequestStatus: string;
}

export function ServiceRequestAttachments({
  serviceRequestId,
  attachments,
  serviceRequestStatus,
}: ServiceRequestAttachmentsProps) {
  const isTerminal = isServiceRequestTerminal(serviceRequestStatus);
  const uploadFile = useUploadFile();
  const addAttachments = useAddServiceRequestAttachments();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    setIsUploading(true);
    try {
      const uploaded: { url: string; fileName: string }[] = [];
      const failed: string[] = [];
      for (const file of files) {
        try {
          const url = await uploadFile.mutateAsync({ file, folder: 'service-requests' });
          uploaded.push({ url, fileName: file.name });
        } catch {
          failed.push(file.name);
        }
      }
      if (uploaded.length > 0) {
        await addAttachments.mutateAsync({ serviceRequestId, attachments: uploaded });
      }
      if (failed.length > 0) {
        toast.error(`No se pudieron subir: ${failed.join(', ')}`);
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!attachments.length && isTerminal) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle className="text-lg">Adjuntos</CardTitle>
        {!isTerminal && (
          <>
            <input
              ref={fileInputRef}
              id="sr-attachment-input"
              type="file"
              multiple
              accept="image/*,application/pdf"
              className="hidden"
              aria-label="Seleccionar archivos adjuntos"
              onChange={handleFileChange}
            />
            <Button
              variant="outline"
              size="sm"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              {isUploading ? 'Subiendo...' : 'Adjuntar archivo'}
            </Button>
            <p className="type-body-sm text-muted-foreground">Máx. 10 MB por archivo</p>
          </>
        )}
      </CardHeader>
      <CardContent>
        {attachments.length > 0 ? (
          <div className="space-y-1">
            {attachments.map((attachment) => (
              <AttachmentItem key={attachment.id} attachment={attachment} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">Sin adjuntos</p>
        )}
      </CardContent>
    </Card>
  );
}
