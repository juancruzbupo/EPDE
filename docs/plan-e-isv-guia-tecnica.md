# Plan de Mantenimiento e ISV — Guía Técnica Completa

> Documento exhaustivo que describe cómo se crea un plan de mantenimiento, cómo se cargan tareas, cómo se completan, y cómo se calcula el ISV (Índice de Salud de la Vivienda). Diseñado para ser consumido por una IA o un developer nuevo.

---

## 1. Creación de una Propiedad con Plan

Cuando se crea una propiedad, el sistema crea automáticamente un plan de mantenimiento vacío en la misma transacción.

**Endpoint:** `POST /api/v1/properties`

**Datos de entrada:**

| Campo         | Tipo               | Requerido           | Ejemplo                 |
| ------------- | ------------------ | ------------------- | ----------------------- |
| userId        | UUID               | Sí                  | `"a9de51bf-..."`        |
| address       | string (3-500)     | Sí                  | `"Av. Libertador 4500"` |
| city          | string (2-200)     | Sí                  | `"Paraná"`              |
| type          | PropertyType       | No (default: HOUSE) | `"HOUSE"`               |
| yearBuilt     | number (1800-2100) | No                  | `1985`                  |
| squareMeters  | number             | No                  | `120`                   |
| activeSectors | PropertySector[]   | No (default: los 9) | `["ROOF", "INTERIOR"]`  |

**Lo que pasa internamente (transacción atómica):**

1. Se crea el registro `Property`
2. Se crea un `MaintenancePlan` con:
   - `name`: "Plan de Mantenimiento — {address}"
   - `status`: DRAFT
   - `propertyId`: el ID de la property recién creada
3. Se retorna Property + Plan juntos

**Relación:** Cada Property tiene exactamente 1 MaintenancePlan (1:1).

---

## 2. Carga de Tareas al Plan

### Opción A: Tarea individual

**Endpoint:** `POST /api/v1/maintenance-plans/{planId}/tasks`

**Datos de entrada:**

| Campo                    | Tipo                    | Requerido                  | Default      |
| ------------------------ | ----------------------- | -------------------------- | ------------ |
| categoryId               | UUID                    | Sí                         | —            |
| name                     | string (2-200)          | Sí                         | —            |
| sector                   | PropertySector          | No                         | null         |
| description              | string (0-2000)         | No                         | null         |
| priority                 | TaskPriority            | No                         | MEDIUM       |
| recurrenceType           | RecurrenceType          | No                         | ANNUAL       |
| recurrenceMonths         | number (1-120)          | Solo si CUSTOM             | —            |
| nextDueDate              | Date                    | Solo si no es ON_DETECTION | —            |
| taskType                 | TaskType                | No                         | INSPECTION   |
| professionalRequirement  | ProfessionalRequirement | No                         | OWNER_CAN_DO |
| technicalDescription     | string (0-1000)         | No                         | null         |
| estimatedDurationMinutes | number                  | No                         | null         |

**Lo que pasa internamente:**

1. Se obtiene el máximo `order` entre las tareas existentes del plan
2. Se crea la tarea con `status: PENDING` y `order: maxOrder + 1`

### Opción B: Carga masiva desde plantilla

**Endpoint:** `POST /api/v1/maintenance-plans/{planId}/bulk-add-tasks`

**Datos de entrada:** `{ categoryTemplateId: UUID }`

**Lo que pasa internamente (transacción atómica):**

1. Se busca la plantilla de categoría con todas sus tareas-plantilla
2. Se busca o crea la categoría vinculada
3. Se crean N tareas desde las plantillas, cada una con `status: PENDING`

---

## 3. Ciclo de Vida de una Tarea

### Status automáticos (cron jobs)

| Transición                 | Condición                               | Cron   |
| -------------------------- | --------------------------------------- | ------ |
| PENDING → UPCOMING         | `nextDueDate` dentro de 30 días         | Diario |
| PENDING/UPCOMING → OVERDUE | `nextDueDate < ahora` y no ON_DETECTION | Diario |
| UPCOMING → PENDING         | `nextDueDate > 30 días` (se adelantó)   | Diario |

### Completar una tarea

**Endpoint:** `POST /api/v1/maintenance-plans/{planId}/tasks/{taskId}/complete`

**Datos de entrada:**

