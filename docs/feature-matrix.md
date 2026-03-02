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

| Feature                        | Web (Admin) | Web (Cliente) | Mobile (Cliente) | Notas                            |
| ------------------------------ | :---------: | :-----------: | :--------------: | -------------------------------- |
| **Auth**                       |             |               |                  |                                  |
| Login                          |     ✅      |      ✅       |        ✅        |                                  |
| Set Password (invitación)      |     ✅      |      ✅       |        ✅        |                                  |
| Token refresh automático       |     ✅      |      ✅       |        ✅        | Web: cookie; Mobile: SecureStore |
| **Dashboard**                  |             |               |                  |                                  |
| Stats generales (admin)        |     ✅      |      ❌       |        ❌        |                                  |
| Stats personales (cliente)     |     ❌      |      ✅       |        ✅        | HealthCard + stat cards          |
| Tareas próximas                |     ❌      |      ✅       |        ✅        |                                  |
| **Propiedades**                |             |               |                  |                                  |
| Listado                        |     ✅      |      ✅       |        ✅        |                                  |
| Crear / Editar                 | ✅ (admin)  |      ❌       |        ❌        | Solo admin crea propiedades      |
| Ver detalle                    |     ✅      |      ✅       |        ✅        |                                  |
| **Planes de Mantenimiento**    |             |               |                  |                                  |
| Listado de planes              |     ✅      |      ✅       |        ✅        | Tab "Planes" en mobile           |
| Ver detalle de plan            |     ✅      |      ✅       |  Vía propiedad   | Mobile accede desde propiedad    |
| Crear / Editar plan            | ✅ (admin)  |      ❌       |        ❌        | Auto-creado con propiedad        |
| **Tareas**                     |             |               |                  |                                  |
| Listado global de tareas       |     ✅      |      ✅       |        ✅        | Tab "Tareas" en mobile           |
| Ver detalle de tarea           |     ✅      |      ✅       |        ✅        |                                  |
| Crear / Editar tarea           | ✅ (admin)  |      ❌       |        ❌        |                                  |
| Completar tarea                |     ✅      |      ✅       |        ✅        | Con foto, costo, nota            |
| Reordenar tareas               | ✅ (admin)  |      ❌       |        ❌        | Drag & drop                      |
| Notas de tarea                 |     ✅      |      ✅       |        ✅        |                                  |
| Historial de tarea (logs)      |     ✅      |      ✅       |        ✅        |                                  |
| **Presupuestos**               |             |               |                  |                                  |
| Listado                        |     ✅      |      ✅       |        ✅        |                                  |
| Crear solicitud                | ✅ (admin)  |      ✅       |        ✅        |                                  |
| Ver detalle                    |     ✅      |      ✅       |        ✅        |                                  |
| Responder / Aprobar / Rechazar | ✅ (admin)  |      ❌       |        ❌        |                                  |
| **Solicitudes de Servicio**    |             |               |                  |                                  |
| Listado                        |     ✅      |      ✅       |        ✅        |                                  |
| Crear solicitud                | ✅ (admin)  |      ✅       |        ✅        | Con fotos                        |
| Ver detalle + fotos            |     ✅      |      ✅       |        ✅        |                                  |
| Actualizar estado              | ✅ (admin)  |      ❌       |        ❌        |                                  |
| **Notificaciones**             |             |               |                  |                                  |
| Centro de notificaciones       |     ✅      |      ✅       |        ✅        | Badge en tab Avisos              |
| Marcar como leída              |     ✅      |      ✅       |        ✅        | Swipe en mobile                  |
| **Plantillas (Templates)**     |             |               |                  |                                  |
| Gestionar CategoryTemplates    | ✅ (admin)  |      ❌       |        ❌        | Solo panel admin                 |
| Gestionar TaskTemplates        | ✅ (admin)  |      ❌       |        ❌        | Sub-recursos de CategoryTemplate |
| **Clientes**                   |             |               |                  |                                  |
| Listar / Invitar clientes      | ✅ (admin)  |      ❌       |        ❌        |                                  |
| **Perfil**                     |             |               |                  |                                  |
| Ver perfil                     |     ✅      |      ✅       |        ✅        |                                  |
| Logout                         |     ✅      |      ✅       |        ✅        |                                  |
| **Categorías**                 |             |               |                  |                                  |
| Gestionar categorías           | ✅ (admin)  |      ❌       |        ❌        | Categorías operacionales         |

## Riesgos de drift documentados

1. **Design tokens**: Web usa CSS custom properties (`globals.css`). Mobile usa NativeWind config (`tailwind.config.js`). Nuevo token → actualizar ambos archivos manualmente.
2. **Hooks duplication**: `use-maintenance-plans.ts`, `use-properties.ts`, etc. existen en `apps/web/src/hooks/` y `apps/mobile/src/hooks/`. Si el backend cambia la shape de un endpoint, actualizar ambos.
3. **Query keys**: Verificar que `QUERY_KEYS` en `@epde/shared` sea la referencia compartida usada en ambos clientes.
