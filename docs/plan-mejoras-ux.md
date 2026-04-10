# Plan de implementación — Mejoras UX competitivas

9 mejoras priorizadas por impacto y esfuerzo. Cada una con estado actual, qué hacer, y alcance técnico.

---

## Fase 1 — Rápidas (1-2 días cada una)

### 1. [x] Resumen semanal por email

**Estado actual:** IMPLEMENTADO. `weekly-summary.service.ts` envía email semanal via `EmailQueueService.enqueueWeeklySummary()`. Template `weeklySummary` en `EmailService`.

**Qué hacer:**

- Agregar un template de email en `EmailService` tipo `weeklySummary` con: nombre del cliente, ISV actual, cantidad de tareas pendientes, próxima tarea (nombre + fecha), streak
- Encolarlo en `EmailQueueService` desde el scheduler existente (ya tiene los datos calculados)
- Diseño simple: texto plano con un botón "Ver mi dashboard" que lleve al sistema
- Asunto: "Tu casa esta semana — ISV {score}, {n} tareas pendientes"

**Archivos a tocar:**

- `apps/api/src/email/email.service.ts` — nuevo método `sendWeeklySummaryEmail()`
- `apps/api/src/email/email-queue.processor.ts` — nuevo case `weeklySummary`
- `apps/api/src/email/email-queue.service.ts` — nuevo método `enqueueWeeklySummary()`
- `apps/api/src/scheduler/weekly-summary.service.ts` — agregar llamada al email además del push
- `packages/shared` — tipo `EmailJobData` agregar variante

**Impacto:** Ataca Gen X (canal preferido) y Boomers (no depende de app mobile). Refuerza el valor del sistema sin que el usuario tenga que entrar.

---

### 2. Tooltips en métricas del dashboard

**Estado actual:** El componente `Tooltip` existe y se usa en charts. No se usa en el ISV, stat cards ni health card.

**Qué hacer:**

- Agregar tooltips en el web dashboard:
  - ISV score → "Índice de Salud de la Vivienda. Mide el estado general de tu casa de 0 a 100."
  - Tareas vencidas → "Tareas que pasaron su fecha límite sin completarse."
  - Tareas pendientes → "Tareas programadas que todavía no se hicieron."
  - Completadas este mes → "Tareas que marcaste como completadas en los últimos 30 días."
  - Presupuestos pendientes → "Presupuestos solicitados que esperan cotización o aprobación."
  - Streak → "Meses consecutivos sin tareas vencidas."
- Ícono de `Info` (Lucide) pequeño al lado de cada label, hover muestra el tooltip
- Solo en web (en mobile no hay hover, el espacio es limitado)

**Archivos a tocar:**

- `apps/web/src/components/health-card.tsx` — wrappear labels con Tooltip
- `apps/web/src/app/(dashboard)/dashboard/` — stat cards si están separados

**Impacto:** Ataca Gen X (jerga técnica) y Boomers (no entienden las métricas). Costo mínimo.

---

### 3. [x] Streak y semana perfecta prominentes en mobile

**Estado actual:** IMPLEMENTADO. Componente `streak-card.tsx` en mobile con sección dedicada. Badges en `home-status-card.tsx`.

**Qué hacer:**

- Darles más protagonismo visual: sacarlos del health card y ponerlos como una sección propia debajo
- Card dedicada con:
  - Racha actual con ícono de fuego animado (pulse si streak > 0)
  - Semana perfecta con checkmark verde y mensaje de felicitación
  - Si streak = 0: mensaje motivacional ("Completá todas las tareas de este mes para empezar tu racha")
  - Historial breve: "Tu mejor racha: X meses" (si tenemos el dato) o simplemente el número actual más grande
- En web dashboard también: agregar los mismos datos al health card o como stat cards

**Archivos a tocar:**

- `apps/mobile/src/components/home-status-card.tsx` — extraer streak/perfectWeek a componente separado
- `apps/mobile/src/app/(tabs)/index.tsx` — renderizar la nueva sección
- `apps/web/src/components/health-card.tsx` — agregar streak/perfectWeek si no están
- Nuevo componente: `streak-card.tsx` (mobile) y/o sección en el dashboard web

**Impacto:** Ataca Millennials (gamificación visible). Genera engagement y retención.

---

## Fase 2 — Medianas (3-5 días cada una)

### 4. Formulario de completar tarea simplificado

**Estado actual:** 4 campos obligatorios (resultado, condición, ejecutor, acción tomada) + 4 opcionales (costo, nota, fecha, foto). Son 4-8 campos en un formulario.

**Qué hacer:**