| Campo          | Tipo           | Requerido           | Ejemplo                           |
| -------------- | -------------- | ------------------- | --------------------------------- |
| result         | TaskResult     | Sí                  | `"OK"`, `"NEEDS_REPAIR"`          |
| conditionFound | ConditionFound | Sí                  | `"GOOD"`, `"POOR"`                |
| executor       | TaskExecutor   | Sí                  | `"OWNER"`, `"HIRED_PROFESSIONAL"` |
| actionTaken    | ActionTaken    | Sí                  | `"INSPECTION_ONLY"`, `"CLEANING"` |
| completedAt    | Date           | No (default: ahora) | `"2026-03-15"`                    |
| cost           | number         | No                  | `35000`                           |
| note           | string (0-500) | No                  | `"Se detectó humedad"`            |
| photoUrl       | string (URL)   | No                  | `"https://..."`                   |

**Lo que pasa internamente (transacción atómica):**

1. Se verifica que la tarea esté en estado completable (PENDING, UPCOMING, o OVERDUE)
2. Se calcula la **próxima fecha** según recurrencia:
   - ON_DETECTION → `null` (sin reprogramación automática)
   - Otras → `fecha actual + recurrenceMonths meses`
3. Se crea un **TaskLog** (registro inmutable de la completación)
4. Se actualiza la tarea:
   - `status` → PENDING (se reinicia para el próximo ciclo)
   - `nextDueDate` → la fecha calculada

**Concepto clave:** COMPLETED es transitorio. La tarea vuelve a PENDING inmediatamente. El historial queda en TaskLog.

---

## 4. Cálculo del ISV (Índice de Salud de la Vivienda)

### Resumen

El ISV es un score de 0 a 100 que representa el estado de salud de una vivienda. Se compone de 5 dimensiones ponderadas.

### Datos que se consultan

| Query                       | Qué trae                                                    | Límite |
| --------------------------- | ----------------------------------------------------------- | ------ |
| Tasks del plan              | id, status, priority, sector, nextDueDate                   | 500    |
| TaskLogs últimos 12 meses   | conditionFound, actionTaken, completedAt, sector (via task) | 2000   |
| TaskLogs de 3-6 meses atrás | conditionFound, actionTaken                                 | 1000   |

### Dimensión 1: Cumplimiento (35%)

Mide qué porcentaje de tareas están al día, ponderado por prioridad.

**Pesos por prioridad:**

| Prioridad | Peso |
| --------- | ---- |
| LOW       | 1    |
| MEDIUM    | 2    |
| HIGH      | 3    |
| URGENT    | 4    |

**Fórmula:**

```
pesoTotal = Σ peso(tarea.prioridad) para todas las tareas
pesoAlDía = Σ peso(tarea.prioridad) para tareas donde status ≠ OVERDUE
cumplimiento = REDONDEAR(pesoAlDía / pesoTotal × 100)
```

Si no hay tareas → 100.

**Ejemplo:** 2 HIGH vencidas (peso 3 cada una), 3 MEDIUM al día (peso 2), 1 LOW al día (peso 1)

- pesoTotal = 6 + 6 + 1 = 13
- pesoAlDía = 6 + 1 = 7
- cumplimiento = 7/13 × 100 = **54**

### Dimensión 2: Condición (30%)

Promedio de la condición encontrada en las inspecciones de los últimos 12 meses.

**Escala de condición:**

| ConditionFound | Puntaje |
| -------------- | ------- |
| EXCELLENT      | 100     |
| GOOD           | 80      |
| FAIR           | 60      |
| POOR           | 40      |
| CRITICAL       | 20      |

**Fórmula:**

```
condición = PROMEDIO(puntaje(log.conditionFound) para cada TaskLog reciente)
```

Si no hay logs → 50 (default).

**Ejemplo:** 5 logs: EXCELLENT(100), GOOD(80), GOOD(80), FAIR(60), POOR(40)

- condición = (100+80+80+60+40) / 5 = **72**

### Dimensión 3: Cobertura (20%)

Porcentaje de sectores de la vivienda que fueron inspeccionados en los últimos 12 meses.

**Fórmula:**

```
todosLosSectores = sectores únicos de todas las tareas
sectoresInspeccionados = sectores únicos de los TaskLogs recientes
cobertura = REDONDEAR(sectoresInspeccionados / todosLosSectores × 100)
```

