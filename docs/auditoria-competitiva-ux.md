# Auditoría competitiva y experiencia por generación — EPDE

---

## Parte 1: Análisis competitivo

### Competidores directos

#### HomeZada (EE.UU.)

- **Qué hace:** Gestión integral del hogar: mantenimiento programado, inventario, proyectos de remodelación, seguimiento del valor de la propiedad.
- **Precio:** Freemium. Plan Pro ~USD 75/año.
- **Plataforma:** Web + iOS + Android.
- **Lo bueno:** Seguimiento financiero del valor de la casa, tracking de costos de remodelación, documentación para seguros.
- **Lo que le falta:** No tiene inspección profesional. Los calendarios de mantenimiento son genéricos, no personalizados. No hay índice de salud.

#### Centriq (EE.UU.)

- **Qué hace:** Manual digital del hogar. Escaneás el modelo de un electrodoméstico y te da manuales, tutoriales en video y recordatorios de mantenimiento específicos.
- **Precio:** Gratis para propietarios. Cobra a constructoras que pre-cargan datos de viviendas nuevas.
- **Plataforma:** Mobile-first (iOS + Android).
- **Lo bueno:** Granularidad a nivel de producto (conoce el modelo exacto de tu calefón). Videos tutoriales.
- **Lo que le falta:** No tiene diagnóstico ni inspección. Es puramente informativo/reactivo.

#### Breezeway (EE.UU.)

- **Qué hace:** Plataforma de operaciones de propiedades: checklists de inspección, gestión de tareas, mantenimiento programado, reportes para propietarios.
- **Precio:** B2B SaaS, ~USD 3-8/unidad/mes.
- **Plataforma:** Web + mobile.
- **Lo bueno:** Es el más parecido a EPDE en concepto: parte de inspecciones y genera tareas. Tiene automatización e integraciones IoT.
- **Lo que le falta:** Está pensado para property managers y alquileres temporarios, no para propietarios individuales. El UX es para operadores, no para familias.

#### Homer by Frontdoor (EE.UU.)

- **Qué hace:** App de gestión del hogar respaldada por American Home Shield (la empresa de garantías de hogar más grande de EE.UU.). Recordatorios de mantenimiento, inventario, conexión con 17.000+ profesionales.
- **Precio:** Gratis (monetiza con referidos a profesionales y upsell de garantías).
- **Plataforma:** iOS + Android.
- **Lo bueno:** Red masiva de contratistas. Respaldo corporativo.
- **Lo que le falta:** No tiene diagnóstico profesional. Los recordatorios son genéricos. Es un marketplace disfrazado de herramienta.

#### Plantillas de Notion / Airtable

- **Qué hace:** Templates DIY para trackear mantenimiento del hogar. Base de datos con tareas, recurrencias y costos.
- **Precio:** Gratis o USD 5-25 por template.
- **Lo bueno:** Totalmente personalizable, sin lock-in.
- **Lo que le falta:** Cero automatización, cero expertise profesional, el usuario tiene que saber qué mantener y cuándo. No escala.

### Competidores en Argentina / LatAm

| Plataforma               | Qué hace                                                     | Diferencia con EPDE                                                                   |
| ------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| **IguanaFix**            | Marketplace de servicios del hogar (plomeros, electricistas) | Reactivo — buscás un profesional cuando algo se rompe. No tiene componente preventivo |
| **Properati / ZonaProp** | Portales inmobiliarios                                       | Compra/venta/alquiler, no mantenimiento                                               |

**Hallazgo clave:** No existe competencia directa en Argentina ni en Latinoamérica para mantenimiento preventivo residencial. EPDE es first-mover en la categoría.

### Matriz comparativa

| Característica                              | EPDE            | HomeZada    | Centriq      | Breezeway      | Homer    |
| ------------------------------------------- | --------------- | ----------- | ------------ | -------------- | -------- |
| Inspección profesional presencial           | ✅              | ❌          | ❌           | ✅ (B2B)       | ❌       |
| Índice de salud (ISV)                       | ✅              | ❌          | ❌           | ❌             | ❌       |
| Plan personalizado por vivienda             | ✅              | Genérico    | Por producto | Checklists     | Genérico |
| Sistema de tareas con prioridad/recurrencia | ✅              | ✅          | ✅           | ✅             | ✅       |
| Gestión de presupuestos                     | ✅              | ❌          | ❌           | ❌             | ❌       |
| Solicitudes de servicio                     | ✅              | ❌          | ❌           | ✅             | ❌       |
| App mobile                                  | ✅              | ✅          | ✅           | ✅             | ✅       |
| Panel admin                                 | ✅              | N/A         | N/A          | ✅             | N/A      |
| Foco en LatAm                               | ✅              | ❌          | ❌           | ❌             | ❌       |
| Seguimiento profesional continuo            | ✅              | ❌          | ❌           | Parcial        | ❌       |
| Precio                                      | Por diagnóstico | Suscripción | Gratis       | Por unidad/mes | Gratis   |

### Ventajas competitivas de EPDE

