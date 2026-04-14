import type { InspectionChecklistStatus, InspectionItemStatus, PropertySector } from '../enums';

// Derived from the canonical enum in enums.ts — do not redeclare as union here
export type { InspectionChecklistStatus, InspectionItemStatus } from '../enums';

export interface InspectionItem {
  id: string;
  checklistId: string;
  sector: PropertySector;
  name: string;
  description: string | null;
  status: InspectionItemStatus;
  finding: string | null;
  photoUrl: string | null;
  taskId: string | null;
  taskTemplateId: string | null;
  inspectionGuide: string | null;
  guideImageUrls: string[];
  isCustom: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface InspectionChecklist {
  id: string;
  propertyId: string;
  inspectedBy: string;
  inspectedAt: string;
  notes: string | null;
  status: InspectionChecklistStatus;
  completedAt: string | null;
  items: InspectionItem[];
  createdAt: string;
  updatedAt: string;
}
