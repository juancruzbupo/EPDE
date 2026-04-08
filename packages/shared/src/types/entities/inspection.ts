import type { PropertySector } from '../enums';

export type InspectionItemStatus = 'PENDING' | 'OK' | 'NEEDS_ATTENTION' | 'NEEDS_PROFESSIONAL';

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
  items: InspectionItem[];
  createdAt: string;
  updatedAt: string;
}
