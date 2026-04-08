# Backlog — Oportunidades de negocio y features futuras

## Re-inspección profesional (servicio premium)

**Qué es:** La arquitecta vuelve a visitar la propiedad después de X meses (6/12) para re-evaluar el estado de todos los puntos del plan. Compara contra la inspección original y ajusta prioridades.

**Por qué es una oportunidad de negocio:**

- Se cobra como servicio adicional (no está incluido en el diagnóstico inicial)
- Genera confianza: un profesional valida que el mantenimiento del cliente está bien hecho
- Detecta nuevos problemas que el cliente no vería → más solicitudes de servicio
- Alimenta el ISV con datos reales de campo (no solo lo que el cliente reporta)

**Cómo se implementaría:**

- La arquitectura ya lo soporta: se pueden crear múltiples `InspectionChecklist` por propiedad
- Nueva inspección genera items desde las tareas existentes del plan (no desde templates)
- Al completar, ajusta prioridades y `professionalRequirement` de tareas existentes (no crea un plan nuevo)
- Nuevo endpoint: `POST /inspections/:checklistId/apply-to-plan` que actualiza tareas del plan vigente
- UI: botón "Re-inspección" en el tab de inspección cuando ya existe un plan

**Cuándo implementar:** Cuando el flujo core (inspección inicial → plan → cliente opera) esté validado con clientes reales y haya demanda de seguimiento profesional.

**Modelo de pricing sugerido:**

- Incluir 1 re-inspección anual en el plan base (retención)
- Re-inspecciones adicionales como servicio pago
- O paquete premium con re-inspecciones trimestrales
