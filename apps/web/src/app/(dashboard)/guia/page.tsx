'use client';

import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle,
  ClipboardList,
  DollarSign,
  FileText,
  Heart,
  HelpCircle,
  Home,
  ListChecks,
  type LucideIcon,
  Wrench,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import { toast } from 'sonner';

import { resetOnboardingTour } from '@/components/onboarding-tour';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageTransition } from '@/components/ui/page-transition';

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-3 flex items-center gap-3">
          <div className="bg-primary/10 rounded-lg p-2">
            <Icon className="text-primary h-5 w-5" />
          </div>
          <h2 className="type-title-md">{title}</h2>
        </div>
        <div className="text-muted-foreground space-y-2 text-sm leading-relaxed">{children}</div>
      </CardContent>
    </Card>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="text-primary hover:text-primary/80 inline-flex items-center gap-1 font-medium"
    >
      {label}
      <ArrowRight className="h-3 w-3" />
    </Link>
  );
}

export default function GuiaPage() {
  useEffect(() => {
    document.title = 'Guía de uso | EPDE';
  }, []);

  return (
    <PageTransition>
      <PageHeader
        title="Guía de uso"
        description="Todo lo que necesitás saber para usar el sistema EPDE."
      />

      <div className="space-y-4">
        {/* ISV */}
        <Section icon={Heart} title="¿Qué es el puntaje ISV?">
          <p>
            El <strong>Índice de Salud de la Vivienda</strong> es un número de 0 a 100 que mide el
            estado general de tu casa. Se calcula en base a 5 dimensiones:
          </p>
          <ul className="list-inside list-disc space-y-1 pl-1">
            <li>
              <strong>¿Estás al día?</strong> — Si completás las tareas a tiempo. Las urgentes pesan
              más.
            </li>
            <li>
              <strong>¿En qué estado está?</strong> — Lo que reportás al completar cada tarea.
            </li>
            <li>
              <strong>¿Cuánto revisamos?</strong> — Si se inspeccionaron todos los sectores de tu
              casa en el último año.
            </li>
            <li>
              <strong>¿Prevenís o reparás?</strong> — Cuánto va a prevención vs. reparaciones.
              Ideal: más prevención.
            </li>
            <li>
              <strong>¿Mejora o empeora?</strong> — Comparación con el trimestre anterior.
            </li>
          </ul>
          <p>
            Un ISV alto significa que tu casa está bien mantenida. Uno bajo indica que los problemas
            se acumulan y las reparaciones futuras van a ser más caras.
          </p>
        </Section>

        {/* Tareas */}
        <Section icon={ListChecks} title="Tareas de mantenimiento">
          <p>
            Después de la inspección visual, se genera automáticamente un plan con todas las tareas
            que tu casa necesita, con prioridades basadas en lo que la arquitecta encontró. Cada
            tarea tiene:
          </p>
          <ul className="list-inside list-disc space-y-1 pl-1">
            <li>
              <strong>Prioridad:</strong> Alta = requiere atención pronto. Media = mantenimiento
              regular. Baja = mejoras opcionales.
            </li>
            <li>
              <strong>Estado:</strong> Vencida = pasó la fecha. Pendiente = programada a más de 30
              días. Próxima = vence en menos de 30 días.
            </li>
            <li>
              <strong>Recurrencia:</strong> Cada cuánto hay que repetirla (mensual, trimestral,
              anual, etc.).
            </li>
            <li>
              <strong>Profesional:</strong> Si necesitás contratar a alguien o la podés hacer vos.
            </li>
          </ul>
          <p>
            <QuickLink href="/tasks" label="Ir a Tareas" />
          </p>
        </Section>

        {/* Completar tarea */}
        <Section icon={CheckCircle} title="¿Cómo completo una tarea?">
          <p>Hacé click en cualquier tarea y después en &quot;Registrar&quot;. Solo necesitás:</p>
          <ol className="list-inside list-decimal space-y-1 pl-1">
            <li>
              <strong>¿En qué estado está?</strong> — Excelente, bueno, aceptable, malo o crítico.
            </li>
            <li>
              <strong>¿Quién lo hizo?</strong> — Vos, un profesional contratado, o EPDE.
            </li>
          </ol>
          <p>
            Eso es todo. Si querés agregar más detalles (costo, notas, fotos), expandí &quot;Más
            detalles&quot;. Pero no es obligatorio.
          </p>
          <p>
            Cuando reportás un estado <strong>malo o crítico</strong>, el sistema te sugiere crear
            una solicitud de servicio para que EPDE intervenga.
          </p>
        </Section>

        {/* Propiedades */}
        <Section icon={Home} title="Tu propiedad">
          <p>Cada propiedad tiene 4 secciones:</p>
          <ul className="list-inside list-disc space-y-1 pl-1">
            <li>
              <strong>Salud:</strong> El puntaje ISV, desglosado por dimensión y por sector de la
              casa.
            </li>
            <li>
              <strong>Plan:</strong> Todas las tareas programadas, organizadas por categoría.
            </li>
            <li>
              <strong>Gastos:</strong> Cuánto llevas invertido en mantenimiento, por sector y por
              categoría.
            </li>
            <li>
              <strong>Fotos:</strong> Registro visual de inspecciones y trabajos realizados.
            </li>
          </ul>
          <p>
            <QuickLink href="/properties" label="Ir a Propiedades" />
          </p>
        </Section>

        {/* Presupuestos */}
        <Section icon={DollarSign} title="Presupuestos">
          <p>Si algo necesita reparación o intervención profesional, el flujo es:</p>
          <ol className="list-inside list-decimal space-y-1 pl-1">
            <li>Vos solicitás un presupuesto.</li>
            <li>EPDE lo cotiza con detalle de costos.</li>
            <li>Vos revisás la cotización y decidís: aprobar o rechazar.</li>
            <li>Si aprobás, EPDE coordina el trabajo.</li>
          </ol>
          <p>Podés dejar comentarios en cualquier momento si tenés dudas sobre la cotización.</p>
          <p>
            <QuickLink href="/budgets" label="Ir a Presupuestos" />
          </p>
        </Section>

        {/* Servicios */}
        <Section icon={Wrench} title="Solicitudes de servicio">
          <p>
            Si detectás un problema o necesitás asistencia profesional, creá una solicitud. Cada
            solicitud pasa por etapas:
          </p>
          <p className="font-medium">Abierta → En revisión → En progreso → Resuelta</p>
          <p>
            Podés crear una solicitud desde la página de servicios o directamente desde una tarea
            cuando reportás un problema.
          </p>
          <p>
            <QuickLink href="/service-requests" label="Ir a Servicios" />
          </p>
        </Section>

        {/* Planes */}
        <Section icon={ClipboardList} title="Planes de mantenimiento">
          <p>Cada propiedad tiene un plan con sus tareas. Los estados del plan son:</p>
          <ul className="list-inside list-disc space-y-1 pl-1">
            <li>
              <strong>Activo:</strong> En uso. Genera recordatorios y afecta tu puntaje ISV.
            </li>
            <li>
              <strong>Borrador:</strong> En preparación. La arquitecta está cargando las tareas.
            </li>
            <li>
              <strong>Archivado:</strong> Ya no se usa. Queda como historial.
            </li>
          </ul>
          <p>
            <QuickLink href="/maintenance-plans" label="Ir a Planes" />
          </p>
        </Section>

        {/* Notificaciones */}
        <Section icon={AlertTriangle} title="Notificaciones y recordatorios">
          <p>El sistema te avisa automáticamente cuando:</p>
          <ul className="list-inside list-disc space-y-1 pl-1">
            <li>Una tarea está por vencer o ya venció.</li>
            <li>Un presupuesto fue cotizado y necesita tu aprobación.</li>
            <li>Una solicitud de servicio cambió de estado.</li>
          </ul>
          <p>
            Los avisos llegan por notificación push (si tenés la app), por email (resumen semanal
            los lunes), y dentro del sistema (campana arriba a la derecha).
          </p>
        </Section>

        {/* ISV y costos */}
        <Section icon={BarChart3} title="¿Por qué importa el mantenimiento preventivo?">
          <p>
            Las reparaciones de emergencia cuestan entre <strong>8 y 15 veces más</strong> que la
            prevención. Ejemplos reales:
          </p>
          <ul className="list-inside list-disc space-y-1 pl-1">
            <li>Filtración en techo: prevención $150.000 vs. emergencia $2.500.000+</li>
            <li>Humedad de cimientos: prevención $300.000 vs. emergencia $3.500.000+</li>
            <li>Falla eléctrica: prevención $80.000 vs. emergencia $1.200.000+</li>
          </ul>
          <p>El sistema EPDE te ayuda a mantener tu casa al día para evitar estos costos.</p>
        </Section>

        {/* Ayuda */}
        <Section icon={FileText} title="¿Necesitás más ayuda?">
          <p>
            Si tenés dudas, podés repetir el tour guiado desde tu{' '}
            <QuickLink href="/profile" label="perfil" /> o contactarnos por WhatsApp.
          </p>
        </Section>

        {/* Replay tour */}
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <HelpCircle className="text-muted-foreground h-5 w-5" />
              <p className="type-body-sm">¿Querés ver el tour guiado de nuevo?</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                resetOnboardingTour();
                toast.success('El tour se mostrará cuando vayas al dashboard');
              }}
            >
              Repetir tour
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
