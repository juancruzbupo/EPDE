import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';

import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { SearchInput } from '@/components/search-input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Smoke tests de accesibilidad con axe-core. Garantizan que los
 * componentes base no regresen en las reglas WCAG 2.2 AA más
 * comunes (roles, contrast, form-label association).
 *
 * Si una nueva regla falla acá, el arreglo va en el componente —
 * NO deshabilitar la regla a menos que haya justificación documentada.
 */
describe('a11y: base components', () => {
  it('Button has no axe violations', async () => {
    const { container } = render(<Button>Continuar</Button>);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('Input with associated Label has no axe violations', async () => {
    const { container } = render(
      <>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" />
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('Badge has no axe violations', async () => {
    const { container } = render(<Badge>Nuevo</Badge>);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('SearchInput has no axe violations', async () => {
    const { container } = render(
      <SearchInput value="" onChange={() => {}} placeholder="Buscar por nombre o email..." />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('EmptyState has no axe violations', async () => {
    const { container } = render(
      <EmptyState title="Sin resultados" message="Probá ajustar los filtros." />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('ErrorState has no axe violations', async () => {
    const { container } = render(
      <ErrorState message="No se pudieron cargar los datos" onRetry={() => {}} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
