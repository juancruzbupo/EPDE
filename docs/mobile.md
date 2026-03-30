# App Mobile

App nativa construida con Expo + React Native. Soporta ambos roles:

- **CLIENT**: Dashboard con health card + charts + tareas proximas
- **ADMIN (MVP)**: Dashboard con 5 KPIs + metricas clave + SLA + actividad reciente

Ambos roles comparten: Propiedades, Tareas, Presupuestos, Solicitudes, Notificaciones, Perfil. El backend filtra datos por rol automaticamente.

## Stack

| Capa           | Tecnologia                                     | Version |
| -------------- | ---------------------------------------------- | ------- |
| Framework      | Expo                                           | 54      |
| Runtime        | React Native                                   | 0.81    |
| Routing        | Expo Router (file-based)                       | 6       |
| Styling        | NativeWind (Tailwind para RN)                  | 5       |
| State (global) | Zustand                                        | 5       |
| State (server) | TanStack React Query                           | 5       |
| Forms          | React Hook Form + Zod                          | 7.71    |
| HTTP           | Axios                                          | 1.13    |
| Token Storage  | expo-secure-store                              | 15      |
| Image Picker   | expo-image-picker                              | 17      |
| Animaciones    | react-native-reanimated                        | 4.1     |
| Gestos         | react-native-gesture-handler                   | 2.28    |
| Charts (SVG)   | react-native-svg                               | 16      |
| Haptics        | expo-haptics                                   | 15      |
| Tipografia     | @expo-google-fonts (DM Sans, DM Serif Display) | -       |
| Shared         | @epde/shared (workspace)                       | -       |

## Estructura de Archivos

