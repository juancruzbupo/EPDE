# EPDE — Guía Completa para Administrador y Cliente

> Este documento explica todas las funcionalidades del sistema EPDE, los flujos de trabajo del administrador (admin) y lo que ve el cliente. Está pensado para que la arquitecta que va a operar el panel admin entienda cómo funciona todo.

---

## 1. Qué es EPDE (resumen rápido)

EPDE es un sistema de **mantenimiento preventivo de viviendas**. Tiene dos partes:

- **Panel Admin (web):** Lo usa la arquitecta para gestionar propiedades, crear planes de mantenimiento, completar inspecciones, y responder presupuestos
- **Portal Cliente (web + app mobile):** Lo usa el propietario para ver el estado de su casa, seguir tareas pendientes, y solicitar servicios

**No es** un sistema de reparaciones. Es un sistema que **detecta problemas antes de que sean caros** y organiza todo el mantenimiento.

---

## 2. Acceso al sistema

### Admin

- Entrás desde el navegador: `https://epde.com.ar/login`
- Email: tu email de admin
- Contraseña: la que configuraste

### Cliente

- Entra desde la web o la app mobile
- Email: el que le asignaste al invitarlo
- Contraseña: la configura él con el link de invitación

---

## 3. Navegación del Admin

El menú lateral (sidebar) del admin tiene:

| Sección            | Qué es                                                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| **Dashboard**      | Resumen general: cuántas propiedades, tareas vencidas, presupuestos pendientes, servicios abiertos + gráficos de análisis |
| **Propiedades**    | Lista de todas las propiedades con su ISV. Desde acá gestionás cada propiedad                                             |
| **Clientes**       | Lista de clientes. Invitar nuevos, editar datos, eliminar                                                                 |
| **Tareas**         | Vista global de TODAS las tareas de TODAS las propiedades, agrupadas por estado                                           |
| **Planes**         | Lista de planes de mantenimiento por propiedad                                                                            |
| **Presupuestos**   | Lista de presupuestos solicitados por clientes                                                                            |
| **Servicios**      | Lista de solicitudes de servicio de clientes                                                                              |
| **Categorías**     | Categorías de tareas (Electricidad, Plomería, etc.)                                                                       |
| **Plantillas**     | Plantillas de categorías + tareas predefinidas                                                                            |
| **Notificaciones** | Todas tus notificaciones                                                                                                  |
| **Perfil**         | Editar tu nombre, teléfono, cambiar contraseña                                                                            |

---

## 4. Flujo principal: Crear una propiedad y su plan

### Paso 1: Invitar al cliente

1. Ir a **Clientes** → botón **"Invitar cliente"**
2. Completar: nombre, email, teléfono (opcional)
3. El sistema envía un email al cliente con un link para crear su contraseña
4. El cliente queda en estado **"Invitado"** hasta que configure su contraseña → pasa a **"Activo"**

### Paso 2: Crear la propiedad

1. Ir a **Propiedades** → botón **"Nueva propiedad"**
2. Completar:
   - **Cliente:** seleccionar el cliente (o crear uno nuevo inline)
   - **Dirección:** la dirección completa
   - **Ciudad:** ej. "Paraná"
   - **Tipo:** Casa, Departamento, Dúplex, Casa de Campo, Otro
   - **Año construcción** (opcional)
   - **Metros cuadrados** (opcional)
3. Al crear, el sistema automáticamente genera un **Plan de Mantenimiento** vacío asociado a esa propiedad

### Paso 3: Configurar sectores activos

1. Entrar a la propiedad → botón **"Editar"**
2. Activar/desactivar los sectores que aplican a esa vivienda:
   - Exterior / Fachada
   - Techo / Cubierta
   - Terraza / Balcón
   - Interior general
   - Cocina
   - Baño
   - Subsuelo / Cimientos
   - Jardín / Perímetro
   - Instalaciones centrales

**Ejemplo:** Un departamento probablemente no tiene "Jardín" ni "Subsuelo". Desactivás esos sectores.

### Paso 4: Cargar tareas al plan

Hay dos formas:

#### Opción A: Desde plantilla (recomendado para empezar)

