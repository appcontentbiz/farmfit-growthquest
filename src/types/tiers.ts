export enum TierLevel {
  BASIC = 'basic',
  EXPLORER = 'explorer',
  PROFESSIONAL = 'professional',
  MASTER = 'master',
  LEGACY = 'legacy'
}

export interface TierFeature {
  id: string;
  name: string;
  description: string;
  isAvailable: boolean;
}

export interface Tier {
  id: TierLevel;
  name: string;
  price: number;
  description: string;
  features: TierFeature[];
  isLifetime?: boolean;
}
