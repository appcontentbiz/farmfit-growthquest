export enum TreatmentStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  SCHEDULED = 'SCHEDULED',
}

export enum TreatmentPriority {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: number;
  startDate: string;
  endDate: string;
  notes?: string;
}

export interface Treatment {
  id: string;
  animalId: string;
  animalName: string;
  condition: string;
  treatment: string;
  startDate: string;
  endDate: string;
  status: TreatmentStatus;
  priority: TreatmentPriority;
  notes?: string;
  nextCheckup?: string;
  prescribedBy: string;
  medications: Medication[];
  createdAt: string;
  updatedAt: string;
}

export interface TreatmentStats {
  totalActive: number;
  totalScheduled: number;
  totalCompleted: number;
  upcomingCheckups: number;
  criticalTreatments: number;
}

export interface TherapeuticOverview {
  treatments: Treatment[];
  stats: TreatmentStats;
}

export interface MedicationInput {
  name: string;
  dosage: string;
  frequency: string;
  duration: number;
  notes?: string;
}

export interface AddTreatmentInput {
  animalId: string;
  condition: string;
  treatment: string;
  startDate: string;
  endDate: string;
  priority: TreatmentPriority;
  notes?: string;
  nextCheckup?: string;
  prescribedBy: string;
  medications: MedicationInput[];
}

export interface UpdateTreatmentInput {
  id: string;
  condition?: string;
  treatment?: string;
  startDate?: string;
  endDate?: string;
  status?: TreatmentStatus;
  priority?: TreatmentPriority;
  notes?: string;
  nextCheckup?: string;
  prescribedBy?: string;
  medications?: MedicationInput[];
}

export interface TreatmentReminder {
  treatmentId: string;
  animalName: string;
  medicationName: string;
  dueDate: string;
  priority: TreatmentPriority;
  message: string;
}

export interface MedicationScheduleConflict {
  medication1: string;
  medication2: string;
  conflictType: 'TIMING' | 'INTERACTION';
  description: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  recommendation?: string;
}

export interface TreatmentAnalytics {
  treatmentId: string;
  progress: number;
  adherence: number;
  effectiveness: number;
  costEfficiency: number;
  timelineDeviation: number;
  recommendations: string[];
}

export interface MedicationHistory {
  medicationId: string;
  treatmentId: string;
  administeredAt: string;
  administeredBy: string;
  dosageGiven: string;
  notes?: string;
  effectiveness?: number;
  sideEffects?: string[];
}

export interface TreatmentReport {
  treatmentId: string;
  generatedAt: string;
  duration: number;
  totalMedications: number;
  completionRate: number;
  effectiveness: number;
  complications: string[];
  recommendations: string[];
  costAnalysis: {
    medications: number;
    consultations: number;
    procedures: number;
    total: number;
  };
}
