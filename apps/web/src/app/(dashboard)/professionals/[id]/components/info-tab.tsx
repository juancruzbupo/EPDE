'use client';

import type { ProfessionalDetailPublic } from '@epde/shared';
import { PROFESSIONAL_SPECIALTY_LABELS } from '@epde/shared';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function InfoTab({ pro }: { pro: ProfessionalDetailPublic }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos básicos</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground text-xs">Email</dt>
              <dd className="font-medium">{pro.email}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Teléfono</dt>
              <dd className="font-medium">{pro.phone}</dd>
            </div>
            {pro.yearsOfExperience != null && (
              <div>
                <dt className="text-muted-foreground text-xs">Años de experiencia</dt>
                <dd className="font-medium">{pro.yearsOfExperience}</dd>
              </div>
            )}
            {(pro.hourlyRateMin != null || pro.hourlyRateMax != null) && (
              <div>
                <dt className="text-muted-foreground text-xs">Tarifa por hora</dt>
                <dd className="font-medium">
                  {pro.hourlyRateMin != null ? `$${pro.hourlyRateMin.toLocaleString('es-AR')}` : ''}
                  {pro.hourlyRateMax != null && pro.hourlyRateMin != null ? ' – ' : ''}
                  {pro.hourlyRateMax != null ? `$${pro.hourlyRateMax.toLocaleString('es-AR')}` : ''}
                </dd>
              </div>
            )}
            {pro.bio && (
              <div>
                <dt className="text-muted-foreground text-xs">Bio</dt>
                <dd className="text-sm leading-relaxed">{pro.bio}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Zonas y especialidades</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-muted-foreground mb-1.5 text-xs">Zonas que atiende</p>
            <div className="flex flex-wrap gap-1.5">
              {pro.serviceAreas.map((a) => (
                <Badge key={a} variant="secondary" className="text-xs">
                  {a}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="text-muted-foreground mb-1.5 text-xs">Especialidades</p>
            <div className="flex flex-wrap gap-1.5">
              {pro.specialties.map((s) => (
                <Badge
                  key={s.specialty}
                  variant={s.isPrimary ? 'success' : 'secondary'}
                  className="text-xs"
                >
                  {PROFESSIONAL_SPECIALTY_LABELS[s.specialty]}
                  {s.isPrimary && ' ★'}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="sm:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-muted-foreground text-xs">Trabajos completados</dt>
              <dd className="text-lg font-bold">{pro.stats.completedAssignments}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Activos</dt>
              <dd className="text-lg font-bold">{pro.stats.activeAssignments}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Total pagado</dt>
              <dd className="text-lg font-bold">${pro.stats.totalPaid.toLocaleString('es-AR')}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Pagos pendientes</dt>
              <dd className="text-warning text-lg font-bold">
                ${pro.stats.pendingPayments.toLocaleString('es-AR')}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
