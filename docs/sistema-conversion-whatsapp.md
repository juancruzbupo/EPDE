# Sistema de Conversión EPDE — WhatsApp + Seguimiento de Leads

> Guía operativa para convertir leads de la landing en diagnósticos agendados.
> Última actualización: marzo 2026.

---

## 1. Flujo completo: Landing → Diagnóstico agendado

```
Landing (CTA) → WhatsApp (mensaje prearmado) → Respuesta automática (inmediata)
     → Primera respuesta humana (< 15 min) → Conversación de calificación
     → Propuesta de fecha → Cierre → Diagnóstico agendado
```

**Regla de oro:** La venta se cierra conversando, no con la landing.

---

## 2. Mensaje prearmado (landing → WhatsApp)

El CTA de la landing abre WhatsApp con:

```
Hola, quiero saber cómo está mi casa y evitar problemas a futuro
```

Este mensaje ya está configurado en `landing-data.ts` → `WHATSAPP_URL`.

---

## 3. Respuesta automática (WhatsApp Business)

Configurar en **WhatsApp Business → Herramientas de negocio → Mensaje de bienvenida:**

```
¡Hola! 👋 Gracias por escribir a EPDE.

En un momento te cuento cómo funciona y vemos tu caso.

Mientras tanto: ¿tu vivienda es casa, dúplex o departamento?
```

**Por qué funciona:**

- Evita que el lead se enfríe (respuesta inmediata)
- Incluye una pregunta (mantiene la conversación activa)
- No habla de precio (evita objeciones prematuras)

**Configuración técnica:**

- Activar en WhatsApp Business → Configuración → Herramientas de negocio → Mensaje de bienvenida
- Horario: siempre activo
- Destinatarios: todos los que escriban por primera vez

---

## 4. Primera respuesta humana (< 15 minutos)

### Objetivo

Explicar valor, calificar el lead, NO hablar de precio todavía.

### Plantilla base

```
¡Hola [nombre]! Soy Noelia, arquitecta.

EPDE es un diagnóstico profesional donde evaluamos el estado real de tu vivienda
y detectamos problemas antes de que se vuelvan costosos.

No es una reparación: es un sistema que te dice qué tiene tu casa,
qué priorizar y cómo mantenerla bajo control.

¿Hace cuánto que no le hacen una revisión general a tu vivienda?
```

### Reglas

- **SIEMPRE** terminar con una pregunta
- **NUNCA** decir el precio en el primer mensaje
- **SIEMPRE** mencionar "evitar costos" o "detectar a tiempo"
- Adaptar según si dijo casa/dpto/dúplex en el automático

---

## 5. Conversación de calificación

### Preguntas clave (ir haciendo naturalmente)

| Pregunta                                     | Para qué sirve      |
| -------------------------------------------- | ------------------- |
| ¿Tu vivienda es casa, dúplex o departamento? | Tipo de propiedad   |
| ¿Hace cuánto la tienen?                      | Antigüedad / riesgo |
| ¿Notaron algún problema últimamente?         | Urgencia percibida  |
| ¿Tienen idea de los metros cuadrados?        | Cotización          |
| ¿La zona?                                    | Logística           |

### Respuestas a objeciones comunes

**"¿Cuánto sale?"**

```
El diagnóstico completo tiene un valor de $35.000, pago único.
Incluye la inspección, el ISV (índice de salud de tu vivienda),
plan de mantenimiento y acceso al sistema por 6 meses.

Es una inversión que puede evitarte problemas de cientos de miles
o millones más adelante.

¿Te queda mejor esta semana o la próxima para coordinar?
```

**"Lo voy a pensar"**

```
¡Dale, sin problema! Quedate tranquilo/a.

Te cuento algo que vemos seguido: muchos problemas en viviendas
empiezan siendo chicos y se vuelven caros por no detectarlos a tiempo.

Si querés avanzar más adelante, escribime sin compromiso. 👍
```

**"Es caro"**

```
Entiendo. Te pongo en contexto: una filtración no detectada a tiempo
puede terminar costando entre 2 y 6 millones en reparación.

El diagnóstico es justamente para evitar llegar a esos números.
Es una decisión simple hoy para evitar un problema grande mañana.
```