Si no hay sectores definidos → 0.

**Ejemplo:** Tareas en ROOF, INTERIOR, KITCHEN, BATHROOM. Logs solo en ROOF e INTERIOR.

- cobertura = 2/4 × 100 = **50**

### Dimensión 4: Inversión (15%)

Ratio de acciones preventivas vs correctivas.

**Acciones preventivas:** INSPECTION_ONLY, CLEANING, ADJUSTMENT, SEALING

**Acciones correctivas:** MINOR_REPAIR, MAJOR_REPAIR, REPLACEMENT, TREATMENT, FULL_SERVICE, NO_ACTION

**Fórmula:**

```
preventivas = cantidad de logs con acción preventiva
inversión = REDONDEAR(preventivas / totalLogs × 100)
```

Si no hay logs → 50 (default).

**Ejemplo:** 10 logs: 4 INSPECTION_ONLY, 2 CLEANING, 2 MINOR_REPAIR, 2 MAJOR_REPAIR

- preventivas = 6
- inversión = 6/10 × 100 = **60**

### Dimensión 5: Tendencia (informativa, sin peso)

Compara la condición promedio del trimestre actual vs el trimestre anterior.

**Fórmula:**

```
promedioReciente = promedio de condición de logs de los últimos 3 meses
promedioAnterior = promedio de condición de logs de 3-6 meses atrás
tendencia = MAX(0, MIN(100, REDONDEAR(50 + (promedioReciente - promedioAnterior))))
```

- tendencia > 50 → mejorando
- tendencia = 50 → estable
- tendencia < 50 → declinando

### Score Global

```
ISV = REDONDEAR(cumplimiento × 0.35 + condición × 0.30 + cobertura × 0.20 + inversión × 0.15)
```

La tendencia NO se incluye en el cálculo. Es solo informativa.

### Labels

| Rango     | Label             |
| --------- | ----------------- |
| ≥ 80      | Excelente         |
| ≥ 60      | Bueno             |
| ≥ 40      | Regular           |
| ≥ 20      | Necesita atención |
| < 20      | Crítico           |
| Sin datos | Sin datos         |

### Scores por Sector

Además del score global, se calcula un score por sector:

```
Para cada sector con tareas:
  score = REDONDEAR((totalTareas - tareasVencidas) / totalTareas × 100)
```

Los sectores se ordenan del peor al mejor.

---

## 5. Snapshot Mensual

Un cron job corre el 1ro de cada mes a las 02:00 UTC.

**Proceso:**

1. Obtiene todas las propiedades con plan activo (máximo 1000)
2. Para cada una (en batches de 10):
   - Calcula el ISV en tiempo real
   - Guarda un snapshot con: score, label, las 5 dimensiones, sector scores
   - Si el score cayó ≥15 puntos respecto al mes anterior → genera alerta

**Uso:** Los snapshots se usan para:

- Gráfico de evolución del ISV (últimos 12 meses)
- Detección de caídas significativas (alertas)
- NO se usan para mostrar el ISV actual (eso es siempre real-time)

---

## 6. Dónde se Muestra el ISV

| Vista                            | Fuente                          | Cálculo                             |
| -------------------------------- | ------------------------------- | ----------------------------------- |
| Dashboard del cliente            | `getPropertyHealthIndex()`      | Real-time, cache Redis 5 min        |
| Tabla de propiedades             | `getPropertyHealthIndexBatch()` | Real-time batch (2 queries totales) |
| Detalle de propiedad (tab Salud) | `getPropertyHealthIndex()`      | Real-time                           |
| Gráfico de evolución             | `ISVSnapshot` (últimos 12)      | Histórico mensual                   |

Todas las vistas usan la misma fórmula. No hay cálculos alternativos.

---

## 7. Ejemplo Completo

### Propiedad con 4 tareas y 3 completaciones

**Tareas:**

| Tarea              | Sector        | Prioridad | Status   |
| ------------------ | ------------- | --------- | -------- |
| Inspección techos  | ROOF          | HIGH      | PENDING  |
| Revisión cañerías  | BATHROOM      | MEDIUM    | OVERDUE  |
| Limpieza canaletas | ROOF          | LOW       | PENDING  |
| Control eléctrico  | INSTALLATIONS | URGENT    | UPCOMING |

**TaskLogs (últimos 12 meses):**