```
apps/mobile/
  src/
    app/                              # Expo Router (file-based routing)
      _layout.tsx                     # Root layout + AuthGate + QueryProvider
      index.tsx                       # Redirect segun auth state
      (auth)/                         # Grupo de autenticacion
        _layout.tsx                   # Stack navigator
        login.tsx                     # Pantalla de login
        set-password.tsx              # Configurar password (invitacion)
      (tabs)/                         # Tab navigator (5 visible: Inicio, Propiedades, Tareas, Notificaciones, Perfil)
        _layout.tsx                   # Configuracion de tabs
        index.tsx                     # Dashboard (Mi Panel)
        properties.tsx                # Mis Propiedades
        maintenance-plans.tsx          # Planes de mantenimiento
        tasks.tsx                     # Tareas (todas las propiedades)
        budgets.tsx                   # Presupuestos
        notifications.tsx             # Centro de notificaciones
        profile.tsx                   # Perfil de usuario
      property/
        [id].tsx                      # Detalle de propiedad (405 LOC)
        components/                   # 4 sub-components (PropertyHeader, PropertyInfo, TaskFilters, TaskCard)
      budget/
        [id].tsx                      # Detalle de presupuesto (299 LOC)
        components/                   # 6 sub-components (BudgetHeader, BudgetInfo, ItemsTable, etc.)
      service-requests/
        index.tsx                     # Lista de solicitudes
        [id].tsx                      # Detalle de solicitud (272 LOC)
        components/                   # 7 sub-components (SRHeader, SRInfo, SRPhotos, etc.)
      task/
        [planId]/
          [taskId].tsx                # Detalle de tarea (230 LOC)
          components/                 # 4 sub-components (TaskHeader, TaskInfo, TaskLogs, TaskNotes)
    components/
      status-badge.tsx                # Badge con variantes por entidad
      empty-state.tsx                 # Placeholder para listas vacias
      error-state.tsx                 # Estado de error con retry
      stat-card.tsx                   # Tarjeta de estadistica compacta
      health-card.tsx                 # Salud del mantenimiento (barra + %)
      animated-list-item.tsx          # Item con animacion fade+slide + haptics
      animated-number.tsx             # Numero con animacion de conteo
      collapsible-section.tsx         # Seccion expandible con chevron animado
      swipeable-row.tsx               # Fila deslizable con acciones (gestos)
      create-budget-modal.tsx         # Modal crear presupuesto
      create-service-request-modal.tsx # Modal crear solicitud (310 LOC) + service-request/ (2 sub-components)
      complete-task-modal.tsx         # Modal completar tarea (240 LOC) + task/ (2 sub-components)
      error-boundary.tsx             # Error boundary (class component)
      profile/                       # 3 sub-components extracted from profile.tsx (243 LOC)
      service-request/               # 2 sub-components extracted from create-service-request-modal
      task/                          # 2 sub-components extracted from complete-task-modal
      home-status-card.tsx           # Nivel 1: score ISV + mensaje humano + mini-stats
      action-list.tsx                # Nivel 2: tareas vencidas + semana
      analytics-section.tsx          # Nivel 3: charts colapsable
    charts/
      chart-card.tsx                 # Wrapper con loading/empty states
      mini-donut-chart.tsx           # Donut SVG (condicion distribution)
      mini-bar-chart.tsx             # Barras SVG animadas (costos)
      mini-trend-chart.tsx           # Linea SVG (tendencia condicion)
      category-breakdown-list.tsx    # Lista con progress bars + condition dots
    hooks/
      use-dashboard.ts               # Stats, tareas proximas y analytics
      use-properties.ts              # CRUD propiedades (infinite scroll)
      use-budgets.ts                 # CRUD presupuestos + status
      use-notifications.ts           # Notificaciones + unread count
      use-service-requests.ts        # CRUD solicitudes
      use-plans.ts                   # Plan queries + tareas list
      use-task-operations.ts         # Task detail, logs, notas, mutations
      use-upload.ts                  # Upload de archivos
    lib/
      api-client.ts                  # Axios instance + interceptors
      token-service.ts               # SecureStore abstraction
      query-persister.ts             # AsyncStorage persister para offline cache
      auth.ts                        # Funciones de auth API
      fonts.ts                       # TYPE scale tipografica + font families
      haptics.ts                     # Wrapper de expo-haptics (light/medium/success/selection)
      animations.ts                  # Presets reanimated (TIMING, SPRING, useSlideIn, useFadeIn)
      colors.ts                      # Design tokens JS (para APIs no-NativeWind: navigation, etc.)
      date-format.ts                 # formatDateES(date, pattern) — formateo de fechas con locale argentino
      chart-colors.ts                # Tokens de color para charts SVG (CHART_TOKENS_LIGHT)
      screen-options.ts              # defaultScreenOptions + defaultTabBarOptions compartidos
      api/
        dashboard.ts                 # GET /dashboard/client-stats, client-upcoming, client-analytics
        properties.ts                # GET /properties
        budgets.ts                   # GET/POST /budgets, PATCH status
        notifications.ts             # GET /notifications, mark read
        service-requests.ts          # GET/POST /service-requests
        maintenance-plans.ts         # GET plan, tasks, logs, notes, complete, add note
        upload.ts                    # POST /upload (multipart)
    stores/
      auth-store.ts                  # Zustand: user, isAuthenticated, login, logout
    global.css                       # Tokens NativeWind (colores, radius)
  assets/                            # icon.png, splash-icon.png, favicon.png
  app.json                           # Expo config
  metro.config.js                    # Metro + NativeWind
  jest.config.js                     # Jest + jest-expo config
  postcss.config.mjs                 # @tailwindcss/postcss
  tsconfig.json                      # Extiende expo/tsconfig.base
  package.json
```

## Navegacion

### Root Layout (`_layout.tsx`)

Componente `AuthGate` que decide la ruta segun el estado de autenticacion:

- `isLoading` → Splash screen
- No autenticado → `/(auth)/login`
- Autenticado → `/(tabs)`

Wraps: `GestureHandlerRootView` → `ErrorBoundary` (con `accessibilityRole` + `accessibilityLabel`) → `PersistQueryClientProvider` (offline cache, gcTime 24h, maxAge 24h, throttle 2s) → `AuthGate` → rutas. Filter pills con `minHeight: 44` para cumplir WCAG 2.5.5 touch target.

### Tabs (7 pantallas)

| Tab          | Ruta                | Icono | Descripcion                        |
| ------------ | ------------------- | ----- | ---------------------------------- |
| Inicio       | `/(tabs)`           | 🏠    | Dashboard con stats y tareas       |
| Propiedades  | `/properties`       | 🏘️    | Lista de propiedades               |
| Servicios    | `/service-requests` | 🔧    | Solicitudes de servicio            |
| Tareas       | `/tasks`            | ✅    | Todas las tareas (todas las props) |
| Presupuestos | `/budgets`          | 📋    | Lista de presupuestos              |
| Avisos       | `/notifications`    | 📢    | Centro de notificaciones           |
| Perfil       | `/profile`          | 👤    | Info de usuario + logout           |

