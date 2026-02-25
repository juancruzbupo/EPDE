# Design System

## Brand

| Atributo                    | Valor                                              |
| --------------------------- | -------------------------------------------------- |
| Nombre                      | EPDE — Estudio Profesional de Diagnostico Edilicio |
| Tipografia principal        | DM Sans (Google Fonts)                             |
| Tipografia headings landing | Playfair Display (Google Fonts)                    |

## Colores

### Paleta Principal

| Token            | Hex       | Uso                                              |
| ---------------- | --------- | ------------------------------------------------ |
| Primary          | `#C4704B` | Botones principales, links, acentos (terracotta) |
| Secondary        | `#E8DDD3` | Backgrounds suaves, hover states (arena)         |
| Background       | `#FFFFFF` | Fondo principal                                  |
| Foreground       | `#0a0a0a` | Texto principal                                  |
| Muted            | `#f5f5f5` | Fondos secundarios                               |
| Muted Foreground | `#737373` | Texto secundario                                 |
| Destructive      | `#dc2626` | Acciones destructivas, errores                   |
| Border           | `#e5e5e5` | Bordes                                           |

### Configuracion CSS (Tailwind CSS 4)

El proyecto usa Tailwind CSS 4 con `@theme inline` en `globals.css`:

```css
@import 'tailwindcss';

@theme inline {
  --color-background: #ffffff;
  --color-foreground: #0a0a0a;
  --font-sans: 'DM Sans', ui-sans-serif, system-ui, sans-serif;

  --color-primary: #c4704b;
  --color-primary-foreground: #ffffff;
  --color-secondary: #e8ddd3;
  --color-secondary-foreground: #1a1a1a;
  --color-muted: #f5f5f5;
  --color-muted-foreground: #737373;
  --color-accent: #e8ddd3;
  --color-accent-foreground: #1a1a1a;
  --color-destructive: #dc2626;
  --color-destructive-foreground: #ffffff;
  --color-border: #e5e5e5;
  --color-input: #e5e5e5;
  --color-ring: #c4704b;
  --color-card: #ffffff;
  --color-card-foreground: #0a0a0a;
  --color-popover: #ffffff;
  --color-popover-foreground: #0a0a0a;

  --color-sidebar-background: #ffffff;
  --color-sidebar-foreground: #0a0a0a;
  --color-sidebar-primary: #c4704b;
  --color-sidebar-primary-foreground: #ffffff;
  --color-sidebar-accent: #f5f5f5;
  --color-sidebar-accent-foreground: #0a0a0a;
  --color-sidebar-border: #e5e5e5;

  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
}
```

### Uso en componentes

```tsx
// Correcto — usar tokens de Tailwind
<div className="bg-primary text-primary-foreground" />
<div className="bg-secondary/20" />  // con opacidad
<div className="text-muted-foreground" />
<div className="border-border" />

// Incorrecto — no usar colores hardcodeados
<div className="bg-[#C4704B]" />
<div style={{ color: '#C4704B' }} />
```

## Componentes UI (shadcn/ui)

El proyecto usa [shadcn/ui](https://ui.shadcn.com/) estilo **new-york** con los siguientes componentes instalados:

### Componentes Disponibles

| Componente | Ubicacion                     | Notas                                                      |
| ---------- | ----------------------------- | ---------------------------------------------------------- |
| Alert      | `components/ui/alert.tsx`     | Mensajes de error/info/warning                             |
| Badge      | `components/ui/badge.tsx`     | Estados, etiquetas                                         |
| Button     | `components/ui/button.tsx`    | Variantes: default, secondary, outline, ghost, destructive |
| Card       | `components/ui/card.tsx`      | Contenedores de contenido                                  |
| Command    | `components/ui/command.tsx`   | Combobox/typeahead (usa cmdk)                              |
| Dialog     | `components/ui/dialog.tsx`    | Modales                                                    |
| Input      | `components/ui/input.tsx`     | Inputs de formulario                                       |
| Label      | `components/ui/label.tsx`     | Labels de formulario                                       |
| Popover    | `components/ui/popover.tsx`   | Tooltips interactivos, dropdowns                           |
| Select     | `components/ui/select.tsx`    | Select nativo mejorado                                     |
| Sheet      | `components/ui/sheet.tsx`     | Panel lateral (mobile sidebar)                             |
| Skeleton   | `components/ui/skeleton.tsx`  | Loading placeholders                                       |
| Table      | `components/ui/table.tsx`     | Tablas HTML estilizadas                                    |
| Textarea   | `components/ui/textarea.tsx`  | Textarea de formulario                                     |
| Separator  | `components/ui/separator.tsx` | Linea divisoria                                            |

### Agregar un nuevo componente shadcn

```bash
pnpm --filter @epde/web dlx shadcn@latest add <component-name>
```

## DataTable Reutilizable

Componente wrapper de TanStack Table en `components/data-table/data-table.tsx`:

```tsx
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean; // Muestra skeletons
  hasMore?: boolean; // Boton "Cargar mas"
  onLoadMore?: () => void;
  total?: number; // "X de Y resultados"
  emptyMessage?: string; // Default: "Sin resultados"
  onRowClick?: (row: TData) => void; // Click en fila para navegar
}
```

### Definir columnas

Cada pagina define sus columnas en un archivo `columns.tsx`:

```tsx
export const myColumns: ColumnDef<MyType>[] = [
  {
    accessorKey: 'title',
    header: 'Titulo',
    cell: ({ row }) => <Link href={`/my-entity/${row.original.id}`}>{row.original.title}</Link>,
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => <Badge variant="secondary">{STATUS_LABELS[row.original.status]}</Badge>,
  },
];
```

## Layout

### Dashboard Layout

- **Sidebar** (desktop): Fijo a la izquierda, 256px, con navegacion por rol
- **Header**: Fijo arriba, muestra nombre de usuario, notificaciones, mobile menu
- **Content**: Area principal con padding

### Navegacion por Rol

**ADMIN:**

- Dashboard, Clientes, Propiedades, Categorias, Presupuestos, Solicitudes

**CLIENT:**

- Dashboard, Mis Propiedades, Presupuestos, Solicitudes

### Iconos

Se usa [Lucide React](https://lucide.dev/) para iconos:

```tsx
import { Home, Users, FileText, Wrench } from 'lucide-react';
```

## Formularios

### Pattern con react-hook-form + Zod

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { mySchema, type MyInput } from '@epde/shared';

const form = useForm<MyInput>({
  resolver: zodResolver(mySchema),
  defaultValues: { ... },
});
```

### Campos opcionales numericos

Cuando un campo numerico es opcional y usa `z.coerce.number()`, agregar `setValueAs` para evitar que string vacio se convierta a 0:

```tsx
<Input
  type="number"
  {...register('yearBuilt', {
    setValueAs: (v: string) => (v === '' ? undefined : v),
  })}
/>
```

### Campos de fecha

HTML `<input type="date">` retorna `YYYY-MM-DD`. Usar `z.string().date()` (NO `z.string().datetime()`).

## Idioma

Toda la UI esta en **espanol**. Labels de enums se importan de `@epde/shared`:

```tsx
import { BUDGET_STATUS_LABELS, SERVICE_URGENCY_LABELS } from '@epde/shared';

// En JSX
{
  BUDGET_STATUS_LABELS[status];
} // "Pendiente", "Cotizado", etc.
```

Las fechas relativas usan `date-fns` con locale `es`:

```tsx
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

formatDistanceToNow(date, { addSuffix: true, locale: es });
// "hace 2 horas", "en 3 dias"
```