1. Entrar a la propiedad → tab **"Plan"**
2. Botón **"Agregar desde plantilla"**
3. Seleccionar una plantilla de categoría (ej. "Electricidad")
4. Se crean automáticamente todas las tareas de esa plantilla

#### Opción B: Tarea individual

1. Tab **"Plan"** → botón **"Nueva tarea"**
2. Completar:
   - **Categoría:** Electricidad, Plomería, etc.
   - **Nombre:** ej. "Inspección tablero eléctrico"
   - **Sector:** dónde está (Instalaciones, Baño, etc.)
   - **Prioridad:** Baja, Media, Alta, Urgente
   - **Recurrencia:** Mensual, Trimestral, Semestral, Anual, Personalizado, Según detección
   - **Próxima fecha:** cuándo hay que hacerla
   - **Tipo:** Inspección, Limpieza, Prueba, Tratamiento, Sellado, etc.
   - **Requiere profesional:** El propietario puede, Profesional recomendado, Profesional obligatorio
   - **Descripción técnica** (opcional)
   - **Duración estimada** (opcional)

**Ejemplo de tarea:**

- Nombre: "Inspección de cubierta"
- Sector: Techo / Cubierta
- Prioridad: Alta
- Recurrencia: Semestral
- Próxima fecha: 1 de junio 2026
- Tipo: Inspección
- Requiere profesional: Profesional recomendado

---

## 5. Completar una tarea (inspección)

Este es el flujo más importante del sistema. Cuando hacés una inspección:

1. Entrar a la propiedad → tab **"Plan"** → click en una tarea
2. Se abre el panel lateral con el detalle de la tarea
3. Botón **"Completar tarea"**
4. Completar el formulario:

| Campo                    | Qué poner                     | Ejemplo                                                               |
| ------------------------ | ----------------------------- | --------------------------------------------------------------------- |
| **Resultado**            | Cómo salió la inspección      | "Todo en orden", "Requiere atención", "Requiere reparación"           |
| **Condición encontrada** | Estado real de lo que viste   | **Excelente**, **Bueno**, **Aceptable**, **Deteriorado**, **Crítico** |
| **Quién lo hizo**        | Quién realizó la tarea        | "Yo (propietario)", "Profesional contratado", "Profesional EPDE"      |
| **Acción realizada**     | Qué se hizo concretamente     | "Solo inspección", "Limpieza", "Reparación menor", "Sellado", etc.    |
| **Fecha**                | Cuándo se hizo (default: hoy) | 15/03/2026                                                            |
| **Costo**                | Cuánto costó (opcional)       | $35.000                                                               |
| **Nota**                 | Observaciones (opcional)      | "Se detectó humedad en esquina noroeste"                              |
| **Foto**                 | Evidencia (opcional)          | Foto del problema                                                     |

### Qué pasa después de completar

1. Se crea un **registro inmutable** (TaskLog) con toda la info
2. La tarea se **reprograma automáticamente** para su próximo ciclo (ej: si es semestral, se programa para 6 meses después)
3. El **ISV se recalcula** en tiempo real con la nueva condición
4. Si la condición es **Deteriorado o Crítico**:
   - El sistema te pregunta si querés solicitar un servicio
   - Se envía una notificación a los admins
   - El problema aparece en la sección "Problemas detectados"

### ¿Qué es cada condición?

| Condición       | Significado                                       | Impacto en ISV                                           |
| --------------- | ------------------------------------------------- | -------------------------------------------------------- |
| **Excelente**   | Perfecto estado, sin observaciones                | Sube mucho el ISV                                        |
| **Bueno**       | Buen estado general, puede tener detalles menores | Sube el ISV                                              |
| **Aceptable**   | Funcional pero con signos de desgaste             | Neutro                                                   |
| **Deteriorado** | Tiene problemas visibles que deben atenderse      | Baja el ISV. Genera **problema detectado**               |
| **Crítico**     | Requiere intervención urgente                     | Baja mucho el ISV. Genera **problema detectado urgente** |

---

## 6. El ISV (Índice de Salud de la Vivienda)

### Qué es

Un número de **0 a 100** que resume el estado general de la vivienda. Se calcula automáticamente.

### Cómo se calcula

Se basa en 5 dimensiones:

