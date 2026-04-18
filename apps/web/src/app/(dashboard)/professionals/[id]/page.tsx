'use client';

import { use, useEffect, useState } from 'react';

import { ErrorState } from '@/components/error-state';
import { SkeletonShimmer } from '@/components/ui/skeleton-shimmer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProfessional } from '@/hooks/use-professionals';

import { AttachmentsTab } from './components/attachments-tab';
import { AvailabilityDialog } from './components/availability-dialog';
import { EditProfessionalDialog } from './components/edit-professional-dialog';
import { InfoTab } from './components/info-tab';
import { NotesTagsTab } from './components/notes-tags-tab';
import { PaymentsTab } from './components/payments-tab';
import { ProfessionalHeader } from './components/professional-header';
import { RatingsTab } from './components/ratings-tab';
import { TierDialog } from './components/tier-dialog';

export default function ProfessionalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: pro, isLoading, isError, refetch } = useProfessional(id);
  const [tierOpen, setTierOpen] = useState(false);
  const [availOpen, setAvailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (pro) document.title = `${pro.name} | Profesionales | EPDE`;
  }, [pro]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <SkeletonShimmer className="h-8 w-64" />
        <SkeletonShimmer className="h-32" />
      </div>
    );
  }

  if (isError || !pro) {
    return (
      <ErrorState
        message="No se pudo cargar el profesional"
        onRetry={refetch}
        severity="critical"
      />
    );
  }

  return (
    <div className="space-y-6">
      <ProfessionalHeader
        professional={pro}
        onOpenTierDialog={() => setTierOpen(true)}
        onOpenAvailabilityDialog={() => setAvailOpen(true)}
        onOpenEditDialog={() => setEditOpen(true)}
      />

      <Tabs defaultValue="info">
        <TabsList className="w-full flex-wrap justify-start">
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
          <TabsTrigger value="ratings">Valoraciones</TabsTrigger>
          <TabsTrigger value="notes">Notas & Tags</TabsTrigger>
          <TabsTrigger value="payments">Pagos</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-4">
          <InfoTab pro={pro} />
        </TabsContent>
        <TabsContent value="documents" className="mt-4">
          <AttachmentsTab professionalId={id} attachments={pro.attachments} />
        </TabsContent>
        <TabsContent value="ratings" className="mt-4">
          <RatingsTab
            professionalId={id}
            ratings={pro.ratings}
            ratingAvg={pro.stats.ratingAvg}
            ratingCount={pro.stats.ratingCount}
          />
        </TabsContent>
        <TabsContent value="notes" className="mt-4">
          <NotesTagsTab professionalId={id} notes={pro.timelineNotes} tags={pro.tags} />
        </TabsContent>
        <TabsContent value="payments" className="mt-4">
          <PaymentsTab professionalId={id} />
        </TabsContent>
      </Tabs>

      <TierDialog
        open={tierOpen}
        onOpenChange={setTierOpen}
        professionalId={id}
        currentTier={pro.tier}
        currentReason={pro.blockedReason}
      />
      <AvailabilityDialog
        open={availOpen}
        onOpenChange={setAvailOpen}
        professionalId={id}
        currentAvailability={pro.availability}
        currentUntil={pro.availableUntil}
      />
      <EditProfessionalDialog open={editOpen} onOpenChange={setEditOpen} professional={pro} />
    </div>
  );
}
