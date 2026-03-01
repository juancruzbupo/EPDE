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
| Primary          | `#c4704b` | Botones principales, links, acentos (terracotta) |
| Secondary        | `#e8ddd3` | Backgrounds suaves, hover states (arena)         |
| Background       | `#fafaf8` | Fondo principal                                  |
| Foreground       | `#2e2a27` | Texto principal                                  |
| Muted            | `#f5f0eb` | Fondos secundarios                               |
| Muted Foreground | `#4a4542` | Texto secundario                                 |
| Destructive      | `#c45b4b` | Acciones destructivas, errores                   |
| Border           | `#e8ddd3` | Bordes                                           |

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

### Escala Tipografica (TYPE Scale)

Sistema unificado de tipografia aplicado en web y mobile. Define combinaciones de `font-family`, `fontSize`, `lineHeight` y `fontWeight` para consistencia cross-platform.

**Web — Utility classes** (definidas en `globals.css` `@layer utilities`):

| Clase             | Font                  | Size | Line Height | Weight |
| ----------------- | --------------------- | ---- | ----------- | ------ |
| `type-display-lg` | `var(--font-heading)` | 28px | 34px        | 700    |
| `type-display-sm` | `var(--font-heading)` | 22px | 28px        | 700    |
| `type-title-lg`   | inherit               | 18px | 24px        | 700    |
| `type-title-md`   | inherit               | 16px | 22px        | 700    |
| `type-title-sm`   | inherit               | 14px | 20px        | 700    |
| `type-body-lg`    | inherit               | 16px | 22px        | 400    |
| `type-body-md`    | inherit               | 14px | 20px        | 400    |
| `type-body-sm`    | inherit               | 12px | 16px        | 400    |
| `type-label-lg`   | inherit               | 14px | 20px        | 500    |
| `type-label-md`   | inherit               | 12px | 16px        | 500    |
| `type-label-sm`   | inherit               | 11px | 14px        | 500    |
| `type-number-lg`  | inherit               | 24px | 30px        | 700    |
| `type-number-md`  | inherit               | 18px | 24px        | 700    |

```tsx
// Web — usar clases type-*
<p className="type-title-md text-foreground">Salud del Mantenimiento</p>
<span className="type-label-sm text-muted-foreground">Completadas</span>
<span className="type-number-lg text-green-600">95</span>
```

**Mobile — TYPE object** (definido en `lib/fonts.ts`):

```tsx
import { TYPE } from '@/lib/fonts';

// Mobile — usar style={TYPE.xxx}
<Text style={TYPE.titleMd} className="text-foreground">Salud del Mantenimiento</Text>
<Text style={TYPE.labelSm} className="text-muted-foreground">Completadas</Text>
<Text style={[TYPE.numberLg, { color }]}>{percent}</Text>
```

| Token       | Font Family             | Size | Line Height |
| ----------- | ----------------------- | ---- | ----------- |
| `displayLg` | PlayfairDisplay_700Bold | 28px | 34px        |
| `displaySm` | PlayfairDisplay_700Bold | 22px | 28px        |
| `titleLg`   | DMSans_700Bold          | 18px | 24px        |
| `titleMd`   | DMSans_700Bold          | 16px | 22px        |
| `titleSm`   | DMSans_700Bold          | 14px | 20px        |
| `bodyLg`    | DMSans_400Regular       | 16px | 22px        |
| `bodyMd`    | DMSans_400Regular       | 14px | 20px        |
| `bodySm`    | DMSans_400Regular       | 12px | 16px        |
| `labelLg`   | DMSans_500Medium        | 14px | 20px        |
| `labelMd`   | DMSans_500Medium        | 12px | 16px        |
| `labelSm`   | DMSans_500Medium        | 11px | 14px        |
| `numberLg`  | DMSans_700Bold          | 24px | 30px        |
| `numberMd`  | DMSans_700Bold          | 18px | 24px        |

**Nota:** En mobile, las clases NativeWind de tamano (`text-xs`, `text-sm`, `text-base`, etc.) se eliminaron porque el `fontSize` viene del TYPE. Solo se mantienen clases de color (`text-foreground`, `text-muted-foreground`, etc.).

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

// Incorrecto — no usar colores raw de Tailwind para estados
<span className="text-red-600">Vencida</span>
<div className="border-red-200 bg-red-50">...</div>

