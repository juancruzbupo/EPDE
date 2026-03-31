# Manual Operativo — EPDE

**Sistema:** EPDE — Estudio Profesional de Diagnóstico Edilicio
**Última actualización:** Marzo 2026

---

## Tabla de Contenidos

### Parte A — Administrador (Arq. Noelia E. Yuskowich)

1. [Acceso al sistema](#1-acceso-al-sistema)
2. [Panel de administración — Módulos disponibles](#2-panel-de-administración--módulos-disponibles)
3. [Flujo de primera carga paso a paso](#3-flujo-de-primera-carga-paso-a-paso)
4. [Gestión de suscripciones](#4-gestión-de-suscripciones)
5. [Editor del plan de mantenimiento](#5-editor-del-plan-de-mantenimiento)
6. [Checklist de inspección visual](#6-checklist-de-inspección-visual)
7. [Tareas que requieren profesional matriculado](#7-tareas-que-requieren-profesional-matriculado)
8. [Criterios de decisión: agregar o no al plan](#8-criterios-de-decisión-agregar-o-no-al-plan)
9. [Gestión de presupuestos (Admin)](#9-gestión-de-presupuestos)
10. [Solicitudes de servicio (Admin)](#10-solicitudes-de-servicio)
11. [Configuración de la landing page](#11-configuración-de-la-landing-page)
12. [Dashboard del Administrador — Detalle completo](#12-dashboard-del-administrador--detalle-completo)

### Parte B — Cliente (Propietario)

13. [Experiencia del cliente — Visión general](#13-experiencia-del-cliente--visión-general)
14. [Dashboard del Cliente — Detalle completo](#14-dashboard-del-cliente--detalle-completo)
15. [Propiedades (Cliente)](#15-propiedades-cliente)
16. [Tareas (Cliente)](#16-tareas-cliente)
17. [Presupuestos (Cliente)](#17-presupuestos-cliente)
18. [Solicitudes de servicio (Cliente)](#18-solicitudes-de-servicio-cliente)
19. [Notificaciones](#19-notificaciones)
20. [Perfil y configuración](#20-perfil-y-configuración)
21. [Funcionalidades exclusivas de la app móvil](#21-funcionalidades-exclusivas-de-la-app-móvil)

### Parte C — Referencia técnica

22. [Índice de Salud de la Vivienda (ISV)](#22-índice-de-salud-de-la-vivienda-isv)
23. [Catálogo completo de plantillas de tareas](#23-catálogo-completo-de-plantillas-de-tareas)

---

## 1. Acceso al sistema

- **URL web:** Acceder con email y contraseña de administrador.
- **Rol:** ADMIN — acceso completo a todos los módulos.
- **Sesión:** Se mantiene activa con renovación automática. Si expira, re-ingresar credenciales.

---

## 2. Panel de administración — Módulos disponibles

El menú lateral del admin tiene **9 módulos**:

| Módulo           | Ruta                | Descripción                                                                    |
| ---------------- | ------------------- | ------------------------------------------------------------------------------ |
| **Dashboard**    | `/dashboard`        | Vista general: métricas de la plataforma, actividad reciente, clientes activos |
| **Clientes**     | `/clients`          | Invitar, ver, editar y gestionar clientes y sus suscripciones                  |
| **Propiedades**  | `/properties`       | Ver todas las propiedades cargadas, sus planes y estado de salud               |
| **Tareas**       | `/tasks`            | Vista global de tareas de todos los planes, filtrar por estado                 |
| **Presupuestos** | `/budgets`          | Gestionar solicitudes de presupuesto y su ciclo de vida                        |
| **Servicios**    | `/service-requests` | Solicitudes de servicio de los clientes                                        |
| **Categorías**   | `/categories`       | Administrar las 14 categorías de mantenimiento                                 |
| **Plantillas**   | `/templates`        | Administrar las plantillas de tareas predefinidas                              |
| **Landing**      | `/landing-settings` | Modificar precios, FAQ y ejemplos de la página de venta                        |

---

## 3. Flujo de primera carga paso a paso

### Paso 1: Invitar al cliente

1. Ir a **Clientes** → botón **"Invitar cliente"**
2. Completar:
   - **Email** (obligatorio) — dirección de correo del cliente
   - **Nombre completo** (obligatorio, 2-200 caracteres)
   - **Teléfono** (opcional)
3. Confirmar → el sistema envía un email de invitación
4. El cliente queda en estado **INVITED**

### Paso 2: El cliente activa su cuenta

1. El cliente recibe el email y hace clic en el enlace
2. Establece su contraseña
3. Su estado pasa a **ACTIVE**
4. Se activa automáticamente una **suscripción de 180 días** (6 meses)
5. Ya puede acceder a la app web y móvil

### Paso 3: Crear la propiedad

1. Ir a **Propiedades** → botón **"Nueva propiedad"**
2. Completar los datos:
   - **Nombre** — ej: "Casa de Av. Ramírez 1234"
   - **Dirección** — dirección completa
   - **Tipo de propiedad:**
     - Casa
     - Departamento
     - Dúplex
     - Casa de Campo
     - Otro
   - **Superficie** (m², opcional)
   - **Año de construcción** (opcional)
   - **Notas** (opcional)
3. Asignar al **cliente** correspondiente

### Paso 4: Crear el plan de mantenimiento

1. Dentro de la propiedad → botón **"Crear plan"**
2. El plan se crea en estado **BORRADOR (DRAFT)**
3. Usar el **editor del plan** para agregar tareas (ver sección 5)
4. Una vez completo, cambiar estado a **ACTIVO (ACTIVE)**
5. El sistema comienza a generar tareas periódicas automáticamente

### Paso 5: Realizar la inspección visual inicial

1. Visitar la propiedad físicamente
2. Seguir el **checklist de inspección** (sección 6) recorriendo los 9 sectores
3. Documentar hallazgos con fotos y notas en cada tarea
4. Determinar qué tareas adicionales agregar al plan según los hallazgos (sección 8)

### Paso 6: Activar el plan

1. Revisar que todas las tareas estén correctamente configuradas
2. Cambiar estado del plan de BORRADOR → **ACTIVO**
3. El cliente ya puede ver sus tareas en la app
4. Las notificaciones automáticas comienzan a funcionar

---

## 4. Gestión de suscripciones

### Acciones disponibles sobre la suscripción de un cliente

Desde **Clientes** → seleccionar cliente → sección de suscripción:

| Acción                 | Efecto                                                                     |
| ---------------------- | -------------------------------------------------------------------------- |
| **Extender +30 días**  | Suma 30 días a la fecha de expiración actual                               |
| **Extender +60 días**  | Suma 60 días                                                               |
| **Extender +365 días** | Suma 1 año                                                                 |
| **Suspender**          | Establece la fecha de expiración a hoy (acceso inmediatamente restringido) |
| **Sin límite**         | Elimina la fecha de expiración (acceso ilimitado)                          |

### Notificaciones automáticas de suscripción

- **7 días antes:** Notificación push "Tu suscripción vence en 7 días"
- **3 días antes:** Notificación push "Tu suscripción vence en 3 días"
- **1 día antes:** Notificación push "Tu suscripción vence mañana"
- Las notificaciones incluyen link al WhatsApp de contacto para renovación
- Se envía **máximo una notificación por tipo por día** (sin duplicados)
- Si el admin cambia la suscripción, el cliente recibe una notificación de cambio

### Suscripción expirada

Cuando la suscripción expira, el cliente:

- Ve una pantalla de "Suscripción expirada" al intentar acceder
- Recibe instrucciones para contactar por WhatsApp
- No puede acceder a ninguna funcionalidad hasta renovar

---

## 5. Editor del plan de mantenimiento

### Funcionalidades del editor

| Función                            | Descripción                                                     |
| ---------------------------------- | --------------------------------------------------------------- |
| **Agregar tarea individual**       | Crear tarea personalizada con todos los campos                  |
| **Aplicar plantilla de categoría** | Agregar múltiples tareas predefinidas de una categoría completa |
| **Editar tarea**                   | Modificar cualquier campo de una tarea existente                |
| **Eliminar tarea**                 | Quitar una tarea del plan                                       |
| **Reordenar tareas**               | Mover tareas arriba/abajo en la lista                           |
| **Completar tarea**                | Marcar como completada (registra fecha, notas y resultado)      |
| **Completar en lote**              | Seleccionar múltiples tareas y completarlas juntas              |
| **Eliminar en lote**               | Seleccionar múltiples tareas y eliminarlas                      |
| **Filtrar por prioridad**          | Baja, Media, Alta, Urgente                                      |
| **Filtrar por estado**             | Accionables, Todas, o estado específico                         |
| **Filtrar por categoría**          | Ver tareas de una categoría particular                          |
| **Buscar**                         | Buscar tareas por nombre                                        |
| **Crear solicitud de servicio**    | Desde una tarea con problema detectado                          |

### Campos de cada tarea

| Campo                     | Descripción                    | Ejemplo                                                               |
| ------------------------- | ------------------------------ | --------------------------------------------------------------------- |
| **Nombre**                | Nombre descriptivo de la tarea | "Inspección de tablero eléctrico"                                     |
| **Categoría**             | A qué categoría pertenece      | "Instalación Eléctrica"                                               |
| **Tipo de tarea**         | Naturaleza de la actividad     | Inspección, Limpieza, Prueba, etc.                                    |
| **Prioridad**             | Urgencia de la tarea           | Baja, Media, Alta, Urgente                                            |
| **Requisito profesional** | Quién puede ejecutarla         | Propietario, Recomendado, Obligatorio                                 |
| **Recurrencia**           | Cada cuánto se repite          | Mensual, Trimestral, Semestral, Anual, Personalizado, Según detección |
| **Meses de recurrencia**  | Período en meses               | 1, 3, 6, 12, 24, 36, 60                                               |
| **Duración estimada**     | Tiempo aproximado en minutos   | 30, 45, 60, 120                                                       |
| **Descripción técnica**   | Instrucciones detalladas       | Qué revisar, cómo, qué buscar                                         |
| **Fecha de vencimiento**  | Cuándo debe realizarse         | Calculada automáticamente según recurrencia                           |

### Estados de una tarea

- **PENDIENTE:** Aún no llegó la fecha de vencimiento
- **PRÓXIMA:** Se acerca la fecha de vencimiento
- **VENCIDA:** Pasó la fecha sin completarse
- **COMPLETADA:** Fue realizada y registrada

### Ciclo de vida del plan

```
BORRADOR (DRAFT) → ACTIVO (ACTIVE) → ARCHIVADO (ARCHIVED)
```

---

## 6. Checklist de inspección visual

Guía para la inspección visual inicial de la vivienda, organizada por los **9 sectores** del inmueble.

### Sector 1: Exterior / Fachada

| Qué revisar         | Qué buscar                                    | Prioridad |
| ------------------- | --------------------------------------------- | --------- |
| Muros exteriores    | Fisuras, grietas, desprendimientos de revoque | Alta      |
| Pintura exterior    | Descascaramiento, manchas, cambios de color   | Media     |
| Medianeras y cercos | Estado general, inclinaciones, faltantes      | Media     |
| Veredas y senderos  | Hundimientos, grietas, desniveles             | Media     |
| Base de muros       | Manchas de humedad ascendente por capilaridad | Alta      |

### Sector 2: Techo / Cubierta

| Qué revisar        | Qué buscar                                      | Prioridad |
| ------------------ | ----------------------------------------------- | --------- |
| Membrana hidrófuga | Burbujas, grietas, despegues en uniones         | Alta      |
| Tejas o chapas     | Rotas, desplazadas, oxidación, tornillos flojos | Media     |
| Canaletas          | Hojas, tierra, sedimentos, obstrucciones        | Alta      |
| Bajadas pluviales  | Libre circulación, fijaciones                   | Alta      |
| Cumbrera           | Sellado, estado general                         | Media     |

### Sector 3: Terraza / Balcón

| Qué revisar        | Qué buscar                                        | Prioridad |
| ------------------ | ------------------------------------------------- | --------- |
| Piso               | Pendiente hacia desagüe, estado del revestimiento | Media     |
| Baranda            | Fijación, altura reglamentaria, estado            | Alta      |
| Desagüe            | Libre de obstrucciones                            | Alta      |
| Impermeabilización | Signos de filtración en techo inferior            | Alta      |

### Sector 4: Interior general

| Qué revisar         | Qué buscar                                  | Prioridad |
| ------------------- | ------------------------------------------- | --------- |
| Muros interiores    | Fisuras nuevas, manchas de humedad          | Alta      |
| Pintura interior    | Estado general, descascaramiento            | Media     |
| Revestimientos      | Cerámicos sueltos, juntas deterioradas      | Media     |
| Pisos               | Hundimientos, cerámicos sueltos, desniveles | Media     |
| Aberturas           | Cierre correcto, burletes, estado de marcos | Media     |
| Bisagras/cerraduras | Funcionamiento, lubricación necesaria       | Baja      |

### Sector 5: Cocina

| Qué revisar         | Qué buscar                             | Prioridad |
| ------------------- | -------------------------------------- | --------- |
| Griferías           | Goteos, estado de juntas, aireadores   | Media     |
| Bajo mesada         | Humedad, pérdidas, estado del material | Media     |
| Mesada y bacha      | Sellado, estado de uniones             | Media     |
| Extractor/campana   | Funcionamiento, filtros sucios         | Media     |
| Artefactos de gas   | Llama azul, ventilación, conexiones    | Urgente   |
| Conexión lavarropas | Estado de mangueras, desagüe           | Media     |

### Sector 6: Baño

| Qué revisar    | Qué buscar                                 | Prioridad |
| -------------- | ------------------------------------------ | --------- |
| Griferías      | Goteos, funcionamiento                     | Media     |
| Inodoro        | Pérdida en mecanismo de descarga, fijación | Media     |
| Sellado juntas | Estado en áreas húmedas (ducha, bañera)    | Media     |
| Vanitory       | Humedad debajo, estado del sifón           | Media     |
| Ventilación    | Funcionamiento del extractor o ventana     | Alta      |
| Sanitarios     | Fijación correcta al piso                  | Baja      |

### Sector 7: Subsuelo / Cimientos

| Qué revisar        | Qué buscar                                    | Prioridad |
| ------------------ | --------------------------------------------- | --------- |
| Fundaciones        | Asentamientos, fisuras (requiere profesional) | Alta      |
| Capa aisladora     | Continuidad, estado                           | Alta      |
| Humedad ascendente | Manchas en zócalos, eflorescencias            | Alta      |
| Muros enterrados   | Filtraciones, manchas                         | Alta      |

### Sector 8: Jardín / Perímetro

| Qué revisar         | Qué buscar                             | Prioridad |
| ------------------- | -------------------------------------- | --------- |
| Árboles             | Ramas cercanas a la estructura, raíces | Media     |
| Desagües exteriores | Libre circulación                      | Alta      |
| Pileta (si hay)     | Estado general, sistema de filtrado    | Media     |
| Indicios de plagas  | Termitas, roedores, insectos           | Media     |

### Sector 9: Instalaciones centrales

| Qué revisar           | Qué buscar                                            | Prioridad |
| --------------------- | ----------------------------------------------------- | --------- |
| Tablero eléctrico     | Térmicas, conexiones, cables sueltos, recalentamiento | Alta      |
| Disyuntor diferencial | Test: presionar botón, debe cortar inmediatamente     | Urgente   |
| Tomacorrientes/llaves | Funcionamiento, chispas, calor, decoloración          | Media     |
| Tanque de agua        | Nivel, flotante, tapa, limpieza                       | Alta      |
| Termotanque           | Ánodo de sacrificio, estado general                   | Media     |
| Artefactos de gas     | Llama piloto, quemadores, conexiones                  | Urgente   |
| Caldera/calefón       | Estado general, ventilación                           | Alta      |
| Aire acondicionado    | Filtros, unidad exterior, drenaje                     | Alta      |
| Puesta a tierra       | Medición con telurímetro (profesional)                | Alta      |

---

## 7. Tareas que requieren profesional matriculado

### Profesional OBLIGATORIO (PROFESSIONAL_REQUIRED)

Estas tareas **no pueden** ser realizadas por el propietario. Requieren un profesional matriculado (electricista, gasista, ingeniero, etc.):

| #   | Tarea                                      | Categoría          | Frecuencia      | Duración |
| --- | ------------------------------------------ | ------------------ | --------------- | -------- |
| 1   | Evaluación profesional de fundaciones      | Estructura         | Cada 2 años     | 2 hs     |
| 2   | Evaluación estructural integral quinquenal | Estructura         | Cada 5 años     | 4 hs     |
| 3   | Reparación de filtraciones                 | Techos y Cubiertas | Según detección | 2 hs     |
| 4   | Reemplazo integral de membrana asfáltica   | Techos y Cubiertas | Cada 10 años    | 8 hs     |
| 5   | Medición de puesta a tierra                | Inst. Eléctrica    | Anual           | 45 min   |
| 6   | Revisión de instalación eléctrica completa | Inst. Eléctrica    | Cada 3 años     | 4 hs     |
| 7   | Mantenimiento de cámara séptica            | Inst. Sanitaria    | Cada 2 años     | 2 hs     |
| 8   | Revisión de artefactos de gas              | Gas y Calefacción  | Anual           | 1 h      |
| 9   | Prueba de monóxido de carbono              | Gas y Calefacción  | Anual           | 45 min   |
| 10  | Service de caldera/calefón                 | Gas y Calefacción  | Anual           | 1.5 hs   |
| 11  | Revisión periódica obligatoria NAG-226     | Gas y Calefacción  | Cada 2 años     | 1.5 hs   |
| 12  | Service de aire acondicionado              | Climatización      | Anual           | 1.5 hs   |
| 13  | Control y recarga de matafuegos            | Seguridad Incendio | Anual           | 30 min   |
| 14  | Desinsectación preventiva                  | Control de Plagas  | Semestral       | 1.5 hs   |
| 15  | Desratización preventiva                   | Control de Plagas  | Semestral       | 1 h      |

### Profesional RECOMENDADO (PROFESSIONAL_RECOMMENDED)

Estas tareas las puede hacer el propietario, pero se **recomienda** contratar a un profesional para mejor resultado:

| #   | Tarea                                               | Categoría                | Frecuencia      | Duración |
| --- | --------------------------------------------------- | ------------------------ | --------------- | -------- |
| 1   | Verificación de juntas de dilatación                | Estructura               | Anual           | 30 min   |
| 2   | Reparación de fisuras detectadas                    | Estructura               | Según detección | 1 h      |
| 3   | Control de humedad ascendente en cimientos          | Estructura               | Anual           | 45 min   |
| 4   | Tratamiento impermeabilizante                       | Techos y Cubiertas       | Cada 2 años     | 3 hs     |
| 5   | Inspección de tablero eléctrico                     | Inst. Eléctrica          | Anual           | 30 min   |
| 6   | Limpieza y desinfección de tanque                   | Inst. Sanitaria          | Anual           | 2 hs     |
| 7   | Verificación de termotanque y ánodo                 | Inst. Sanitaria          | Anual           | 45 min   |
| 8   | Limpieza de conductos de ventilación                | Gas y Calefacción        | Anual           | 45 min   |
| 9   | Tratamiento anti-humedad                            | Pintura y Revestimientos | Según detección | 2 hs     |
| 10  | Poda de árboles cercanos a la estructura            | Jardín y Exteriores      | Anual           | 2 hs     |
| 11  | Evaluación de aislación térmica                     | Climatización            | Cada 3 años     | 2 hs     |
| 12  | Control de muros enterrados y subsuelos             | Humedad                  | Anual           | 1 h      |
| 13  | Revisión de inst. eléctrica como fuente de ignición | Seguridad Incendio       | Anual           | 45 min   |
| 14  | Control preventivo de termitas                      | Control de Plagas        | Anual           | 1 h      |
| 15  | Verificación de contrapiso y nivelación             | Pisos                    | Cada 2 años     | 45 min   |

### Propietario PUEDE hacerlo (OWNER_CAN_DO)

Las restantes **51 tareas** pueden ser realizadas por el propietario siguiendo las instrucciones de la descripción técnica en cada tarea. Algunas son tan simples como presionar un botón (test del disyuntor) y otras requieren inspección visual básica.

---

## 8. Criterios de decisión: agregar o no al plan

Después de la inspección visual, la arquitecta debe decidir qué tareas adicionales incluir en el plan. Estos son los criterios:

### SIEMPRE agregar al plan

- Tareas de **seguridad** (gas, eléctrica, incendio) → riesgo de vida
- Tareas con hallazgo de **humedad activa** → daño progresivo si no se trata
- Tareas donde se detectó un **problema existente** → requiere seguimiento
- Todas las tareas de **recurrencia mensual** (disyuntor, detectores de humo, pileta)
- Tareas con prioridad **URGENTE** en las plantillas

### AGREGAR si corresponde al tipo de propiedad

- **Pileta de natación** → solo si la propiedad tiene pileta
- **Cámara séptica** → solo si no tiene cloacas
- **Terraza/balcón** → solo si la propiedad tiene
- **Subsuelo** → solo si tiene subsuelo accesible
- **Caldera/calefón** → según el tipo de calefacción instalada
- **Aire acondicionado** → solo si tiene equipos instalados

### EVALUAR según el estado encontrado

| Hallazgo en la inspección              | Acción recomendada                                 |
| -------------------------------------- | -------------------------------------------------- |
| Fisuras activas (creciendo)            | Agregar control semestral + evaluación profesional |
| Fisuras estables (viejas, sin cambio)  | Agregar control anual de seguimiento               |
| Humedad ascendente visible             | Agregar control semestral + tratamiento            |
| Humedad por filtración                 | Agregar reparación urgente + control posterior     |
| Manchas sin humedad activa             | Agregar control anual                              |
| Instalación eléctrica vieja (>20 años) | Agregar evaluación profesional completa            |
| Gas con llama amarilla/irregular       | Agregar revisión profesional urgente               |
| Membrana asfáltica deteriorada         | Evaluar reemplazo + agregar control semestral      |
| Termitas o indicios de plagas          | Agregar control profesional + tratamiento          |
| Pisos con desniveles                   | Agregar evaluación de contrapiso                   |

### NO agregar (innecesario para la vivienda)

- Tareas de equipamiento que la vivienda no tiene
- Tareas redundantes con otra ya incluida
- Tareas de recurrencia personalizada donde no hay antecedentes

---

## 9. Gestión de presupuestos (Admin)

### Flujo completo de un presupuesto

```
PENDIENTE (cliente solicita)
  → COTIZADO (admin envía cotización con ítems y montos)
    → APROBADO (cliente acepta)
      → EN PROGRESO (admin inicia el trabajo)
        → COMPLETADO (trabajo finalizado)
    → RECHAZADO (cliente rechaza)
```

### Acciones del admin en presupuestos

| Acción                        | Cuándo             | Detalle                                                                               |
| ----------------------------- | ------------------ | ------------------------------------------------------------------------------------- |
| **Ver todas las solicitudes** | Siempre            | Lista con filtros por estado, propiedad, búsqueda                                     |
| **Cotizar**                   | Estado PENDIENTE   | Agregar ítems con descripción y monto, total, plazo estimado, fecha de validez, notas |
| **Iniciar trabajo**           | Estado APROBADO    | Marcar que se comenzó la ejecución                                                    |
| **Completar**                 | Estado EN PROGRESO | Marcar como finalizado                                                                |
| **Agregar comentarios**       | Cualquier estado   | Comunicación con el cliente                                                           |
| **Adjuntar archivos**         | Cualquier estado   | Fotos, documentos, comprobantes                                                       |
| **Ver timeline**              | Siempre            | Historial de todos los cambios de estado con fechas                                   |

### Campos de la cotización (respuesta del admin)

| Campo              | Descripción                                          |
| ------------------ | ---------------------------------------------------- |
| **Ítems**          | Lista de trabajos con descripción individual y monto |
| **Monto total**    | Suma de todos los ítems                              |
| **Días estimados** | Plazo de ejecución estimado                          |
| **Válido hasta**   | Fecha límite para que el cliente acepte              |
| **Notas**          | Observaciones adicionales                            |

---

## 10. Solicitudes de servicio (Admin)

### Flujo completo de una solicitud de servicio

```
ABIERTA (cliente reporta problema)
  → EN REVISIÓN (admin evalúa la solicitud)
    → EN PROGRESO (se está trabajando)
      → RESUELTA (trabajo completado)
      → CERRADA (sin resolución necesaria)
```

### Acciones del admin en solicitudes

| Acción                        | Cuándo                       | Detalle                                           |
| ----------------------------- | ---------------------------- | ------------------------------------------------- |
| **Ver todas las solicitudes** | Siempre                      | Lista con filtros por estado, urgencia, propiedad |
| **Cambiar estado**            | Cualquier estado no terminal | Transicionar entre los estados del flujo          |
| **Agregar comentarios**       | Estado no terminal           | Actualizaciones sobre el avance                   |
| **Adjuntar fotos**            | Estado no terminal           | Fotos del trabajo realizado o hallazgos           |
| **Ver fotos del cliente**     | Siempre                      | Galería de fotos adjuntadas por el cliente        |
| **Ver historial**             | Siempre                      | Timeline completo de cambios de estado            |

### Niveles de urgencia

| Nivel       | Significado                       | Ejemplo                          |
| ----------- | --------------------------------- | -------------------------------- |
| **Urgente** | Riesgo de seguridad o daño activo | Fuga de gas, filtración severa   |
| **Alta**    | Requiere atención pronta          | Rotura de caño, falla eléctrica  |
| **Media**   | Puede programarse                 | Goteo de canilla, puerta trabada |
| **Baja**    | Sin urgencia                      | Consulta, mejora estética        |

### Métricas de SLA (visibles en dashboard admin)

- **Tiempo promedio de respuesta:** Horas desde la creación hasta la primera respuesta
- **Tiempo promedio de resolución:** Horas desde la creación hasta el cierre
- Colorización: Verde (<=24h respuesta, <=48h resolución), Naranja (intermedio), Rojo (>72h respuesta, >168h resolución)

---

## 11. Configuración de la landing page

Desde **Landing** en el menú lateral, se pueden editar tres secciones:

### Precios

- **Precio de lanzamiento** — el precio que se muestra en la sección de inversión (ej: "$35.000")
- **Nota de precio** — texto aclaratorio debajo del precio (ej: "Para viviendas de hasta 150m²")
- **Texto de suscripción** — microcopy sobre la suscripción incluida

### Preguntas frecuentes

- Agregar/editar/eliminar preguntas y respuestas
- Se muestran en la sección FAQ de la landing
- Cada FAQ tiene: pregunta + respuesta

### Ejemplos de consecuencias

- Agregar/editar/eliminar ejemplos de problemas detectados
- Cada ejemplo tiene: título, descripción, consecuencia si no se atiende
- Se muestran en la sección "Problemas detectados" de la landing

> Los cambios se reflejan automáticamente en la landing page sin necesidad de deploy.

---

## 12. Dashboard del Administrador — Detalle completo

El dashboard del admin se organiza en **4 niveles jerárquicos**, diseñado para dar una visión ejecutiva de toda la plataforma.

### Nivel 1: KPIs principales (3 tarjetas)

| Métrica                    | Icono | Qué muestra                            | Colorización                                 |
| -------------------------- | ----- | -------------------------------------- | -------------------------------------------- |
| **Total Clientes**         | 👥    | Cantidad total de clientes registrados | Color primario                               |
| **Total Propiedades**      | 🏠    | Cantidad total de propiedades cargadas | Color primario                               |
| **Tasa de Completamiento** | 📈    | % de tareas completadas vs total       | Verde (>=80%), Naranja (60-79%), Rojo (<60%) |

Los números se muestran con animación de conteo al cargar.

### Nivel 2: Alertas de atención inmediata

Sección que muestra hasta **3 alertas** de ítems que requieren acción:

| Alerta                                         | Nivel                  | Acción                                      |
| ---------------------------------------------- | ---------------------- | ------------------------------------------- |
| **X presupuesto(s) pendiente(s) de respuesta** | Advertencia (amarillo) | Clic → va a `/budgets?status=PENDING`       |
| **X solicitud(es) de servicio abierta(s)**     | Advertencia (amarillo) | Clic → va a `/service-requests?status=OPEN` |
| **X tarea(s) vencida(s)**                      | Urgente (rojo)         | Clic → va a `/tasks?status=OVERDUE`         |

Si no hay alertas, muestra: "Todo al día" con ícono verde de check.

### Nivel 3: Analíticas (3 pestañas con selector de período)

Selector de rango temporal: **3 meses**, **6 meses**, **12 meses**.

#### Pestaña "Operativo"

| Gráfico / Elemento           | Tipo                  | Qué muestra                                                                                          |
| ---------------------------- | --------------------- | ---------------------------------------------------------------------------------------------------- |
| **Tareas Completadas**       | Gráfico de línea/área | Cantidad de tareas completadas por mes en el período seleccionado                                    |
| **Condiciones**              | Gráfico de torta/dona | Distribución de condiciones encontradas en inspecciones (Excelente, Bueno, Regular, Malo, Crítico)   |
| **Categorías Problemáticas** | Gráfico de barras     | Top 5 categorías con más problemas detectados (nombre, cantidad de problemas, total de inspecciones) |

#### Pestaña "Tendencias"

| Gráfico / Elemento         | Tipo                          | Qué muestra                                                                             |
| -------------------------- | ----------------------------- | --------------------------------------------------------------------------------------- |
| **Costos por Categoría**   | Gráfico de área apilada       | Desglose de costos de mantenimiento por categoría, mes a mes                            |
| **Salud del Portfolio**    | Métrica con barra de progreso | Tasa de completamiento global con colorización (Verde >=80%, Naranja 60-79%, Rojo <60%) |
| **Sectores Problemáticos** | Lista con badges              | Top 5 sectores con más tareas vencidas, mostrando nombre del sector y cantidad          |

#### Pestaña "Financiero"

| Gráfico / Elemento                  | Tipo                | Qué muestra                                                                                                                    |
| ----------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Pipeline de Presupuestos**        | Desglose por estado | Presupuestos agrupados por estado (Pendiente, Cotizado, Aprobado, Rechazado, Completado) con cantidad y monto total por estado |
| **Costo total mantenimiento**       | Métrica individual  | Suma total de costos de todas las tareas completadas (formato moneda ARS)                                                      |
| **Respuesta promedio presupuestos** | Métrica individual  | Promedio de días entre solicitud y respuesta del admin                                                                         |
| **Tiempo respuesta solicitudes**    | Métrica individual  | Promedio de horas hasta primera respuesta en solicitudes de servicio                                                           |
| **Tiempo resolución solicitudes**   | Métrica individual  | Promedio de horas hasta resolución de solicitudes de servicio                                                                  |

> Los tiempos de SLA se colorean: Verde (bueno), Naranja (aceptable), Rojo (necesita mejorar).

### Nivel 4: Actividad reciente (Feed)

Lista de las **10 actividades más recientes** de toda la plataforma, ordenadas por fecha:

| Tipo de actividad          | Formato                                  | Link                       |
| -------------------------- | ---------------------------------------- | -------------------------- |
| **Nuevo cliente**          | "Nuevo cliente: {nombre}"                | → `/clients/{id}`          |
| **Nueva propiedad**        | "Nueva propiedad: {dirección}, {ciudad}" | → `/properties/{id}`       |
| **Tarea completada**       | "Tarea completada: {nombre tarea}"       | → `/tasks`                 |
| **Presupuesto solicitado** | "Presupuesto solicitado: {título}"       | → `/budgets/{id}`          |
| **Solicitud de servicio**  | "Solicitud de servicio: {título}"        | → `/service-requests/{id}` |

Cada ítem muestra: ícono + descripción + tiempo relativo ("hace 2 horas", "hace 5 minutos").

---

# PARTE B — CLIENTE (PROPIETARIO)

---

## 13. Experiencia del cliente — Visión general

El cliente accede al sistema después de ser invitado por la arquitecta. Tiene dos interfaces disponibles:

### Interfaces de acceso

| Interfaz      | Acceso                             | Optimizada para                                         |
| ------------- | ---------------------------------- | ------------------------------------------------------- |
| **Web**       | Navegador en computadora o celular | Visualización detallada, analíticas, gestión completa   |
| **App móvil** | App nativa iOS/Android             | Uso diario rápido, notificaciones push, gestos táctiles |

### Navegación del cliente

**Web (menú lateral — 5 módulos):**

| Módulo           | Descripción                                                    |
| ---------------- | -------------------------------------------------------------- |
| **Dashboard**    | Resumen de salud de la vivienda, tareas pendientes, analíticas |
| **Tareas**       | Ver y completar tareas de mantenimiento                        |
| **Propiedades**  | Ver sus propiedades y estado de salud                          |
| **Presupuestos** | Solicitar y gestionar presupuestos                             |
| **Servicios**    | Reportar problemas y solicitar asistencia                      |

**Móvil (barra inferior — 5 pestañas):**

| Pestaña            | Icono | Descripción                                          |
| ------------------ | ----- | ---------------------------------------------------- |
| **Inicio**         | 🏠    | Dashboard con ISV, tareas próximas y accesos rápidos |
| **Tareas**         | ✅    | Lista de tareas con filtros y completado             |
| **Propiedades**    | 🏘    | Propiedades con detalle y plan de mantenimiento      |
| **Notificaciones** | 🔔    | Centro de notificaciones (con badge de no leídas)    |
| **Perfil**         | 👤    | Datos personales, suscripción, configuración         |

Además, desde la pantalla de Inicio se accede a:

- **Solicitudes de servicio** (acceso rápido)
- **Presupuestos** (acceso rápido)

### Qué PUEDE hacer el cliente

| Acción                        | Detalle                                                         |
| ----------------------------- | --------------------------------------------------------------- |
| Ver sus propiedades           | Información, plan, tareas, fotos, gastos, ISV                   |
| Completar tareas              | Registrar inspecciones con condición, acción, resultado y fotos |
| Solicitar presupuestos        | Crear nuevas solicitudes de presupuesto                         |
| Aprobar/rechazar cotizaciones | Cuando el admin cotiza un presupuesto                           |
| Crear solicitudes de servicio | Reportar problemas detectados                                   |
| Agregar comentarios           | En presupuestos y solicitudes de servicio                       |
| Adjuntar fotos                | En tareas (al completar), presupuestos y solicitudes            |
| Gestionar notificaciones      | Ver, marcar como leídas                                         |
| Editar su perfil              | Nombre, teléfono, contraseña                                    |
| Cambiar tema                  | Claro, oscuro o automático (solo móvil)                         |
| Renovar suscripción           | Contacto por WhatsApp                                           |

### Qué NO puede hacer el cliente

| Restricción                          | Motivo                                                        |
| ------------------------------------ | ------------------------------------------------------------- |
| Crear propiedades                    | Solo el admin carga propiedades                               |
| Editar propiedades                   | Solo el admin modifica datos                                  |
| Crear/editar planes de mantenimiento | Solo el admin gestiona los planes                             |
| Activar/archivar planes              | Solo el admin cambia el estado del plan                       |
| Cotizar presupuestos                 | Solo el admin envía cotizaciones                              |
| Cambiar estado de solicitudes        | Solo el admin transiciona estados                             |
| Eliminar nada                        | No hay botones de eliminación para clientes                   |
| Ver datos de otros clientes          | Solo ve sus propios datos                                     |
| Editar presupuestos                  | Solo si el estado es PENDIENTE (antes de que el admin cotice) |
| Editar solicitudes de servicio       | Solo si el estado es ABIERTA                                  |

---

## 14. Dashboard del Cliente — Detalle completo

El dashboard del cliente se organiza en **3 niveles jerárquicos**, diseñado para que el propietario entienda rápidamente el estado de su vivienda y qué debe hacer.

### Tarjeta de bienvenida (solo para clientes nuevos)

Se muestra hasta que el cliente tenga una propiedad con tareas activas. Progreso de 3 pasos:

1. ✓ Tu propiedad fue registrada
2. ✓ Tu plan de mantenimiento está activo
3. ✓ Completá tu primera tarea cuando llegue la fecha

Botones contextuales: "Ver mi propiedad" / "Ver tareas" según el progreso.

### Banner de suscripción (condicional)

Se muestra cuando la suscripción vence en **7 días o menos**:

- Ícono de advertencia amarillo
- Texto: "Tu suscripción vence [en X días / mañana / hoy]"
- Link: "Contactar para renovar →" (abre WhatsApp)

### Nivel 1: Tarjeta de estado de la vivienda (ISV)

La tarjeta principal muestra el **Índice de Salud de la Vivienda** con toda esta información:

#### Puntaje principal (0-100)

- Número grande animado con el puntaje ISV
- Barra de progreso visual coloreada según el estado
- Badge de etiqueta: "Excelente", "Bueno", "Regular", etc.

#### Mensajes contextuales según el estado

| Puntaje | Color    | Título                              | Mensaje                                                                                                |
| ------- | -------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------ |
| 80-100  | Verde    | "Tu casa está bien"                 | "Todo bajo control. Seguí así y tu hogar se va a mantener en excelente estado."                        |
| 60-79   | Amarillo | "Tu casa necesita algo de atención" | Menciona tareas pendientes de la semana                                                                |
| 40-59   | Naranja  | "Tu casa necesita atención"         | "Un ISV por debajo de 60 indica que los problemas se están acumulando..."                              |
| 0-39    | Rojo     | "Tu casa necesita atención urgente" | "Tu vivienda necesita intervención urgente. Cada mes de demora aumenta significativamente el costo..." |

#### Mensajes dinámicos adicionales

El sistema genera mensajes personalizados según la situación del cliente:

- Si hay tareas vencidas + urgentes: "Tenés X tarea vencida y Y urgente. Revisalas cuanto antes."
- Si hay tareas esta semana: "Tenés X tarea programada esta semana."
- Si está todo al día: "Todo bajo control. Seguí así..."

#### Mini estadísticas (4 métricas)

| Métrica                  | Icono | Color especial | Tooltip                                      |
| ------------------------ | ----- | -------------- | -------------------------------------------- |
| **Vencidas**             | ⚠️    | Rojo si > 0    | "Tareas que pasaron su fecha de vencimiento" |
| **Pendientes**           | 🕐    | Normal         | "Tareas programadas que aún no vencieron"    |
| **Completadas este mes** | ✅    | Verde si > 0   | "Tareas completadas en los últimos 30 días"  |
| **Presup. pendientes**   | 📄    | Normal         | "Presupuestos esperando tu decisión"         |

#### Botones de acción

- **"Ver qué hacer"** → desplaza a la lista de acciones
- **"Ver análisis completo"** → desplaza a la sección de analíticas

### Nivel 2: Lista de acciones (Qué hacer)

Organizada en 3 secciones:

#### Sección 1: "Próxima inspección" (destacada)

- Tarjeta destacada con la próxima tarea programada (no vencida)
- Muestra: nombre de la tarea, dirección de la propiedad, fecha relativa ("en 5 días", "mañana")
- Ícono de calendario con fondo azul
- Clic → navega al detalle de la tarea

#### Sección 2: "Necesitan atención" (borde rojo)

Lista de tareas **vencidas** (máximo 5 visibles, con link "Ver las X tareas vencidas →" si hay más).

Cada tarjeta de tarea muestra:

- **Nombre** de la tarea (clickeable)
- **Badge de categoría** (contorno)
- **Badge de prioridad** (coloreado: rojo=urgente, naranja=alta, gris=media/baja)
- **"Requiere profesional"** badge con ícono de llave (si corresponde)
- **Dirección** de la propiedad + **Sector** (si aplica)
- **Estado de vencimiento** en rojo: "Vencida hace X días"
- **Botón "Registrar"** (rojo) — para completar la tarea

#### Sección 3: "Tu semana"

Lista de tareas programadas para los **próximos 7 días**:

- Misma estructura que la sección anterior
- Fecha relativa: "en 2 días", "vence hoy", "mañana"
- Sin botón de registrar (aún no están vencidas)

#### Estado vacío

Si no hay tareas vencidas ni programadas esta semana:

- Ícono verde de check: "Todo al día"
- "No tenés tareas vencidas ni programadas esta semana."

### Nivel 3: Analíticas detalladas (colapsable)

Colapsada por defecto con botón "Ver estadísticas detalladas". Al expandir:

#### Selector de período: "3 meses", "6 meses", "12 meses"

#### Pestaña 1: Estado general

| Elemento                  | Tipo              | Qué muestra                                                                                             |
| ------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------- |
| **Condición General**     | Gráfico de torta  | Distribución de condiciones encontradas en inspecciones (Excelente, Bueno, Regular, Malo, Crítico)      |
| **Índice de Salud (ISV)** | Tarjeta detallada | Las 5 dimensiones del ISV con barras, puntajes por sector, recomendaciones dinámicas, historial mensual |

##### Detalle de la tarjeta ISV expandida

**5 dimensiones** (cada una 0-100 con barra visual):

| Dimensión    | Tooltip explicativo                                                  |
| ------------ | -------------------------------------------------------------------- |
| Cumplimiento | "Tareas al día (ponderado por prioridad)"                            |
| Condición    | "Estado encontrado en últimas inspecciones"                          |
| Cobertura    | "Sectores inspeccionados en últimos 12 meses"                        |
| Inversión    | "¿Gastás más en prevención o en reparaciones? Ideal: más prevención" |
| Tendencia    | Flecha arriba/abajo/derecha + "Mejorando" / "Declinando" / "Estable" |

**Puntaje por sector:**

- Cada sector de la propiedad con su puntaje (0-100%)
- Se resalta en rojo el peor sector si tiene puntaje < 70%
- Cada sector es clickeable → filtra tareas por ese sector

**Recomendaciones dinámicas** (se muestran si alguna dimensión está baja):

- Cumplimiento < 60%: "Completá las tareas vencidas de alta prioridad..."
- Condición < 50%: "Las últimas inspecciones muestran condiciones desfavorables..."
- Cobertura < 50%: "Hay sectores sin inspección reciente..."
- Inversión < 40%: "La mayoría de las acciones son correctivas..."
- Tendencia < 45%: "La tendencia indica deterioro..."
- Si todo bien: mensaje verde de éxito

**Mini gráfico de historial ISV:**

- Barras mensuales con puntaje ISV
- Coloreadas según el nivel de salud
- Solo visible si hay 2+ meses de historial

**Disclaimer legal:**

> "El ISV es un indicador orientativo basado en inspecciones realizadas. No constituye una certificación técnica ni garantiza el estado estructural de la propiedad."

#### Pestaña 2: Evolución

| Elemento                   | Tipo             | Qué muestra                                                 |
| -------------------------- | ---------------- | ----------------------------------------------------------- |
| **Evolución de Condición** | Gráfico de línea | Promedio de condición por categoría a lo largo de los meses |

#### Pestaña 3: Gastos

| Elemento                    | Tipo               | Qué muestra                           |
| --------------------------- | ------------------ | ------------------------------------- |
| **Historial de Gastos**     | Gráfico de barras  | Costos de mantenimiento por mes       |
| **Costo total del período** | Métrica individual | Total acumulado en formato moneda ARS |

#### Pestaña 4: Por categoría

| Elemento                 | Tipo               | Qué muestra                                                                                                                                           |
| ------------------------ | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Estado por Categoría** | Tabla              | Cada categoría con: cantidad de tareas, % completamiento, tareas vencidas, condición promedio, barra de progreso                                      |
| **Estado por Sector**    | Grilla de tarjetas | Cada sector con: nombre, % de salud (coloreado), barra de progreso, cantidad de tareas, tareas vencidas, costo. Clickeable → filtra tareas por sector |

### Accesos rápidos (solo móvil)

Dos tarjetas prominentes debajo del ISV:

| Tarjeta                     | Subtítulo                                  | Destino                  |
| --------------------------- | ------------------------------------------ | ------------------------ |
| **Solicitudes de Servicio** | "Reportar problemas o pedir asistencia"    | Pantalla de solicitudes  |
| **Presupuestos**            | "Solicitar cotizaciones para reparaciones" | Pantalla de presupuestos |

---

## 15. Propiedades (Cliente)

### Qué ve el cliente

- **Lista de propiedades** con: dirección, tipo (badge), ciudad, año de construcción, superficie, nombre del plan
- **Filtros:** tipo de propiedad (pills horizontales), estado del plan (Activo, Borrador, Archivado)
- **Búsqueda:** por dirección o ciudad

### Detalle de propiedad

Al hacer clic en una propiedad, el cliente ve:

| Sección                   | Contenido                                                                                                                                     |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Información**           | Dirección, tipo, ciudad, año, superficie, cliente asignado                                                                                    |
| **ISV**                   | Puntaje de salud actual + historial mensual                                                                                                   |
| **Plan de mantenimiento** | Nombre del plan + estado (badge)                                                                                                              |
| **Tareas**                | Lista de tareas del plan agrupadas por categoría, con filtros por estado (Todas, Pendientes, Próximas, Vencidas, Completadas) y por categoría |
| **Problemas detectados**  | Lista de problemas encontrados en inspecciones, con botón "Solicitar servicio"                                                                |
| **Gastos**                | Costo total, desglose por categoría y sector, promedio mensual                                                                                |
| **Fotos**                 | Galería de fotos de inspecciones                                                                                                              |

### Restricciones

- No puede crear propiedades (botón oculto)
- No puede editar datos de la propiedad
- No puede crear, activar ni archivar planes

---

## 16. Tareas (Cliente)

### Vista de lista

- **Tarjetas de estado** en la parte superior con conteo clickeable:
  - Vencidas (rojo si > 0)
  - Pendientes
  - Próximas
  - Completadas
- **Filtros:** prioridad (Alta, Media, Baja), sector, propiedad (si tiene más de una)
- **Búsqueda:** por nombre de tarea, categoría, dirección o ciudad
- Pull-to-refresh en móvil
- Scroll infinito

### Tarjeta de cada tarea

| Dato        | Detalle                                                            |
| ----------- | ------------------------------------------------------------------ |
| Nombre      | Título de la tarea                                                 |
| Prioridad   | Badge coloreado (Urgente/Alta/Media/Baja)                          |
| Estado      | Badge (Pendiente/Próxima/Vencida/Completada)                       |
| Categoría   | Nombre de la categoría                                             |
| Sector      | Sector de la propiedad (si aplica)                                 |
| Profesional | Badge "Requiere profesional" si corresponde                        |
| Propiedad   | Dirección + ciudad                                                 |
| Fecha       | Fecha de vencimiento relativa ("en 2 días", "vencida hace 5 días") |

### Detalle de tarea

Pantalla completa con toda la información:

| Sección                         | Contenido                                                              |
| ------------------------------- | ---------------------------------------------------------------------- |
| **Información principal**       | Nombre, estado, prioridad, fecha de vencimiento, requisito profesional |
| **Descripción técnica**         | Instrucciones detalladas de qué hacer y qué buscar                     |
| **Detalles**                    | Tipo de tarea, recurrencia, categoría, sector, duración estimada       |
| **Última completación**         | Fecha + condición encontrada (si fue completada antes)                 |
| **Historial de completaciones** | Todas las completaciones anteriores con fechas y condiciones           |
| **Notas**                       | Notas anteriores + posibilidad de agregar nuevas                       |

### Completar una tarea (Registrar inspección)

Al presionar **"Registrar inspección"** se abre un formulario con:

| Campo                    | Opciones                                                                                   |
| ------------------------ | ------------------------------------------------------------------------------------------ |
| **Condición encontrada** | Buena, Regular, Mala, Crítica                                                              |
| **Acción tomada**        | Propietario reparó, Profesional reparó, Solo inspección                                    |
| **Resultado**            | Solucionado, Requiere servicio, Parcialmente solucionado, Falsa alarma, No se pudo evaluar |
| **Fotos**                | Subir fotos desde cámara o galería                                                         |
| **Notas**                | Texto libre con observaciones                                                              |

Si el resultado indica un problema, el sistema sugiere **crear una solicitud de servicio** con los datos pre-cargados.

### Solicitar servicio desde tarea

Botón **"Solicitar Servicio"** disponible en el detalle de cualquier tarea. Pre-carga:

- Propiedad de la tarea
- Título basado en el nombre de la tarea
- Descripción basada en la descripción técnica

---

## 17. Presupuestos (Cliente)

### Acciones del cliente

| Acción                    | Cuándo            | Detalle                                                                       |
| ------------------------- | ----------------- | ----------------------------------------------------------------------------- |
| **Solicitar presupuesto** | Siempre           | Botón "Solicitar Presupuesto" → formulario con propiedad, título, descripción |
| **Ver presupuestos**      | Siempre           | Lista con filtros por estado, propiedad, búsqueda                             |
| **Editar solicitud**      | Solo si PENDIENTE | Modificar título y descripción antes de que el admin cotice                   |
| **Aprobar cotización**    | Solo si COTIZADO  | Aceptar la cotización del admin                                               |
| **Rechazar cotización**   | Solo si COTIZADO  | Rechazar la cotización                                                        |
| **Agregar comentarios**   | Cualquier estado  | Comunicación con el admin                                                     |
| **Adjuntar archivos**     | Cualquier estado  | Fotos, documentos                                                             |
| **Ver timeline**          | Siempre           | Historial completo de cambios                                                 |

### Detalle del presupuesto (vista del cliente)

| Sección                      | Contenido                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------- |
| **Información**              | Título, descripción, estado (badge), propiedad                                  |
| **Cotización** (si cotizado) | Lista de ítems con montos, total, plazo estimado, válido hasta, notas del admin |
| **Botones de acción**        | Aprobar / Rechazar (solo si estado es COTIZADO)                                 |
| **Comentarios**              | Hilo de conversación con el admin                                               |
| **Adjuntos**                 | Archivos subidos por ambas partes                                               |
| **Timeline**                 | Historial de todos los cambios de estado                                        |

### Flujo típico del cliente

```
1. Solicita presupuesto → estado PENDIENTE
2. Espera que el admin cotice → estado COTIZADO
3. Revisa la cotización (ítems, montos, plazo)
4. Aprueba o rechaza → estado APROBADO o RECHAZADO
5. Si aprobado, el admin ejecuta → estado EN PROGRESO
6. El admin completa → estado COMPLETADO
```

---

## 18. Solicitudes de servicio (Cliente)

### Acciones del cliente

| Acción                  | Cuándo                        | Detalle                                                                     |
| ----------------------- | ----------------------------- | --------------------------------------------------------------------------- |
| **Crear solicitud**     | Siempre                       | Desde la lista, desde una tarea completada, o desde el detalle de una tarea |
| **Ver solicitudes**     | Siempre                       | Lista con filtros por estado, urgencia, propiedad, búsqueda                 |
| **Editar solicitud**    | Solo si ABIERTA               | Modificar título y descripción                                              |
| **Agregar comentarios** | Si no está en estado terminal | Comunicación con el admin                                                   |
| **Adjuntar fotos**      | Si no está en estado terminal | Fotos del problema desde cámara o galería                                   |
| **Ver historial**       | Siempre                       | Timeline de cambios de estado                                               |

### Crear solicitud de servicio

| Campo           | Obligatorio | Descripción                                         |
| --------------- | ----------- | --------------------------------------------------- |
| **Propiedad**   | Sí          | Seleccionar de la lista de propiedades del cliente  |
| **Título**      | Sí          | Descripción corta del problema                      |
| **Descripción** | Sí          | Detalle completo del problema                       |
| **Urgencia**    | Sí          | Urgente, Alta, Media, Baja                          |
| **Categoría**   | Sí          | Categoría relacionada (Estructura, Eléctrica, etc.) |

Si la solicitud se crea desde una tarea:

- La propiedad se pre-selecciona
- El título se pre-carga con el nombre de la tarea
- La descripción se pre-carga con la descripción técnica

### Flujo típico del cliente

```
1. Detecta problema (durante inspección o uso diario)
2. Crea solicitud → estado ABIERTA
3. Adjunta fotos del problema
4. El admin revisa → estado EN REVISIÓN
5. El admin gestiona → estado EN PROGRESO
6. Se resuelve → estado RESUELTA
```

---

## 19. Notificaciones

### Tipos de notificaciones que recibe el cliente

| Tipo                             | Icono | Ejemplos                                                        |
| -------------------------------- | ----- | --------------------------------------------------------------- |
| **Recordatorio de tarea**        | 🕐    | "La tarea X vence mañana", "Tenés X tareas vencidas"            |
| **Actualización de presupuesto** | 📋    | "Tu presupuesto fue cotizado", "El trabajo fue completado"      |
| **Actualización de servicio**    | 🔧    | "Tu solicitud está en progreso", "Tu solicitud fue resuelta"    |
| **Sistema**                      | 🔔    | "Tu suscripción vence en 7 días", "Bienvenido a EPDE"           |
| **Alerta de ISV**                | 📊    | "El ISV de tu propiedad bajó 15 puntos" (snapshot mensual)      |
| **Suscripción**                  | ⏰    | "Tu suscripción fue extendida", "Tu suscripción fue suspendida" |

### Acciones sobre notificaciones

| Acción                       | Detalle                                                                    |
| ---------------------------- | -------------------------------------------------------------------------- |
| **Ver notificación**         | Tap/clic para ver el detalle                                               |
| **Navegar al ítem**          | Clic en la notificación abre el presupuesto, solicitud o tarea relacionada |
| **Marcar como leída**        | Individual (clic o swipe en móvil)                                         |
| **Marcar todas como leídas** | Botón en la parte superior                                                 |

### Indicador de no leídas

- **Web:** Número en el menú lateral
- **Móvil:** Badge numérico rojo en la pestaña de notificaciones (🔔)
- El badge desaparece cuando todas están leídas

---

## 20. Perfil y configuración

### Información visible

| Dato                  | Editable               |
| --------------------- | ---------------------- |
| **Nombre**            | Sí                     |
| **Email**             | No (solo lectura)      |
| **Teléfono**          | Sí                     |
| **Rol**               | No (muestra "Cliente") |
| **Fecha de registro** | No                     |

### Suscripción

| Dato                    | Detalle                                                                |
| ----------------------- | ---------------------------------------------------------------------- |
| **Fecha de expiración** | Fecha exacta                                                           |
| **Días restantes**      | Conteo de días                                                         |
| **Estado**              | Badge: Activa (verde), Por vencer (amarillo, <7 días), Expirada (rojo) |
| **Renovar**             | Link a WhatsApp para contactar                                         |

### Cambio de contraseña

Requisitos de la nueva contraseña:

- Mínimo 8 caracteres
- Al menos 1 mayúscula
- Al menos 1 minúscula
- Al menos 1 número

Campos: contraseña actual + nueva contraseña + confirmar nueva contraseña.

### Configuración (solo móvil)

| Opción   | Valores                                                         |
| -------- | --------------------------------------------------------------- |
| **Tema** | Claro, Oscuro, Automático (sigue configuración del dispositivo) |

### Cerrar sesión

Botón de logout con confirmación antes de cerrar.

---

## 21. Funcionalidades exclusivas de la app móvil

### Gestos táctiles

| Gesto                                    | Dónde                                   | Acción                                                              |
| ---------------------------------------- | --------------------------------------- | ------------------------------------------------------------------- |
| **Deslizar tarea a la derecha**          | Lista de tareas en detalle de propiedad | Completa la tarea directamente (muestra ícono de check al deslizar) |
| **Deslizar notificación a la izquierda** | Lista de notificaciones                 | Marca la notificación como leída                                    |
| **Pull-to-refresh**                      | Todas las pantallas de lista            | Recarga los datos                                                   |

### Feedback háptico (vibración)

El celular vibra sutilmente en estos momentos:

- Selección de pestaña inferior
- Selección de filtros (pills)
- Completar tarea por deslizamiento
- Acciones importantes (aprobar presupuesto, enviar solicitud)
- Subir foto exitosamente
- Cerrar sesión

### Notificaciones push

- Recordatorios de tareas próximas y vencidas
- Actualizaciones de presupuestos y solicitudes de servicio
- Alertas de suscripción
- Alertas de ISV (cuando baja significativamente)
- Se pueden gestionar desde la configuración del dispositivo

### Cámara integrada

En la completación de tareas y solicitudes de servicio, el cliente puede:

- Tomar foto con la cámara del celular
- Seleccionar foto de la galería
- Las fotos se suben automáticamente al servidor

### Modo offline

- Banner "Sin conexión" visible cuando no hay internet
- Los datos cargados previamente se mantienen visibles (caché local de 24 horas)
- Las acciones se bloquean hasta que se recupere la conexión

### Scroll infinito

Todas las listas cargan más elementos automáticamente al llegar al final (sin paginación manual).

### Animaciones

- Íconos de pestañas con animación de escala al seleccionar
- Números animados (conteo progresivo) en el ISV y estadísticas
- Transiciones suaves entre pantallas
- Se respeta la configuración de "Reducir movimiento" del dispositivo

---

# PARTE C — REFERENCIA TÉCNICA

---

## 22. Índice de Salud de la Vivienda (ISV)

### Cómo se calcula

El ISV es un puntaje de **0 a 100** que mide la salud general de la vivienda. Se compone de 4 dimensiones ponderadas + 1 de tendencia:

| Dimensión        | Peso        | Qué mide                                                            |
| ---------------- | ----------- | ------------------------------------------------------------------- |
| **Cumplimiento** | 35%         | % de tareas prioritarias al día                                     |
| **Condición**    | 30%         | Promedio de condición encontrada en inspecciones (últimos 12 meses) |
| **Cobertura**    | 20%         | % de sectores inspeccionados en los últimos 12 meses                |
| **Inversión**    | 15%         | % de acciones preventivas vs correctivas                            |
| **Tendencia**    | (indicador) | Comparación de condición últimos 3 meses vs 3 meses anteriores      |

### Escala de puntaje

| Rango  | Etiqueta          | Significado                                      |
| ------ | ----------------- | ------------------------------------------------ |
| 80-100 | Excelente         | Vivienda en óptimo estado de mantenimiento       |
| 60-79  | Bueno             | Mantenimiento adecuado, mejoras menores posibles |
| 40-59  | Regular           | Necesita atención en varias áreas                |
| 20-39  | Necesita atención | Problemas significativos que atender             |
| 0-19   | Crítico           | Requiere intervención inmediata                  |

### Snapshots mensuales

- Se captura automáticamente el 1° de cada mes
- Si el puntaje baja 15+ puntos respecto al mes anterior, se genera una alerta
- El historial de snapshots permite ver la evolución de la vivienda

### Cómo mejorar el ISV de un cliente

1. **Cumplimiento (35%):** Asegurar que las tareas de alta prioridad se completen a tiempo
2. **Condición (30%):** Registrar condiciones "Bueno" o "Excelente" en las inspecciones
3. **Cobertura (20%):** Inspeccionar todos los sectores de la propiedad al menos 1 vez al año
4. **Inversión (15%):** Realizar más acciones preventivas (inspección, limpieza, ajuste) que correctivas

---

## 23. Catálogo completo de plantillas de tareas

### Tipos de tarea

| Tipo          | Icono | Descripción                                  |
| ------------- | ----- | -------------------------------------------- |
| Inspección    | 🔍    | Revisión visual o técnica del estado actual  |
| Limpieza      | 🧹    | Limpieza de componentes o sistemas           |
| Prueba/Ensayo | 🧪    | Test de funcionamiento (disyuntor, pérdidas) |
| Tratamiento   | 💊    | Aplicación de producto o reparación          |
| Sellado       | 🔒    | Sellado de juntas, grietas o uniones         |
| Lubricación   | 🛢    | Lubricación de partes móviles                |
| Ajuste        | 🔧    | Ajuste, regulación o service                 |
| Medición      | 📏    | Medición técnica con instrumental            |
| Evaluación    | 📋    | Evaluación integral por profesional          |

### Niveles de prioridad

| Prioridad   | Significado                                                       |
| ----------- | ----------------------------------------------------------------- |
| **Urgente** | Riesgo de seguridad o daño inmediato. Atender de inmediato        |
| **Alta**    | Puede causar daño significativo si se posterga                    |
| **Media**   | Mantenimiento regular preventivo                                  |
| **Baja**    | Estético o de baja criticidad, puede programarse con flexibilidad |

### Requisito profesional

| Nivel                       | Significado                                                   |
| --------------------------- | ------------------------------------------------------------- |
| **Propietario puede**       | El propietario puede realizarla siguiendo las instrucciones   |
| **Profesional recomendado** | Se recomienda un profesional para mejor resultado             |
| **Profesional obligatorio** | Requiere matriculado (electricista, gasista, ingeniero, etc.) |

---

### 23.1 Estructura 🏗

| #   | Tarea                                      | Tipo        | Profesional | Prioridad | Frecuencia      | Duración | Descripción técnica                                                                                                                               |
| --- | ------------------------------------------ | ----------- | ----------- | --------- | --------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Inspección visual de vigas y columnas      | Inspección  | Propietario | Alta      | Anual           | 30 min   | Revisar visualmente vigas y columnas en busca de fisuras, deformaciones o manchas de humedad. Verificar que no haya desprendimientos de material. |
| 2   | Control de fisuras en muros                | Inspección  | Propietario | Media     | Semestral       | 45 min   | Examinar muros interiores y exteriores buscando fisuras nuevas o crecimiento de existentes. Marcar con cinta y fotografiar para seguimiento.      |
| 3   | Evaluación profesional de fundaciones      | Evaluación  | Obligatorio | Alta      | Cada 2 años     | 2 hs     | Evaluación técnica de cimientos y fundaciones por profesional matriculado. Incluye nivel de asentamientos y estado general.                       |
| 4   | Verificación de juntas de dilatación       | Inspección  | Recomendado | Media     | Anual           | 30 min   | Inspeccionar el estado de las juntas de dilatación en losas y muros. Verificar sellado y flexibilidad del material.                               |
| 5   | Reparación de fisuras detectadas           | Tratamiento | Recomendado | Alta      | Según detección | 1 h      | Reparar fisuras detectadas en inspecciones previas. Aplicar sellador o mortero según corresponda al tipo de fisura.                               |
| 6   | Control de humedad ascendente en cimientos | Inspección  | Recomendado | Alta      | Anual           | 45 min   | Inspeccionar base de muros y zócalos buscando manchas de humedad ascendente por capilaridad. Verificar estado de capa aisladora.                  |
| 7   | Evaluación estructural integral quinquenal | Evaluación  | Obligatorio | Alta      | Cada 5 años     | 4 hs     | Evaluación completa del estado estructural por ingeniero matriculado. Incluye fundaciones, losas, vigas, columnas y muros portantes.              |

### 23.2 Techos y Cubiertas 🏠

| #   | Tarea                                     | Tipo        | Profesional | Prioridad | Frecuencia      | Duración | Descripción técnica                                                                                                                        |
| --- | ----------------------------------------- | ----------- | ----------- | --------- | --------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Inspección de membrana hidrófuga          | Inspección  | Propietario | Alta      | Semestral       | 40 min   | Revisar estado de la membrana asfáltica o hidrófuga en techos planos. Buscar burbujas, grietas o despegues en uniones.                     |
| 2   | Limpieza de canaletas y bajadas pluviales | Limpieza    | Propietario | Alta      | Trimestral      | 45 min   | Limpiar hojas, tierra y sedimentos de canaletas y verificar libre circulación de bajadas pluviales. Probar con agua.                       |
| 3   | Control de tejas o chapa                  | Inspección  | Propietario | Media     | Anual           | 30 min   | Verificar estado de tejas (rotas, desplazadas) o chapas (oxidación, tornillos flojos). Controlar sellado en cumbrera.                      |
| 4   | Tratamiento impermeabilizante             | Tratamiento | Recomendado | Media     | Cada 2 años     | 3 hs     | Aplicar tratamiento impermeabilizante en terraza o techo plano. Incluye limpieza previa y aplicación de producto protector.                |
| 5   | Reparación de filtraciones                | Tratamiento | Obligatorio | Urgente   | Según detección | 2 hs     | Detectar y reparar filtraciones activas en techos. Requiere identificación del punto de ingreso y sellado profesional.                     |
| 6   | Reemplazo integral de membrana asfáltica  | Tratamiento | Obligatorio | Alta      | Cada 10 años    | 8 hs     | Reemplazo completo de membrana asfáltica en techos planos. Incluye retiro de membrana vieja, preparación de superficie y colocación nueva. |

### 23.3 Instalación Eléctrica ⚡

| #   | Tarea                                      | Tipo       | Profesional | Prioridad | Frecuencia  | Duración | Descripción técnica                                                                                                                 |
| --- | ------------------------------------------ | ---------- | ----------- | --------- | ----------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Prueba de disyuntor diferencial (ID)       | Prueba     | Propietario | Urgente   | Mensual     | 5 min    | Presionar botón de test del interruptor diferencial. Debe cortar el suministro inmediatamente. Si no corta, llamar a electricista.  |
| 2   | Inspección de tablero eléctrico            | Inspección | Recomendado | Alta      | Anual       | 30 min   | Revisar estado del tablero: térmicas, conexiones, cables sueltos, signos de recalentamiento. Verificar identificación de circuitos. |
| 3   | Medición de puesta a tierra                | Medición   | Obligatorio | Alta      | Anual       | 45 min   | Medir resistencia de puesta a tierra con telurímetro. Valor debe ser menor a 10 ohms según reglamentación AEA.                      |
| 4   | Control de tomacorrientes y llaves         | Inspección | Propietario | Media     | Anual       | 30 min   | Verificar que todos los tomacorrientes y llaves de luz funcionen correctamente. Buscar signos de chispas, calor o decoloración.     |
| 5   | Revisión de instalación eléctrica completa | Evaluación | Obligatorio | Alta      | Cada 3 años | 4 hs     | Revisión completa de la instalación eléctrica por electricista matriculado. Incluye termografía y mediciones de aislación.          |

### 23.4 Instalación Sanitaria 🚿

| #   | Tarea                                             | Tipo       | Profesional | Prioridad | Frecuencia  | Duración | Descripción técnica                                                                                                           |
| --- | ------------------------------------------------- | ---------- | ----------- | --------- | ----------- | -------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 1   | Inspección de canillas y griferías                | Inspección | Propietario | Media     | Semestral   | 20 min   | Verificar que no haya goteos en canillas de cocina, baños y lavadero. Revisar estado de las juntas y aireadores.              |
| 2   | Limpieza de sifones y rejillas                    | Limpieza   | Propietario | Media     | Trimestral  | 30 min   | Desarmar y limpiar sifones de piletas. Retirar residuos de rejillas de piso. Verificar buen escurrimiento del agua.           |
| 3   | Control de tanque de agua                         | Inspección | Propietario | Alta      | Semestral   | 30 min   | Inspeccionar tanque de reserva: nivel de agua, estado de flotante, tapa bien colocada, limpieza interna si corresponde.       |
| 4   | Limpieza y desinfección de tanque                 | Limpieza   | Recomendado | Alta      | Anual       | 2 hs     | Vaciar tanque, cepillar paredes interiores, enjuagar y desinfectar con lavandina diluida. Dejar secar antes de llenar.        |
| 5   | Detección de pérdidas ocultas                     | Prueba     | Propietario | Media     | Trimestral  | 10 min   | Cerrar todas las canillas y verificar que el medidor de agua no se mueva durante 30 minutos. Si se mueve, hay pérdida oculta. |
| 6   | Verificación de termotanque y ánodo de sacrificio | Inspección | Recomendado | Media     | Anual       | 45 min   | Inspeccionar termotanque: pérdidas, corrosión externa, estado de ánodo de sacrificio. Reemplazar ánodo si corresponde.        |
| 7   | Mantenimiento de cámara séptica                   | Limpieza   | Obligatorio | Alta      | Cada 2 años | 2 hs     | Vaciado y limpieza de cámara séptica por servicio especializado. Verificar estado de la cámara y conexiones.                  |

### 23.5 Gas y Calefacción 🔥

| #   | Tarea                                  | Tipo       | Profesional | Prioridad | Frecuencia  | Duración | Descripción técnica                                                                                                                 |
| --- | -------------------------------------- | ---------- | ----------- | --------- | ----------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Revisión de artefactos de gas          | Inspección | Obligatorio | Urgente   | Anual       | 1 h      | Revisión de todos los artefactos de gas por gasista matriculado. Verificar conexiones, ventilación y estado de quemadores.          |
| 2   | Control de llama piloto y quemadores   | Inspección | Propietario | Alta      | Trimestral  | 10 min   | Verificar que la llama de pilotos y quemadores sea azul y estable. Llama amarilla o irregular indica problema.                      |
| 3   | Prueba de monóxido de carbono          | Prueba     | Obligatorio | Urgente   | Anual       | 45 min   | Medición de niveles de CO con detector certificado. Verificar ventilación de ambientes con artefactos de gas.                       |
| 4   | Limpieza de conductos de ventilación   | Limpieza   | Recomendado | Alta      | Anual       | 45 min   | Limpiar conductos de ventilación de cocina y baño. Verificar tiraje de calefones y estufas.                                         |
| 5   | Service de caldera/calefón             | Ajuste     | Obligatorio | Alta      | Anual       | 1.5 hs   | Service completo de caldera o calefón por técnico matriculado. Incluye limpieza de quemadores, verificación de tiraje y regulación. |
| 6   | Revisión periódica obligatoria NAG-226 | Evaluación | Obligatorio | Urgente   | Cada 2 años | 1.5 hs   | Revisión reglamentaria obligatoria de instalación de gas según NAG-226. Emisión de oblea de aprobación.                             |

### 23.6 Aberturas 🚪

| #   | Tarea                                | Tipo        | Profesional | Prioridad | Frecuencia  | Duración | Descripción técnica                                                                                           |
| --- | ------------------------------------ | ----------- | ----------- | --------- | ----------- | -------- | ------------------------------------------------------------------------------------------------------------- |
| 1   | Lubricación de bisagras y cerraduras | Lubricación | Propietario | Baja      | Semestral   | 30 min   | Aplicar lubricante en aerosol en todas las bisagras de puertas y ventanas. Lubricar cerraduras con grafito.   |
| 2   | Ajuste de burletes y sellados        | Ajuste      | Propietario | Media     | Anual       | 1 h      | Verificar estado de burletes en puertas y ventanas. Reemplazar los deteriorados. Sellar filtraciones de aire. |
| 3   | Inspección de marcos y premarcos     | Inspección  | Propietario | Media     | Anual       | 30 min   | Revisar marcos de puertas y ventanas buscando deformaciones, humedad o deterioro del material.                |
| 4   | Control de vidrios y masillas        | Inspección  | Propietario | Media     | Anual       | 20 min   | Verificar estado de vidrios (rajaduras, sellos) y masillas de fijación. Reemplazar masillas deterioradas.     |
| 5   | Tratamiento de marcos de madera      | Tratamiento | Propietario | Media     | Cada 2 años | 2 hs     | Lijar, tratar con fungicida/insecticida y aplicar barniz o pintura protectora en marcos de madera.            |

### 23.7 Pintura y Revestimientos 🎨

| #   | Tarea                                  | Tipo        | Profesional | Prioridad | Frecuencia      | Duración | Descripción técnica                                                                                               |
| --- | -------------------------------------- | ----------- | ----------- | --------- | --------------- | -------- | ----------------------------------------------------------------------------------------------------------------- |
| 1   | Inspección de pintura exterior         | Inspección  | Propietario | Media     | Anual           | 30 min   | Revisar estado de pintura en fachadas y muros exteriores. Buscar descascaramiento, ampollas o cambios de color.   |
| 2   | Control de humedad en muros interiores | Inspección  | Propietario | Alta      | Semestral       | 20 min   | Revisar muros interiores buscando manchas de humedad, moho o eflorescencias. Especial atención en baños y cocina. |
| 3   | Tratamiento anti-humedad               | Tratamiento | Recomendado | Alta      | Según detección | 2 hs     | Tratar manchas de humedad con producto anti-hongo. Aplicar sellador o pintura anti-humedad según corresponda.     |
| 4   | Inspección de revestimientos cerámicos | Inspección  | Propietario | Media     | Anual           | 20 min   | Golpear suavemente cerámicos buscando piezas huecas o sueltas. Verificar estado de pastina en juntas.             |
| 5   | Sellado de juntas en áreas húmedas     | Sellado     | Propietario | Media     | Anual           | 45 min   | Verificar y renovar sellado de silicona en juntas de bañera, ducha, mesada y backsplash.                          |

### 23.8 Jardín y Exteriores 🌳

| #   | Tarea                                    | Tipo       | Profesional | Prioridad | Frecuencia | Duración | Descripción técnica                                                                                               |
| --- | ---------------------------------------- | ---------- | ----------- | --------- | ---------- | -------- | ----------------------------------------------------------------------------------------------------------------- |
| 1   | Inspección de veredas y senderos         | Inspección | Propietario | Media     | Semestral  | 20 min   | Verificar estado de veredas: hundimientos, grietas, desniveles que puedan causar tropiezos o acumulación de agua. |
| 2   | Control de medianeras y cercos           | Inspección | Propietario | Media     | Anual      | 30 min   | Revisar estado de medianeras: fisuras, inclinaciones, humedad. Verificar cercos perimetrales.                     |
| 3   | Limpieza de desagües exteriores          | Limpieza   | Propietario | Alta      | Trimestral | 30 min   | Limpiar rejillas de piso exteriores, canaletas de garage y desagües perimetrales. Verificar pendientes.           |
| 4   | Control de pileta de natación            | Inspección | Propietario | Media     | Mensual    | 30 min   | Verificar pH y cloro del agua, estado del filtro, limpieza de bordes y sistema de recirculación.                  |
| 5   | Poda de árboles cercanos a la estructura | Ajuste     | Recomendado | Media     | Anual      | 2 hs     | Podar ramas que estén en contacto o cerca de techos, cableado o muros. Verificar raíces cerca de fundaciones.     |

### 23.9 Climatización ❄️

| #   | Tarea                                     | Tipo       | Profesional | Prioridad | Frecuencia  | Duración | Descripción técnica                                                                                                      |
| --- | ----------------------------------------- | ---------- | ----------- | --------- | ----------- | -------- | ------------------------------------------------------------------------------------------------------------------------ |
| 1   | Limpieza de filtros de aire acondicionado | Limpieza   | Propietario | Alta      | Trimestral  | 20 min   | Retirar y lavar filtros de unidades interiores con agua y jabón neutro. Dejar secar completamente antes de reinstalar.   |
| 2   | Service de aire acondicionado             | Ajuste     | Obligatorio | Alta      | Anual       | 1.5 hs   | Service completo por técnico: limpieza de serpentinas, verificación de gas refrigerante, control eléctrico y de drenaje. |
| 3   | Inspección de unidad exterior             | Inspección | Propietario | Media     | Semestral   | 15 min   | Verificar que la unidad exterior esté limpia, sin obstrucciones y con espacio suficiente para ventilación.               |
| 4   | Control de ventilación natural            | Inspección | Propietario | Alta      | Semestral   | 10 min   | Verificar que todas las aberturas de ventilación estén libres de obstrucciones. Especial atención en ambientes con gas.  |
| 5   | Evaluación de aislación térmica           | Evaluación | Recomendado | Baja      | Cada 3 años | 2 hs     | Evaluar aislación térmica de techos y muros expuestos. Considerar mejoras para eficiencia energética.                    |

### 23.10 Humedad e Impermeabilización 💧

| #   | Tarea                                                  | Tipo       | Profesional | Prioridad | Frecuencia | Duración | Descripción técnica                                                                                                     |
| --- | ------------------------------------------------------ | ---------- | ----------- | --------- | ---------- | -------- | ----------------------------------------------------------------------------------------------------------------------- |
| 1   | Inspección de manchas y eflorescencias                 | Inspección | Propietario | Alta      | Semestral  | 30 min   | Buscar manchas blancas (eflorescencias) en muros que indican presencia de humedad. Fotografiar para comparación futura. |
| 2   | Control de muros enterrados y subsuelos                | Inspección | Recomendado | Alta      | Anual      | 1 h      | Inspeccionar muros en contacto con suelo buscando filtraciones, manchas o eflorescencias. Verificar impermeabilización. |
| 3   | Verificación de impermeabilización en baños y cocina   | Inspección | Propietario | Media     | Anual      | 30 min   | Revisar posibles filtraciones debajo de bañeras, duchas y mesadas. Verificar sellados perimetrales.                     |
| 4   | Control de ventilación para prevención de condensación | Inspección | Propietario | Media     | Semestral  | 20 min   | Verificar que los ambientes tengan ventilación adecuada. Buscar signos de condensación en vidrios y muros fríos.        |

### 23.11 Seguridad contra Incendio 🧯

| #   | Tarea                                                     | Tipo       | Profesional | Prioridad | Frecuencia | Duración | Descripción técnica                                                                                                        |
| --- | --------------------------------------------------------- | ---------- | ----------- | --------- | ---------- | -------- | -------------------------------------------------------------------------------------------------------------------------- |
| 1   | Verificación de detectores de humo                        | Prueba     | Propietario | Alta      | Mensual    | 10 min   | Presionar botón de test de cada detector de humo. Verificar que suene la alarma. Reemplazar baterías si es necesario.      |
| 2   | Control y recarga de matafuegos                           | Inspección | Obligatorio | Alta      | Anual      | 30 min   | Verificar fecha de vencimiento y presión de matafuegos. Enviar a recargar si corresponde. Servicio por empresa habilitada. |
| 3   | Revisión de instalación eléctrica como fuente de ignición | Inspección | Recomendado | Alta      | Anual      | 45 min   | Buscar cables deteriorados, empalmes precarios o sobrecargas en circuitos. Verificar protecciones térmicas.                |

### 23.12 Control de Plagas 🐛

| #   | Tarea                                    | Tipo        | Profesional | Prioridad | Frecuencia | Duración | Descripción técnica                                                                                                       |
| --- | ---------------------------------------- | ----------- | ----------- | --------- | ---------- | -------- | ------------------------------------------------------------------------------------------------------------------------- |
| 1   | Inspección general de indicios de plagas | Inspección  | Propietario | Media     | Trimestral | 30 min   | Buscar indicios de roedores (excrementos, marcas), termitas (aserrín, alas), u otros insectos en zonas húmedas y oscuras. |
| 2   | Control preventivo de termitas           | Inspección  | Recomendado | Alta      | Anual      | 1 h      | Inspeccionar marcos de madera, muebles de madera y estructuras buscando galerías o aserrín de termitas.                   |
| 3   | Desinsectación preventiva                | Tratamiento | Obligatorio | Media     | Semestral  | 1.5 hs   | Aplicación de insecticida por empresa habilitada en perímetro exterior y zonas críticas interiores.                       |
| 4   | Desratización preventiva                 | Tratamiento | Obligatorio | Media     | Semestral  | 1 h      | Colocación y control de cebaderos por empresa habilitada en puntos estratégicos del perímetro.                            |

### 23.13 Pisos y Contrapisos 🧱

| #   | Tarea                                    | Tipo       | Profesional | Prioridad | Frecuencia  | Duración | Descripción técnica                                                                                          |
| --- | ---------------------------------------- | ---------- | ----------- | --------- | ----------- | -------- | ------------------------------------------------------------------------------------------------------------ |
| 1   | Inspección general de pisos              | Inspección | Propietario | Media     | Anual       | 30 min   | Verificar estado general de pisos: baldosas sueltas, grietas, desniveles, desgaste. Golpear buscando huecos. |
| 2   | Verificación de contrapiso y nivelación  | Inspección | Recomendado | Media     | Cada 2 años | 45 min   | Evaluar nivelación de pisos con nivel. Buscar hundimientos que indiquen problemas de contrapiso o cimientos. |
| 3   | Sellado de juntas de dilatación en pisos | Sellado    | Propietario | Baja      | Cada 2 años | 45 min   | Verificar y renovar material de sellado en juntas de dilatación de pisos de grandes superficies.             |

### 23.14 Mobiliario y Equipamiento Fijo 🪑

| #   | Tarea                                       | Tipo       | Profesional | Prioridad | Frecuencia | Duración | Descripción técnica                                                                                     |
| --- | ------------------------------------------- | ---------- | ----------- | --------- | ---------- | -------- | ------------------------------------------------------------------------------------------------------- |
| 1   | Inspección de alacenas y bajo-mesadas       | Inspección | Propietario | Media     | Anual      | 20 min   | Verificar estado de bisagras, correderas y estructura. Buscar signos de humedad o plagas en interiores. |
| 2   | Inspección de mesada y bacha                | Inspección | Propietario | Media     | Anual      | 15 min   | Verificar sellado entre mesada y pared, estado de bacha y sifón. Buscar pérdidas.                       |
| 3   | Limpieza de filtros de extractor de cocina  | Limpieza   | Propietario | Media     | Trimestral | 20 min   | Retirar filtros del extractor, desengrasar con agua caliente y detergente. Verificar motor y conducto.  |
| 4   | Inspección de campana extractora            | Inspección | Propietario | Baja      | Anual      | 15 min   | Verificar funcionamiento del motor, iluminación y estado del conducto de extracción.                    |
| 5   | Inspección de mueble de baño/vanitory       | Inspección | Propietario | Media     | Anual      | 15 min   | Revisar estado del mueble: humedad en base, estado de bisagras y estado del sifón visible.              |
| 6   | Control de mecanismo de descarga de inodoro | Inspección | Propietario | Media     | Anual      | 10 min   | Verificar que el mecanismo de descarga funcione correctamente y no haya pérdida continua de agua.       |
| 7   | Verificación de fijación de sanitarios      | Inspección | Propietario | Baja      | Anual      | 10 min   | Verificar que inodoro, bidé y lavatorio estén firmemente fijados. Apretar bulones si hay movimiento.    |
| 8   | Control de conexiones de lavarropas         | Inspección | Propietario | Media     | Anual      | 10 min   | Verificar estado de mangueras de ingreso y desagüe. Buscar pérdidas, grietas o aplastamientos.          |

---

## Resumen de frecuencias mínimas

| Frecuencia          | Tareas    | Ejemplos clave                                          |
| ------------------- | --------- | ------------------------------------------------------- |
| **Mensual**         | 3 tareas  | Test disyuntor, detectores de humo, pileta              |
| **Trimestral**      | 8 tareas  | Canaletas, sifones, filtros A/C, llama piloto, plagas   |
| **Semestral**       | 14 tareas | Membrana, canillas, humedad, tanque agua, exteriores    |
| **Anual**           | 40 tareas | La mayoría de inspecciones y services anuales           |
| **Cada 2 años**     | 8 tareas  | Fundaciones, impermeabilizante, NAG-226, cámara séptica |
| **Cada 3 años**     | 2 tareas  | Revisión eléctrica completa, aislación térmica          |
| **Cada 5 años**     | 1 tarea   | Evaluación estructural integral                         |
| **Cada 10 años**    | 1 tarea   | Reemplazo de membrana asfáltica                         |
| **Según detección** | 4 tareas  | Reparación de fisuras, filtraciones, humedad, plagas    |

**Total: 81 tareas predefinidas en 14 categorías**

---

_Documento generado a partir del código fuente del sistema EPDE. Para modificaciones a las plantillas, usar el módulo Categorías y Plantillas del panel de administración._
