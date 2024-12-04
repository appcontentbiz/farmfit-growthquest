export interface Tool {
  id: string;
  name: string;
  description: string;
  requiredTier: string;
}

export interface FarmingModule {
  id: string;
  name: string;
  description: string;
  category: FarmingCategory;
  tools: Tool[];
  features: ModuleFeature[];
  requiredTier: string;
}

export interface ModuleFeature {
  id: string;
  name: string;
  description: string;
  isAdvanced: boolean;
}

export enum FarmingCategory {
  BIORHYTHM = 'biorhythm',
  METAVERSE = 'metaverse',
  GENETICS = 'genetics',
  ATMOSPHERIC = 'atmospheric',
  MICRO_ECOSYSTEM = 'micro-ecosystem',
  TIME_BANKING = 'time-banking',
  BIOMIMICRY = 'biomimicry',
  QUANTUM = 'quantum',
  NEURAL = 'neural',
  REGENERATIVE = 'regenerative',
  BLOCKCHAIN = 'blockchain',
  BIOFEEDBACK = 'biofeedback',
  SOCIAL_IMPACT = 'social-impact',
  FUTURE_FOOD = 'future-food',
  HERITAGE = 'heritage'
}
