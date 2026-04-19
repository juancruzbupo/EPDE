import { getErrorMessage, QUERY_KEYS } from '@epde/shared';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { toast } from 'sonner';

import {
  useCancelTechnicalInspection,
  useCreateTechnicalInspection,
  useMarkTechnicalInspectionPaid,
  useScheduleTechnicalInspection,
  useTechnicalInspection,
  useTechnicalInspections,
  useUpdateTechnicalInspectionStatus,
  useUploadTechnicalInspectionDeliverable,
} from '../use-technical-inspections';

vi.mock('@tanstack/react-query', () => ({
  useInfiniteQuery: vi.fn(),
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@epde/shared', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, getErrorMessage: vi.fn((_err: unknown, fallback: string) => fallback) };
});

vi.mock('@/lib/api/technical-inspections', () => ({
  getTechnicalInspections: vi.fn(),
  getTechnicalInspection: vi.fn(),
  createTechnicalInspection: vi.fn(),
  scheduleTechnicalInspection: vi.fn(),
  updateTechnicalInspectionStatus: vi.fn(),
  uploadTechnicalInspectionDeliverable: vi.fn(),
  markTechnicalInspectionPaid: vi.fn(),
  cancelTechnicalInspection: vi.fn(),
}));

describe('useTechnicalInspections queries', () => {
  beforeEach(() => {
    vi.mocked(useInfiniteQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as ReturnType<typeof useInfiniteQuery>);
    vi.mocked(useQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
    } as ReturnType<typeof useQuery>);
  });

  it('list hook calls useInfiniteQuery with QUERY_KEYS.technicalInspections', () => {
    renderHook(() => useTechnicalInspections({ status: 'REPORT_READY' }));
    const call = vi.mocked(useInfiniteQuery).mock.calls[0]?.[0];
    expect(call?.queryKey[0]).toBe(QUERY_KEYS.technicalInspections);
    expect(call?.queryKey[1]).toEqual({ status: 'REPORT_READY' });
  });

  it('detail hook is enabled only when id is truthy', () => {
    renderHook(() => useTechnicalInspection('insp-123'));
    const call = vi.mocked(useQuery).mock.calls[0]?.[0];
    expect(call?.enabled).toBe(true);
    expect(call?.queryKey).toEqual([QUERY_KEYS.technicalInspections, 'insp-123']);
  });

  it('detail hook is disabled with empty id', () => {
    renderHook(() => useTechnicalInspection(''));
    const call = vi.mocked(useQuery).mock.calls.at(-1)?.[0];
    expect(call?.enabled).toBe(false);
  });
});

describe('useTechnicalInspections mutations', () => {
  const mockInvalidate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useQueryClient).mockReturnValue({
      invalidateQueries: mockInvalidate,
    } as unknown as ReturnType<typeof useQueryClient>);
    vi.mocked(useMutation).mockImplementation(
      (options) =>
        ({
          mutate: vi.fn(),
          mutateAsync: vi.fn(),
          ...options,
        }) as unknown as ReturnType<typeof useMutation>,
    );
  });

  it('create mutation emits success toast + invalidates list', () => {
    const { result } = renderHook(() => useCreateTechnicalInspection());
    const options = vi.mocked(useMutation).mock.calls[0]?.[0] as {
      onSuccess: () => void;
      onError: (err: unknown) => void;
    };
    options.onSuccess();
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('Informe solicitado'));
    expect(mockInvalidate).toHaveBeenCalledWith({
      queryKey: [QUERY_KEYS.technicalInspections],
    });
    expect(result.current).toBeDefined();
  });

  it('create mutation surfaces error via toast', () => {
    renderHook(() => useCreateTechnicalInspection());
    const options = vi.mocked(useMutation).mock.calls[0]?.[0] as {
      onError: (err: unknown) => void;
    };
    options.onError(new Error('boom'));
    expect(getErrorMessage).toHaveBeenCalledWith(expect.any(Error), 'Error al solicitar informe');
    expect(toast.error).toHaveBeenCalled();
  });

  it('schedule mutation invalidates both list and detail', () => {
    renderHook(() => useScheduleTechnicalInspection('insp-1'));
    const options = vi.mocked(useMutation).mock.calls[0]?.[0] as {
      onSuccess: () => void;
    };
    options.onSuccess();
    expect(mockInvalidate).toHaveBeenCalledWith({
      queryKey: [QUERY_KEYS.technicalInspections],
    });
    expect(mockInvalidate).toHaveBeenCalledWith({
      queryKey: [QUERY_KEYS.technicalInspections, 'insp-1'],
    });
  });

  it('updateStatus mutation success toast says Estado actualizado', () => {
    renderHook(() => useUpdateTechnicalInspectionStatus('insp-1'));
    const options = vi.mocked(useMutation).mock.calls[0]?.[0] as {
      onSuccess: () => void;
    };
    options.onSuccess();
    expect(toast.success).toHaveBeenCalledWith('Estado actualizado');
  });

  it('uploadDeliverable mutation notifies cliente puede pagar', () => {
    renderHook(() => useUploadTechnicalInspectionDeliverable('insp-1'));
    const options = vi.mocked(useMutation).mock.calls[0]?.[0] as {
      onSuccess: () => void;
    };
    options.onSuccess();
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('cliente ya puede verlo'));
  });

  it('markPaid mutation success toast registers pago', () => {
    renderHook(() => useMarkTechnicalInspectionPaid('insp-1'));
    const options = vi.mocked(useMutation).mock.calls[0]?.[0] as {
      onSuccess: () => void;
    };
    options.onSuccess();
    expect(toast.success).toHaveBeenCalledWith('Pago registrado');
  });

  it('cancel mutation success toast confirms cancelado', () => {
    renderHook(() => useCancelTechnicalInspection());
    const options = vi.mocked(useMutation).mock.calls[0]?.[0] as {
      onSuccess: () => void;
    };
    options.onSuccess();
    expect(toast.success).toHaveBeenCalledWith('Informe cancelado');
  });
});
