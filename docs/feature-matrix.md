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

| Feature                          | Web (Admin) | Web (Cliente) | Mobile (Cliente) | Notas                                                     |
| -------------------------------- | :---------: | :-----------: | :--------------: | --------------------------------------------------------- |
| **Auth**                         |             |               |                  |                                                           |
| Login                            |     ✅      |      ✅       |        ✅        |                                                           |
| Set Password (invitación)        |     ✅      |      ✅       |        ✅        |                                                           |
| Token refresh automático         |     ✅      |      ✅       |        ✅        | Web: cookie; Mobile: SecureStore                          |
| **Dashboard**                    |             |               |                  |                                                           |
| Stats generales (admin)          |     ✅      |      ❌       |        ❌        |                                                           |
| Stats personales (cliente)       |     ❌      |      ✅       |        ✅        | HealthCard + stat cards                                   |
| Analytics admin (charts)         |     ✅      |      ❌       |        ❌        | Recharts: trend, donut, bars, stacked area                |
| Analytics cliente (charts)       |     ❌      |      ✅       |        ✅        | Web: Recharts; Mobile: SVG custom (react-native-svg)      |
| Tareas próximas                  |     ❌      |      ✅       |        ✅        |                                                           |
| **Propiedades**                  |             |               |                  |                                                           |
| Listado                          |     ✅      |      ✅       |        ✅        |                                                           |
| Crear / Editar                   | ✅ (admin)  |      ❌       |        ❌        | Solo admin crea propiedades                               |
| Ver detalle                      |     ✅      |      ✅       |        ✅        |                                                           |
| **Planes de Mantenimiento**      |             |               |                  |                                                           |
| Listado de planes                |     ✅      |      ✅       |        ✅        | Vía Propiedades → tab Plan (sin tab dedicado)             |
| Ver detalle de plan              |     ✅      |      ✅       |  Vía propiedad   | Mobile accede desde propiedad                             |
| Crear / Editar plan              | ✅ (admin)  |      ❌       |        ❌        | Auto-creado con propiedad                                 |
| **Tareas**                       |             |               |                  |                                                           |
| Listado global de tareas         |     ✅      |      ✅       |        ✅        | Tab "Tareas" en mobile                                    |
| Ver detalle de tarea             |     ✅      |      ✅       |        ✅        |                                                           |
| Crear / Editar tarea             | ✅ (admin)  |      ❌       |        ❌        |                                                           |
| Completar tarea                  |     ✅      |      ✅       |        ✅        | Con foto, costo, nota                                     |
| Solicitar servicio desde tarea   |     ✅      |      ✅       |        ✅        | Pre-llena propertyId + taskId + título                    |
| Completar tarea desde PlanEditor | ✅ (admin)  |      ❌       |        ❌        | Sin salir de la propiedad                                 |
| Bulk tasks desde template        | ✅ (admin)  |      ❌       |        ✅        | POST /tasks/bulk con categoryTemplateId                   |
| Reordenar tareas                 | ✅ (admin)  |      ❌       |        ❌        | Drag & drop                                               |
| Notas de tarea                   |     ✅      |      ✅       |        ✅        |                                                           |
| Historial de tarea (logs)        |     ✅      |      ✅       |        ✅        |                                                           |
| **Presupuestos**                 |             |               |                  |                                                           |
| Listado                          |     ✅      |      ✅       |        ✅        |                                                           |
| Crear solicitud                  | ✅ (admin)  |      ✅       |        ✅        |                                                           |
| Ver detalle                      |     ✅      |      ✅       |        ✅        |                                                           |
| Responder / Aprobar / Rechazar   | ✅ (admin)  |      ❌       |        ❌        |                                                           |
| **Solicitudes de Servicio**      |             |               |                  |                                                           |
| Listado                          |     ✅      |      ✅       |        ✅        |                                                           |
| Crear solicitud                  | ✅ (admin)  |      ✅       |        ✅        | Con fotos                                                 |
| Ver detalle + fotos              |     ✅      |      ✅       |        ✅        |                                                           |
| Actualizar estado                | ✅ (admin)  |      ❌       |        ❌        |                                                           |
| **Notificaciones**               |             |               |                  |                                                           |
| Centro de notificaciones         |     ✅      |      ✅       |        ✅        | Badge en tab Avisos                                       |
| Marcar como leída                |     ✅      |      ✅       |        ✅        | Swipe en mobile                                           |
| **Plantillas (Templates)**       |             |               |                  |                                                           |
| Gestionar CategoryTemplates      | ✅ (admin)  |      ❌       |        ❌        | Solo panel admin                                          |
| Gestionar TaskTemplates          | ✅ (admin)  |      ❌       |        ❌        | Sub-recursos de CategoryTemplate                          |
| **Clientes**                     |             |               |                  |                                                           |
| Listar / Invitar clientes        | ✅ (admin)  |      ❌       |        ❌        |                                                           |
| **Perfil**                       |             |               |                  |                                                           |
| Ver perfil                       |     ✅      |      ✅       |        ✅        |                                                           |
| Logout                           |     ✅      |      ✅       |        ✅        |                                                           |
| **ISV (Índice Salud Vivienda)**  |             |               |                  |                                                           |
| ISV score en tab Salud           |     ✅      |      ✅       |        ✅        | 5 dimensiones + sector scores (CollapsibleSection mobile) |
| ISV historial (chart)            |     ✅      |      ✅       |        ✅        | Barras mensuales (últimos 12 meses)                       |
| ISV columna en tabla             |     ✅      |      ❌       |        ❌        | Badge color-coded en listado de propiedades               |
| ISV reporte imprimible           |     ✅      |      ✅       |        ❌        | window.print() — 1 página A4, sin botones/tabs/duplicados |
| Informe técnico completo         |     ✅      | ✅ (web link) |        ✅        | /properties/{id}/report — 9 secciones, fotos, print/PDF   |
| ISV alertas (caída >15 pts)      |     ✅      |      ✅       |        ✅        | Notificación in-app + push                                |
| ISV snapshots mensuales          |   Backend   |    Backend    |     Backend      | Cron job 1ro de cada mes 02:00 UTC                        |
| **Categorías**                   |             |               |                  |                                                           |
| Gestionar categorías             | ✅ (admin)  |      ❌       |        ❌        | Categorías operacionales                                  |

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