La tab de Avisos muestra un **badge con conteo de no leidas** (auto-refresh cada 60s).

### Rutas de Detalle

| Ruta                      | Descripcion                    |
| ------------------------- | ------------------------------ |
| `/property/[id]`          | Propiedad + tareas del plan    |
| `/budget/[id]`            | Presupuesto + items + acciones |
| `/service-requests`       | Lista de solicitudes           |
| `/service-requests/[id]`  | Detalle de solicitud           |
| `/task/[planId]/[taskId]` | Tarea + historial + notas      |

## Autenticacion

### Auth Store (Zustand)

```typescript
interface AuthState {
  user: UserPublic | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
  checkAuth(): Promise<void>;
}
```

### Flujo (Token Rotation)

1. **App start** → `checkAuth()` → busca tokens en SecureStore → valida con `/auth/me`
2. **Login** → `POST /auth/login` → guarda access + refresh tokens en SecureStore (refresh contiene family + generation)
3. **Request** → Axios interceptor adjunta `Authorization: Bearer <token>`
4. **401** → Interceptor refresca token automaticamente (singleton pattern) → se rota el refresh token (nueva generation)
5. **Logout** → Primero limpia estado local (`queryClient.cancelQueries()` + `queryClient.clear()` + `set({ user: null, isAuthenticated: false })`), luego `try { authApi.logout() } catch { /* API puede fallar */ } finally { tokenService.clearTokens() }`. El estado se limpia antes de la llamada API para evitar race conditions con requests in-flight. Backend revoca family + blacklist access JTI en Redis

### Token Service

Usa `expo-secure-store` para almacenamiento seguro de tokens en plataformas nativas (iOS keychain / Android keystore). En web, usa `sessionStorage` como fallback (datos no persisten entre tabs ni al cerrar el navegador).

- **iOS/Android**: `expo-secure-store` (keychain/keystore nativo)
- **Web**: `sessionStorage` (no `localStorage` — mitiga XSS)

## API Client

```typescript
const apiClient = axios.create({
  baseURL: getApiBaseUrl(), // Auto-detecta segun plataforma
  headers: { 'X-Client-Type': 'mobile' },
});
```

### Auto-deteccion de URL

- **Web (dev)**: `http://localhost:3001/api/v1`
- **Native (dev)**: `http://<device-ip>:3001/api/v1` (via Expo Constants)
- **Produccion**: `https://api.epde.com.ar/api/v1`

### Interceptor de Refresh

- Detecta 401 en cualquier request
- Usa patron singleton para evitar multiples refreshes concurrentes
- Reintentar request original con nuevo token si refresh exitoso
- Si refresh falla → logout automatico

## Pantallas

### Dashboard (Mi Panel) — Pirámide Invertida

Estructura en 3 niveles (conclusión primero, datos después):

**Nivel 1 — Resumen (siempre visible):**

- `HomeStatusCard`: mensaje humano ("Tu casa está bien"), score ISV con AnimatedNumber + progress bar, color dinámico según score
- 4 mini-stats inline: Vencidas, Pendientes, Completadas, Presupuestos

**Nivel 2 — Acciones concretas:**

- `ActionList`: tareas vencidas (sección roja) + tareas de esta semana
- Cada tarea: nombre, vencimiento, categoría, sector, badge "Requiere profesional" (cuando `professionalRequirement !== OWNER_CAN_DO`)
- Press → navega al detalle de la tarea
- Si no hay tareas: "Todo al día" mensaje positivo

**Nivel 3 — Análisis (colapsado por defecto):**

- `AnalyticsSection` wrapping `CollapsibleSection` con `defaultOpen={false}`
- Selector de meses (3m/6m/12m)
- 4 mini charts: MiniDonutChart, MiniTrendChart, MiniBarChart, CategoryBreakdownList

- Botón rápido a solicitudes de servicio
- Pull-to-refresh (refresca stats + tasks + analytics)
- Muestra timestamp "Actualizado hace X" via React Query `dataUpdatedAt`
- Usa `ScrollView` (todo el contenido es estructurado)

### Propiedades

- Lista con scroll infinito (cursor-based)
- Cards con: direccion, ciudad, anio, superficie, tipo
- Badge de tipo de propiedad
- Tap → detalle con plan de mantenimiento y tareas

### Detalle de Propiedad