- Modo rápido (por defecto): solo 2 campos
  - Condición encontrada (visual: 5 íconos con caras tipo emoji de Excelente a Crítico)
  - ¿Quién lo hizo? (3 botones: Yo / Profesional contratado / Profesional EPDE)
  - Los demás campos se infieren con defaults razonables:
    - Resultado: OK si condición es Excelente/Bueno, OK_CON_OBSERVACIONES si Regular, NECESITA_ATENCIÓN si Malo/Crítico
    - Acción tomada: INSPECCIÓN (default del tipo de tarea)
- Botón "Agregar más detalles" que expande el formulario completo (costo, nota, foto, acción tomada, resultado)
- En mobile: la selección de condición con íconos grandes tipo encuesta visual (cards tocables, no select)

**Archivos a tocar:**

- `apps/web/src/app/(dashboard)/properties/[id]/complete-task-dialog.tsx` — refactor a 2 modos
- `apps/mobile/src/components/complete-task-modal.tsx` — misma lógica
- Posiblemente nuevo componente: `condition-picker.tsx` con íconos visuales

**Impacto:** Ataca Boomers (formularios complejos) y Gen Z (quieren rapidez). Reduce fricción en la acción más importante del sistema.

---

### 5. Formulario de contacto en la landing

**Estado actual:** Solo hay links a WhatsApp. No existe formulario.

**Qué hacer:**

- Agregar formulario simple en la sección final CTA:
  - Nombre
  - Email o teléfono
  - Dirección de la vivienda (texto libre)
  - Botón "Solicitar diagnóstico"
- El submit manda un email a la casilla de EPDE (no necesita backend nuevo, puede usar el EmailService existente con un template `contactForm`)
- Mantener el botón de WhatsApp al lado como alternativa
- Texto: "Completá el formulario y te contactamos en 24hs, o si preferís escribinos directo por WhatsApp"

**Archivos a tocar:**

- `apps/web/src/components/landing/sections/final-cta.tsx` — agregar formulario
- `apps/web/src/app/api/contact/route.ts` — API route de Next.js para manejar el submit (o endpoint en la API NestJS)
- `apps/api/src/email/email.service.ts` — template `contactForm` si se usa el backend

**Impacto:** Ataca Millennials (no quieren hablar por teléfono/WhatsApp) y mejora conversión general. Captura leads que no se animan a escribir por WhatsApp.

---

### 6. Guía PDF de primer uso

**Estado actual:** No existe. El onboarding es solo una welcome card con 3 pasos.

**Qué hacer:**

- Armar un PDF de 4-6 páginas con capturas de pantalla:
  - Página 1: Qué es EPDE y qué vas a encontrar en el sistema
  - Página 2: Tu dashboard — qué significa cada número (ISV, tareas, streak)
  - Página 3: Cómo ver tus tareas y completarlas
  - Página 4: Cómo pedir un servicio o presupuesto
  - Página 5: La app en el celular — cómo instalarla y qué hacer
  - Página 6: Contacto y soporte
- Guardar en `public/guia-primer-uso.pdf`
- Linkearlo desde:
  - La welcome card del dashboard ("Descargá la guía de uso")
  - El email de invitación al cliente
  - La sección "Qué incluye" de la landing

**Archivos a tocar:**

- Crear el PDF (fuera del código, herramienta de diseño)
- `apps/web/public/guia-primer-uso.pdf` — archivo estático
- `apps/web/src/components/welcome-card.tsx` — agregar link de descarga
- `apps/api/src/email/email.service.ts` — agregar link en el email de invitación

**Impacto:** Ataca Boomers directamente. Un PDF es algo que pueden imprimir y tener al lado de la computadora. Reduce consultas de soporte.

---

## Fase 3 — Grandes (1-2 semanas cada una)

### 7. Onboarding interactivo con tour guiado

**Estado actual:** No existe. No hay librería de tours instalada.

**Qué hacer:**

- Instalar `react-joyride` en web (la más usada, 6k+ stars, buen soporte para React)
- Tour de 5 pasos en el primer login:
  1. Health card → "Este es el puntaje de salud de tu vivienda. Mientras más alto, mejor."
  2. Stat cards → "Acá ves cuántas tareas tenés pendientes y vencidas."
  3. Próximas tareas → "Estas son las tareas que vienen. Hacé click en una para ver el detalle."
  4. Sidebar → "Desde acá accedés a tus propiedades, presupuestos y servicios."
  5. Notificaciones → "Te avisamos cuando tengas algo que hacer. También te llegan por email."
- Guardar en localStorage si el tour se completó (no mostrarlo de nuevo)
- Botón "Ver tour de nuevo" en el perfil o en un ícono de ayuda
- En mobile: no usar tour (no funciona bien), en su lugar hacer un carrusel de 4 slides en el primer acceso

**Archivos a tocar:**

- `apps/web/package.json` — agregar `react-joyride`
- Nuevo componente: `apps/web/src/components/onboarding-tour.tsx`
- `apps/web/src/app/(dashboard)/dashboard/page.tsx` — renderizar tour condicionalmente
- `apps/mobile/src/components/onboarding-carousel.tsx` — nuevo componente
- `apps/mobile/src/app/(tabs)/index.tsx` — renderizar carrusel en primer acceso

