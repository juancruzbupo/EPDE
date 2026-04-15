/**
 * Canonical share-message builder for the referral program. Both web and
 * mobile call this so the copy can't drift — if product changes the
 * wording, it changes here and flows to every surface.
 *
 * Used by:
 *   - apps/web/src/app/(dashboard)/profile/referrals-share-actions.tsx (WhatsApp)
 *   - apps/mobile/src/components/profile/referrals-card.tsx (native Share sheet)
 */
export function buildReferralShareMessage(referralCode: string, referralUrl: string): string {
  return (
    `Hola! Te recomiendo EPDE, un servicio de diagnóstico preventivo para tu casa. ` +
    `Si te sumás con mi código ${referralCode} tenés 10% de descuento. Mirá: ${referralUrl}`
  );
}