| Dimensión        | Peso | Qué mide                                                               |
| ---------------- | ---- | ---------------------------------------------------------------------- |
| **Cumplimiento** | 35%  | ¿Las tareas están al día? Las urgentes pesan más                       |
| **Condición**    | 30%  | Promedio de las condiciones encontradas en inspecciones del último año |
| **Cobertura**    | 20%  | ¿Se inspeccionaron todos los sectores de la casa?                      |
| **Inversión**    | 15%  | ¿Se hacen más acciones preventivas o correctivas?                      |
| **Tendencia**    | Info | ¿Está mejorando o empeorando respecto al trimestre anterior?           |

### Qué significan los niveles

| ISV    | Estado            | Color          | Significado                            |
| ------ | ----------------- | -------------- | -------------------------------------- |
| 80-100 | Excelente         | Verde          | La casa está muy bien mantenida        |
| 60-79  | Bueno             | Amarillo       | Bien pero con algunos puntos a atender |
| 40-59  | Regular           | Naranja        | Hay problemas que necesitan atención   |
| 20-39  | Necesita atención | Naranja oscuro | Problemas significativos acumulados    |
| 0-19   | Crítico           | Rojo           | Intervención urgente necesaria         |

### Dónde se ve

- **Dashboard del cliente:** Card principal con el score y la tendencia
- **Tabla de propiedades:** Badge con score y label en cada fila
- **Detalle de propiedad → tab Salud:** Score completo con las 5 dimensiones y gráfico de evolución mensual

### Cómo mejorar el ISV

1. **Completar tareas a tiempo** (mejora Cumplimiento)
2. **Encontrar buenas condiciones** en inspecciones (mejora Condición)
3. **Inspeccionar todos los sectores** al menos una vez al año (mejora Cobertura)
4. **Hacer más acciones preventivas** que correctivas (mejora Inversión)

---

## 7. Problemas detectados

### Cómo aparecen

Cuando completás una tarea con condición **Deteriorado** o **Crítico**, el sistema:

1. Muestra un alert preguntando si querés solicitar un servicio
2. Envía notificación a admins
3. El problema aparece en la sección **"Esto puede generarte gastos si no lo resolvés"** en el tab Salud

### Qué muestra cada problema

- Nombre de la tarea
- Badge de severidad (Crítico en rojo, Deteriorado en amarillo)
- Mensaje de impacto según el sector (ej: "Puede generar filtraciones activas y dañar interiores")
- Si es crítico: "Recomendado resolver cuanto antes"
- Botón **"Solicitar servicio"**

### Cómo se resuelve un problema

1. Click en **"Solicitar servicio"** → se crea un ServiceRequest pre-rellenado
2. El problema desaparece de la lista (tiene un servicio activo)
3. Se gestiona el servicio (OPEN → IN_PROGRESS → RESOLVED)
4. En la próxima inspección de esa tarea:
   - Si la condición mejoró → problema resuelto definitivamente
   - Si sigue mal → el problema reaparece

### Click en el card del problema

Si hacés click en el card (no en el botón), te lleva al **tab Plan** y abre automáticamente el **detalle de esa tarea** para ver su historial completo.

---

## 8. Presupuestos

### Flujo completo

```
Cliente solicita presupuesto
         ↓
Estado: PENDIENTE (el admin lo ve en la lista)
         ↓
Admin responde con cotización (line items + total + plazo + validez)
         ↓
Estado: COTIZADO (el cliente lo ve)
         ↓
Cliente aprueba o rechaza
         ↓
Si APROBADO → Admin marca EN PROGRESO → COMPLETADO
Si RECHAZADO → fin del flujo
Si no responde → EXPIRADO (automático al pasar la fecha de validez)
```

### Cómo responder un presupuesto (admin)

1. Ir a **Presupuestos** → click en uno con estado "Pendiente"
2. Botón **"Responder"**
3. Completar:
   - **Items:** agregar líneas con descripción, cantidad, precio unitario (el subtotal se calcula solo)
   - **Total:** se calcula automáticamente de los items
   - **Días estimados:** cuánto tardaría el trabajo
   - **Válido hasta:** fecha límite para que el cliente acepte
   - **Notas:** observaciones para el cliente
   - **Plantilla de cotización:** podés usar una plantilla guardada para no escribir todo de cero
