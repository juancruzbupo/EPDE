# ADR-019: Technical inspections — paid professional service

## Estado

Aceptada — implementada en abril 2026.

## Contexto

Hasta ADR-019, EPDE ofrecía dos canales de trabajo operativo:

1. **Plan de mantenimiento** (suscripción mensual): tareas cíclicas, diagnóstico ISV, certificado automático.
2. **Service requests**: cliente avisa de un problema, EPDE lo deriva a un profesional matriculado del directorio (ADR-018).

Lo que faltaba: un producto **profesional y pagado** ejecutado directamente por Arq. Noelia Yuskowich como matriculada — no derivado, no automático. Casos concretos que ya estaban llegando por WhatsApp sin poder registrarse:

- Cliente pide un **informe técnico firmado** para compraventa o escribano.
- Propietario heredó una vivienda y quiere un **relevamiento estructural** para decidir si vende o arregla.
- Inquilino o comprador potencial quiere un **segundo ojo profesional** antes de firmar contrato.

Estos casos no encajan en el plan (son puntuales), ni en service requests (no se derivan — los ejecuta Noelia con su matrícula), ni en el certificado (ese es automático y gratuito como bonus del plan). Perder estos ingresos además desaprovecha la credencial más fuerte que EPDE tiene: el título habilitante de Noelia.

## Decisión

Creamos **Technical Inspection** como modelo aparte con tres tipos preconfigurados, pricing escalonado, y un flujo que va desde la solicitud del cliente hasta el pago post-entrega.

### Pricing (ARS, abril 2026) — tiers por superficie

Tres tiers según m² de la propiedad (cliente EPDE, −15% sobre público):

| Tipo                 | Hasta 120 m² | 120–250 m² | Más de 250 m² |
| -------------------- | ------------ | ---------- | ------------- |
| Básica               | 114.750      | 153.000    | 212.500       |
| Estructural profunda | 340.000      | 442.000    | 595.000       |
| Para compraventa     | 658.750      | 850.000    | 1.190.000     |

Precios derivados de investigación de mercado (abril 2026): InspecThome mínimos + CheckHome USD 299–499 convertidos + CAPBA aranceles Informe Técnico + mediana del rango para interior (Paraná, ER).

**Por qué tiers en vez de precio único o cotización**: una casa de 80 m² en PB no implica las mismas horas que una casona de 300 m² en dos plantas. El precio único sub-cotiza casas grandes y sobre-cotiza chicas; la cotización manual mata el ancla de precio en landing (−30/40% en conversión). Tiers por m² captura ambos beneficios con costo operativo nulo: la superficie ya está en `Property.squareMeters`, el tier se resuelve automáticamente con `resolveInspectionPriceTier()`, y el precio se congela al crear.

**Fallback**: si `squareMeters` es null o ≤0, cae a tier MEDIUM (conservador, el admin puede ajustar manualmente si la propiedad es atípica).

El descuento del 15% es un **retention perk** para clientes activos — refuerza el lock-in de la suscripción.

### Flujo (state machine)

```
REQUESTED → SCHEDULED → IN_PROGRESS → REPORT_READY → PAID
    ↓           ↓              ↓             ↓
 CANCELED   CANCELED       CANCELED      CANCELED
```

- **REQUESTED**: cliente envía la solicitud (tipo + propiedad + notas). El precio queda congelado en ese momento con el descuento aplicable.
- **SCHEDULED**: admin coordina fecha/hora de visita.
- **IN_PROGRESS**: visita en sitio realizándose.
- **REPORT_READY**: admin subió el PDF firmado. Cliente ya puede descargarlo y pagar.
- **PAID**: admin registra la transferencia recibida. Terminal.
- **CANCELED**: soft-delete. No se puede cancelar una ya pagada.

### Decisiones de diseño

**Solo clientes activos pueden solicitar**: verificamos `subscriptionExpiresAt > now` en el service. Razón: (a) es un beneficio del plan, y (b) evita que el directorio quede expuesto como un servicio público separado que compita con el plan mensual.

**Precio congelado al crear (`feeAmount`)**: el cambio de tarifario futuro no afecta solicitudes existentes. Evita disputas "me cotizaste X hace un mes".

**Numeración secuencial por año (`INSP-YYYY-NNNN`)**: singleton `TechnicalInspectionCounter` con JSON por año + incremento atómico. Igual pattern que BudgetRequest.

**Entrega primero, pago después**: el cliente recibe el informe antes de transferir. Razón de confianza: Noelia ya firmó, descargó, no va a escaparse con el dinero. Simplifica también el flujo legal (no somos un PSP).

**Pago manual (transferencia bancaria)**: no integramos pasarela. Razón: volumen bajo al arrancar (< 10 inspecciones/mes proyectado), no justifica el costo de MP/Stripe + comisiones. Admin registra el pago manualmente con `paymentMethod` + `paymentReceiptUrl` opcional.

