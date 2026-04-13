import { DESIGN_TOKENS_LIGHT } from '@epde/shared';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().min(2).max(100),
  contact: z.string().min(5).max(100),
  address: z.string().min(3).max(200),
});

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  const emailTo = process.env.CONTACT_EMAIL_TO ?? 'info@epde.com.ar';

  const body = await request.json();
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  const { name, contact, address } = parsed.data;

  if (!apiKey) {
    console.warn('RESEND_API_KEY not set — contact form submission dropped (dev/staging only)');
    return NextResponse.json({ ok: true });
  }

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? 'EPDE <onboarding@resend.dev>',
    to: emailTo,
    subject: `Nuevo contacto: ${name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${DESIGN_TOKENS_LIGHT.primary};">Nuevo contacto desde la landing</h2>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px 0; color: #666; width: 120px;">Nombre</td>
            <td style="padding: 8px 0; font-weight: bold;">${name.replace(/</g, '&lt;')}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Contacto</td>
            <td style="padding: 8px 0; font-weight: bold;">${contact.replace(/</g, '&lt;')}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Dirección</td>
            <td style="padding: 8px 0; font-weight: bold;">${address.replace(/</g, '&lt;')}</td>
          </tr>
        </table>
        <hr style="border: none; border-top: 1px solid ${DESIGN_TOKENS_LIGHT.border}; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px;">EPDE — formulario de contacto de la landing page</p>
      </div>
    `,
  });

  return NextResponse.json({ ok: true });
}
