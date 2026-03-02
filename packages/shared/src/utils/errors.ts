export function getErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object') {
    if ('response' in error) {
      const data = (error as { response?: { data?: { message?: string } } }).response?.data;
      if (data?.message) return data.message;
    }
    if ('message' in error && typeof (error as { message: unknown }).message === 'string') {
      return (error as { message: string }).message;
    }
  }
  return fallback;
}