- Info de la propiedad
- Tareas agrupadas por categoria
- Filtros: Todas, Proximas, Vencidas, Completadas
- Cards de tarea con dot de estado, badge de prioridad, fecha, badge "Requiere profesional" (cuando `professionalRequirement !== OWNER_CAN_DO`)

### Detalle de Tarea

- Info completa: nombre, descripcion, estado, prioridad, recurrencia, categoria
- Boton "Completar Tarea" → modal con 4 selectores, costo y foto
- Boton "Solicitar Servicio" → abre modal pre-llenado con propertyId + taskId + titulo
- Boton "Pedir Presupuesto" → abre modal pre-llenado con propertyId + titulo
- Hint "Esta tarea requiere intervencion profesional" cuando `professionalRequirement !== OWNER_CAN_DO`
- Historial de completados (logs) — `CollapsibleSection` expandible
- Seccion de comentarios/notas — `CollapsibleSection` expandible

### Presupuestos

- Lista con scroll infinito
- Filtros por estado: Pendiente, Cotizado, Aprobado, Rechazado, En Progreso, Completado
- Copy humanizado: "Esperando cotización" (en vez de "Sin cotizar") para presupuestos pendientes
- Boton "Nuevo" → modal de creacion
- Cards: titulo, estado, propiedad, monto, fecha

### Detalle de Presupuesto

- Info del presupuesto
- Si cotizado: tabla de items (descripcion, cantidad, precio unitario, subtotal)
- Monto total destacado
- Si estado QUOTED: botones "Aprobar" y "Rechazar"

### Solicitudes de Servicio

- Lista con scroll infinito
- Filtros por estado
- Boton "Nueva Solicitud" → modal con formulario + upload de fotos (max 5)
- Cards: titulo, estado, propiedad, urgencia, fecha

### Notificaciones

- Lista con scroll infinito
- Distincion visual: no leidas (fondo tintado + titulo bold + dot indicador)
- Iconos por tipo: Tarea 🕐, Presupuesto 📋, Servicio 🔧, Sistema 🔔
- **Swipe derecha**: marcar como leida (SwipeableRow con icono ✓ verde)
- Tap → marca como leida
- Boton "Marcar todas como leidas" (haptics medium) — `useCallback` en `handleMarkAllAsRead`
- `handleNotificationPress` wrapeado en `useCallback`; `notifications` array estabilizado con `useMemo`
- Auto-refresh del conteo cada 60 segundos
- El cliente recibe notificación push + in-app cuando el admin cambia su suscripción (extensión, suspensión, o acceso ilimitado)

### Perfil

- Avatar placeholder + info del usuario (nombre, email, telefono)
- Info de la app (version, plataforma)
- Botón de renovación de suscripción prominente (`bg-primary`, full-width) cuando la suscripción está próxima a expirar
- Boton de logout con alerta de confirmacion

## Sub-Component Pattern (28 sub-components)

Los screens de detalle y modales complejos se dividen en sub-componentes presentacionales para mantener cada archivo por debajo de 400 LOC. Los hooks y logica de negocio permanecen en el screen padre; los sub-componentes reciben props minimas y usan `React.memo`.

### Screens divididos

| Screen original                    | LOC antes | LOC despues | Sub-componentes | Carpeta                        |
| ---------------------------------- | --------- | ----------- | --------------- | ------------------------------ |
| `property/[id].tsx`                | 811       | 405         | 4               | `property/components/`         |
| `service-requests/[id].tsx`        | 776       | 272         | 7               | `service-requests/components/` |
| `budget/[id].tsx`                  | 642       | 299         | 6               | `budget/components/`           |
| `profile.tsx`                      | 452       | 243         | 3               | `components/profile/`          |
| `create-service-request-modal.tsx` | 553       | 310         | 2               | `components/service-request/`  |
| `complete-task-modal.tsx`          | 476       | 240         | 2               | `components/task/`             |
| `task/[planId]/[taskId].tsx`       | 417       | 230         | 4               | `task/components/`             |

### Patron

- Cada detail screen tiene una carpeta `components/` hermana con sub-componentes presentacionales
- Los sub-componentes usan `React.memo` con props minimas (solo los datos que necesitan)
- Los hooks (`useQuery`, `useMutation`, etc.) viven en el screen padre, no en los sub-componentes
- Los modales complejos siguen el mismo patron (sub-componentes en carpeta del dominio bajo `components/`)

## Patrones Clave

### Infinite Scroll con Cursor

