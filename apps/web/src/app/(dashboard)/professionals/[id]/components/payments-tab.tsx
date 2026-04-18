'use client';

import type { ProfessionalPaymentPublic, ProfessionalPaymentStatus } from '@epde/shared';
import { PROFESSIONAL_PAYMENT_STATUS_LABELS } from '@epde/shared';
import { CheckCircle, DollarSign, Plus } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  useCreatePayment,
  useProfessionalPayments,
  useUpdatePaymentStatus,
} from '@/hooks/use-professionals';

const STATUS_VARIANT: Record<ProfessionalPaymentStatus, 'success' | 'warning' | 'secondary'> = {
  PAID: 'success',
  PENDING: 'warning',
  CANCELED: 'secondary',
};

function PaymentRow({ payment }: { payment: ProfessionalPaymentPublic }) {
  const updateStatus = useUpdatePaymentStatus();

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-lg font-bold">${Number(payment.amount).toLocaleString('es-AR')}</p>
              <Badge variant={STATUS_VARIANT[payment.status] ?? 'secondary'}>
                {PROFESSIONAL_PAYMENT_STATUS_LABELS[payment.status]}
              </Badge>
            </div>
            <p className="text-muted-foreground text-xs">
              {new Date(payment.createdAt).toLocaleDateString('es-AR')}
              {payment.paymentMethod && ` · ${payment.paymentMethod}`}
              {payment.paidAt &&
                ` · Pagado ${new Date(payment.paidAt).toLocaleDateString('es-AR')}`}
            </p>
            {payment.notes && (
              <p className="text-muted-foreground mt-1 text-xs italic">{payment.notes}</p>
            )}
          </div>
          {payment.status === 'PENDING' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                updateStatus.mutate({
                  paymentId: payment.id,
                  status: 'PAID',
                })
              }
              disabled={updateStatus.isPending}
            >
              <CheckCircle className="mr-1 h-3 w-3" />
              Marcar pagado
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function PaymentsTab({ professionalId }: { professionalId: string }) {
  const { data: payments = [], isLoading } = useProfessionalPayments(professionalId);
  const create = useCreatePayment(professionalId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('');
  const [notes, setNotes] = useState('');

  const totals = payments.reduce(
    (acc, p) => {
      if (p.status === 'PAID') acc.paid += Number(p.amount);
      if (p.status === 'PENDING') acc.pending += Number(p.amount);
      return acc;
    },
    { paid: 0, pending: 0 },
  );

  const handleSubmit = () => {
    const parsed = Number(amount);
    if (!parsed || parsed <= 0) return;
    create.mutate(
      {
        amount: parsed,
        paymentMethod: method || null,
        notes: notes || null,
      },
      {
        onSuccess: () => {
          setDialogOpen(false);
          setAmount('');
          setMethod('');
          setNotes('');
        },
      },
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-muted-foreground text-xs">Total pagado</p>
            <p className="text-success text-2xl font-bold">
              ${totals.paid.toLocaleString('es-AR')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-muted-foreground text-xs">Pendiente</p>
            <p className="text-warning text-2xl font-bold">
              ${totals.pending.toLocaleString('es-AR')}
            </p>
          </CardContent>
        </Card>
        <Card className="col-span-2 sm:col-span-1">
          <CardContent className="p-4">
            <p className="text-muted-foreground text-xs">Pagos registrados</p>
            <p className="text-2xl font-bold">{payments.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Registrar pago
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-center text-sm">Cargando...</p>
      ) : payments.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <DollarSign className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
            <p className="text-muted-foreground text-sm">Sin pagos registrados</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {payments.map((p) => (
            <PaymentRow key={p.id} payment={p} />
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar pago</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="amount">Monto *</Label>
              <Input
                id="amount"
                type="number"
                min={0}
                step={0.01}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="method">Método de pago</Label>
              <Input
                id="method"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                placeholder="Transferencia, efectivo..."
              />
            </div>
            <div>
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                maxLength={1000}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={create.isPending || !amount}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
