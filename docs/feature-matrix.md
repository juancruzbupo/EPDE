# Feature Matrix — Web vs Mobile

Mapa explícito de qué funcionalidades existen en cada cliente.
Actualizar cuando se agrega o modifica una feature en cualquier plataforma.

## Leyenda

| Símbolo | Significado               |
| ------- | ------------------------- |
| ✅      | Implementado              |
| ❌      | No aplica (por diseño)    |
| 🚧      | Pendiente / En desarrollo |

## Features por módulo

| Feature                                 | Web (Admin) | Web (Cliente) | Mobile (Cliente) |           Mobile (Admin)           | Notas                                                                             |
| --------------------------------------- | :---------: | :-----------: | :--------------: | :--------------------------------: | --------------------------------------------------------------------------------- |
| **Auth**                                |             |               |                  |                                    |                                                                                   |
| Login                                   |     ✅      |      ✅       |        ✅        |                 ✅                 |                                                                                   |
| Set Password (invitación)               |     ✅      |      ✅       |        ✅        |                 ✅                 |                                                                                   |
| Token refresh automático                |     ✅      |      ✅       |        ✅        |                 ✅                 | Web: cookie; Mobile: SecureStore                                                  |
| **Dashboard**                           |             |               |                  |                                    |                                                                                   |
| Stats generales (admin)                 |     ✅      |      ❌       |        ❌        |                 ❌                 | Admin mobile redirige a web                                                       |
| Stats personales (cliente)              |     ❌      |      ✅       |        ✅        |                 ❌                 | HealthCard + stat cards                                                           |
| Analytics admin (charts)                |     ✅      |      ❌       |        ❌        |                 ❌                 | Recharts: trend, donut, bars, stacked area                                        |
| Analytics cliente (charts)              |     ❌      |      ✅       |        ✅        |                 ❌                 | Web: Recharts; Mobile: SVG custom                                                 |
| Tareas próximas                         |     ❌      |      ✅       |        ✅        |                 ❌                 |                                                                                   |
| **Propiedades**                         |             |               |                  |                                    |                                                                                   |
| Listado                                 |     ✅      |      ✅       |        ✅        |                 ✅                 |                                                                                   |
| Crear / Editar                          | ✅ (admin)  |      ❌       |        ❌        |                 ❌                 | Solo admin crea desde web                                                         |
| Ver detalle                             |     ✅      |      ✅       |        ✅        |                 ✅                 |                                                                                   |
| Activar / Archivar plan                 | ✅ (admin)  |      ❌       |        ❌        |                 ✅                 | Mobile admin puede cambiar estado del plan                                        |
| **Planes de Mantenimiento**             |             |               |                  |                                    |                                                                                   |
| Listado de planes                       |     ✅      |      ✅       |        ✅        |                 ✅                 |                                                                                   |
| Ver detalle de plan                     |     ✅      |      ✅       |  Vía propiedad   |           Vía propiedad            |                                                                                   |
| Crear / Editar plan                     | ✅ (admin)  |      ❌       |        ❌        |                 ❌                 | Auto-creado con propiedad                                                         |
| **Tareas**                              |             |               |                  |                                    |                                                                                   |
| Listado global de tareas                |     ✅      |      ✅       |        ✅        |                 ✅                 | Tab "Tareas" en mobile                                                            |
| Ver detalle de tarea                    |     ✅      |      ✅       |        ✅        |                 ✅                 |                                                                                   |
| Crear / Editar tarea                    | ✅ (admin)  |      ❌       |        ❌        |                 ❌                 |                                                                                   |
| Completar tarea                         |     ✅      |      ✅       |        ✅        |                 ✅                 | Con foto, costo, nota                                                             |
| Solicitar servicio desde tarea          |     ✅      |      ✅       |        ✅        |                 ✅                 | Pre-llena propertyId + taskId + título                                            |
| Completar tarea desde PlanEditor        | ✅ (admin)  |      ❌       |        ❌        |                 ❌                 | Sin salir de la propiedad                                                         |
| Bulk tasks desde template               | ✅ (admin)  |      ❌       |        ❌        |                 ❌                 | POST /tasks/bulk (admin web only)                                                 |
| Reordenar tareas                        | ✅ (admin)  |      ❌       |        ❌        |                 ❌                 | Drag & drop                                                                       |
| Notas de tarea                          |     ✅      |      ✅       |        ✅        |                 ✅                 |                                                                                   |
| Historial de tarea (logs)               |     ✅      |      ✅       |        ✅        |                 ✅                 |                                                                                   |
| **Presupuestos**                        |             |               |                  |                                    |                                                                                   |
| Listado                                 |     ✅      |      ✅       |        ✅        |                 ✅                 |                                                                                   |
| Crear solicitud                         | ✅ (admin)  |      ✅       |        ✅        |                 ❌                 |                                                                                   |
| Ver detalle                             |     ✅      |      ✅       |        ✅        |                 ✅                 |                                                                                   |
| Cotizar / Re-cotizar                    | ✅ (admin)  |      ❌       |        ❌        |                 ✅                 | RespondBudgetModal con line items dinámicos                                       |
| Aprobar / Rechazar                      |     ❌      |      ✅       |        ✅        |                 ❌                 | Solo cliente                                                                      |
| Iniciar Trabajo / Completar             | ✅ (admin)  |      ❌       |        ❌        |                 ✅                 |                                                                                   |
| Generar desde SR                        | ✅ (admin)  |      ❌       |        ❌        |                 ✅                 | Pre-llena con datos del SR                                                        |
| **Solicitudes de Servicio**             |             |               |                  |                                    |                                                                                   |
| Listado                                 |     ✅      |      ✅       |        ✅        |                 ✅                 |                                                                                   |
| Crear solicitud                         | ✅ (admin)  |      ✅       |        ✅        |                 ❌                 | Con fotos                                                                         |
| Ver detalle + fotos                     |     ✅      |      ✅       |        ✅        |                 ✅                 |                                                                                   |
| Transiciones de estado                  | ✅ (admin)  |      ❌       |        ❌        |                 ✅                 | OPEN→IN_REVIEW→IN_PROGRESS→RESOLVED→CLOSED                                        |
| Generar presupuesto desde SR            | ✅ (admin)  |      ❌       |        ❌        |                 ✅                 |                                                                                   |
| **Notificaciones**                      |             |               |                  |                                    |                                                                                   |
| Centro de notificaciones                |     ✅      |      ✅       |        ✅        |                 ✅                 | Badge en tab Avisos                                                               |
| Marcar como leída                       |     ✅      |      ✅       |        ✅        |                 ✅                 | Swipe en mobile                                                                   |
| **Inspección Visual**                   |             |               |                  |                                    |                                                                                   |
| Crear checklist de inspección           | ✅ (admin)  |      ❌       |        ❌        |                 ❌                 | Items generados desde TaskTemplates. Un solo DRAFT activo por propiedad           |
| Evaluar items (OK/Atención/Prof)        | ✅ (admin)  |      ❌       |        ❌        |                 ❌                 | Con hallazgo + foto. Editable mientras status=DRAFT                               |
| Agregar item custom                     | ✅ (admin)  |      ❌       |        ❌        |                 ❌                 |                                                                                   |
| Generar plan desde inspección           | ✅ (admin)  |      ❌       |        ❌        |                 ❌                 | Ajusta prioridades según hallazgos. Lockea checklist (DRAFT→COMPLETED)            |
| Ver inspecciones de propiedad           |     ✅      |      ❌       |        ❌        |                 ❌                 | Tab Inspección en detalle propiedad                                               |
| Guía de inspección (modal)              | ✅ (admin)  |      ❌       |        ❌        |                 ❌                 | 152 guías con UI rica, ojo por item                                               |
| Sectores colapsables                    | ✅ (admin)  |      ❌       |        ❌        |                 ❌                 | Colapsar/expandir sectores completados                                            |
| Editor de guías (admin)                 | ✅ (admin)  |      ❌       |        ❌        |                 ❌                 | Markdown + upload imágenes en templates                                           |
| **Onboarding Tours**                    |             |               |                  |                                    |                                                                                   |
| Tours guiados (react-joyride)           |     ❌      |      ✅       |        ❌        |                 ❌                 | Solo rol CLIENT, se muestran una vez                                              |
| **Plantillas (Templates)**              |             |               |                  |                                    |                                                                                   |
| Gestionar CategoryTemplates             | ✅ (admin)  |      ❌       |        ❌        |                 ❌                 | Solo panel admin web                                                              |
| Gestionar TaskTemplates                 | ✅ (admin)  |      ❌       |        ❌        |                 ❌                 | Sub-recursos de CategoryTemplate                                                  |
| **Clientes**                            |             |               |                  |                                    |                                                                                   |
| Listar / Invitar clientes               | ✅ (admin)  |      ❌       |        ❌        |                 ❌                 |                                                                                   |
| **Perfil**                              |             |               |                  |                                    |                                                                                   |
| Ver perfil                              |     ✅      |      ✅       |        ✅        |                 ✅                 |                                                                                   |
| Logout                                  |     ✅      |      ✅       |        ✅        |                 ✅                 |                                                                                   |
| **Risk Score (Priorización)**           |             |               |                  |                                    |                                                                                   |
| Cálculo de riskScore por tarea          |     ✅      |      ✅       |        ✅        |                 ❌                 | priority × severity × sector_weight (0-18)                                        |
| Ordenamiento por riesgo                 |     ✅      |      ✅       |        ✅        |                 ❌                 | Plan viewer ordena por riskScore DESC                                             |
| Badge de riesgo en tareas               |     ✅      |      ✅       |        ✅        |                 ❌                 | Rojo ≥12, amarillo ≥6                                                             |
| **ISV (Índice Salud Vivienda)**         |             |               |                  |                                    |                                                                                   |
| ISV score en tab Salud                  |     ✅      |      ✅       |        ✅        |                 ✅                 | 5 dimensiones + sector scores                                                     |
| ISV historial (chart)                   |     ✅      |      ✅       |        ✅        |                 ✅                 | Barras mensuales (últimos 12 meses)                                               |
| ISV columna en tabla                    |     ✅      |      ❌       |        ❌        |                 ❌                 | Badge color-coded en listado de propiedades                                       |
| ISV reporte imprimible                  |     ✅      |      ✅       |        ❌        |                 ❌                 | window.print()                                                                    |
| Informe técnico completo                |     ✅      | ✅ (web link) |        ✅        |                 ✅                 | /properties/{id}/report                                                           |
| Certificado de Mantenimiento Preventivo |     ✅      |      ✅       |        🚧        |                 ✅                 | /properties/{id}/certificate. Requiere ISV ≥60 + 1 año antigüedad plan. CERT-NNNN |
| **Profesionales matriculados (admin)**  |             |               |                  |                                    |                                                                                   |
| Directorio CRUD                         |     ✅      |      ❌       |        ❌        |                 ❌                 | /professionals. Admin-only, gated por middleware                                  |
| Smart match top-3 para SRs              |     ✅      |      ❌       |        ❌        |                 ❌                 | Tier + rating bayesiano + anti-fatiga                                             |
| Valoraciones + tags + timeline          |     ✅      |      ❌       |        ❌        |                 ❌                 | Admin score 1-5 + 3 sub-ratings + comentario cliente separado                     |
| Adjuntos (matrícula, seguro RC)         |     ✅      |      ❌       |        ❌        |                 ❌                 | Matrícula requiere expiresAt. Cron notifica 30d antes                             |
| Pagos EPDE → profesional                |     ✅      |      ❌       |        ❌        |                 ❌                 | PENDING → PAID status machine                                                     |
| Asignación 1:1 con Service Request      |     ✅      |      ❌       |        ❌        |                 ❌                 | Cliente nunca ve el nombre del profesional (lock-in)                              |
| ISV alertas (caída >15 pts)             |     ✅      |      ✅       |        ✅        |     Notificación in-app + push     |
| ISV snapshots mensuales                 |   Backend   |    Backend    |     Backend      | Cron job 1ro de cada mes 02:00 UTC |
| **Suscripción**                         |             |               |                  |                                    |                                                                                   |
| Estado de suscripción                   |     ✅      |      ✅       |        ✅        |                 ✅                 | SubscriptionGuard verifica en cada request                                        |
| Página suscripción expirada             |     ❌      |      ✅       |        ✅        |                 ❌                 | Redirect automático en 402                                                        |
| Renovar suscripción (admin)             | ✅ (admin)  |      ❌       |        ❌        |                 ❌                 | Admin extiende subscriptionExpiresAt                                              |
| Suspender + Quitar límite               | ✅ (admin)  |      ❌       |        ❌        |                 ❌                 | Suspender=expiresAt now; Quitar límite=null                                       |
| SubscriptionInfo en perfil              |     ❌      |      ✅       |        ✅        |                 ❌                 | Web: SubscriptionInfo; Mobile: MobileSubscriptionInfo                             |
| Warning banner ≤7 días                  |     ❌      |      ✅       |        ✅        |                 ❌                 | Banner en dashboard si quedan ≤7 días                                             |
| "Próxima inspección" card               |     ❌      |      ✅       |        ✅        |                 ❌                 | Primera tarea UPCOMING no vencida (azul)                                          |
| Notificaciones en sidebar               |     ❌      |      ❌       |        ❌        |                 ❌                 | Removida de sidebar; accesible via bell icon en header                            |
| Recordatorios de vencimiento            |   Backend   |    Backend    |     Backend      |    Cron diario 7/3/1 días antes    | Notificación in-app + email                                                       |
| **Programa de recomendación**           |             |               |                  |                                    |                                                                                   |
| Código personal + URL compartible       |     ✅      |      ✅       |        ✅        |                 ❌                 | Generado al crear el cliente; mismo formato en web/mobile                         |
| Compartir (copy + WhatsApp/Share)       |     ❌      |      ✅       |        ✅        |                 ❌                 | Web: copy code/link + WhatsApp; Mobile: native Share sheet                        |
| Stats (recomendados/conversiones/meses) |     ✅      |      ✅       |        ✅        |                 ❌                 |                                                                                   |
| Stepper de hitos (1/2/3/5/10)           |     ❌      |      ✅       |        ❌        |                 ❌                 | Mobile muestra hint de próximo hito en lugar del stepper completo                 |
| Historial de recomendaciones            |     ✅      |      ✅       |        ❌        |                 ❌                 | Web admin lo ve por cliente; cliente ve los suyos en `/profile`                   |
| Marcar recomendación como pagada        | ✅ (admin)  |      ❌       |        ❌        |                 ❌                 | `POST /admin/referrals/:id/convert` (manual mientras no haya pagos)               |
| Recalcular contadores                   | ✅ (admin)  |      ❌       |        ❌        |                 ❌                 | Drift recovery; no dispara emails                                                 |
| Email de hito alcanzado                 |   Backend   |    Backend    |     Backend      |              Backend               | BullMQ; dedupe por `<email>:<milestone>`                                          |
| Email a admin al cruzar 10              |   Backend   |    Backend    |     Backend      |              Backend               | Disparado por `delta.biannualDiagnosis > 0`                                       |
| **Categorías**                          |             |               |                  |                                    |
| Gestionar categorías                    | ✅ (admin)  |      ❌       |        ❌        |      Categorías operacionales      |