// Correcto — usar tokens semanticos
<span className="text-destructive">Vencida</span>
<div className="border-destructive/30 bg-destructive/10">...</div>
```

## Style Maps Centralizados

Los mapas de variantes y colores para Badges estan centralizados en `lib/style-maps.ts`. **No duplicar** en cada componente.

Los mapas de color (`priorityColors`, `taskTypeColors`, `professionalReqColors`, `budgetStatusClassName`) incluyen variantes `dark:` para soporte de dark mode:

```typescript
// Ejemplo: priorityColors con dark mode
LOW: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
MEDIUM: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
URGENT: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
```

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
| `serviceStatusVariant`  | Solicitudes  | Badge variant por estado de solicitud     |
| `clientStatusVariant`   | Clientes     | Badge variant por estado                  |
| `taskTypeColors`        | Templates    | Clases bg+text por tipo de tarea          |
| `professionalReqColors` | Templates    | Clases bg+text por req. profesional       |

## Componentes UI (shadcn/ui)

El proyecto usa [shadcn/ui](https://ui.shadcn.com/) estilo **new-york** con los siguientes componentes instalados:

### Componentes Disponibles

| Componente   | Ubicacion                         | Notas                                                      |
| ------------ | --------------------------------- | ---------------------------------------------------------- |
| Alert        | `components/ui/alert.tsx`         | Mensajes de error/info/warning                             |
| Avatar       | `components/ui/avatar.tsx`        | Avatares de usuario                                        |
| Badge        | `components/ui/badge.tsx`         | Estados, etiquetas                                         |
| Button       | `components/ui/button.tsx`        | Variantes: default, secondary, outline, ghost, destructive |
| Card         | `components/ui/card.tsx`          | Contenedores de contenido                                  |
| Command      | `components/ui/command.tsx`       | Combobox/typeahead (usa cmdk)                              |
| Dialog       | `components/ui/dialog.tsx`        | Modales                                                    |
| DropdownMenu | `components/ui/dropdown-menu.tsx` | Menus contextuales                                         |
| Input        | `components/ui/input.tsx`         | Inputs de formulario                                       |
| Label        | `components/ui/label.tsx`         | Labels de formulario                                       |
| Popover      | `components/ui/popover.tsx`       | Tooltips interactivos, dropdowns                           |
| Select       | `components/ui/select.tsx`        | Select nativo mejorado                                     |
| Separator    | `components/ui/separator.tsx`     | Linea divisoria                                            |
| Sheet        | `components/ui/sheet.tsx`         | Panel lateral (mobile sidebar)                             |
| Skeleton     | `components/ui/skeleton.tsx`      | Loading placeholders                                       |
| Table        | `components/ui/table.tsx`         | Tablas HTML estilizadas                                    |
| Tabs         | `components/ui/tabs.tsx`          | Pestanas de navegacion                                     |
| Tooltip      | `components/ui/tooltip.tsx`       | Tooltips informativos                                      |

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

- Dashboard, Clientes, Propiedades, Presupuestos, Servicios, Categorias, Plantillas

**CLIENT:**

- Dashboard, Propiedades, Presupuestos, Servicios

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

## Accesibilidad (Web)

### Botones icon-only

Todo boton que contiene solo un icono DEBE tener `aria-label` descriptivo:

```tsx
// Correcto
<button aria-label="Eliminar tarea" className="... focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none">
  <Trash2 className="h-4 w-4" />
</button>

// Incorrecto — sin aria-label, screen readers anuncian "button"
<button><Trash2 className="h-4 w-4" /></button>
```

### Focus ring

Todos los elementos interactivos custom (botones raw `<button>`, divs clickeables) deben tener focus ring visible:

```tsx
className = 'focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none';
```

Los componentes shadcn/ui (`<Button>`, `<Select>`, `<Input>`) ya incluyen focus ring por defecto.

### Elementos clickeables no-button

Divs o elementos no semanticos que son clickeables deben tener soporte completo de teclado:

```tsx
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
  className="cursor-pointer focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none"
>
```

### Formularios: Labels vinculados

Todo `<Label>` debe estar vinculado a su input via `htmlFor`/`id`:

```tsx
<Label htmlFor="prop-address">Dirección</Label>
<Input id="prop-address" {...register('address')} />

// Para Select de shadcn, agregar id al SelectTrigger
<Label htmlFor="prop-type">Tipo</Label>
<Select ...>
  <SelectTrigger id="prop-type">
    <SelectValue placeholder="Seleccionar" />
  </SelectTrigger>
