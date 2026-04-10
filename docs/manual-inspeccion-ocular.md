# Manual de inspección ocular — EPDE

Guía operativa para la arquitecta. Cubre desde que llegás a la vivienda hasta que el cliente tiene su plan activo.

---

## Resumen del proceso

1. Preparación antes de ir
2. Recorrido por la vivienda (inspección visual)
3. Carga de datos en el sistema (tab Inspección → Iniciar inspección)
4. Evaluación de cada item usando las guías estructuradas (OK / Necesita atención / Requiere profesional)
5. Generación del plan desde la inspección completada (botón "Generar Plan")
6. Revisión, activación y entrega al cliente

> **Nota:** El plan de mantenimiento **no se crea manualmente** — se genera automáticamente a partir de la inspección completada. Los items de inspección se generan desde los TaskTemplates del sistema, filtrados por los sectores activos de la propiedad. Al completar la inspección, el sistema genera el plan con prioridades ajustadas según los hallazgos y el Risk Score.

---

## 1. Preparación antes de ir

Antes de salir a la vivienda:

- Verificar que la propiedad esté creada en el sistema (dirección, tipo, m², año de construcción)
- Verificar que los **sectores activos** estén correctamente configurados (desactivar los que no aplican)
- Llevar: cinta métrica, linterna, cámara/celular para fotos, anotador o tablet con acceso al sistema
- Pedirle al propietario acceso a todos los sectores: techo, terraza, sótano, tablero eléctrico, tanque de agua

> **Importante:** Ya no es necesario crear el plan de mantenimiento previamente. El plan se genera automáticamente al completar la inspección.

---

## 2. Recorrido por la vivienda

La inspección se hace sector por sector, en este orden recomendado:

### 2.1 Exterior

- Estado de muros exteriores (fisuras, manchas de humedad, descascaramiento)
- Revestimientos y pintura exterior
- Juntas de dilatación
- Desagües pluviales y canaletas visibles desde abajo
- Veredas perimetrales (pendientes, fisuras)

### 2.2 Techo

- Estado de la cubierta (tejas, membrana, chapa)
- Canaletas y bajadas pluviales
- Babetas y encuentros con muros
- Ventilaciones
- Manchas o acumulación de agua

### 2.3 Terraza (si aplica)

- Estado de la membrana o impermeabilización
- Pendientes y desagües
- Barandas y bordes
- Fisuras en solado

### 2.4 Interior

- Paredes y cielorrasos (manchas, fisuras, humedad)
- Pisos (nivelación, fisuras, juntas)
- Aberturas (estado, sellado, funcionamiento)
- Ventilación natural

### 2.5 Cocina

- Estado de grifería y conexiones de agua
- Desagües (flujo, pérdidas)
- Conexión de gas (flexible, llave de paso)
- Revestimientos y sellados en mesada
- Ventilación y extracción

### 2.6 Baño

- Grifería y conexiones
- Desagües y sifones
- Sellado de bañera/ducha
- Ventilación
- Estado de revestimientos y juntas

### 2.7 Sótano / Cimientos (si accesible)

- Humedad ascendente
- Estado de fundaciones visibles
- Ventilación del subsuelo
- Instalaciones visibles (cañerías, cables)

### 2.8 Jardín / Perímetro

- Árboles cerca de muros o cañerías
- Pendientes del terreno (escurrimiento de agua)
- Cercos y medianeras
- Accesos y veredas

### 2.9 Instalaciones

- **Eléctrica:** tablero general, térmicas, diferencial, puesta a tierra, estado de cables visibles
- **Sanitaria:** estado de cañerías visibles, llaves de paso, tanque de agua, termotanque
- **Gas:** estado de artefactos, ventilaciones reglamentarias, flexible, llave de corte

---

## 3. Carga de la inspección en el sistema

### 3.0 Flujo en la app

1. Entrar a la propiedad → tab **"Inspección"** → **"Iniciar inspección"**
2. El sistema genera los 152 items organizados en **secciones colapsables por sector**
3. Recorrer cada sector evaluando item por item
4. Cada item tiene un botón con **ícono de ojo** que abre la **guía estructurada de inspección**:
   - **Tarjetas de evaluación:** criterios claros para cada resultado (OK / Necesita atención / Requiere profesional)
   - **Pasos del procedimiento:** qué revisar exactamente y cómo hacerlo
   - **Referencias normativas:** cuando aplica (NAG-226, reglamentaciones eléctricas, etc.)
