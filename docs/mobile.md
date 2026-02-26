# App Mobile

App nativa para clientes (rol `CLIENT`) construida con Expo + React Native. Replica las funcionalidades del portal web cliente en una experiencia mobile-first.

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
| Token Storage  | expo-secure-store                              | 55      |
| Image Picker   | expo-image-picker                              | 55      |
| Tipografia     | @expo-google-fonts (DM Sans, Playfair Display) | -       |
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
      (tabs)/                         # Tab navigator (5 tabs)
        _layout.tsx                   # Configuracion de tabs
        index.tsx                     # Dashboard (Mi Panel)
        properties.tsx                # Mis Propiedades
        budgets.tsx                   # Presupuestos
        notifications.tsx             # Centro de notificaciones
        profile.tsx                   # Perfil de usuario
      property/
        [id].tsx                      # Detalle de propiedad + tareas
      budget/
        [id].tsx                      # Detalle de presupuesto + items
      service-requests/
        index.tsx                     # Lista de solicitudes
        [id].tsx                      # Detalle de solicitud
      task/
        [planId]/
          [taskId].tsx                # Detalle de tarea + logs + notas
    components/
      status-badge.tsx                # Badge con variantes por entidad
      empty-state.tsx                 # Placeholder para listas vacias
      stat-card.tsx                   # Tarjeta de estadistica
      create-budget-modal.tsx         # Modal crear presupuesto
      create-service-request-modal.tsx # Modal crear solicitud (con fotos)
      complete-task-modal.tsx         # Modal completar tarea (con foto)
    hooks/
      use-dashboard.ts               # Stats y tareas proximas
      use-properties.ts              # CRUD propiedades (infinite scroll)
      use-budgets.ts                 # CRUD presupuestos + status
      use-notifications.ts           # Notificaciones + unread count
      use-service-requests.ts        # CRUD solicitudes
      use-maintenance-plans.ts       # Plan + tareas + logs + notas
      use-upload.ts                  # Upload de archivos
    lib/
      api-client.ts                  # Axios instance + interceptors
      token-service.ts               # SecureStore abstraction
      auth.ts                        # Funciones de auth API
      api/
        dashboard.ts                 # GET /dashboard/client-stats, client-upcoming
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

Wraps: `QueryClientProvider` → `AuthGate` → rutas

### Tabs (5 pantallas)

| Tab          | Ruta             | Icono | Descripcion                  |
| ------------ | ---------------- | ----- | ---------------------------- |
| Inicio       | `/(tabs)`        | 🏠    | Dashboard con stats y tareas |
| Propiedades  | `/properties`    | 🏘️    | Lista de propiedades         |
| Presupuestos | `/budgets`       | 📋    | Lista de presupuestos        |
| Avisos       | `/notifications` | 📢    | Centro de notificaciones     |
| Perfil       | `/profile`       | 👤    | Info de usuario + logout     |

La tab de Avisos muestra un **badge con conteo de no leidas** (auto-refresh cada 30s).

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
5. **Logout** → Limpia tokens + invalida query cache + redirige a login. Backend revoca family + blacklist access JTI en Redis

### Token Service

Abstraccion cross-platform para almacenamiento seguro:

- **iOS/Android**: `expo-secure-store` (keychain/keystore nativo)
- **Web**: `localStorage` (fallback)

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

### Dashboard (Mi Panel)

- 6 tarjetas de estadisticas (propiedades, tareas pendientes/vencidas/completadas, presupuestos, solicitudes)
- Boton rapido a solicitudes de servicio
- Lista de tareas proximas (por prioridad y fecha)
- Pull-to-refresh

### Propiedades

- Lista con scroll infinito (cursor-based)
- Cards con: direccion, ciudad, anio, superficie, tipo
- Badge de tipo de propiedad
- Tap → detalle con plan de mantenimiento y tareas

### Detalle de Propiedad

- Info de la propiedad
- Tareas agrupadas por categoria
- Filtros: Todas, Proximas, Vencidas, Completadas
- Cards de tarea con dot de estado, badge de prioridad, fecha

### Detalle de Tarea

- Info completa: nombre, descripcion, estado, prioridad, recurrencia, categoria
- Boton "Completar Tarea" → modal con notas y foto
- Historial de completados (logs)
- Seccion de comentarios/notas

### Presupuestos

- Lista con scroll infinito
- Filtros por estado: Pendiente, Cotizado, Aprobado, Rechazado, En Progreso, Completado
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
- Tap → marca como leida
- Boton "Marcar todas como leidas"
- Auto-refresh del conteo cada 30 segundos

### Perfil

- Avatar placeholder + info del usuario (nombre, email, telefono)
- Info de la app (version, plataforma)
- Boton de logout con alerta de confirmacion

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
- Completar tarea
- Marcar notificacion como leida
- Rollback automatico en caso de error

### Upload de Imagenes

1. Solicitar permisos (camara o galeria)
2. Seleccionar imagen via `expo-image-picker`
3. Upload a la API (multipart/form-data)
4. Mostrar progreso de upload
5. Prevenir submit hasta que el upload termine

### Localizacion

- Toda la UI en espanol (Argentina)
- Labels de enums desde `@epde/shared` (BUDGET_STATUS_LABELS, etc.)
- Fechas con `date-fns` locale `es`
- Moneda: Peso Argentino (ARS) formateado con `$`

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