1. **El diagnóstico profesional como punto de entrada.** Ningún competidor arranca con una inspección presencial que genera un plan personalizado. Los demás generan calendarios genéricos.

2. **ISV como métrica de retención.** Un número claro que evoluciona en el tiempo. Genera urgencia ("bajó tu puntaje") y satisfacción ("subió tu puntaje"). Nadie más lo tiene.

3. **Cadena completa: diagnóstico → plan → tareas → presupuestos → servicios.** Los competidores son o herramientas de inspección o trackers de mantenimiento. Nunca los dos integrados.

4. **Mercado sin competencia.** En Argentina el concepto de mantenimiento preventivo residencial no existe como categoría de producto. El competidor real es la inercia del propietario.

### Riesgos

- **Inercia del usuario.** El mayor competidor no es otra plataforma sino la costumbre de no hacer mantenimiento hasta que algo se rompe.
- **Sustitutos de bajo costo.** Una planilla de Excel o un template de Notion le alcanza a alguien organizado y con conocimiento técnico.
- **Escalabilidad del diagnóstico.** El cuello de botella es la inspección presencial. Solo se puede atender una vivienda a la vez.

---

## Parte 2: Experiencia de usuario por generación

### Baby Boomers (1946–1964) — 60 a 80 años

**Perfil:** Propietarios de viviendas de larga data. Muchos llevan 20-30 años en la misma casa. Conocen los problemas de su vivienda por experiencia. No son nativos digitales pero usan WhatsApp y redes sociales.

**Qué les funciona de EPDE:**

- El ISV es claro: un número, un color, un estado. No necesitan interpretar gráficos complejos.
- El concepto de "inspección profesional" les resulta familiar y confiable — es como llamar al arquitecto de toda la vida pero con un sistema detrás.
- Las notificaciones por email funcionan bien para este grupo.
- La landing con la comparación de costos (prevención vs. emergencia) les llega directo — ya vivieron reparaciones caras.

**Qué les puede costar:**

- **Tamaño de texto.** La tipografía body de 14px puede ser chica. En mobile 12px para labels es difícil de leer sin anteojos.
- **Navegación del dashboard.** Muchas secciones colapsables y tabs pueden confundir. Prefieren scroll lineal.
- **Completar una tarea.** El formulario tiene 6 campos obligatorios con selects (resultado, acción tomada, ejecutor, condición). Puede sentirse como mucho para alguien que no está acostumbrado a formularios digitales.
- **La app mobile.** Si no la instalan, pierden las notificaciones push. Muchos van a quedarse solo en web.

**Qué mejoraría su experiencia:**

- Opción de texto más grande (accesibilidad) o body en 16px por defecto.
- Simplificar el flujo de completar tarea: 3 campos esenciales + "¿Querés agregar más detalles?" expandible.
- Guía de primer uso con capturas paso a paso (PDF imprimible para tener a mano).
- Notificaciones por WhatsApp además de push/email — es donde viven digitalmente.

---

### Generación X (1965–1980) — 45 a 60 años

**Perfil:** El target principal de EPDE. Propietarios establecidos, con capacidad de inversión. Usan tecnología a diario pero no la buscan por placer — la usan si les resuelve algo concreto. Valoran la eficiencia y desconfían de lo que parece marketing.

**Qué les funciona de EPDE:**

- El dashboard con métricas concretas. Les gusta tener el control sin tener que pensar.
- La estructura de tareas con prioridad y fechas claras. Es como una lista de pendientes del trabajo pero para la casa.
- El concepto de ROI implícito en el ISV: "esto me está ahorrando plata" los mantiene.
- El panel es profesional sin ser complejo. No tiene animaciones innecesarias ni gamificación excesiva.
- Los presupuestos integrados eliminan la fricción de cotizar aparte.

**Qué les puede costar:**

- **Densidad de información en el dashboard.** Las stat cards, los charts, la actividad reciente, las tareas próximas — todo junto puede sentirse como "mucho para procesar" en la primera visita.
- **Jerga técnica.** Términos como "ISV", "recurrencia", "condición encontrada" son claros para la arquitecta pero pueden no serlo para el propietario.

**Qué mejoraría su experiencia:**

- Tooltips en los términos técnicos del dashboard (hover en "ISV" → "Índice de Salud de la Vivienda: mide el estado general de tu casa de 0 a 100").
- Un resumen semanal por email: "Esta semana tenés 2 tareas pendientes. Tu ISV es 78." Simple, accionable, sin tener que entrar al sistema.
- La comparación de costos de la landing debería estar visible en el dashboard también — refuerza el valor constantemente.

---

### Millennials (1981–1996) — 29 a 44 años

**Perfil:** Primeros compradores o propietarios recientes. Muchos compraron su primera casa en los últimos 5-10 años. Nativos digitales. Esperan que las apps sean intuitivas como las que usan todos los días (MercadoLibre, Spotify, bancos digitales). Valoran la transparencia y la experiencia mobile.

**Qué les funciona de EPDE:**

