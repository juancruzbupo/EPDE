'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FADE_IN, FADE_IN_UP, STAGGER_CONTAINER } from '@/lib/motion';

import type { SectionProps } from '../landing-data';
import { LAUNCH_PRICE, PRIMARY_CTA_LABEL, WHATSAPP_URL } from '../landing-data';

interface FinalCtaSectionProps extends SectionProps {
  price?: string;
}

export function FinalCtaSection({ motionProps, price }: FinalCtaSectionProps) {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const canSubmit =
    name.trim().length >= 2 && contact.trim().length >= 5 && address.trim().length >= 3;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          contact: contact.trim(),
          address: address.trim(),
        }),
      });
      if (!res.ok) throw new Error();
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  return (
    <section id="contacto" className="bg-foreground py-20 md:py-28">
      <motion.div variants={STAGGER_CONTAINER} {...motionProps} className="mx-auto max-w-4xl px-4">
        <motion.h2
          variants={FADE_IN_UP}
          className="font-heading text-background text-center text-3xl sm:text-4xl"
        >
          Tu casa necesita atención profesional.
        </motion.h2>
        <motion.p
          variants={FADE_IN}
          className="type-body-lg text-background/70 mx-auto mt-6 max-w-lg text-center"
        >
          Por {price ?? LAUNCH_PRICE}, una arquitecta diagnostica tu casa y te arma un plan completo
          de mantenimiento.
        </motion.p>

        <motion.div variants={FADE_IN} className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Contact form */}
          <div className="bg-background/10 rounded-xl p-6">
            <p className="type-title-sm text-background mb-4">Dejá tus datos y te contactamos</p>
            {status === 'success' ? (
              <div className="flex flex-col items-center gap-3 py-6">
                <Check className="text-success h-10 w-10" />
                <p className="type-body-md text-background text-center">
                  Recibimos tu solicitud. Te contactamos en menos de 24 horas.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  className="border-background/20 bg-background/10 text-background placeholder:text-background/40"
                />
                <Input
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="Email o teléfono"
                  className="border-background/20 bg-background/10 text-background placeholder:text-background/40"
                />
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Dirección de la vivienda"
                  className="border-background/20 bg-background/10 text-background placeholder:text-background/40"
                />
                <Button
                  type="submit"
                  size="lg"
                  variant="secondary"
                  className="w-full gap-2"
                  disabled={!canSubmit || status === 'loading'}
                >
                  {status === 'loading' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                  Solicitar diagnóstico
                </Button>
                {status === 'error' && (
                  <p className="text-destructive type-body-sm text-center">
                    Error al enviar. Intentá de nuevo o escribinos por WhatsApp.
                  </p>
                )}
              </form>
            )}
          </div>

          {/* WhatsApp option */}
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <p className="type-body-md text-background/60">O si preferís, escribinos directo</p>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="secondary" className="gap-2">
                {PRIMARY_CTA_LABEL} por WhatsApp
                <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
            <p className="type-body-sm text-background/40">Respondemos en menos de 24 horas</p>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