Todas las listas usan `useInfiniteQuery` con paginacion cursor-based:

```typescript
const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
  queryKey: ['budgets', filters],
  queryFn: ({ pageParam }) => getBudgets({ ...filters, cursor: pageParam }),
  getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor : undefined),
});
```

- `onEndReached` threshold 0.5 (dispara al 50% del scroll)
- `isFetchingNextPage` previene requests duplicados

### Optimistic Updates

Mutations con actualizacion optimista para UX instantanea:

- Aprobar/rechazar presupuesto
- Marcar notificacion como leida
- Rollback automatico en caso de error

> **Nota:** Completar tarea NO usa optimistic update. El server resetea el status a PENDING con nueva fecha (modelo ciclico de mantenimiento preventivo). El feedback al usuario muestra la fecha de reprogramacion en el Alert.

### Upload de Imagenes

1. Solicitar permisos (camara o galeria)
2. Seleccionar imagen via `expo-image-picker` (quality 0.7)
3. Upload a la API (multipart/form-data), MIME normalizado (.jpg → image/jpeg)
4. Trackear uploads por URI (no por indice) para evitar race conditions con selecciones rapidas
5. Mostrar spinner overlay por foto durante upload
6. Si falla: mantener preview con overlay "Reintentar" (no borrar la foto)
7. Prevenir submit hasta que todos los uploads terminen (`uploadingCount === 0`)

### Dark Mode

Implementado via NativeWind `vars()` (no className `.dark`):

- **`theme-tokens.ts`** — `lightTheme` y `darkTheme` usando `vars()` de NativeWind
- **Root layout** — `<View style={themeVars}>` inyecta tokens segun preferencia
- **Theme store** — Zustand + AsyncStorage, opciones: auto/light/dark
- **Toggle** — Pantalla de Perfil, seccion "Apariencia"
- **`global.css`** — usa `@theme` (sin `inline`) para que Tailwind emita `var()` en vez de hex estaticos

### Localizacion

- Toda la UI en espanol (Argentina)
- Labels de enums desde `@epde/shared` (BUDGET_STATUS_LABELS, etc.)
- Fechas con `date-fns` locale `es`. `date-format.ts` — `formatDateES(date, pattern)` centraliza formateo de fechas con locale argentino (date-fns + es locale). Reemplaza imports directos de `format`/`es` en cada archivo
- Moneda: Peso Argentino (ARS) formateado con `$`

### Offline Cache (Query Persistence)

Las queries de React Query se persisten automaticamente en `AsyncStorage` via `PersistQueryClientProvider`:

- **gcTime**: 24 horas (datos cacheados disponibles offline)
- **Persister**: `@tanstack/query-async-storage-persister` con `@react-native-async-storage/async-storage`
- **Cache key versionado**: incluye `Constants.expoConfig?.version` para invalidar cache automaticamente al actualizar la app. Al iniciar, limpia keys de versiones anteriores
- Al abrir la app sin conexion, los datos del ultimo uso se muestran inmediatamente
- Las queries se revalidan automaticamente cuando hay conexion
- En logout, se limpian todas las keys de cache (`epde-query-cache*`) de AsyncStorage

### Tipografia (TYPE Scale)

Escala tipografica centralizada en `lib/fonts.ts`. Reemplaza el uso de `style={{ fontFamily: '...' }}` + clases NativeWind de tamano sueltas:

```tsx
import { TYPE } from '@/lib/fonts';

// Antes (inline):
<Text style={{ fontFamily: 'DMSans_700Bold' }} className="text-lg">Titulo</Text>

// Ahora (TYPE scale):
<Text style={TYPE.titleLg} className="text-foreground">Titulo</Text>
```

Las clases NativeWind de tamano (`text-xs`, `text-sm`, etc.) se eliminaron de los componentes migrados porque el `fontSize` viene del TYPE. Solo se mantienen clases de color.

