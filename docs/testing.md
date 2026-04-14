# Testing strategy

Quick reference for how EPDE's three apps run tests and how to keep the patterns aligned.

## Runners by workspace

| Workspace       | Runner                           | Transform  | Notes                                           |
| --------------- | -------------------------------- | ---------- | ----------------------------------------------- |
| `@epde/api`     | Jest 29 + `ts-jest`              | `ts-jest`  | TypeScript executes as-is; full TS syntax works |
| `@epde/shared`  | Vitest 4                         | native ESM | TypeScript executes as-is                       |
| `@epde/web`     | Vitest 4 + React Testing Library | native ESM | Component tests in `src/**/__tests__/`          |
| `@epde/mobile`  | Jest 29 + `jest-expo` (Babel)    | Babel      | No TS type annotations in mock callbacks        |
| `@epde/web` e2e | Playwright                       | —          | `apps/web/e2e/`                                 |

The mobile runner uses Babel, not `ts-jest`, so type assertions like `(x as jest.Mock)` parse but won't type-check in the test file itself. Keep mocks lean.

## Where tests live

| App      | Location                               | Example                                    |
| -------- | -------------------------------------- | ------------------------------------------ |
| api      | Co-located next to the source          | `apps/api/src/tasks/tasks.service.spec.ts` |
| shared   | `src/__tests__/` + `src/**/__tests__/` | `packages/shared/src/constants/__tests__/` |
| web unit | `src/**/__tests__/` next to component  | `apps/web/src/components/__tests__/…`      |
| web e2e  | `apps/web/e2e/`                        | `apps/web/e2e/inspection-to-plan.spec.ts`  |
| mobile   | Mixed — `__tests__/` per folder        | `apps/mobile/src/hooks/__tests__/…`        |

## Mocking convention by runner

### API (Jest + ts-jest)

- Mocks at the top of the file via `jest.mock('module-path', () => ({ … }))`.
- DI via `Test.createTestingModule({ providers: [Service, { provide: Repository, useValue: mock }] })`.
- Clear mocks in `beforeEach(() => { jest.clearAllMocks() })` or `afterEach`.
- Type assertions in test bodies are fine — `ts-jest` compiles TS.

### Shared (Vitest)

- `vi.mock('module-path', () => ({ … }))` at top of file.
- `vi.fn()` for function mocks; `vi.clearAllMocks()` in `beforeEach`.
- Imports resolve without build; run with `pnpm --filter @epde/shared test`.

### Web (Vitest + RTL)

- Same `vi.mock` / `vi.fn()` API as shared.
- For components, import from `@testing-library/react` and assert via `screen.getByRole`, `getByText`.
- Mock `next/navigation` and `next/link` when testing App Router components.

### Mobile (Jest + Babel)

- `jest.mock('react-native', () => ({ Alert: { alert: jest.fn() }, Platform: { OS: 'ios' } }))` — include every top-level module member the unit touches, because the full mock replaces the module.
- `jest.mock('@/lib/toast', () => ({ toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() } }))` when the hook surfaces toast feedback.
- Type casts in test bodies compile via Babel's TS plugin but aren't type-checked. Keep them minimal.

## Shared entity factories

`@epde/shared/testing` exports `makeUser`, `makeProperty`, `makePlan`, `makeTask`, `makeTaskDetail`, `makeTaskLog`, `makeBudgetRequest`. Each returns a minimal-valid entity shape with deterministic defaults. Prefer them over inline object literals so unrelated schema additions don't cascade-break specs:

```ts
// Don't
const task = {
  id: 'task-1',
  maintenancePlanId: 'plan-1',
  categoryId: 'category-1',
  name: 'x',
  priority: 'MEDIUM',
  recurrenceType: 'ANNUAL',
  recurrenceMonths: 12,
  // … 12 more fields
};

// Do
import { makeTask } from '@epde/shared/testing';
const task = makeTask({ priority: 'URGENT' });
```

Extend the factory when a new required field lands on the public type — every call site inherits the default, no test edits needed.

## Error-path coverage

The audit called out that web/mobile unit tests skew toward happy paths. When you touch a hook:

1. Add a spec for the success branch (toast/invalidate/haptics).
2. Add a spec for the error branch — confirm `toast.error` (mobile) or `toast.error` from `sonner` (web) gets called and the query cache rolls back when applicable.
3. For optimistic updates, add a spec that exercises the `onError` rollback explicitly.

## E2E

Playwright in `apps/web/e2e/`. Auth is fixtured via `apps/web/e2e/fixtures.ts`. Admin tours are disabled in `test.beforeEach` by seeding `localStorage` (see `inspection-to-plan.spec.ts`). Keep the skipped full-flow tests — land them when the UI surface stabilizes further.

## When in doubt

Match the runner's convention to avoid style drift. If a spec fails to parse, it's almost always because the runner mismatch (Babel vs ts-jest) swallowed a TS-level error — drop the type annotation or move the cast to a helper.