</Select>
```

### HTML Semantico

| Patron                                    | Uso                                                 |
| ----------------------------------------- | --------------------------------------------------- |
| `<nav aria-label="Navegación principal">` | Sidebar de navegacion                               |
| `aria-current="page"`                     | Link activo en sidebar                              |
| `<ul>/<li>`                               | Listas de items (actividad, notificaciones, tareas) |
| `role="status"`                           | Indicadores de carga                                |
| `aria-expanded={isOpen}`                  | Secciones colapsables                               |
| `<Dialog>` (shadcn)                       | Modales con focus trap, Escape, aria-modal          |

---

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
| `ErrorState`                | Estado de error con boton de reintentar                                    |
| `StatCard`                  | Tarjeta de estadistica compacta                                            |
| `HealthCard`                | Barra de progreso animada de salud del mantenimiento (%, label, colores)   |
| `AnimatedListItem`          | Item de lista con animacion de entrada (fade + slide) y haptics            |
| `AnimatedNumber`            | Numero con animacion de conteo (reanimated)                                |
| `CollapsibleSection`        | Seccion expandible con chevron animado y haptics                           |
| `SwipeableRow`              | Fila deslizable con acciones (Gesture.Pan + reanimated + haptics)          |
| `CreateBudgetModal`         | Modal de creacion de presupuesto                                           |
| `CreateServiceRequestModal` | Modal con upload de fotos (camara/galeria)                                 |
| `CompleteTaskModal`         | Modal con 4 selectores (resultado, estado, ejecutor, accion), costo y nota |

### Componentes Web (custom)

| Componente       | Descripcion                                                          |
| ---------------- | -------------------------------------------------------------------- |
| `HealthCard`     | Barra de progreso animada (Framer Motion) de salud del mantenimiento |
| `AnimatedNumber` | Numero con animacion de conteo (Framer Motion `useSpring`)           |
| `StatCard`       | Tarjeta de estadistica con icono y valor                             |

## Animaciones

### Web — Framer Motion

Sistema de animacion centralizado en `lib/motion.ts`:

```typescript
import { useMotionPreference, MOTION_DURATION } from '@/lib/motion';

const { shouldAnimate } = useMotionPreference(); // respeta prefers-reduced-motion

// Duraciones estandar
MOTION_DURATION.fast; // 150ms
MOTION_DURATION.normal; // 250ms
MOTION_DURATION.slow; // 400ms
```

- `HealthCard`: barra de progreso con ease-out y `AnimatedNumber` para porcentaje
- Respeta `prefers-reduced-motion` — animaciones deshabilitadas si el usuario lo prefiere

### Mobile — React Native Reanimated 4.1

Sistema de animacion centralizado en `lib/animations.ts`:

```typescript
import { TIMING, SPRING, useReducedMotion, useSlideIn, useFadeIn } from '@/lib/animations';

const reduced = useReducedMotion(); // hook para respetar accesibilidad
const slideStyle = useSlideIn('bottom'); // animacion de entrada desde abajo

// Presets de timing
TIMING.fast; // 150ms
TIMING.normal; // 250ms
TIMING.slow; // 400ms

// Presets de spring
SPRING.gentle; // damping: 15, stiffness: 100
SPRING.stiff; // damping: 20, stiffness: 200
```

**Principio:** Toda animacion se deshabilita si `useReducedMotion()` retorna `true`. Los componentes (`SwipeableRow`, `CollapsibleSection`, `AnimatedListItem`, `HealthCard`) verifican esto internamente.

## Haptics (Mobile)

Servicio wrapper de `expo-haptics` en `lib/haptics.ts`:

```typescript
import { haptics } from '@/lib/haptics';

haptics.light(); // Tap, list item press
haptics.medium(); // Acciones importantes (aprobar, rechazar)
haptics.heavy(); // No usado actualmente
haptics.success(); // Submit exitoso (completar tarea, crear presupuesto)
haptics.warning(); // No usado actualmente
haptics.error(); // No usado actualmente
haptics.selection(); // Tab press, toggle
```

**Donde se usa:**

| Componente/Pantalla         | Evento            | Tipo                  |
| --------------------------- | ----------------- | --------------------- |
| `AnimatedListItem`          | `onPressIn`       | `haptics.light()`     |
| `CompleteTaskModal`         | Submit exitoso    | `haptics.success()`   |
| `CreateBudgetModal`         | Submit exitoso    | `haptics.success()`   |
| `CreateServiceRequestModal` | Submit exitoso    | `haptics.success()`   |
| `CollapsibleSection`        | Toggle            | `haptics.light()`     |
| `SwipeableRow`              | Threshold cruzado | `haptics.light()`     |
| Tab navigator `_layout`     | Tab press         | `haptics.selection()` |
| Notificaciones              | Mark as read      | `haptics.light()`     |
| Notificaciones              | Mark all as read  | `haptics.medium()`    |
| Budget detail               | Aprobar/Rechazar  | `haptics.medium()`    |

## Gestos (Mobile)

### SwipeableRow

Componente generico para filas deslizables con `Gesture.Pan` de react-native-gesture-handler:

```tsx
<SwipeableRow
  rightActions={[{ icon: '✓', color: '#6b9b7a', onPress: handleComplete }]}
  threshold={72}
>
  <TaskCard ... />
</SwipeableRow>
```

- Swipe izquierda revela acciones a la derecha
- Haptic feedback al cruzar threshold
- Spring back al soltar
- Deshabilitado si `useReducedMotion()` retorna `true`
- Usado en: notificaciones (marcar como leida), tareas en property detail (completar tarea)

### Uso de Colores en Mobile

```tsx
// Correcto — tokens NativeWind
<View className="bg-primary rounded-lg p-4" />
<Text className="text-foreground text-lg font-semibold" />
<View className="border border-border bg-card" />

// Incorrecto — colores hardcodeados
<View style={{ backgroundColor: '#C4704B' }} />
```