Ver tabla completa de tokens en [design-system.md](design-system.md#escala-tipografica-type-scale).

### Haptics

Servicio wrapper de `expo-haptics` en `lib/haptics.ts`. Proporciona feedback tactil en interacciones clave:

- `haptics.light()` — taps, list items, swipe threshold
- `haptics.medium()` — acciones importantes (aprobar/rechazar)
- `haptics.success()` — submits exitosos (completar tarea, crear presupuesto)
- `haptics.selection()` — tab press, toggles

### Animaciones (Reanimated 4.1)

Presets centralizados en `lib/animations.ts`:

- **TIMING**: `fast` (150ms), `normal` (250ms), `slow` (400ms)
- **SPRING**: `gentle` (damping 15, stiffness 100), `stiff` (damping 20, stiffness 200)
- **Hooks**: `useSlideIn(direction)`, `useFadeIn()`, `useReducedMotion()`
- Todos los componentes animados respetan `useReducedMotion()` — accesibilidad first
- AnimatedListItem skipea animación de entrada para items con index >= 30 (performance en listas grandes). Stagger delay máximo: 300ms.
- Todos los modales tienen `accessibilityViewIsModal={true}` para aislar contenido de screen readers.

### Gestos (react-native-gesture-handler)

`GestureHandlerRootView` wrappea toda la app en `_layout.tsx`. Componente `SwipeableRow` disponible para filas deslizables:

- Usa `Gesture.Pan` para deteccion de swipe horizontal
- Revela acciones bajo el contenido (absolute positioned)
- Spring back al soltar si no supera threshold
- Haptic feedback al cruzar threshold
- Se deshabilita automaticamente con reduced motion
- Usado en: notificaciones (marcar como leida), tareas en property detail (completar)

### Densidad de Cards

Patron de densidad compacta aplicado a todas las cards mobile:

- Padding reducido: `p-4` → `p-3`
- Gaps reducidos: `mb-3` → `mb-2`
- Metadata compactada en una linea con separador `·` (ej: `Buenos Aires · 2015 · 180 m²`)

### Error Boundary

Class component `ErrorBoundary` que captura errores de render:

- Muestra pantalla de fallback "Algo salio mal" con boton "Reintentar"
- Wrappea toda la app en el root layout
- Reporta errores a Sentry via `Sentry.captureException(error)` en `componentDidCatch`

## Desarrollo

```bash
# Iniciar Expo dev server
pnpm dev:mobile
# o
pnpm --filter @epde/mobile dev

# Plataforma especifica
pnpm --filter @epde/mobile ios
pnpm --filter @epde/mobile android

# Requisitos
# - API corriendo en puerto 3001
# - Expo Go instalado en dispositivo o simulador configurado
```

### Notas

- La app usa **New Architecture** de React Native (`newArchEnabled: true` en app.json)
- Orientacion forzada a **portrait**
- Bundle ID: `com.epde.mobile` (iOS y Android)
- Deep linking scheme: `epde://`
- **Deep link validation**: `Linking.addEventListener('url')` valida paths contra whitelist de rutas permitidas, rechazando URLs no reconocidas

## Testing

### Setup

- Framework: **jest-expo** (preset de Jest para Expo/React Native)
- Test runner: Jest 29
- Testing Library: `@testing-library/react-native`
- Config: `apps/mobile/jest.config.js`

```javascript
module.exports = {
  preset: 'jest-expo',
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/e2e/'],
  setupFiles: ['./src/test-setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|@tanstack/.*|@epde/.*)',
  ],
};
```

**Setup file** (`src/test-setup.ts`): Mocks globales para native modules no disponibles en Jest (`expo-haptics`, `@react-native-community/netinfo`, `@react-native-async-storage/async-storage`).

**Nota:** Los tests e2e (Detox) en `e2e/` están excluidos del Jest runner. Se ejecutan con Detox CLI separado.

### Tests disponibles (34 suites, 176 tests)

| Grupo      | Suites | Tests   | Descripcion                                                                                                                                         |
| ---------- | ------ | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hooks      | 9      | ~70     | use-budgets, use-plans, use-properties, use-dashboard, use-notifications, use-service-requests, use-task-operations, use-upload, use-network-status |
| Screens    | 9      | ~50     | dashboard, budgets, properties, tasks, maintenance-plans, notifications, profile, service-requests, task-detail                                     |
| Components | 6      | ~30     | status-badge, empty-state, health-card, animated-number, offline-banner, error-state                                                                |
| Lib        | 1      | ~5      | css-tokens (design token sync)                                                                                                                      |
| Auth       | 1      | ~10     | auth-flow (login, logout, checkAuth)                                                                                                                |
| **Total**  | **32** | **165** |                                                                                                                                                     |

### Comandos

```bash
pnpm --filter @epde/mobile test          # Ejecutar todos los tests
pnpm --filter @epde/mobile test --watch  # Watch mode
```
