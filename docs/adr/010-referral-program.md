# ADR-010: Programa de recomendación — MVP con conversión manual + reward acumulativo

## Estado

Aceptada — implementada en PRs A-L (Abril 2026)

## Contexto

Se requería un programa de "trae un amigo" que motivara a los clientes a recomendar EPDE: cada cliente comparte un código único, los referidos pagan su diagnóstico citando el código, y al confirmarse el pago el referrer suma meses de suscripción gratis según una escala de hitos (1, 2, 3, 5, 10 conversiones).

Dos decisiones de diseño concentraron el debate:

1. **¿Cómo se confirma una conversión?** No existe (todavía) un sistema de pagos online — los pagos se acuerdan por WhatsApp y se registran fuera de la plataforma. La opción "esperar al sistema de pagos" hubiera bloqueado la feature por meses.
2. **¿Cómo se calcula el reward al alcanzar un hito?** Hitos son acumulativos pero las recompensas no son un simple "+1 mes por conversión" — siguen una escala (1→1mes, 2→2meses, 3→3meses, 5→6meses, 10→12meses + diagnóstico bianual). Hay que decidir cómo evitar drift entre el contador `convertedCount` y los créditos otorgados.

## Decisión

**MVP con bridge manual + reward absoluto recalculado en cada conversión.**

### 1. Conversión manual por admin (bridge temporal)

- Los referidos se registran automáticamente cuando un cliente nuevo se da de alta con un `referralCode` (`POST /clients` acepta el campo opcional, `ClientService` invoca `ReferralsService.registerReferral`).
- Una `Referral` queda en estado `PENDING` hasta que un admin confirma manualmente el pago desde la ficha del cliente: `POST /admin/referrals/:id/convert`.
- Cuando exista un sistema de pagos real, la confirmación de pago llamará directamente a `ReferralsService.convertReferral(referredUserId)`. La signatura y los efectos no van a cambiar; el endpoint admin queda como backup operativo (recovery de incidentes, payments offline).

### 2. Reward absoluto + delta en cada conversión

- En cada `convertReferral` se calcula el reward absoluto correspondiente al `newConvertedCount` (`computeReward(n)` en `apps/api/src/referrals/milestones.ts`).
- El delta vs. el snapshot previo del usuario se aplica como extensión incremental de `subscriptionExpiresAt` (solo se agrega lo nuevo, no se duplica).
- Esto convierte la operación en **idempotente y resistente a drift**: si por bug nunca se otorgó el mes 2, recomputar arroja el delta correcto sin doble contar lo ya aplicado.

### 3. Drift recovery explícito

- `POST /admin/referrals/:userId/recompute` reconstruye `convertedCount` desde la tabla `Referral` y reaplica el reward snapshot. **No** dispara notificaciones — es reconciliación, no celebración.
- Cualquier admin puede invocarlo (gateado por `@StrictAuth()` + `StrictBlacklistGuard`) si los contadores se ven desincronizados.

### 4. Notificaciones post-conversión

- Email "¡felicitaciones, alcanzaste el hito X!" + notificación in-app SYSTEM (a través de `NotificationsHandlerService.handleReferralMilestoneReached`).
- Solo se dispara cuando `delta > 0` — re-llamar `convertReferral` sobre un referido ya convertido es no-op silencioso.
- Email adicional al admin cuando un cliente cruza al hito 10 (la regla de negocio dice que ese cliente probablemente quiere conversación humana). Identificado por `delta.biannualDiagnosis > 0` como bit marker.

## Modelo de datos

| Campo en `User`                                            | Tipo              | Motivo                                                                           |
| ---------------------------------------------------------- | ----------------- | -------------------------------------------------------------------------------- |
| `referralCode`                                             | `String? @unique` | Código compartible (formato `PREFIJO-XYZ`, alfabeto sin ambigüedad)              |
| `referredByCode`                                           | `String?`         | Código que el usuario citó al registrarse (auditoría)                            |
| `referralCount`                                            | `Int`             | Total de referidos (contador denormalizado)                                      |
| `convertedCount`                                           | `Int`             | Total de conversiones confirmadas                                                |
| `referralCreditMonths` / `…AnnualDiagnosis` / `…Biannual…` | `Int`             | Snapshot del reward absoluto otorgado hasta hoy — fuente de verdad para el delta |

Tabla `Referral` (no soft-deletable): `id`, `referrerId`, `referredUserId?`, `referredEmail`, `status: PENDING|CONVERTED`, `createdAt`, `convertedAt?`. Indexes en `(referrerId, status)`, `referredUserId`, `status`.

## Caveat: por qué no soft-delete en `Referral`

`Referral` es una entidad de auditoría — los registros NO se borran. Si un cliente se da de baja, la `Referral` queda como histórico (con `referredUserId = null` por `onDelete: SetNull`). Soft-delete agregaría complejidad (campo `deletedAt`, filtros en cada query) sin caso de uso real para "ocultar" referidos.

## Consecuencias

- **Pro:** la feature ya está en producción sin esperar al sistema de pagos. La superficie de admin (un botón "Marcar como pagada" en la ficha del cliente) cubre el flujo manual completo.
- **Pro:** drift entre contadores y créditos es siempre recuperable con `recompute`. Tests de servicio cubren idempotencia, doble-click concurrente, y delta correcto cuando se cruza un hito.
- **Pro:** cuando el sistema de pagos exista, sustituir al admin por el webhook es un cambio de un solo punto (`ReferralsService.convertReferral`) — ni el modelo de datos ni el contrato público cambian.
- **Contra:** el admin necesita acordarse de marcar el pago — si lo olvida el referrer no recibe el reward. Mitigación: el botón está en la misma ficha donde el admin extiende la suscripción, así que hace una sola operación visual.
- **Contra:** los milestones (1, 2, 3, 5, 10) y los rewards correspondientes están hardcodeados en `milestones.ts`. Cambiar la escala requiere code change + migración para recomputar rewards de usuarios con `convertedCount` ya alcanzado.
