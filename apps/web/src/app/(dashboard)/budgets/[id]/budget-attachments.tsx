'use client';

import type { BudgetAttachmentPublic } from '@epde/shared';
import { formatRelativeDate, isBudgetTerminal } from '@epde/shared';
import { Download, Loader2, Paperclip, Upload } from 'lucide-react';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAddBudgetAttachments } from '@/hooks/use-budgets';
import { useUploadFile } from '@/hooks/use-upload';

function AttachmentItem({ attachment }: { attachment: BudgetAttachmentPublic }) {
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

interface BudgetAttachmentsProps {
  budgetId: string;
  attachments: BudgetAttachmentPublic[];
  budgetStatus: string;
}

export function BudgetAttachments({ budgetId, attachments, budgetStatus }: BudgetAttachmentsProps) {
  const isTerminal = isBudgetTerminal(budgetStatus);
  const uploadFile = useUploadFile();
  const addAttachments = useAddBudgetAttachments();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    setIsUploading(true);
    try {
      const uploaded: { url: string; fileName: string }[] = [];
      for (const file of files) {
        const url = await uploadFile.mutateAsync({ file, folder: 'budgets' });
        uploaded.push({ url, fileName: file.name });
      }
      await addAttachments.mutateAsync({ budgetId, attachments: uploaded });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!attachments.length && isTerminal) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Adjuntos</CardTitle>
        {!isTerminal && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,application/pdf"
              className="hidden"
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