- La app mobile con pull-to-refresh, animaciones suaves y haptics. Se siente moderna.
- El sistema de badges y colores para estados/prioridades — es visual e inmediato.
- La posibilidad de solicitar servicios y presupuestos desde la plataforma — no quieren llamar por teléfono.
- Las notificaciones push. Viven en el celular.
- El concepto de "puntaje de salud" les es natural — están acostumbrados a métricas (score crediticio, rating de Uber, etc.).

**Qué les puede costar:**

- **El onboarding es pasivo.** No hay tutorial interactivo ni tour guiado. Solo una welcome card con 3 pasos. Comparado con apps como Duolingo o Notion, el primer contacto puede sentirse frío.
- **No hay gamificación visible.** El streak y la "semana perfecta" existen pero no están prominentes. Para esta generación, mostrar progreso con visuales atractivos (barras, medallas, rachas) aumenta el engagement.
- **La landing pide contactar por WhatsApp.** Muchos millennials prefieren un formulario online o agendar directamente sin hablar con nadie.

**Qué mejoraría su experiencia:**

- Onboarding interactivo: tour de 4 pantallas con highlights en los elementos clave del dashboard.
- Mostrar el streak y la semana perfecta de forma prominente en el dashboard mobile (no escondido en stats).
- Agregar un formulario de contacto o un Calendly para agendar el diagnóstico sin WhatsApp.
- Compartir el ISV en redes ("Mi casa tiene un ISV de 85 🏠") — genera boca en boca orgánico.

---

### Generación Z (1997–2012) — 13 a 28 años

**Perfil:** Muy pocos son propietarios todavía. Los que sí lo son compraron con ayuda familiar o son inversores jóvenes. Ultra nativos digitales. Esperan experiencias tipo Instagram/TikTok: rápidas, visuales, con microinteracciones. Tienen poca paciencia para interfaces densas.

**Qué les funciona de EPDE:**

- Las animaciones y haptics del mobile. Las transiciones suaves y el feedback táctil se sienten bien.
- El color system es cohesivo y moderno (terracotta + sand es una paleta que funciona en tendencias actuales).
- Los badges con colores son inmediatamente legibles.

**Qué les puede costar:**

- **Demasiado texto.** Las descripciones de tareas, las notas técnicas, los formularios con muchos campos — esta generación escanea, no lee.
- **Sin contenido visual/multimedia.** No hay fotos del estado de la vivienda en el dashboard, no hay before/after, no hay video explicativo dentro de la app.
- **La landing es larga y textual.** 11 secciones con mucho copy es un formato que no les atrapa. Prefieren un video de 30 segundos que explique todo.
- **El flujo de completar tarea es un formulario.** Preferirían algo tipo "deslizá para completar" → selección rápida con íconos → listo.

**Qué mejoraría su experiencia:**

- Versión "rápida" del formulario de completar tarea: íconos grandes en vez de selects, tipo encuesta visual.
- Galería de fotos del estado de la propiedad prominente en el dashboard.
- Video corto (15 segundos) embebido en el onboarding explicando el concepto.
- Stories o cards tipo Instagram con tips de mantenimiento en vez del "consejo del día" en texto plano.

---

### Resumen por generación

| Aspecto                | Boomers                              | Gen X                                 | Millennials                         | Gen Z                                      |
| ---------------------- | ------------------------------------ | ------------------------------------- | ----------------------------------- | ------------------------------------------ |
| **Canal preferido**    | Web + email                          | Web + email semanal                   | Mobile + push                       | Mobile + push                              |
| **Fortaleza de EPDE**  | ISV simple, inspección profesional   | Dashboard con métricas, presupuestos  | App moderna, badges, servicios      | Animaciones, paleta, haptics               |
| **Punto de fricción**  | Texto chico, formularios complejos   | Densidad del dashboard, jerga         | Onboarding pasivo, sin gamificación | Mucho texto, formularios largos            |
| **Mejora clave**       | Texto más grande, flujo simplificado | Tooltips, resumen semanal             | Tour interactivo, streak visible    | Formularios visuales, contenido foto/video |
| **Riesgo de abandono** | No entiende cómo usar la app         | No ve el valor después del primer mes | Se aburre si no hay engagement      | Nunca llega a registrarse                  |

---

### Recomendaciones priorizadas (impacto vs. esfuerzo)

**Rápidas (bajo esfuerzo, alto impacto):**

1. Resumen semanal por email con 3 datos: ISV, tareas pendientes, próxima tarea
2. Tooltips en métricas del dashboard (ISV, cumplimiento, cobertura)
3. Streak y semana perfecta visibles en el dashboard mobile (ya existen los datos)

**Medianas (esfuerzo moderado, alto impacto):** 4. Formulario de completar tarea simplificado (3 campos esenciales + expandible) 5. Formulario de contacto en la landing además de WhatsApp 6. Guía PDF imprimible del primer uso

**Grandes (alto esfuerzo, alto impacto):** 7. Onboarding interactivo con tour guiado 8. Notificaciones por WhatsApp (integración con API de WhatsApp Business) 9. Galería de fotos del estado de la propiedad en el dashboard