5. Para cada item marcar el resultado y agregar descripción/foto si hay hallazgos
6. Cuando el 100% de los items están evaluados → **"Generar Plan"**
7. El sistema crea el plan de mantenimiento con prioridades ajustadas según el Risk Score

### Criterio para ajustar las tareas generadas

Después de generar el plan desde la inspección, revisás las tareas creadas y ajustás lo que haga falta. Para cada tarea, verificar estos 4 campos clave:

### 3.1 Prioridad

| Prioridad   | Cuándo usarla                                                                       | Ejemplo                                                                          |
| ----------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **Urgente** | Riesgo para la seguridad o el daño se agrava cada día. Hay que actuar ya.           | Pérdida de gas, cable pelado expuesto, filtración activa en techo                |
| **Alta**    | Problema serio que puede empeorar en semanas/meses si no se atiende.                | Humedad ascendente en muro, diferencial que salta, membrana de terraza agrietada |
| **Media**   | Mantenimiento regular necesario pero sin riesgo inmediato. Es el valor por defecto. | Limpieza de canaletas, revisión de grifería, sellado de juntas                   |
| **Baja**    | Mejoras opcionales o controles de rutina de bajo impacto.                           | Pintura interior, ajuste de bisagras, limpieza de rejillas de ventilación        |

**Regla práctica:** si te preguntás "¿qué pasa si no se hace en 30 días?" y la respuesta es "se rompe algo" → Alta o Urgente. Si la respuesta es "nada grave" → Media o Baja.

### 3.2 Recurrencia

| Tipo              | Cada cuánto    | Cuándo usarla                                                                |
| ----------------- | -------------- | ---------------------------------------------------------------------------- |
| **Mensual**       | 1 mes          | Controles frecuentes: filtros de aire, limpieza de rejillas                  |
| **Trimestral**    | 3 meses        | Revisiones periódicas: canaletas, desagües, jardín                           |
| **Semestral**     | 6 meses        | Controles estacionales: impermeabilización antes de invierno/verano          |
| **Anual**         | 12 meses       | El más común. Revisiones generales de instalaciones, estructura, pintura     |
| **Personalizado** | 1-120 meses    | Cuando ningún estándar aplica. Ej: revisión de tanque cada 2 años (24 meses) |
| **Por detección** | Sin fecha fija | Problemas puntuales que se resuelven una vez. Ej: reparar fisura detectada   |

### 3.3 Tipo de tarea

Elegir el que mejor describe la acción:

- **Inspección** — Mirar y evaluar estado (el más usado en el diagnóstico inicial)
- **Limpieza** — Limpiar componentes (canaletas, filtros, rejillas)
- **Prueba** — Verificar funcionamiento (probar térmicas, probar desagües)
- **Tratamiento** — Aplicar producto (antihumedad, impermeabilizante, protector)
- **Sellado** — Sellar juntas, fisuras menores, encuentros
- **Lubricación** — Bisagras, cerraduras, mecanismos
- **Ajuste** — Regulación de componentes (presión de agua, tensión de cables)
- **Medición** — Tomar valores (humedad, nivel, temperatura)
- **Evaluación** — Análisis profesional para definir intervención mayor

### 3.4 Quién lo hace

- **Lo puede hacer el propietario** — Tareas simples: limpiar canaletas, revisar grifería, ajustar bisagras
- **Profesional recomendado** — Conviene un técnico pero no es obligatorio: sellado de terraza, revisión de tanque
- **Profesional obligatorio** — Solo un matriculado: instalación eléctrica, gas, intervención estructural

---

## 4. Cómo organizar los tiempos

### 4.1 Lo urgente primero

Si durante la inspección encontrás algo que requiere acción inmediata:

1. Cargar la tarea como **prioridad Urgente** y **recurrencia Por detección**
2. Avisar al propietario en el momento — no esperar a entregar el informe
3. Si corresponde, crear una **solicitud de servicio** desde la tarea
4. Documentar con foto

### 4.2 Criterio para asignar fechas de vencimiento

La fecha de vencimiento (nextDueDate) es cuándo la tarea debería estar hecha:

| Situación                              | Fecha sugerida                               |
| -------------------------------------- | -------------------------------------------- |
| Urgente / riesgo activo                | Dentro de 7 días                             |
| Alta prioridad, sin riesgo inmediato   | Dentro de 30 días                            |
| Media prioridad, mantenimiento regular | Según la recurrencia (próximo ciclo)         |
| Baja prioridad, mejora opcional        | 3-6 meses                                    |
| Por detección (problema puntual)       | No lleva fecha — se activa cuando se detecta |

### 4.3 Distribución en el calendario