**Impacto:** Ataca Millennials (onboarding pasivo) y Boomers (no entienden la app). Reduce la curva de aprendizaje y el abandono en la primera semana.

---

### 8. Notificaciones por WhatsApp

**Estado actual:** No hay integración con WhatsApp API. Solo links `wa.me/`.

**Qué hacer:**

- Integrar con la API de WhatsApp Business (vía Twilio o directamente con Meta)
- Mensajes a enviar por WhatsApp:
  - Recordatorio de tarea próxima a vencer (mismo trigger que el push actual)
  - Resumen semanal (complemento del email)
  - Presupuesto cotizado ("Tu presupuesto para X fue cotizado en $Y. Ingresá al sistema para aprobarlo.")
- El usuario elige en su perfil si quiere recibir por: email, push, WhatsApp, o combinación
- Requiere:
  - Cuenta de WhatsApp Business verificada
  - Templates de mensaje aprobados por Meta (proceso de 24-72hs)
  - Número de teléfono del cliente en el modelo de User (agregar campo `phone`)

**Archivos a tocar:**

- `packages/shared/src/types/entities/user.ts` — agregar campo `phone`
- `apps/api/prisma/schema.prisma` — migración para agregar `phone` a User
- Nuevo módulo: `apps/api/src/whatsapp/` (service, module)
- `apps/api/src/notifications/notifications-handler.service.ts` — agregar canal WhatsApp
- `apps/web/src/app/(dashboard)/profile/page.tsx` — preferencias de notificación
- `apps/mobile/src/app/(tabs)/profile.tsx` — preferencias de notificación

**Impacto:** Ataca Boomers (WhatsApp es su canal principal) y mejora engagement general. Argentina tiene penetración de WhatsApp del 95%+.

**Costo real:** Twilio WhatsApp cuesta ~USD 0.05 por mensaje. Con 10 clientes y 4 mensajes/semana = ~USD 8/mes. Meta directo es más barato pero más complejo de integrar.

---

### 9. Galería de fotos en el dashboard

**Estado actual:** Las fotos solo se ven en la pestaña "Fotos" del detalle de propiedad. No aparecen en el dashboard.

**Qué hacer:**

- Agregar sección "Estado visual" en el dashboard del cliente (debajo de las tareas próximas):
  - Últimas 4-6 fotos de la propiedad (de inspecciones y tareas completadas)
  - Cada foto con: fecha, tarea/servicio de origen, sector
  - Click abre la foto en grande con contexto
- En la propiedad: mejorar la galería existente con vista de grilla y posibilidad de comparar antes/después si hay fotos del mismo sector en distintas fechas
- En mobile: carrusel horizontal con las últimas fotos en el dashboard

**Archivos a tocar:**

- `apps/api/src/dashboard/dashboard.repository.ts` — query para últimas fotos de la propiedad del cliente
- `apps/api/src/dashboard/dashboard.controller.ts` — nuevo endpoint o agregar al stats existente
- Nuevo componente: `apps/web/src/components/recent-photos.tsx`
- `apps/web/src/app/(dashboard)/dashboard/page.tsx` — renderizar sección
- `apps/mobile/src/app/(tabs)/index.tsx` — carrusel de fotos

**Impacto:** Ataca Gen Z (contenido visual) y refuerza el valor para todas las generaciones. Ver fotos de tu casa con problemas detectados es más impactante que leer "condición: regular".

---

## Orden de ejecución recomendado

| #   | Mejora                                  | Esfuerzo        | Impacto  | Generaciones         |
| --- | --------------------------------------- | --------------- | -------- | -------------------- |
| 1   | Tooltips en dashboard                   | 1 día           | Alto     | Gen X, Boomers       |
| 2   | Streak prominente                       | 1-2 días        | Alto     | Millennials          |
| 3   | Resumen semanal por email               | 2 días          | Alto     | Gen X, Boomers       |
| 4   | Formulario completar tarea simplificado | 3 días          | Muy alto | Boomers, Gen Z       |
| 5   | Formulario contacto en landing          | 2 días          | Alto     | Millennials          |
| 6   | Guía PDF primer uso                     | 2 días (diseño) | Medio    | Boomers              |
| 7   | Onboarding tour                         | 4-5 días        | Alto     | Millennials, Boomers |
| 8   | Galería fotos dashboard                 | 5 días          | Medio    | Gen Z, todos         |
| 9   | WhatsApp notifications                  | 1-2 semanas     | Alto     | Boomers, todos       |

**Total estimado:** ~4-5 semanas de desarrollo si se hace secuencial.
Las primeras 3 se pueden hacer en una semana y ya generan impacto visible.
