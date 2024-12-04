export type HealthStatus = 'HEALTHY' | 'ATTENTION' | 'CRITICAL';

export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';

export interface Livestock {
  id: string;
  name: string;
  breed: string;
  species: string;
  age: number;
  weight: number;
  healthStatus: HealthStatus;
  lastCheckup: string;
  birthDate?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  tags: string[];
  notes?: string;
  location?: string;
}

export interface HealthMetric {
  date: string;
  score: number;
  temperature: number;
  heartRate: number;
  respirationRate: number;
  feedIntake?: number;
  waterIntake?: number;
}

export interface Alert {
  id: string;
  severity: AlertSeverity;
  message: string;
  timestamp: string;
  status: AlertStatus;
}

export interface HealthRecord {
  id: string;
  date: string;
  type: string;
  description: string;
  performer: string;
  medications?: string[];
  notes?: string;
}

export interface Vaccination {
  id: string;
  date: string;
  type: string;
  dueDate: string;
  performer: string;
  notes?: string;
}

export interface NutritionPlan {
  feedType: string;
  dailyAmount: number;
  frequency: number;
  supplements?: string[];
  notes?: string;
}

export interface LivestockOverview {
  livestock: Livestock[];
  healthMetrics: HealthMetric[];
  alerts: Alert[];
}

export interface HealthAnalytics {
  dailyMetrics: HealthMetric[];
  trends: {
    metric: string;
    trend: 'UP' | 'DOWN' | 'STABLE';
    change: number;
    recommendation?: string;
  }[];
  predictions: {
    metric: string;
    value: number;
    confidence: number;
    factors: string[];
  }[];
  anomalies: {
    date: string;
    metric: string;
    value: number;
    severity: AlertSeverity;
    description: string;
  }[];
}

export interface LivestockInput {
  name: string;
  breed: string;
  species: string;
  age: number;
  weight: number;
  birthDate?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  tags: string[];
  notes?: string;
  location?: string;
}

export interface HealthRecordInput {
  date: string;
  type: string;
  description: string;
  performer: string;
  medications?: string[];
  notes?: string;
}

export interface VaccinationInput {
  date: string;
  type: string;
  dueDate: string;
  performer: string;
  notes?: string;
}

export interface NutritionPlanInput {
  feedType: string;
  dailyAmount: number;
  frequency: number;
  supplements?: string[];
  notes?: string;
}

export interface HealthMetricInput {
  date: string;
  temperature: number;
  heartRate: number;
  respirationRate: number;
  feedIntake?: number;
  waterIntake?: number;
}
