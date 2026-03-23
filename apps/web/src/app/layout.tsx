import './globals.css';

import type { Metadata } from 'next';
import { DM_Sans, DM_Serif_Display } from 'next/font/google';
import Script from 'next/script';
import { Suspense } from 'react';
import { Toaster } from 'sonner';

import { NavigationProgress } from '@/components/navigation-progress';
import { AuthProvider } from '@/providers/auth-provider';
import { QueryProvider } from '@/providers/query-provider';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const dmSerifDisplay = DM_Serif_Display({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-dm-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'EPDE - Mantenimiento Preventivo',
  description: 'Plataforma de mantenimiento preventivo para viviendas',
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
        >{`(function(){try{var t=localStorage.getItem('theme');if(t==='dark')document.documentElement.classList.add('dark')}catch(e){}})()`}</Script>
      </head>
      <body className={`${dmSans.variable} ${dmSerifDisplay.variable}`} suppressHydrationWarning>
        <Suspense>
          <NavigationProgress />
        </Suspense>
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
