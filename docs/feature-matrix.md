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

| Feature                          | Web (Admin) | Web (Cliente) | Mobile (Cliente) |           Mobile (Admin)           | Notas                                       |
| -------------------------------- | :---------: | :-----------: | :--------------: | :--------------------------------: | ------------------------------------------- |
| **Auth**                         |             |               |                  |                                    |                                             |
| Login                            |     ✅      |      ✅       |        ✅        |                 ✅                 |                                             |
| Set Password (invitación)        |     ✅      |      ✅       |        ✅        |                 ✅                 |                                             |
| Token refresh automático         |     ✅      |      ✅       |        ✅        |                 ✅                 | Web: cookie; Mobile: SecureStore            |
| **Dashboard**                    |             |               |                  |                                    |                                             |
| Stats generales (admin)          |     ✅      |      ❌       |        ❌        |                 ❌                 | Admin mobile redirige a web                 |
| Stats personales (cliente)       |     ❌      |      ✅       |        ✅        |                 ❌                 | HealthCard + stat cards                     |
| Analytics admin (charts)         |     ✅      |      ❌       |        ❌        |                 ❌                 | Recharts: trend, donut, bars, stacked area  |
| Analytics cliente (charts)       |     ❌      |      ✅       |        ✅        |                 ❌                 | Web: Recharts; Mobile: SVG custom           |
| Tareas próximas                  |     ❌      |      ✅       |        ✅        |                 ❌                 |                                             |
| **Propiedades**                  |             |               |                  |                                    |                                             |
| Listado                          |     ✅      |      ✅       |        ✅        |                 ✅                 |                                             |
| Crear / Editar                   | ✅ (admin)  |      ❌       |        ❌        |                 ❌                 | Solo admin crea desde web                   |
| Ver detalle                      |     ✅      |      ✅       |        ✅        |                 ✅                 |                                             |
| Activar / Archivar plan          | ✅ (admin)  |      ❌       |        ❌        |                 ✅                 | Mobile admin puede cambiar estado del plan  |
| **Planes de Mantenimiento**      |             |               |                  |                                    |                                             |
| Listado de planes                |     ✅      |      ✅       |        ✅        |                 ✅                 |                                             |
| Ver detalle de plan              |     ✅      |      ✅       |  Vía propiedad   |           Vía propiedad            |                                             |
| Crear / Editar plan              | ✅ (admin)  |      ❌       |        ❌        |                 ❌                 | Auto-creado con propiedad                   |
| **Tareas**                       |             |               |                  |                                    |                                             |
| Listado global de tareas         |     ✅      |      ✅       |        ✅        |                 ✅                 | Tab "Tareas" en mobile                      |
| Ver detalle de tarea             |     ✅      |      ✅       |        ✅        |                 ✅                 |                                             |
| Crear / Editar tarea             | ✅ (admin)  |      ❌       |        ❌        |                 ❌                 |                                             |
| Completar tarea                  |     ✅      |      ✅       |        ✅        |                 ✅                 | Con foto, costo, nota                       |
| Solicitar servicio desde tarea   |     ✅      |      ✅       |        ✅        |                 ✅                 | Pre-llena propertyId + taskId + título      |
| Completar tarea desde PlanEditor | ✅ (admin)  |      ❌       |        ❌        |                 ❌                 | Sin salir de la propiedad                   |
| Bulk tasks desde template        | ✅ (admin)  |      ❌       |        ✅        |                 ❌                 | POST /tasks/bulk                            |
| Reordenar tareas                 | ✅ (admin)  |      ❌       |        ❌        |                 ❌                 | Drag & drop                                 |
| Notas de tarea                   |     ✅      |      ✅       |        ✅        |                 ✅                 |                                             |
| Historial de tarea (logs)        |     ✅      |      ✅       |        ✅        |                 ✅                 |                                             |
| **Presupuestos**                 |             |               |                  |                                    |                                             |
| Listado                          |     ✅      |      ✅       |        ✅        |                 ✅                 |                                             |
| Crear solicitud                  | ✅ (admin)  |      ✅       |        ✅        |                 ❌                 |                                             |
| Ver detalle                      |     ✅      |      ✅       |        ✅        |                 ✅                 |                                             |
| Cotizar / Re-cotizar             | ✅ (admin)  |      ❌       |        ❌        |                 ✅                 | RespondBudgetModal con line items dinámicos |
| Aprobar / Rechazar               |     ❌      |      ✅       |        ✅        |                 ❌                 | Solo cliente                                |
| Iniciar Trabajo / Completar      | ✅ (admin)  |      ❌       |        ❌        |                 ✅                 |                                             |
| Generar desde SR                 | ✅ (admin)  |      ❌       |        ❌        |                 ✅                 | Pre-llena con datos del SR                  |
| **Solicitudes de Servicio**      |             |               |                  |                                    |                                             |
| Listado                          |     ✅      |      ✅       |        ✅        |                 ✅                 |                                             |
| Crear solicitud                  | ✅ (admin)  |      ✅       |        ✅        |                 ❌                 | Con fotos                                   |
| Ver detalle + fotos              |     ✅      |      ✅       |        ✅        |                 ✅                 |                                             |
| Transiciones de estado           | ✅ (admin)  |      ❌       |        ❌        |                 ✅                 | OPEN→IN_REVIEW→IN_PROGRESS→RESOLVED→CLOSED  |
| Generar presupuesto desde SR     | ✅ (admin)  |      ❌       |        ❌        |                 ✅                 |                                             |
| **Notificaciones**               |             |               |                  |                                    |                                             |
| Centro de notificaciones         |     ✅      |      ✅       |        ✅        |                 ✅                 | Badge en tab Avisos                         |
| Marcar como leída                |     ✅      |      ✅       |        ✅        |                 ✅                 | Swipe en mobile                             |
| **Plantillas (Templates)**       |             |               |                  |                                    |                                             |
| Gestionar CategoryTemplates      | ✅ (admin)  |      ❌       |        ❌        |                 ❌                 | Solo panel admin web                        |
| Gestionar TaskTemplates          | ✅ (admin)  |      ❌       |        ❌        |                 ❌                 | Sub-recursos de CategoryTemplate            |
| **Clientes**                     |             |               |                  |                                    |                                             |
| Listar / Invitar clientes        | ✅ (admin)  |      ❌       |        ❌        |                 ❌                 |                                             |
| **Perfil**                       |             |               |                  |                                    |                                             |
| Ver perfil                       |     ✅      |      ✅       |        ✅        |                 ✅                 |                                             |
| Logout                           |     ✅      |      ✅       |        ✅        |                 ✅                 |                                             |
| **ISV (Índice Salud Vivienda)**  |             |               |                  |                                    |                                             |
| ISV score en tab Salud           |     ✅      |      ✅       |        ✅        |                 ✅                 | 5 dimensiones + sector scores               |
| ISV historial (chart)            |     ✅      |      ✅       |        ✅        |                 ✅                 | Barras mensuales (últimos 12 meses)         |
| ISV columna en tabla             |     ✅      |      ❌       |        ❌        |                 ❌                 | Badge color-coded en listado de propiedades |
| ISV reporte imprimible           |     ✅      |      ✅       |        ❌        |                 ❌                 | window.print()                              |
| Informe técnico completo         |     ✅      | ✅ (web link) |        ✅        |                 ✅                 | /properties/{id}/report                     |
| ISV alertas (caída >15 pts)      |     ✅      |      ✅       |        ✅        |     Notificación in-app + push     |
| ISV snapshots mensuales          |   Backend   |    Backend    |     Backend      | Cron job 1ro de cada mes 02:00 UTC |
| **Categorías**                   |             |               |                  |                                    |
| Gestionar categorías             | ✅ (admin)  |      ❌       |        ❌        |      Categorías operacionales      |