4. Enviar → el cliente recibe notificación

### Plantillas de cotización

En **Plantillas** podés crear plantillas con items predefinidos (ej: "Reparación de cubierta estándar" con materiales y mano de obra). Al responder un presupuesto, seleccionás la plantilla y se cargan los items automáticamente.

---

## 9. Solicitudes de servicio

### Qué son

Cuando el cliente (o el admin) detecta un problema, puede crear una solicitud de servicio para pedir que se atienda.

### Desde dónde se crean

- Desde la sección **"Problemas detectados"** en el detalle de propiedad
- Desde el detalle de una tarea (botón "Solicitar servicio")
- Desde la lista de **Servicios** → botón "Nueva solicitud"
- Desde el prompt automático al completar una tarea con condición mala

### Flujo

```
ABIERTO → EN REVISIÓN → EN PROGRESO → RESUELTO → CERRADO
```

| Estado          | Quién lo cambia                          | Significado                       |
| --------------- | ---------------------------------------- | --------------------------------- |
| **Abierto**     | Automático al crear                      | Solicitud nueva, sin revisar      |
| **En revisión** | Admin                                    | El admin está evaluando qué hacer |
| **En progreso** | Admin                                    | Se está trabajando en la solución |
| **Resuelto**    | Admin                                    | El trabajo se completó            |
| **Cerrado**     | Automático (30 días después de resuelto) | Archivo definitivo                |

### Qué incluye una solicitud

- Propiedad asociada
- Tarea vinculada (si aplica)
- Título y descripción
- Urgencia: Baja, Media, Alta, Urgente
- Fotos (hasta 5)
- Comentarios (admin y cliente pueden comentar)
- Historial de cambios de estado

---

## 10. Categorías y Plantillas

### Categorías

Son los **tipos de trabajo** que organizan las tareas. Vienen 14 por defecto:

1. Estructura
2. Techos y Cubiertas
3. Instalación Eléctrica
4. Instalación Sanitaria
5. Gas y Calefacción
6. Aberturas
7. Pintura y Revestimientos
8. Jardín y Exteriores
9. Climatización
10. Humedad e Impermeabilización
11. Seguridad contra Incendio
12. Control de Plagas
13. Pisos y Contrapisos
14. Mobiliario y Equipamiento Fijo

Podés crear nuevas, editar las existentes, reordenarlas, o eliminarlas (si no tienen tareas asociadas).

### Plantillas de categoría

Son **conjuntos predefinidos de tareas** que se aplican a una categoría. Por ejemplo:

**Plantilla "Electricidad residencial":**

- Inspección tablero eléctrico (Anual, Alta prioridad)
- Control de tomas y enchufes (Semestral, Media)
- Verificación de puesta a tierra (Anual, Alta)
- Control de iluminación exterior (Semestral, Baja)

Cuando cargás tareas desde plantilla, todas estas tareas se crean de una vez en el plan de la propiedad.

---

## 11. Notificaciones

El admin recibe notificaciones cuando:

| Evento                             | Ejemplo                                                           |
| ---------------------------------- | ----------------------------------------------------------------- |
| Cliente crea presupuesto           | "María González solicitó un presupuesto para Av. Libertador 4500" |
| Cliente crea solicitud de servicio | "Nueva solicitud: Filtración en techo"                            |
| Problema detectado en inspección   | "Se detectó un problema (Crítico) en Av. Libertador 4500"         |
| ISV cayó significativamente        | "El ISV de Av. Libertador 4500 bajó 17 puntos"                    |
| Cliente aprobó/rechazó presupuesto | "Presupuesto aprobado: Reparación de cubierta"                    |
| Comentario en presupuesto/servicio | "Nuevo comentario de María González"                              |

Podés marcar como leídas individualmente o todas a la vez.

---

## 12. Lo que ve el cliente

### Dashboard del cliente

- **ISV** de su propiedad con label y tendencia
- **Tareas vencidas, próximas, urgentes** (contadores)
- **Próximas tareas** con acceso directo al detalle
- **Acceso rápido** a Servicios y Presupuestos

### Detalle de propiedad

El cliente ve los mismos 4 tabs pero en **modo lectura**:

| Tab        | Qué ve el cliente                                                                         |
| ---------- | ----------------------------------------------------------------------------------------- |
| **Salud**  | ISV con las 5 dimensiones + gráfico de evolución + problemas detectados                   |
| **Plan**   | Lista de tareas (puede completar las que le corresponden, no puede editar/crear/eliminar) |
| **Gastos** | Historial de costos de mantenimiento                                                      |
| **Fotos**  | Galería de fotos de inspecciones y solicitudes                                            |

### Lo que puede hacer el cliente

- ✅ Ver estado de su propiedad
- ✅ Completar tareas que le corresponden (ej: tareas marcadas como "Propietario puede")
- ✅ Solicitar presupuestos
- ✅ Crear solicitudes de servicio (con fotos)
- ✅ Aprobar o rechazar presupuestos cotizados
- ✅ Comentar en presupuestos y solicitudes
- ✅ Ver notificaciones
- ✅ Editar su perfil
- ❌ NO puede crear propiedades
- ❌ NO puede crear/editar/eliminar tareas
- ❌ NO puede cambiar estado de servicios
- ❌ NO puede responder presupuestos
- ❌ NO puede gestionar categorías ni plantillas
- ❌ NO puede ver otros clientes

### App mobile

El cliente también puede hacer todo lo anterior desde la app mobile (mismas funcionalidades, adaptadas a pantalla chica). La app mobile es **solo para clientes** — si un admin se loguea en mobile, ve un mensaje para usar la versión web.

---

## 13. Reportes

Desde el detalle de una propiedad, el admin puede generar un **Informe** (botón "Ver Informe"):

- ISV actual con las 5 dimensiones
- Desglose por sector
- Desglose por categoría
- Tareas vencidas y próximas
- Últimas inspecciones realizadas
- Fotos relevantes

El informe se puede imprimir o compartir por link/WhatsApp.

---

## 14. Tareas del cron (automáticas)

El sistema ejecuta tareas automáticas sin intervención:

| Tarea                          | Frecuencia        | Qué hace                                                                     |
| ------------------------------ | ----------------- | ---------------------------------------------------------------------------- |
| **Marcar tareas vencidas**     | Diario            | Si `nextDueDate` pasó → status cambia a OVERDUE                              |
| **Marcar tareas próximas**     | Diario            | Si `nextDueDate` dentro de 30 días → status cambia a UPCOMING                |
| **Enviar recordatorios**       | Diario            | Notifica al cliente sobre tareas próximas o vencidas                         |
| **Expirar presupuestos**       | Diario            | Si `validUntil` pasó → status cambia a EXPIRED                               |
| **Cerrar servicios resueltos** | Diario            | Si resuelto hace +30 días → cierra automáticamente                           |
| **Snapshot ISV mensual**       | 1ro de cada mes   | Guarda el ISV para el gráfico de evolución. Si bajó ≥15 puntos, envía alerta |
| **Limpiar notificaciones**     | Semanal (domingo) | Elimina notificaciones leídas de más de 90 días                              |

---

## 15. Glosario

| Término                   | Significado                                                             |
| ------------------------- | ----------------------------------------------------------------------- |
| **ISV**                   | Índice de Salud de la Vivienda (0-100)                                  |
| **Plan de mantenimiento** | Conjunto de tareas programadas para una propiedad                       |
| **TaskLog**               | Registro inmutable de una inspección/completación de tarea              |
| **Sector**                | Zona de la vivienda (Techo, Baño, Instalaciones, etc.)                  |
| **Recurrencia**           | Cada cuánto se repite una tarea (mensual, trimestral, anual, etc.)      |
| **ON_DETECTION**          | Tarea que no tiene fecha fija — se hace cuando se detecta algo          |
| **Condición encontrada**  | Estado real observado durante una inspección                            |
| **Acción realizada**      | Qué se hizo concretamente (solo inspección, limpieza, reparación, etc.) |
| **Problema detectado**    | Inspección con condición Deteriorado o Crítico sin servicio activo      |
| **ServiceRequest**        | Solicitud de servicio creada por el cliente o el admin                  |
| **BudgetRequest**         | Solicitud de presupuesto con line items y cotización                    |
