'use client';

import type { ProfessionalRatingPublic } from '@epde/shared';
import { Plus, Star, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateRating, useDeleteRating } from '@/hooks/use-professionals';

function StarRating({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange?: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => !disabled && onChange?.(n)}
          disabled={disabled}
          className={disabled ? 'cursor-default' : 'cursor-pointer'}
          aria-label={`${n} estrella${n === 1 ? '' : 's'}`}
        >
          <Star
            className={`h-4 w-4 ${
              n <= value ? 'fill-warning text-warning' : 'text-muted-foreground'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function RatingCard({
  rating,
  professionalId,
}: {
  rating: ProfessionalRatingPublic;
  professionalId: string;
}) {
  const remove = useDeleteRating(professionalId);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <StarRating value={rating.score} disabled />
              <span className="text-muted-foreground text-xs">
                {new Date(rating.createdAt).toLocaleDateString('es-AR')}
              </span>
            </div>
            {(rating.punctuality || rating.quality || rating.priceValue) && (
              <div className="text-muted-foreground mt-2 flex flex-wrap gap-3 text-xs">
                {rating.punctuality != null && <span>Puntualidad: {rating.punctuality}/5</span>}
                {rating.quality != null && <span>Calidad: {rating.quality}/5</span>}
                {rating.priceValue != null && <span>Precio: {rating.priceValue}/5</span>}
              </div>
            )}
            {rating.adminComment && (
              <div className="mt-2">
                <p className="text-muted-foreground text-xs">Admin:</p>
                <p className="text-sm leading-relaxed">{rating.adminComment}</p>
              </div>
            )}
            {rating.clientComment && (
              <div className="mt-2 border-l-2 pl-2">
                <p className="text-muted-foreground text-xs">Cliente:</p>
                <p className="text-sm leading-relaxed italic">{rating.clientComment}</p>
              </div>
            )}
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive"
            onClick={() => remove.mutate(rating.id)}
            disabled={remove.isPending}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function RatingsTab({
  professionalId,
  ratings,
  ratingAvg,
  ratingCount,
}: {
  professionalId: string;
  ratings: ProfessionalRatingPublic[];
  ratingAvg: number | null;
  ratingCount: number;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [score, setScore] = useState(5);
  const [punctuality, setPunctuality] = useState<number>(0);
  const [quality, setQuality] = useState<number>(0);
  const [priceValue, setPriceValue] = useState<number>(0);
  const [adminComment, setAdminComment] = useState('');
  const create = useCreateRating(professionalId);

  const handleSubmit = () => {
    create.mutate(
      {
        score,
        punctuality: punctuality || null,
        quality: quality || null,
        priceValue: priceValue || null,
        adminComment: adminComment || null,
      },
      {
        onSuccess: () => {
          setDialogOpen(false);
          setScore(5);
          setPunctuality(0);
          setQuality(0);
          setPriceValue(0);
          setAdminComment('');
        },
      },
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <div>
            {ratingAvg !== null ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold">{ratingAvg.toFixed(1)}</span>
                  <StarRating value={Math.round(ratingAvg)} disabled />
                </div>
                <p className="text-muted-foreground text-xs">
                  Basado en {ratingCount} valoración{ratingCount === 1 ? '' : 'es'}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">Sin valoraciones todavía</p>
            )}
          </div>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Valorar
          </Button>
        </CardContent>
      </Card>

      {ratings.length === 0 ? (
        <p className="text-muted-foreground text-center text-sm">Sin valoraciones cargadas</p>
      ) : (
        <div className="space-y-3">
          {ratings.map((r) => (
            <RatingCard key={r.id} rating={r} professionalId={professionalId} />
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva valoración</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Score general *</Label>
              <StarRating value={score} onChange={setScore} />
            </div>
            <div>
              <Label>Puntualidad (opcional)</Label>
              <StarRating value={punctuality} onChange={setPunctuality} />
            </div>
            <div>
              <Label>Calidad (opcional)</Label>
              <StarRating value={quality} onChange={setQuality} />
            </div>
            <div>
              <Label>Precio / valor (opcional)</Label>
              <StarRating value={priceValue} onChange={setPriceValue} />
            </div>
            <div>
              <Label htmlFor="admin-comment">Comentario privado (opcional)</Label>
              <Textarea
                id="admin-comment"
                value={adminComment}
                onChange={(e) => setAdminComment(e.target.value)}
                rows={3}
                maxLength={2000}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={create.isPending}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
