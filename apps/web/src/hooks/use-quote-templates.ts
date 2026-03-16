import { getErrorMessage, QUERY_KEYS } from '@epde/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  createQuoteTemplate,
  deleteQuoteTemplate,
  getQuoteTemplates,
  updateQuoteTemplate,
} from '@/lib/api/quote-templates';

const QT_KEY = [QUERY_KEYS.quoteTemplates] as const;

export function useQuoteTemplates() {
  return useQuery({
    queryKey: [...QT_KEY],
    queryFn: ({ signal }) => getQuoteTemplates(signal).then((r) => r.data),
  });
}

export function useCreateQuoteTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createQuoteTemplate,
    onSuccess: () => {
      toast.success('Plantilla de cotización creada');
      queryClient.invalidateQueries({ queryKey: [...QT_KEY] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Error al crear plantilla'));
    },
  });
}

export function useUpdateQuoteTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...dto
    }: {
      id: string;
      name?: string;
      items?: { description: string; quantity: number; unitPrice: number }[];
    }) => updateQuoteTemplate(id, dto),
    onSuccess: () => {
      toast.success('Plantilla actualizada');
      queryClient.invalidateQueries({ queryKey: [...QT_KEY] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Error al actualizar plantilla'));
    },
  });
}

export function useDeleteQuoteTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteQuoteTemplate,
    onSuccess: () => {
      toast.success('Plantilla eliminada');
      queryClient.invalidateQueries({ queryKey: [...QT_KEY] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Error al eliminar plantilla'));
    },
  });
}
