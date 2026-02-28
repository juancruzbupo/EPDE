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

El proyecto usa Tailwind CSS 4 con `@theme inline` en `globals.css`. Los tokens se definen en dos capas:

1. `@theme inline` — registra custom properties como tokens de Tailwind (genera clases utilitarias)
2. `:root` — define los valores hex reales de la marca

```css
@import 'tailwindcss';

@theme inline {
  --font-heading: 'Playfair Display', serif;
  --radius-sm: calc(var(--radius) - 4px);
  /* ... radius tokens ... */
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-ring: var(--ring);
  /* ... sidebar, chart, popover, card tokens ... */
}

:root {
  --radius: 0.625rem;
  --background: #fafaf8;
  --foreground: #2e2a27;
  --primary: #c4704b; /* Terracotta */
  --primary-foreground: #fafaf8;
  --secondary: #e8ddd3; /* Arena */
  --secondary-foreground: #2e2a27;
  --muted: #f5f0eb;
  --muted-foreground: #4a4542;
  --accent: #e8ddd3;
  --destructive: #c45b4b;
  --border: #e8ddd3;
  --ring: #c4704b;
  /* ... sidebar, chart tokens ... */
}
```

### Tipografia

- **Body**: `DM Sans` — aplicado via `body { font-family }` en globals.css
- **Headings (landing/auth)**: `Playfair Display` — clase utilitaria `font-heading` generada por `--font-heading` en `@theme inline`

```tsx
// Uso de font-heading
<h1 className="font-heading text-3xl font-bold">EPDE</h1>
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

## Style Maps Centralizados

Los mapas de variantes y colores para Badges estan centralizados en `lib/style-maps.ts`. **No duplicar** en cada componente:

```typescript
import { priorityColors, taskStatusVariant, budgetStatusVariant } from '@/lib/style-maps';

// Uso en Badge
<Badge variant={taskStatusVariant[task.status] ?? 'outline'}>
  {TASK_STATUS_LABELS[task.status]}
</Badge>

// Uso en span con clases de color
<span className={priorityColors[task.priority] ?? ''}>
  {TASK_PRIORITY_LABELS[task.priority]}
</span>
```

**Maps disponibles:**

| Export                  | Entidad      | Descripcion                               |
| ----------------------- | ------------ | ----------------------------------------- |
| `priorityColors`        | Tareas       | Clases bg+text por prioridad (LOW→URGENT) |
| `taskStatusVariant`     | Tareas       | Badge variant por estado                  |
| `budgetStatusVariant`   | Presupuestos | Badge variant por estado                  |
| `budgetStatusClassName` | Presupuestos | Clases extra para APPROVED/COMPLETED      |
| `urgencyVariant`        | Solicitudes  | Badge variant por urgencia                |
| `clientStatusVariant`   | Clientes     | Badge variant por estado                  |
| `taskTypeColors`        | Templates    | Clases bg+text por tipo de tarea          |
| `professionalReqColors` | Templates    | Clases bg+text por req. profesional       |

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

- Dashboard, Clientes, Propiedades, Categorias, Plantillas, Presupuestos, Solicitudes

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

## Mobile (NativeWind)

La app mobile replica el design system web usando **NativeWind 5** (Tailwind CSS para React Native).

### Configuracion (`src/global.css`)

```css
@import 'tailwindcss/theme.css' layer(theme);
@import 'tailwindcss/preflight.css' layer(base);
@import 'tailwindcss/utilities.css';
@import 'nativewind/theme';

@theme inline {
  --color-primary: #c4704b;
  --color-primary-foreground: #ffffff;
  --color-secondary: #e8ddd3;
  --color-secondary-foreground: #2e2a27;
  --color-background: #fafaf8;
  --color-foreground: #2e2a27;
  --color-card: #ffffff;
  --color-card-foreground: #2e2a27;
  --color-muted: #f5f0eb;
  --color-muted-foreground: #4a4542;
  --color-destructive: #c45b4b;
  --color-border: #e8ddd3;
  --color-success: #6b9b7a;
  --radius: 0.625rem;
}
```

### Tipografia Mobile

- **Body**: DM Sans (`@expo-google-fonts/dm-sans`) — Regular, Medium, Bold
- **Headings**: Playfair Display (`@expo-google-fonts/playfair-display`) — Bold
- Cargadas via `expo-font` en el root layout

### Componentes Mobile

| Componente                  | Descripcion                                                                |
| --------------------------- | -------------------------------------------------------------------------- |
| `StatusBadge`               | Badge con variantes por estado/prioridad/urgencia                          |
| `EmptyState`                | Placeholder para listas vacias                                             |
| `StatCard`                  | Tarjeta de estadistica del dashboard                                       |
| `CreateBudgetModal`         | Modal de creacion de presupuesto                                           |
| `CreateServiceRequestModal` | Modal con upload de fotos (camara/galeria)                                 |
| `CompleteTaskModal`         | Modal con 4 selectores (resultado, estado, ejecutor, accion), costo y nota |

### Uso de Colores en Mobile

```tsx
// Correcto — tokens NativeWind
<View className="bg-primary rounded-lg p-4" />
<Text className="text-foreground text-lg font-semibold" />
<View className="border border-border bg-card" />

// Incorrecto — colores hardcodeados
<View style={{ backgroundColor: '#C4704B' }} />
```
