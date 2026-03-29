# EPDE — Resumen Completo del Sistema

> Documento diseñado para que una IA entienda completamente qué es EPDE, qué hace, cómo está construido, y cómo calcula sus métricas.

---

## 1. Qué es EPDE

EPDE (Estudio Profesional de Diagnóstico Edilicio) es una plataforma de **mantenimiento preventivo para viviendas residenciales** en Paraná, Argentina.

**No es** una empresa de reparaciones. **Es** un sistema que:

- Diagnostica el estado real de una vivienda
- Organiza todo su mantenimiento en tareas programadas
- Calcula un Índice de Salud de la Vivienda (ISV) de 0 a 100
- Detecta problemas antes de que sean costosos
- Permite solicitar servicios profesionales cuando se detectan problemas

---

## 2. Estructura técnica

### Monorepo con 3 apps + 1 paquete compartido

| App        | Tecnología                                               | Función                                             |
| ---------- | -------------------------------------------------------- | --------------------------------------------------- |
| **API**    | NestJS 11 + Prisma 6 + PostgreSQL 16 + Redis + BullMQ    | REST API, auth JWT, RBAC, cron jobs, notificaciones |
| **Web**    | Next.js 15 + React 19 + Tailwind + React Query + Zustand | Panel admin + portal cliente                        |
| **Mobile** | Expo 54 + React Native 0.81 + NativeWind + React Query   | App cliente (solo rol CLIENT)                       |
| **Shared** | TypeScript + Zod + tsup (ESM/CJS)                        | Tipos, schemas, constantes, API factories — SSoT    |

### Roles

| Rol        | Acceso       | Qué puede hacer                                                        |
| ---------- | ------------ | ---------------------------------------------------------------------- |
| **ADMIN**  | Web only     | Gestionar propiedades, clientes, tareas, presupuestos, servicios       |
| **CLIENT** | Web + Mobile | Ver su propiedad, completar tareas, solicitar servicios y presupuestos |

---

## 3. Modelo de datos (entidades principales)

```
User ──1:N── Property ──1:1── MaintenancePlan ──1:N── Task
                │                                        │
                ├──1:N── BudgetRequest                   ├── TaskLog (inmutable, historial)
                ├──1:N── ServiceRequest                  ├── TaskNote
                └──1:N── ISVSnapshot (mensual)           └── TaskAuditLog
```

### Property (Propiedad)

- Dirección, ciudad, tipo (HOUSE/APARTMENT/DUPLEX/etc.), año construcción, metros²
- `activeSectors`: array de 9 posibles sectores de la vivienda (ROOF, BATHROOM, INSTALLATIONS, etc.)
- Cada propiedad tiene exactamente 1 MaintenancePlan

### MaintenancePlan (Plan de Mantenimiento)

- Se crea automáticamente al crear la propiedad
- Status: DRAFT → ACTIVE
- Contiene N tareas

### Task (Tarea de mantenimiento)

- Nombre, descripción, sector, prioridad (LOW/MEDIUM/HIGH/URGENT)
- Recurrencia: MONTHLY, QUARTERLY, BIANNUAL, ANNUAL, CUSTOM, ON_DETECTION
- `nextDueDate`: cuándo vence
- `status`: PENDING → UPCOMING (30 días antes) → OVERDUE (si pasa la fecha) → PENDING (al completar)
- `taskType`: INSPECTION, CLEANING, TEST, TREATMENT, SEALING, LUBRICATION, ADJUSTMENT, MEASUREMENT, EVALUATION
- `professionalRequirement`: OWNER_CAN_DO, PROFESSIONAL_RECOMMENDED, PROFESSIONAL_REQUIRED

**Concepto clave:** COMPLETED es transitorio. Al completar una tarea, se crea un TaskLog y la tarea vuelve a PENDING con nueva `nextDueDate`. El historial vive en TaskLog.

### TaskLog (Registro de completación — inmutable)

- `conditionFound`: EXCELLENT, GOOD, FAIR, POOR, CRITICAL
- `actionTaken`: INSPECTION_ONLY, CLEANING, MINOR_REPAIR, MAJOR_REPAIR, REPLACEMENT, TREATMENT, SEALING, ADJUSTMENT, FULL_SERVICE, NO_ACTION
- `result`: OK, OK_WITH_OBSERVATIONS, NEEDS_ATTENTION, NEEDS_REPAIR, NEEDS_URGENT_REPAIR, NOT_APPLICABLE
- `executor`: OWNER, HIRED_PROFESSIONAL, EPDE_PROFESSIONAL
- `cost`, `notes`, `photoUrl`, `completedAt`

### BudgetRequest (Presupuesto)

- El cliente solicita un presupuesto para una propiedad
- Status: PENDING → QUOTED → APPROVED/REJECTED → IN_PROGRESS → COMPLETED/EXPIRED
- Tiene line items con cantidades y precios