**"¿Qué incluye exactamente?"**

```
Incluye:
• Inspección profesional completa de la vivienda
• Índice de Salud de la Vivienda (ISV)
• Plan de mantenimiento con prioridades
• Detección de riesgos y tareas críticas
• Acceso al sistema EPDE por 6 meses

Todo queda cargado en una plataforma donde podés hacer
seguimiento, ver tareas y recibir alertas.

¿Queremos coordinar una fecha?
```

---

## 6. Cierre — Propuesta de fecha

### Regla: SIEMPRE cerrar con opciones

**Bien:**

```
¿Te queda mejor esta semana o la próxima?
```

```
Tengo disponibilidad el jueves por la mañana o el viernes a la tarde.
¿Cuál te viene mejor?
```

**Mal:**

```
¿Querés avanzar?
¿Te interesa?
Avisame si querés.
```

### Mensaje de confirmación (post-cierre)

```
¡Perfecto! Quedamos entonces el [día] a las [hora].

Te paso un resumen:
📍 Dirección: [confirmar]
🕐 Horario: [hora]
📋 Duración estimada: 1.5 a 2 horas
💰 Valor: $35.000 (pago único)

El día del diagnóstico voy personalmente.
Cualquier consulta previa, escribime por acá. 👍
```

---

## 7. Seguimiento post-conversación

### Flujo de seguimiento

| Día        | Acción                            | Mensaje           |
| ---------- | --------------------------------- | ----------------- |
| **Día 0**  | Conversación inicial              | (flujo normal)    |
| **Día 1**  | Seguimiento si no respondió       | Ver mensaje abajo |
| **Día 3**  | Seguimiento con impacto económico | Ver mensaje abajo |
| **Día 7**  | Seguimiento suave                 | Ver mensaje abajo |
| **Día 21** | Recuperación final                | Ver mensaje abajo |

### Día 1 — Seguimiento inmediato

```
¡Hola [nombre]! ¿Pudiste pensar lo del diagnóstico?

Quedo a disposición por cualquier duda. 👍
```

### Día 3 — Impacto económico

```
Hola [nombre], te escribo por si te sirve esta info:

Muchas veces vemos que cuando los problemas en una vivienda
no se detectan a tiempo, el costo después es mucho mayor.

El diagnóstico justamente sirve para evitar eso.

¿Querés que veamos una fecha? Sin compromiso.
```

### Día 7 — Seguimiento suave

```
Hola [nombre], pasé a saludar.

Si en algún momento querés evaluar tu vivienda,
escribime y coordinamos. No tiene vencimiento. 👍
```

### Día 21 — Recuperación final

```
Hola [nombre]! Te escribo por última vez por si querías
retomar el diagnóstico.

Es algo que podés hacer en cualquier momento para evitar
problemas más adelante.

Quedo a disposición 👍
```

---

## 8. Sistema de etiquetas (estados de lead)

### Etiquetas en WhatsApp Business

| Etiqueta          | Color    | Cuándo usar                                     |
| ----------------- | -------- | ----------------------------------------------- |
| 🟢 **Nuevo**      | Verde    | Acaba de escribir, sin respuesta aún            |
| 🔵 **Interesado** | Azul     | Respondió, hizo preguntas, parece interesado    |
| 🟡 **En duda**    | Amarillo | Pidió tiempo, dijo "lo pienso", preguntó precio |
| 🔴 **Frío**       | Rojo     | No responde hace +7 días                        |
| ⚪ **Cerrado**    | Gris     | Diagnóstico agendado o realizado                |
| ⚫ **Descartado** | Negro    | No es target (alquiler, otra ciudad, etc.)      |

### Reglas de transición

```
Nuevo → Interesado    (respondió con interés)
Nuevo → Descartado    (no es target)
Interesado → En duda  (pidió tiempo o no avanzó)
Interesado → Cerrado  (agendó diagnóstico)
En duda → Frío        (no responde +7 días)
En duda → Cerrado     (retomó y agendó)
Frío → Cerrado        (recuperado con seguimiento)
Frío → Descartado     (sin respuesta post día 21)
```

