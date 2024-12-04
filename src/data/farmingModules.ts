import { FarmingModule, FarmingCategory } from '../types/farming';
import { TierLevel } from '../types/tiers';

export const farmingModules: FarmingModule[] = [
  {
    id: 'biorhythm-agriculture',
    name: 'Biorhythm Agriculture',
    description: 'Advanced biological rhythm monitoring and optimization',
    category: FarmingCategory.BIORHYTHM,
    requiredTier: TierLevel.PROFESSIONAL,
    tools: [
      {
        id: 'bioelectric-sensor',
        name: 'Bioelectric Signal Monitor',
        description: 'Monitor plant and animal stress through bioelectrical signals',
        requiredTier: TierLevel.PROFESSIONAL
      },
      {
        id: 'circadian-optimizer',
        name: 'Circadian Rhythm Optimizer',
        description: 'Optimize growth cycles with natural rhythms',
        requiredTier: TierLevel.PROFESSIONAL
      },
      {
        id: 'lunar-calendar',
        name: 'Lunar Phase Integration',
        description: 'Align farming activities with moon phases',
        requiredTier: TierLevel.PROFESSIONAL
      }
    ],
    features: [
      {
        id: 'stress-monitoring',
        name: 'Real-time Stress Monitoring',
        description: 'Monitor plant and animal stress levels',
        isAdvanced: false
      },
      {
        id: 'growth-optimization',
        name: 'Growth Cycle Optimization',
        description: 'Optimize growth cycles with natural rhythms',
        isAdvanced: true
      }
    ]
  },
  {
    id: 'agricultural-metaverse',
    name: 'Agricultural Metaverse',
    description: 'Virtual farming experience and training platform',
    category: FarmingCategory.METAVERSE,
    requiredTier: TierLevel.MASTER,
    tools: [
      {
        id: 'virtual-farm',
        name: 'Virtual Farm Creator',
        description: 'Create and manage virtual farm environments',
        requiredTier: TierLevel.MASTER
      },
      {
        id: 'equipment-simulator',
        name: 'Equipment Training Simulator',
        description: 'Practice with virtual farming equipment',
        requiredTier: TierLevel.MASTER
      },
      {
        id: 'virtual-marketplace',
        name: 'Virtual Marketplace',
        description: 'Trade and collaborate in virtual space',
        requiredTier: TierLevel.MASTER
      }
    ],
    features: [
      {
        id: 'virtual-training',
        name: 'Virtual Training Sessions',
        description: 'Learn farming techniques in VR',
        isAdvanced: false
      },
      {
        id: 'global-collaboration',
        name: 'Global Collaboration Space',
        description: 'Connect with farmers worldwide',
        isAdvanced: true
      }
    ]
  },
  {
    id: 'quantum-agriculture',
    name: 'Quantum Agriculture',
    description: 'Cutting-edge quantum-based farming solutions',
    category: FarmingCategory.QUANTUM,
    requiredTier: TierLevel.LEGACY,
    tools: [
      {
        id: 'quantum-sensor',
        name: 'Quantum Sensor Network',
        description: 'Advanced quantum sensing for crop optimization',
        requiredTier: TierLevel.LEGACY
      },
      {
        id: 'entanglement-comm',
        name: 'Quantum Communication',
        description: 'Secure and instant farm-wide communication',
        requiredTier: TierLevel.LEGACY
      }
    ],
    features: [
      {
        id: 'quantum-optimization',
        name: 'Quantum Computing Optimization',
        description: 'Advanced resource and yield optimization',
        isAdvanced: true
      },
      {
        id: 'energy-manipulation',
        name: 'Quantum Energy Field Management',
        description: 'Manipulate energy fields for optimal growth',
        isAdvanced: true
      }
    ]
  }
];