### ServiceRequest (Solicitud de servicio)

- El cliente reporta un problema o pide asistencia
- Puede estar vinculada a una tarea (`taskId` nullable)
- Status: OPEN → IN_REVIEW → IN_PROGRESS → RESOLVED → CLOSED
- Tiene fotos, comentarios, audit log

### ISVSnapshot (Snapshot mensual del ISV)

- Se genera el 1ro de cada mes por cron
- Almacena: score, label, las 5 dimensiones, scores por sector
- Se usa solo para historial (gráfico de evolución) y alertas de caída ≥15 puntos
- NO se usa para mostrar el ISV actual (eso siempre es real-time)

---

## 4. Cálculo del ISV (Índice de Salud de la Vivienda)

### Resumen

Score de **0 a 100** compuesto por **5 dimensiones ponderadas**. Se calcula en tiempo real a partir de las tareas y sus completaciones (TaskLogs).

### Datos que consulta

| Query                       | Qué trae                                         | Límite |
| --------------------------- | ------------------------------------------------ | ------ |
| Tasks del plan              | status, priority, sector                         | 500    |
| TaskLogs últimos 12 meses   | conditionFound, actionTaken, sector, completedAt | 2000   |
| TaskLogs de 3-6 meses atrás | conditionFound, actionTaken                      | 1000   |

### Dimensión 1: Cumplimiento (35%)

Qué porcentaje de tareas están al día, ponderado por prioridad.

- Pesos: LOW=1, MEDIUM=2, HIGH=3, URGENT=4
- Fórmula: `pesoAlDía / pesoTotal × 100`
- Una tarea "al día" = status ≠ OVERDUE
- Sin tareas → 100

### Dimensión 2: Condición (30%)

Promedio de condición encontrada en inspecciones recientes (12 meses).

- Escala: EXCELLENT=100, GOOD=80, FAIR=60, POOR=40, CRITICAL=20
- Fórmula: promedio de los puntajes de cada TaskLog
- Sin logs → 50

### Dimensión 3: Cobertura (20%)

Porcentaje de sectores inspeccionados en los últimos 12 meses.

- Fórmula: `sectoresInspeccionados / todosLosSectores × 100`
- Sin sectores → 0

### Dimensión 4: Inversión (15%)

Ratio de acciones preventivas vs correctivas.

- Preventivas: INSPECTION_ONLY, CLEANING, ADJUSTMENT, SEALING
- Correctivas: todo lo demás (MINOR_REPAIR, MAJOR_REPAIR, REPLACEMENT, etc.)
- Fórmula: `preventivas / totalLogs × 100`
- Sin logs → 50

### Dimensión 5: Tendencia (informativa, 0% peso)

Compara condición promedio del trimestre actual vs anterior.

- `> 50` = mejorando, `= 50` = estable, `< 50` = declinando

### Score Global

```
ISV = cumplimiento × 0.35 + condición × 0.30 + cobertura × 0.20 + inversión × 0.15
```

### Labels

| Score | Label             |
| ----- | ----------------- |
| ≥ 80  | Excelente         |
| ≥ 60  | Bueno             |
| ≥ 40  | Regular           |
| ≥ 20  | Necesita atención |
| < 20  | Crítico           |

### Scores por sector

Para cada sector con tareas: `(totalTareas - vencidas) / totalTareas × 100`

---

## 5. Problemas detectados (flujo automático)

### Cómo se genera

Cuando se completa una tarea con `conditionFound` = POOR o CRITICAL:

1. Backend retorna `problemDetected: true`
2. Admin recibe notificación push + in-app
3. Mobile muestra prompt para solicitar servicio

### Endpoint

`GET /properties/:id/problems` — retorna TaskLogs POOR/CRITICAL sin ServiceRequest activo asociado. Deduplica por tarea (último log). Ordena CRITICAL primero.

### Ciclo de vida

```
Inspección detecta POOR/CRITICAL → Problema aparece
     ↓
Usuario solicita servicio → Problema sale (tiene SR activo)
     ↓
Servicio completado → Tarea se re-inspecciona
     ↓
Si mejora → Resuelto     Si no mejora → Reaparece
```

No hay estado manual. Todo derivado de datos reales.

### UX del flujo

- **Web:** Card de problema es clickeable → navega al tab Plan y abre el detalle de la tarea automáticamente. Botón "Solicitar servicio" abre dialog pre-rellenado (con `stopPropagation`)
- **Mobile:** Row presionable → abre modal de ServiceRequest
- **Post-creación de SR:** Toast "Este problema ya está en proceso" con botón "Ver servicio" que navega al detalle del SR creado
- **Invalidación:** Completar tarea o crear SR invalida la query de problemas — el problema desaparece si la condición mejoró o si tiene SR activo
- **Mensajes de impacto:** Diferenciados por sector + severidad (ej: ROOF/CRITICAL → "Puede generar filtraciones activas y dañar interiores")

