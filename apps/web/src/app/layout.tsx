import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'EPDE - Mantenimiento Preventivo',
  description: 'Plataforma de mantenimiento preventivo para viviendas',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
