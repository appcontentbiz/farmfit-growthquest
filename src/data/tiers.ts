import { Tier, TierLevel } from '../types/tiers';

export const tiers: Tier[] = [
  {
    id: TierLevel.BASIC,
    name: 'Green Thumb Starter',
    price: 0,
    description: 'Perfect for beginners starting their agricultural journey',
    features: [
      {
        id: 'plant-personality',
        name: 'Plant Personality Quiz',
        description: 'Find your perfect plant match based on lifestyle and preferences',
        isAvailable: true
      },
      {
        id: 'light-meter',
        name: 'Daily Light Meter',
        description: 'Measure sunlight levels using your phone camera',
        isAvailable: true
      },
      {
        id: 'window-planner',
        name: 'Window Sill Planner',
        description: 'Optimize your window space for plant growth',
        isAvailable: true
      },
      {
        id: 'plant-story',
        name: 'Plant Story Time',
        description: 'Daily educational content in story format',
        isAvailable: true
      },
      {
        id: 'basic-ai-doctor',
        name: 'Virtual Plant Doctor',
        description: 'Basic AI-powered plant health diagnostics',
        isAvailable: true
      }
    ]
  },
  {
    id: TierLevel.EXPLORER,
    name: 'Garden Explorer',
    price: 4.99,
    description: 'For enthusiasts ready to expand their growing skills',
    features: [
      {
        id: 'time-lapse',
        name: 'Growth Time-Lapse',
        description: 'Document your plants growth journey automatically',
        isAvailable: true
      },
      {
        id: 'tool-maintenance',
        name: 'Tool Maintenance Guide',
        description: 'Interactive tutorials for proper tool care',
        isAvailable: true
      },
      {
        id: 'expert-qa',
        name: 'Local Expert Q&A',
        description: 'Connect with local gardening experts',
        isAvailable: true
      },
      {
        id: 'harvest-calc',
        name: 'Harvest Calculator',
        description: 'Predict harvest times and yields',
        isAvailable: true
      },
      {
        id: 'recipe-matcher',
        name: 'Seasonal Recipe Matcher',
        description: 'Find recipes for your current harvest',
        isAvailable: true
      }
    ]
  },
  {
    id: TierLevel.PROFESSIONAL,
    name: 'Garden Professional',
    price: 19.99,
    description: 'For agricultural entrepreneurs and small farm operators',
    features: [
      {
        id: 'market-analyzer',
        name: 'Market Price Analyzer',
        description: 'Real-time market price analysis and predictions',
        isAvailable: true
      },
      {
        id: 'equipment-network',
        name: 'Equipment Sharing Network',
        description: 'Connect with local equipment sharing opportunities',
        isAvailable: true
      },
      {
        id: 'labor-management',
        name: 'Labor Management',
        description: 'Comprehensive workforce planning and scheduling',
        isAvailable: true
      },
      {
        id: 'compliance-tracker',
        name: 'Compliance Tracker',
        description: 'Stay updated with agricultural regulations',
        isAvailable: true
      },
      {
        id: 'wholesale-connect',
        name: 'Wholesale Connection',
        description: 'Direct connection to bulk buyers',
        isAvailable: true
      }
    ]
  },
  {
    id: TierLevel.MASTER,
    name: 'Master Cultivator',
    price: 49.99,
    description: 'For agricultural innovators and large-scale operators',
    features: [
      {
        id: 'predictive-analytics',
        name: 'Predictive Analytics',
        description: 'Advanced AI for yield and market predictions',
        isAvailable: true
      },
      {
        id: 'research-network',
        name: 'Research Network',
        description: 'Connect with agricultural research institutions',
        isAvailable: true
      },
      {
        id: 'global-market',
        name: 'Global Market Access',
        description: 'International produce trading platform',
        isAvailable: true
      },
      {
        id: 'custom-api',
        name: 'Custom Integration API',
        description: 'Integrate with existing farm systems',
        isAvailable: true
      },
      {
        id: 'innovation-lab',
        name: 'Innovation Lab',
        description: 'Early access to emerging technologies',
        isAvailable: true
      }
    ]
  },
  {
    id: TierLevel.LEGACY,
    name: 'Legacy Pioneer',
    price: 999,
    description: 'The ultimate package for agricultural visionaries',
    isLifetime: true,
    features: [
      {
        id: 'knowledge-archive',
        name: 'Knowledge Archive',
        description: 'Create and preserve farming knowledge',
        isAvailable: true
      },
      {
        id: 'global-mentor',
        name: 'Global Mentor Network',
        description: 'Connect with master farmers worldwide',
        isAvailable: true
      },
      {
        id: 'research-participation',
        name: 'Research Participation',
        description: 'Priority access to agricultural studies',
        isAvailable: true
      },
      {
        id: 'legacy-planning',
        name: 'Legacy Planning',
        description: 'Farm succession and transition tools',
        isAvailable: true
      },
      {
        id: 'innovation-council',
        name: 'Innovation Council',
        description: 'Shape the future of farming technology',
        isAvailable: true
      }
    ]
  }
];
