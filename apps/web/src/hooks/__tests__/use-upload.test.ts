import { useMutation } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';

import { useUploadFile } from '../use-upload';

vi.mock('@tanstack/react-query', () => ({
  useMutation: vi.fn(),
}));

vi.mock('@epde/shared', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual };
});

vi.mock('@/lib/api-client', () => ({
  apiClient: { post: vi.fn() },
}));

describe('useUploadFile', () => {
  const mockMutationReturn = { mutate: vi.fn(), mutateAsync: vi.fn() };

  beforeEach(() => {
    vi.mocked(useMutation).mockReturnValue(mockMutationReturn as ReturnType<typeof useMutation>);
  });

  afterEach(() => vi.clearAllMocks());

  it('should call useMutation with mutationFn only (callers handle toasts)', () => {
    renderHook(() => useUploadFile());
    const config = vi.mocked(useMutation).mock.calls[0][0] as Record<string, unknown>;
    expect(config.mutationFn).toEqual(expect.any(Function));
    expect(config.onSuccess).toBeUndefined();
    expect(config.onError).toBeUndefined();
  });

  it('should validate file before uploading', async () => {
    renderHook(() => useUploadFile());
    const { mutationFn } = vi.mocked(useMutation).mock.calls[0][0] as {
      mutationFn: (args: { file: File; folder: string }) => Promise<string>;
    };

    const oversizedFile = new File(['x'], 'big.jpg', { type: 'image/jpeg' });
    Object.defineProperty(oversizedFile, 'size', { value: 11 * 1024 * 1024 });

    await expect(mutationFn({ file: oversizedFile, folder: 'test' })).rejects.toThrow(
      'El archivo excede el tamaño máximo de 10 MB',
    );
  });

  it('should reject invalid MIME types', async () => {
    renderHook(() => useUploadFile());
    const { mutationFn } = vi.mocked(useMutation).mock.calls[0][0] as {
      mutationFn: (args: { file: File; folder: string }) => Promise<string>;
    };

    const badFile = new File(['x'], 'script.exe', { type: 'application/x-msdownload' });

    await expect(mutationFn({ file: badFile, folder: 'test' })).rejects.toThrow(
      'Tipo de archivo no permitido',
    );
  });
});