| Tarea              | Condición | Acción          | Sector   |
| ------------------ | --------- | --------------- | -------- |
| Inspección techos  | GOOD      | INSPECTION_ONLY | ROOF     |
| Revisión cañerías  | POOR      | MINOR_REPAIR    | BATHROOM |
| Limpieza canaletas | FAIR      | CLEANING        | ROOF     |

**Cálculo:**

**Cumplimiento (35%):**

- HIGH(3) PENDING=al día + MEDIUM(2) OVERDUE=vencida + LOW(1) PENDING=al día + URGENT(4) UPCOMING=al día
- pesoTotal = 3 + 2 + 1 + 4 = 10
- pesoAlDía = 3 + 1 + 4 = 8 (se excluye la MEDIUM vencida)
- cumplimiento = 8/10 × 100 = **80**

**Condición (30%):**

- GOOD(80) + POOR(40) + FAIR(60)
- condición = (80+40+60) / 3 = **60**

**Cobertura (20%):**

- Sectores en tareas: {ROOF, BATHROOM, INSTALLATIONS}
- Sectores inspeccionados: {ROOF, BATHROOM}
- cobertura = 2/3 × 100 = **67**

**Inversión (15%):**

- INSPECTION_ONLY (preventiva) + MINOR_REPAIR (correctiva) + CLEANING (preventiva)
- preventivas = 2, total = 3
- inversión = 2/3 × 100 = **67**

**Score Global:**

```
ISV = 80 × 0.35 + 60 × 0.30 + 67 × 0.20 + 67 × 0.15
    = 28 + 18 + 13.4 + 10.05
    = 69.45 → 69
```

**Label:** Bueno (≥60)

**Scores por sector:**

- ROOF: 2 tareas, 0 vencidas → 100%
- BATHROOM: 1 tarea, 1 vencida → 0%
- INSTALLATIONS: 1 tarea, 0 vencidas → 100%

---

## 8. Problemas Detectados (flujo automático)

### Cuándo aparece un problema

Cuando se completa una tarea con `conditionFound` = **POOR** o **CRITICAL**:

1. Backend retorna `problemDetected: true` en la respuesta de completación
2. Admin recibe notificación push + in-app
3. Mobile muestra Alert preguntando si quiere solicitar servicio
4. El problema aparece en `GET /properties/:id/problems`

### Qué muestra el endpoint

**`GET /api/v1/properties/:id/problems`**

Retorna TaskLogs con condición POOR/CRITICAL que **no tienen un ServiceRequest activo** asociado:

- Deduplica por `taskId` (solo el último log por tarea)
- Excluye tareas con ServiceRequest en status != RESOLVED/CLOSED
- Ordena: CRITICAL primero, luego por fecha
- Límite: 20 problemas

Cada problema incluye: `taskId`, `taskName`, `sector`, `conditionFound`, `severity` (high/medium), `notes`, `completedAt`, `propertyId`, `propertyAddress`.

### Ciclo de vida de un problema

```
Inspección detecta POOR/CRITICAL → Problema aparece en UI
         ↓
Usuario solicita servicio → Problema sale de la lista (tiene SR activo)
         ↓
Servicio se completa → SR pasa a RESOLVED/CLOSED
         ↓
Tarea se re-inspecciona en su próximo ciclo
         ↓
Si condición mejora (GOOD/EXCELLENT) → Resuelto definitivamente
Si condición sigue mala → Reaparece en la lista
```

### Reglas clave

- **No hay estado manual** — el problema se resuelve cuando los datos reales lo confirman
- **No hay entidades nuevas** — derivado de TaskLog + ServiceRequest existentes
- **No afecta el ISV directamente** — el ISV ya penaliza condiciones malas en su dimensión Condición
- **Mensajes de impacto** diferenciados por sector + severidad (ej: ROOF/CRITICAL → "Puede generar filtraciones activas")

### Dónde se muestra

| Plataforma | Ubicación                            | Comportamiento                                                       |
| ---------- | ------------------------------------ | -------------------------------------------------------------------- |
| Web        | Property detail → tab Salud          | Sección "Esto puede generarte gastos" con botón "Solicitar servicio" |
| Mobile     | Property detail → sección colapsable | Rows presionables → abren modal de ServiceRequest                    |
| Tab badge  | Web tab "Salud (3)"                  | Muestra cantidad de problemas activos                                |