**Visible en la landing como servicio adicional**: sección dedicada después del certificado, antes de la inversión. Marketing dual — ancla el valor autoridad de Noelia ("firmado por arquitecta matriculada") + fuerza motivo adicional para suscribirse (el 15% off es exclusivo activos).

**Disclaimer explícito de oblea/RE-7**: el tipo SALE no incluye oblea NAG-226 de gasista matriculado ni informe RE-7 de electricista matriculado. Está explicitado en la descripción del tipo y en la landing. Razón legal: no podemos ofrecer lo que requiere otra matrícula distinta.

## Modelo de datos

```prisma
model TechnicalInspection {
  id                String                           @id @default(uuid())
  inspectionNumber  String                           @unique @db.VarChar(20)
  propertyId        String
  requestedBy       String
  type              TechnicalInspectionType
  status            TechnicalInspectionStatus        @default(REQUESTED)
  clientNotes       String?                          @db.VarChar(2000)
  adminNotes        String?                          @db.VarChar(4000)
  scheduledFor      DateTime?
  completedAt       DateTime?
  deliverableUrl    String?
  deliverableFileName String?                        @db.VarChar(200)
  feeAmount         Decimal                          @db.Decimal(12, 2)
  priceTier         InspectionPriceTier              @default(MEDIUM)
  propertySqm       Float?
  feeStatus         TechnicalInspectionPaymentStatus @default(PENDING)
  hadActivePlan     Boolean                          @default(false)
  paidAt            DateTime?
  paymentMethod     String?                          @db.VarChar(50)
  paymentReceiptUrl String?
  createdAt         DateTime                         @default(now())
  updatedAt         DateTime                         @updatedAt
  deletedAt         DateTime?
  property          Property                         @relation(fields: [propertyId], references: [id], onDelete: Cascade)
  requester         User                             @relation(fields: [requestedBy], references: [id], onDelete: Restrict)
}

model TechnicalInspectionCounter {
  id             String   @id @default("singleton")
  yearlyCounters Json     @default("{}")
  updatedAt      DateTime @updatedAt
}

enum TechnicalInspectionType           { BASIC, STRUCTURAL, SALE }
enum TechnicalInspectionStatus         { REQUESTED, SCHEDULED, IN_PROGRESS, REPORT_READY, PAID, CANCELED }
enum TechnicalInspectionPaymentStatus  { PENDING, PAID, CANCELED }
enum InspectionPriceTier               { SMALL, MEDIUM, LARGE }
```

Soft-delete: sí (criterio "audit relevance": registro profesional firmado con valor legal). Incluido en `SOFT_DELETABLE_MODELS` + ESLint rules.

## Endpoints (REST)

Bajo `/technical-inspections`, prefijo estándar.

| Método | Path               | Rol           | Descripción                      |
| ------ | ------------------ | ------------- | -------------------------------- |
| GET    | `/`                | CLIENT, ADMIN | Lista (cliente ve la suya)       |
| GET    | `/:id`             | CLIENT, ADMIN | Detalle (con ownership check)    |
| POST   | `/`                | CLIENT        | Crear (solo subscripción activa) |
| PATCH  | `/:id/schedule`    | ADMIN         | Agendar visita                   |
| PATCH  | `/:id/status`      | ADMIN         | Cambiar estado                   |
| POST   | `/:id/deliverable` | ADMIN         | Subir informe PDF firmado        |
| POST   | `/:id/mark-paid`   | ADMIN         | Registrar pago recibido          |
| DELETE | `/:id`             | ADMIN         | Cancelar (soft-delete)           |

Subida del PDF reutiliza `/upload` — el controller solo persiste la URL. Auto-transición: al subir `deliverableUrl` el estado pasa a `REPORT_READY`.

## Consecuencias

**Positivas**

- Ingreso adicional recurrente fuera del plan, sin diluir la suscripción mensual.
- Aprovecha la credencial más fuerte (matrícula de Noelia) en la landing y en la UX.
- Marketing dual: refuerza el valor de ser cliente activo (−15%) y la autoridad profesional.
- Trazabilidad completa de inspecciones firmadas (soft-delete + audit trail).

**Negativas / costos**

- El admin sostiene una responsabilidad profesional nueva (firma con matrícula) por cada trabajo.
- Volumen bajo al inicio; el costo de desarrollo se amortiza lento.
- Disclaimer de oblea/RE-7 puede confundir clientes que esperan "todo-en-uno" para escrituración.

**Invariantes**

- Precio congelado al crear: inmutable post-solicitud.
- Solo clientes con `subscriptionExpiresAt >= now` pueden crear.
- Transición terminal PAID / CANCELED — no se revierte.
- `paidAt` requiere `deliverableUrl` ≠ null.