## Diferencias intencionales entre plataformas

| Área                   | Web                                  | Mobile                                                                     | Razón                                                                                                                               |
| ---------------------- | ------------------------------------ | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Property detail        | Tabs (Salud/Plan/Gastos/Fotos)       | CollapsibleSections                                                        | Mobile: scroll vertical natural; Web: tabs para pantalla grande                                                                     |
| Dark mode toggle       | Header dropdown (CSS class `.dark`)  | Profile screen (`vars()` NativeWind)                                       | Web: toggle CSS class en `<html>`. Mobile: `vars()` inyecta tokens en root View (NativeWind no soporta cascade de className)        |
| Font scale             | Profile → `--font-scale` CSS var     | Profile → `useType()` hook escala TYPE                                     | Web usa CSS variable global; mobile escala per-component via hook. Constantes compartidas en `@epde/shared/constants/font-scale.ts` |
| Confirmación destruct. | Dialog shadcn con labels explícitos  | `confirm()` API → Modal con labels                                         | Web usa Dialog component; mobile usa emitter + ConfirmHost (patrón toast). Ambos fuerzan confirmLabel obligatorio                   |
| Onboarding             | 73 data-tour overlay tooltips        | Carousel genérico + FirstTimeBanner inline en 3 screens                    | Overlays hostiles en mobile touch. Banners inline one-shot (persisten dismiss en AsyncStorage). ADR-016                             |
| Motivation style       | Profile → rewards/minimal toggle     | Profile → MotivationSelector (🎉/📊)                                       | Mobile porta el mismo toggle. Confetti + messages gateados por motivationStyle. Web tiene MotivationCard + NotificationsCard extras |
| Engagement cards       | ISV animated + streak + weekly obj.  | MonthlySummaryCard + ProtectedHomeBanner + PreventionROICard               | Mobile agrega 3 cards profesionales de engagement: resumen mensual, status all-clear, ROI de prevención. Web tiene weekly challenge |
| Notification routing   | `/budgets/`, `/properties/` (plural) | `/budget/`, `/property/` (singular)                                        | Expo Router usa file system routes (singular)                                                                                       |
| Dashboard welcome      | "Bienvenido, {nombre}"               | "Hola, {nombre}"                                                           | Ambos personalizados, tono ligeramente diferente                                                                                    |
| Tab bar mobile         | N/A (sidebar nav)                    | 5 tabs visibles; Presupuestos, Solicitudes y Planes ocultos (`href: null`) | Simplifica la nav para el caso de uso principal del cliente. Las rutas ocultas siguen accesibles por deep link desde notificaciones |

## Riesgos de drift documentados

1. **Design tokens**: Web usa CSS custom properties (`globals.css`). Mobile usa NativeWind config (`tailwind.config.js`). Nuevo token → actualizar ambos archivos manualmente.
2. **Hooks duplication**: `use-plans.ts`, `use-task-operations.ts`, `use-properties.ts`, etc. existen en `apps/web/src/hooks/` y `apps/mobile/src/hooks/`. Si el backend cambia la shape de un endpoint, actualizar ambos.
3. **Query keys**: Verificar que `QUERY_KEYS` en `@epde/shared` sea la referencia compartida usada en ambos clientes.