---

## 9. Planilla de tracking (Google Sheets / Notion)

### Campos mínimos

| Campo                 | Ejemplo                                            |
| --------------------- | -------------------------------------------------- |
| Nombre                | María González                                     |
| WhatsApp              | +54 343 555-1234                                   |
| Tipo de vivienda      | Casa                                               |
| m² estimados          | ~120                                               |
| Zona                  | Paraná centro                                      |
| Estado                | 🔵 Interesado                                      |
| Fecha primer contacto | 2026-03-22                                         |
| Último contacto       | 2026-03-23                                         |
| Próximo contacto      | 2026-03-25                                         |
| Notas                 | Preguntó precio, le mandé info. Seguimiento día 3. |
| Objeción principal    | "Lo voy a pensar"                                  |

### Revisión

- **Diaria:** Revisar leads Nuevos e Interesados
- **Cada 3 días:** Revisar leads En duda (enviar seguimiento)
- **Semanal:** Revisar Fríos (enviar recuperación)

---

## 10. Registro de objeciones

### Para qué sirve

- Mejorar el discurso de venta
- Ajustar la landing (si una objeción se repite, la landing no la está resolviendo)
- Preparar respuestas más efectivas

### Formato

| Objeción                    | Frecuencia | Respuesta actual                                     | ¿Funciona? |
| --------------------------- | ---------- | ---------------------------------------------------- | ---------- |
| "Es caro"                   | Alta       | Comparación con costo de reparación                  | Sí         |
| "Lo pienso"                 | Alta       | Seguimiento día 3 con impacto económico              | Regular    |
| "No tengo problemas"        | Media      | "Justamente, el diagnóstico detecta lo que no se ve" | Sí         |
| "¿Sirve para departamento?" | Baja       | "Sí, aplica a cualquier vivienda propia"             | Sí         |

---

## 11. Métricas clave

| Métrica                     | Cómo medir                                 | Objetivo |
| --------------------------- | ------------------------------------------ | -------- |
| Leads nuevos / semana       | Conteo de chats nuevos                     | > 5      |
| Tasa de respuesta           | Leads que responden / total                | > 70%    |
| Tasa de cierre              | Diagnósticos agendados / leads respondidos | > 25%    |
| Tiempo de primera respuesta | Minutos desde primer mensaje               | < 15 min |
| Leads recuperados           | Fríos que vuelven a responder              | > 10%    |

---

## 12. Checklist diario

- [ ] Revisar chats nuevos (etiquetar como 🟢 Nuevo)
- [ ] Responder leads nuevos (< 15 minutos)
- [ ] Enviar seguimientos pendientes (día 1, 3, 7, 21)
- [ ] Actualizar estados en planilla
- [ ] Registrar objeciones nuevas

---

## 13. Notas importantes

### Lo que SÍ hacer

- Responder rápido (< 15 min en horario laboral)
- Siempre terminar con pregunta
- Cerrar con opciones de fecha, no con "¿querés?"
- Registrar todo en la planilla
- Seguir el flujo de seguimiento (no abandonar leads)

### Lo que NO hacer

- Hablar de precio en el primer mensaje
- Mandar audios largos sin contexto
- Dejar de responder si el lead no contesta
- Usar lenguaje técnico innecesario
- Presionar agresivamente

### Lo que genera más cierres

- Mencionar el riesgo económico de no actuar
- Dar opciones concretas de fecha
- Personalizar según lo que contó el lead
- Ser directa y profesional, no vendedora

---

## 14. Mejoras futuras

- [ ] Implementar CRM simple (Notion o Airtable) si el volumen de leads supera 20/semana
- [ ] Crear respuestas rápidas en WhatsApp Business para las preguntas frecuentes
- [ ] Agregar link de pago (MercadoPago) al mensaje de confirmación
- [ ] Grabar video corto de "cómo es un diagnóstico EPDE" para mandar por WhatsApp
- [ ] A/B test de mensajes de seguimiento (día 3 vs día 5)
- [ ] Automatizar seguimientos con herramienta tipo Whaticket o similar cuando el volumen lo justifique