No poner todas las tareas con la misma fecha. Distribuirlas para que el propietario no tenga 15 tareas venciendo el mismo mes:

- **Mes 1-2:** Tareas urgentes y de alta prioridad
- **Mes 3-4:** Tareas de media prioridad relacionadas con la temporada que viene
- **Mes 5-6:** Tareas de baja prioridad y mejoras opcionales
- Dejar las tareas recurrentes espaciadas a lo largo del año

---

## 5. Carga en el sistema paso a paso

### Paso 1 — Realizar la inspección

1. Entrar a la propiedad → tab **"Inspección"** → **"Iniciar inspección"**
2. Evaluar todos los items sector por sector, usando las guías estructuradas cuando sea necesario
3. Registrar hallazgos con descripción y foto
4. Cuando el 100% esté completo → **"Generar Plan"**

### Paso 2 — Revisar las tareas generadas

El sistema crea las tareas con prioridades basadas en el Risk Score. Para cada tarea:

- Verificar que la **prioridad** refleje lo que viste (subir si encontraste deterioro, bajar si está todo bien)
- Verificar el **sector** asignado
- Poner la **fecha de vencimiento** según el criterio de arriba
- Completar la **descripción técnica** si hay algo específico de esta vivienda (ej: "la canaleta del lateral derecho tiene pendiente invertida")
- Marcar si **requiere profesional**
- Agregar **duración estimada** si es relevante

### Paso 3 — Agregar tareas adicionales

Las tareas generadas desde la inspección cubren lo detectado. Opcionalmente agregar:

- Tareas desde **plantillas de categoría** para cubrir mantenimiento estándar no incluido
- Tareas manuales para particularidades de la vivienda (ej: pileta, bomba presurizadora)
- Problemas puntuales que requieran seguimiento (recurrencia: Por detección)

### Paso 4 — Revisar el plan completo

Antes de activar, verificar:

- [ ] Todos los sectores de la vivienda tienen al menos una tarea asignada
- [ ] Las prioridades reflejan lo visto en la inspección
- [ ] Las fechas están distribuidas y no todas caen el mismo mes
- [ ] Las tareas urgentes tienen fecha dentro de los próximos 7 días
- [ ] Las tareas que requieren profesional están marcadas correctamente
- [ ] Las descripciones técnicas son claras para alguien que no es profesional

### Paso 5 — Activar el plan

Cambiar el estado del plan de **Borrador** a **Activo**. A partir de ese momento:

- El cliente puede ver su dashboard con el puntaje ISV
- Las tareas empiezan a generar recordatorios automáticos
- El sistema calcula el ISV mensualmente

---

## 6. Cómo se calcula el puntaje ISV

El ISV (Índice de Salud de la Vivienda) es un número de 0 a 100 que se calcula con 4 dimensiones:

| Dimensión        | Peso | Qué mide                                                                                       |
| ---------------- | ---- | ---------------------------------------------------------------------------------------------- |
| **Cumplimiento** | 35%  | ¿Las tareas se hacen a tiempo? Las urgentes pesan 4x más que las bajas                         |
| **Estado**       | 30%  | ¿En qué condición se encuentra lo inspeccionado? Sale de lo que se reporta al completar tareas |
| **Cobertura**    | 20%  | ¿Se están revisando todos los sectores de la casa?                                             |
| **Inversión**    | 15%  | ¿Se hace más prevención que reparación?                                                        |

**Rangos:**

- 80-100: Excelente
- 60-79: Bueno
- 40-59: Regular
- 20-39: Necesita atención
- 0-19: Crítico

**Dato clave para la carga:** como el Cumplimiento pesa 35% y las tareas urgentes/altas pesan más, es importante que las prioridades estén bien asignadas. Una tarea marcada como Urgente que se vence baja mucho más el puntaje que una Baja.

---

## 7. Después de la activación

- El propietario recibe acceso al sistema y ve su dashboard
- Las tareas con fecha próxima generan notificaciones automáticas
- Cuando el propietario completa una tarea, reporta el estado encontrado → eso alimenta el ISV
- Si reporta estado "Malo" o "Crítico", el sistema alerta y sugiere solicitar servicio
- El ISV se recalcula mensualmente y queda el histórico para ver la evolución

---

## Resumen rápido

```
Llegar → Recorrer sector por sector → Anotar hallazgos
  ↓
Tab Inspección → Evaluar items con guías → Registrar hallazgos
  ↓
100% completo → Generar Plan → Ajustar tareas → Agregar extras
  ↓
Revisar todo → Activar plan → El cliente tiene su dashboard
```