## Diferencias intencionales entre plataformas

| Área                 | Web                                  | Mobile                               | Razón                                                                                                                        |
| -------------------- | ------------------------------------ | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| Property detail      | Tabs (Salud/Plan/Gastos/Fotos)       | CollapsibleSections                  | Mobile: scroll vertical natural; Web: tabs para pantalla grande                                                              |
| Dark mode toggle     | Header dropdown (CSS class `.dark`)  | Profile screen (`vars()` NativeWind) | Web: toggle CSS class en `<html>`. Mobile: `vars()` inyecta tokens en root View (NativeWind no soporta cascade de className) |
| Notification routing | `/budgets/`, `/properties/` (plural) | `/budget/`, `/property/` (singular)  | Expo Router usa file system routes (singular)                                                                                |
| Dashboard welcome    | "Bienvenido, {nombre}"               | "Hola, {nombre}"                     | Ambos personalizados, tono ligeramente diferente                                                                             |

## Riesgos de drift documentados

1. **Design tokens**: Web usa CSS custom properties (`globals.css`). Mobile usa NativeWind config (`tailwind.config.js`). Nuevo token → actualizar ambos archivos manualmente.
2. **Hooks duplication**: `use-plans.ts`, `use-task-operations.ts`, `use-properties.ts`, etc. existen en `apps/web/src/hooks/` y `apps/mobile/src/hooks/`. Si el backend cambia la shape de un endpoint, actualizar ambos.
3. **Query keys**: Verificar que `QUERY_KEYS` en `@epde/shared` sea la referencia compartida usada en ambos clientes.