---

## 6. Sectores de vivienda

9 valores fijos (enum): EXTERIOR, ROOF, TERRACE, INTERIOR, KITCHEN, BATHROOM, BASEMENT, GARDEN, INSTALLATIONS.

- Cada propiedad tiene `activeSectors` (cuáles aplican a esa vivienda)
- Cada tarea puede tener un sector (opcional)
- El ISV calcula score por sector
- Los problemas detectados muestran mensaje de impacto por sector

---

## 7. Notificaciones y side-effects

- `NotificationsHandlerService` es el punto único para todos los side-effects
- Pattern: fire-and-forget con try/catch aislado
- Canales: push (Expo), in-app (DB), email (BullMQ queue)
- Triggers: completación de tarea, cambio de status de presupuesto/servicio, problema detectado, caída de ISV

---

## 8. Arquitectura de datos

### Backend patterns

- **Repository Pattern** con BaseRepository genérico + soft-delete
- **Deny-by-default guards** — si falta `@Roles()`, el endpoint se bloquea
- **Domain exceptions** mapeadas a HTTP codes
- **Transacciones** con timeout explícito (10s)
- **BullMQ** para emails + notificaciones async
- **Redis** para cache (dashboard stats 5 min) + token rotation + rate limiting

### Frontend patterns

- **React Query** para data fetching (staleTime: 2 min, refetchOnWindowFocus: false)
- **Zustand** solo para auth state (1 store, selectors granulares)
- **API factories** compartidas entre web y mobile via `@epde/shared`
- **Charts** cargados via `next/dynamic` (deferred ~200KB)

### Shared package (`@epde/shared`)

- **Zod schemas** = SSoT para validación (backend + frontend)
- **TypeScript types** = interfaces de todas las entidades
- **Constants** = labels en español, badge variants, design tokens, QUERY_KEYS
- **API factories** = `createBudgetQueries(apiClient)` etc.
- **Barrel exports** — consumidores importan `from '@epde/shared'`

---

## 9. Landing page

Marketing page con 16 secciones optimizadas para conversión:

1. Hero con headline de loss-aversion
2. Problema del mercado
3. Consecuencia económica
4. Solución EPDE
5. ISV visual (gauge SVG)
6. Cómo funciona (3 pasos)
7. Qué incluye
8. Sistema digital (screenshots)
9. Comparación tradicional vs EPDE
10. Credenciales (arquitecta)
11. Para quién
12. Pricing ($35.000 pago único, 6 meses acceso)
13. Urgencia (cupos limitados)
14. CTA final
15. Footer
16. WhatsApp flotante

---

## 10. Modelo de negocio

- **Producto:** Diagnóstico EPDE — $35.000 (pago único)
- **Incluye:** inspección completa, ISV, plan de mantenimiento, acceso al sistema por 6 meses
- **Continuidad:** suscripción mensual opcional después de los 6 meses
- **Revenue adicional:** servicios profesionales y presupuestos (se cotizan aparte)
- **Mercado:** propietarios de viviendas residenciales en Paraná, Argentina

---

## 11. Modelo de suscripción

- **Activación:** Al setear password (`set-password`), se registra `activatedAt` y se calcula `subscriptionExpiresAt` = activatedAt + 6 meses
- **Verificación:** `SubscriptionGuard` (4to guard global, después de RolesGuard) verifica `subscriptionExpiresAt > now()` en cada request autenticado de CLIENT. Salta `@Public()`, endpoints de auth, y usuarios ADMIN
- **Expiración:** Si la suscripción expiró, retorna HTTP 402 (Payment Required). El frontend intercepta 402 y redirige a página de suscripción expirada
- **Renovación:** Solo ADMIN puede extender `subscriptionExpiresAt` desde el panel de clientes (no hay auto-renovación ni pago online)
- **Recordatorios:** Cron job `subscription-reminder` (10:30 UTC diario) envía notificación in-app + email a clientes con 7, 3 y 1 días restantes. Deduplicación por día
- **Campos en User:** `activatedAt: DateTime?`, `subscriptionExpiresAt: DateTime?`
- **Índice:** `@@index([status, subscriptionExpiresAt])` para queries eficientes del scheduler
- **Validación dual:** El check de suscripción se ejecuta en dos puntos: (1) en AuthController.login() antes de emitir tokens (porque Passport swallows excepciones no-401 en strategy.validate()), y (2) en SubscriptionGuard para requests autenticados (lee subExp del JWT). AuthProvider.checkAuth() se saltea en páginas del grupo auth para evitar loops de redirect
