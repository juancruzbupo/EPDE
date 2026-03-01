'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { useMotionPreference, MOTION_DURATION } from '@/lib/motion';

interface HealthCardProps {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
}

function getHealthInfo(total: number, overdue: number) {
  if (total === 0)
    return {
      percent: 100,
      label: 'Sin tareas',
      colorClass: 'text-muted-foreground',
      barColor: '#4a4542',
    };
  const percent = Math.round(((total - overdue) / total) * 100);
  if (percent > 90)
    return { percent, label: 'Excelente', colorClass: 'text-green-600', barColor: '#6b9b7a' };
  if (percent > 70)
    return { percent, label: 'Bueno', colorClass: 'text-primary', barColor: '#c4704b' };
  if (percent > 50)
    return {
      percent,
      label: 'Necesita atencion',
      colorClass: 'text-yellow-600',
      barColor: '#d4a843',
    };
  return { percent, label: 'Critico', colorClass: 'text-destructive', barColor: '#c45b4b' };
}

export function HealthCard({ totalTasks, completedTasks, overdueTasks }: HealthCardProps) {
  const { shouldAnimate } = useMotionPreference();
  const { percent, label, colorClass, barColor } = getHealthInfo(totalTasks, overdueTasks);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-3 flex items-center justify-between">
          <p className="type-title-md text-foreground">Salud del Mantenimiento</p>
          <span className={`type-label-md ${colorClass}`}>{label}</span>
        </div>

        {/* Progress bar */}
        <div className="bg-muted mb-3 h-3 overflow-hidden rounded-full">
          {shouldAnimate ? (
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: barColor }}
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={{
                duration: MOTION_DURATION.slow * 2,
                ease: [0.33, 1, 0.68, 1],
              }}
            />
          ) : (
            <div
              className="h-full rounded-full"
              style={{ backgroundColor: barColor, width: `${percent}%` }}
            />
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1">
            <span className={`type-number-lg ${colorClass}`}>
              <AnimatedNumber value={percent} />
            </span>
            <span className={`type-body-md ${colorClass}`}>%</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="type-title-sm text-foreground">{completedTasks}</p>
              <p className="type-label-sm text-muted-foreground">Completadas</p>
            </div>
            <div className="text-center">
              <p
                className={`type-title-sm ${overdueTasks > 0 ? 'text-destructive' : 'text-foreground'}`}
              >
                {overdueTasks}
              </p>
              <p className="type-label-sm text-muted-foreground">Vencidas</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
