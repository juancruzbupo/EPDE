import '@testing-library/jest-dom/vitest';

import { vi } from 'vitest';

// Mock next/navigation — required by pages that use usePathname, useRouter, etc.
vi.mock('next/navigation', () => ({
  usePathname: () => '/test',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));
