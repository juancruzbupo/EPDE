# Prompt de Auditoría Arquitectónica — EPDE

> **Uso**: Decile a Claude "lee `docs/audit-prompt.md` y ejecuta la auditoría".
> No hace falta copiar/pegar este prompt cada vez.

---

## Objetivo

Evaluar si el proyecto:

- Sigue patrones de diseño de forma consistente
- Tiene una estructura clara y sostenible
- Evita drift arquitectónico
- Mantiene separación de responsabilidades real
- Es mantenible por un equipo de 5+ devs sin caos
- Es coherente entre backend, web y mobile
- Tiene decisiones bien justificadas o si hay sobreingeniería

## Contexto

Leer `docs/monorepo-completo.md` y `docs/ai-development-guide.md` como referencia de la arquitectura documentada. Contrastar contra el código real.

---

## Áreas de Auditoría Obligatorias

### 1. Estructura del Monorepo

Evaluar:

- ¿La división apps/packages está bien planteada?
- ¿@epde/shared es realmente SSoT o hay duplicación conceptual?
- ¿Hay riesgo de acoplamiento entre apps?
- ¿El árbol de carpetas es intuitivo o creció orgánicamente?
- ¿La organización por feature en backend es realmente modular?
- ¿La estructura permite escalar sin refactors masivos?

Detectar: Inconsistencias, carpetas ambiguas, responsabilidades mezcladas, convenciones no respetadas.

### 2. Backend — Seguimiento de Patrones

**Repository Pattern**:

- ¿Está correctamente aplicado o es un wrapper innecesario?
- ¿BaseRepository es demasiado genérico?
- ¿Hay riesgo de que los servicios filtren lógica de datos?
- ¿El soft delete extension rompe el principio de sorpresa?
- ¿La paginación cursor-based está bien encapsulada?

**Module Pattern**:

- ¿Todos los módulos siguen exactamente la misma estructura?
- ¿Hay excepciones? ¿Hay features con responsabilidades difusas?

**Guards & Decorators**:

- ¿La composición de guards es consistente?
- ¿@Public, @Roles y @CurrentUser están bien definidos o son frágiles?
- ¿Hay endpoints con reglas implícitas poco claras?

**Eventos y Queues**:

- ¿El uso de EventEmitter + BullMQ está bien delimitado?
- ¿Se mezclan responsabilidades síncronas y asíncronas?
- ¿La arquitectura event-driven está bien pensada o solo agregada?

### 3. Frontend Web — Arquitectura y Coherencia

Evaluar:

- ¿App Router está bien estructurado o hay mezcla de concerns?
- ¿Los hooks están correctamente desacoplados?
- ¿La separación entre React Query y Zustand es limpia?
- ¿El api-client está correctamente encapsulado?
- ¿DataTable es una buena abstracción o está sobrecargada?
- ¿Los style-maps son mantenibles o frágiles?

Detectar: Acoplamientos ocultos, inconsistencias de naming, repetición innecesaria, posibles anti-patterns.

### 4. Mobile — Consistencia con Web

Evaluar:

- ¿La arquitectura replica patrones correctamente o hay divergencia?
- ¿El manejo de tokens es consistente?
- ¿Los hooks siguen la misma filosofía que web?
- ¿Hay duplicación que debería estar en shared?
- ¿NativeWind respeta el design system o se desvió?

### 5. Shared Package — Single Source of Truth Real

Evaluar:

- ¿Zod como SSoT está bien implementado?
- ¿Hay riesgo de drift entre Prisma schema y Zod schemas?
- ¿Los tipos están bien organizados?
- ¿Los re-exports son claros o generan confusión?
- ¿El dual build ESM/CJS está correctamente planteado?

### 6. Design System — Consistencia Real

Evaluar:

- ¿Los tokens están bien definidos?
- ¿Hay riesgo de inconsistencias entre web y mobile?
- ¿Dark mode está bien pensado o es superficial?
- ¿Las variantes de Badge están bien centralizadas?
- ¿Hay hardcoded colors fuera del sistema?
- ¿Los patrones UI están realmente documentados o implícitos?

Detectar: Drift visual potencial, duplicación de estilos, falta de abstracciones.

### 7. Convenciones y Naming

Evaluar:

- Consistencia de kebab-case, PascalCase, SCREAMING_SNAKE
- Naming semántico o técnico
- Convenciones realmente respetadas
- ¿Hay mezcla de español/inglés problemática?
- ¿Los imports siguen orden consistente?

### 8. Testing Strategy

Evaluar:

- ¿Hay cobertura coherente entre capas?
- ¿Los tests siguen patrones?
- ¿E2E están bien ubicados?
- ¿Falta testing crítico?
- ¿Hay tests frágiles?

---

## Formato de Respuesta Obligatorio

### 🔥 Resumen Ejecutivo

Breve diagnóstico general del nivel de madurez del proyecto.

### 🟢 Buenas Prácticas Sólidas

Qué está bien implementado y es consistente.

### 🟡 Puntos de Mejora (Riesgo Medio)

Para cada punto: **Problema** — **Por qué importa** — **Recomendación concreta** (archivo + línea si aplica).

### 🔴 Puntos Críticos

Para cada punto: **Problema estructural** — **Impacto a mediano plazo** — **Cómo corregirlo**.

### 🧱 Inconsistencias Detectadas

Lista concreta: `#`, inconsistencia, ubicación, severidad.

### 🧠 Riesgo de Drift Arquitectónico

¿En qué partes el sistema podría desordenarse con más features?

### 📈 Recomendaciones Estratégicas

Qué harías como Staff Engineer para: fortalecer coherencia, reducir fragilidad, simplificar sobreingeniería, documentar mejor.

### 📊 Evaluación Final (1–10)

- Coherencia estructural
- Seguimiento de patrones
- Mantenibilidad
- Claridad arquitectónica

---

## Reglas

- No explicaciones genéricas
- No teoría de libro
- No respuestas tipo blog
- Análisis aplicado a ESTE proyecto
- Si algo es excelente, decilo
- Si algo está mal diseñado, decilo
- Citar archivos y líneas específicas cuando se detecte un problema
