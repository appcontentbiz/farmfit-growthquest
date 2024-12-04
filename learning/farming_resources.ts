import { VideoResource } from '../types/resources';
import { FarmingLevel } from '../types/user_profile';
import { TherapeuticBenefit } from '../types/health';
import { MusicTherapy } from '../therapy/music_therapy';

interface LearningResource {
    title: string;
    description: string;
    level: FarmingLevel;
    type: 'video' | 'article' | 'interactive' | 'workshop';
    category: string[];
    duration: number; // in minutes
    therapeuticBenefits?: TherapeuticBenefit[];
    musicIntegration?: boolean;
}

interface TherapeuticGardeningResource extends LearningResource {
    cognitiveStimulation: string[];
    sensoryEngagement: string[];
    physicalActivity: string[];
    emotionalBenefits: string[];
    socialInteraction: string[];
}

export const RESOURCE_CATEGORIES = {
    BASICS: {
        id: 'basics',
        title: 'Farming Basics',
        subcategories: [
            {
                id: 'getting_started',
                title: 'Getting Started',
                topics: [
                    'Introduction to Farming',
                    'Setting Up Your Farm',
                    'Basic Tools and Equipment'
                ]
            },
            {
                id: 'soil_health',
                title: 'Soil Health',
                topics: [
                    'Soil Composition',
                    'Soil Testing',
                    'Soil Conservation'
                ]
            }
        ]
    },
    SEASONAL: {
        id: 'seasonal',
        title: 'Seasonal Farming',
        subcategories: [
            {
                id: 'planting_schedules',
                title: 'Planting Schedules',
                topics: [
                    'Spring Planting',
                    'Summer Planting',
                    'Fall Planting',
                    'Winter Planting'
                ]
            },
            {
                id: 'seasonal_crops',
                title: 'Seasonal Crops',
                topics: [
                    'Spring Crops',
                    'Summer Crops',
                    'Fall Crops',
                    'Winter Crops'
                ]
            }
        ]
    },
    TOOLS: {
        id: 'tools',
        title: 'Farming Tools and Equipment',
        subcategories: [
            {
                id: 'hand_tools',
                title: 'Hand Tools',
                topics: [
                    'Gloves',
                    'Hoes',
                    'Rakes',
                    'Shovels'
                ]
            },
            {
                id: 'power_equipment',
                title: 'Power Equipment',
                topics: [
                    'Tractors',
                    'Mowers',
                    'Plows',
                    'Irrigation Systems'
                ]
            }
        ]
    },
    LIVESTOCK_CARE: {
        id: 'livestock_care',
        title: 'Livestock Care and Management',
        subcategories: [
            {
                id: 'cattle_management',
                title: 'Cattle Management',
                topics: [
                    'Breed Selection',
                    'Nutrition and Feeding',
                    'Health Monitoring',
                    'Reproduction Management',
                    'Handling and Safety'
                ]
            },
            {
                id: 'horse_care',
                title: 'Horse Care',
                topics: [
                    'Equine Health',
                    'Training and Exercise',
                    'Nutrition Requirements',
                    'Stable Management',
                    'Grooming Practices'
                ]
            },
            {
                id: 'veterinary_care',
                title: 'Veterinary Care',
                topics: [
                    'Preventive Medicine',
                    'Emergency Response',
                    'Health Records',
                    'Vaccination Schedules',
                    'Common Ailments'
                ]
            }
        ]
    },
    MARKET_RESOURCES: {
        id: 'market_resources',
        title: 'Agricultural Markets and Services',
        subcategories: [
            {
                id: 'farmers_markets',
                title: 'Farmers Markets',
                topics: [
                    'Market Participation',
                    'Product Presentation',
                    'Pricing Strategies',
                    'Customer Relations',
                    'Local Regulations'
                ]
            },
            {
                id: 'supply_management',
                title: 'Supply Chain Management',
                topics: [
                    'Inventory Control',
                    'Supplier Relations',
                    'Cost Management',
                    'Quality Assurance',
                    'Emergency Supplies'
                ]
            }
        ]
    }
};

export class FarmingResourceSystem {
    private beginnerResources: Map<string, LearningResource[]>;
    private advancedResources: Map<string, LearningResource[]>;
    private therapeuticResources: Map<string, TherapeuticGardeningResource[]>;
    private musicTherapy: MusicTherapy;

    constructor() {
        this.beginnerResources = new Map();
        this.advancedResources = new Map();
        this.therapeuticResources = new Map();
        this.musicTherapy = new MusicTherapy();
        this.initializeResources();
    }

    private initializeResources() {
        // Beginner Resources
        this.initializeBeginnerResources();
        
        // Advanced Resources
        this.initializeAdvancedResources();
        
        // Therapeutic Resources
        this.initializeTherapeuticResources();
    }

    private initializeBeginnerResources() {
        const beginnerCategories = {
            'basics': [
                {
                    title: 'Introduction to Farming',
                    description: 'Basic concepts and principles for beginners',
                    level: 'beginner',
                    type: 'video',
                    category: ['basics', 'education'],
                    duration: 30
                },
                {
                    title: 'Understanding Soil Health',
                    description: 'Learn about soil composition and maintenance',
                    level: 'beginner',
                    type: 'interactive',
                    category: ['soil', 'education'],
                    duration: 45
                }
            ],
            'seasonal': [
                {
                    title: 'Seasonal Planting Guide',
                    description: 'When to plant different crops',
                    level: 'beginner',
                    type: 'article',
                    category: ['planning', 'seasons'],
                    duration: 20
                }
            ],
            'tools': [
                {
                    title: 'Essential Farming Tools',
                    description: 'Basic tools every farmer needs',
                    level: 'beginner',
                    type: 'video',
                    category: ['tools', 'equipment'],
                    duration: 25
                }
            ]
        };

        Object.entries(beginnerCategories).forEach(([category, resources]) => {
            this.beginnerResources.set(category, resources);
        });
    }

    private initializeAdvancedResources() {
        const advancedCategories = {
            'advanced_techniques': [
                {
                    title: 'Advanced Crop Rotation',
                    description: 'Complex rotation patterns for optimal yield',
                    level: 'advanced',
                    type: 'workshop',
                    category: ['techniques', 'planning'],
                    duration: 60
                },
                {
                    title: 'Sustainable Farming Systems',
                    description: 'Implementing sustainable practices',
                    level: 'advanced',
                    type: 'video',
                    category: ['sustainability', 'management'],
                    duration: 90
                }
            ],
            'technology': [
                {
                    title: 'Smart Farming Technologies',
                    description: 'Integration of IoT and AI in farming',
                    level: 'advanced',
                    type: 'interactive',
                    category: ['technology', 'innovation'],
                    duration: 120
                }
            ],
            'business': [
                {
                    title: 'Farm Business Management',
                    description: 'Advanced business strategies for farms',
                    level: 'advanced',
                    type: 'workshop',
                    category: ['business', 'management'],
                    duration: 180
                }
            ]
        };

        Object.entries(advancedCategories).forEach(([category, resources]) => {
            this.advancedResources.set(category, resources);
        });
    }

    private initializeTherapeuticResources() {
        const therapeuticCategories = {
            'stress-reduction': [
                {
                    title: 'Mindful Plant Care',
                    description: 'Learn mindful gardening techniques for stress reduction',
                    level: 'beginner',
                    type: 'workshop',
                    category: ['therapeutic', 'mindfulness'],
                    duration: 45,
                    therapeuticBenefits: ['stress-reduction', 'mindfulness'],
                    musicIntegration: true,
                    cognitiveStimulation: ['attention', 'memory'],
                    sensoryEngagement: ['touch', 'smell', 'sight'],
                    physicalActivity: ['light-gardening', 'stretching'],
                    emotionalBenefits: ['relaxation', 'accomplishment'],
                    socialInteraction: ['group-activities', 'sharing-experiences']
                }
            ],
            'cognitive-enhancement': [
                {
                    title: 'Garden Planning for Brain Health',
                    description: 'Design and plan gardens to enhance cognitive function',
                    level: 'intermediate',
                    type: 'interactive',
                    category: ['therapeutic', 'planning'],
                    duration: 60,
                    therapeuticBenefits: ['cognitive-enhancement', 'problem-solving'],
                    musicIntegration: false,
                    cognitiveStimulation: ['planning', 'spatial-awareness', 'decision-making'],
                    sensoryEngagement: ['visual-planning', 'tactile-learning'],
                    physicalActivity: ['garden-design', 'measurement'],
                    emotionalBenefits: ['confidence', 'creativity'],
                    socialInteraction: ['collaborative-planning', 'knowledge-sharing']
                }
            ],
            'physical-therapy': [
                {
                    title: 'Adaptive Gardening Techniques',
                    description: 'Learn gardening methods adapted for physical therapy',
                    level: 'beginner',
                    type: 'video',
                    category: ['therapeutic', 'physical-health'],
                    duration: 30,
                    therapeuticBenefits: ['physical-rehabilitation', 'strength-building'],
                    musicIntegration: true,
                    cognitiveStimulation: ['body-awareness', 'movement-planning'],
                    sensoryEngagement: ['proprioception', 'balance'],
                    physicalActivity: ['adapted-movements', 'strengthening'],
                    emotionalBenefits: ['independence', 'achievement'],
                    socialInteraction: ['peer-support', 'group-exercises']
                }
            ]
        };

        for (const [category, resources] of Object.entries(therapeuticCategories)) {
            this.therapeuticResources.set(category, resources);
        }
    }

    public getBeginnerResources(category?: string): LearningResource[] {
        if (category) {
            return this.beginnerResources.get(category) || [];
        }
        return Array.from(this.beginnerResources.values()).flat();
    }

    public getAdvancedResources(category?: string): LearningResource[] {
        if (category) {
            return this.advancedResources.get(category) || [];
        }
        return Array.from(this.advancedResources.values()).flat();
    }

    public getTherapeuticResources(category?: string): TherapeuticGardeningResource[] {
        if (category) {
            return this.therapeuticResources.get(category) || [];
        }
        return Array.from(this.therapeuticResources.values()).flat();
    }

    public getTherapeuticResourcesByBenefit(benefit: string): TherapeuticGardeningResource[] {
        const allResources: TherapeuticGardeningResource[] = [];
        this.therapeuticResources.forEach(resources => {
            resources.forEach(resource => {
                if (resource.therapeuticBenefits?.includes(benefit)) {
                    allResources.push(resource);
                }
            });
        });
        return allResources;
    }

    public getResourcesWithMusicTherapy(): LearningResource[] {
        const allResources: LearningResource[] = [];
        this.therapeuticResources.forEach(resources => {
            resources.forEach(resource => {
                if (resource.musicIntegration) {
                    allResources.push(resource);
                }
            });
        });
        return allResources;
    }

    public getPersonalizedLearningPath(userLevel: FarmingLevel, interests: string[]): LearningResource[] {
        const personalizedPath: LearningResource[] = [];
        const allResources = this.getAllResources();

        // Filter and sort resources based on user level and interests
        const relevantResources = allResources.filter(resource => {
            const levelMatch = resource.level === userLevel;
            const interestMatch = resource.category.some(cat => interests.includes(cat));
            return levelMatch && interestMatch;
        });

        // Sort by duration (shorter lessons first)
        relevantResources.sort((a, b) => a.duration - b.duration);

        return relevantResources;
    }

    private getAllResources(): LearningResource[] {
        const allResources: LearningResource[] = [];
        
        // Combine resources from all categories
        this.beginnerResources.forEach(resources => allResources.push(...resources));
        this.advancedResources.forEach(resources => allResources.push(...resources));
        this.therapeuticResources.forEach(resources => allResources.push(...resources));

        return allResources;
    }

    public async getResourceWithMusic(
        resourceId: string,
        therapeuticFocus: string[]
    ): Promise<{
        resource: TherapeuticGardeningResource;
        musicPlaylist: string[];
    }> {
        const resource = this.findResourceById(resourceId);
        if (!resource || !resource.musicIntegration) {
            throw new Error('Resource not found or does not support music integration');
        }

        const playlist = await this.musicTherapy.generatePlaylist(
            therapeuticFocus,
            resource.duration
        );

        return {
            resource: resource as TherapeuticGardeningResource,
            musicPlaylist: playlist
        };
    }

    private findResourceById(resourceId: string): LearningResource | null {
        // Search through all resources to find matching ID
        const allResources = [
            ...Array.from(this.beginnerResources.values()).flat(),
            ...Array.from(this.advancedResources.values()).flat(),
            ...Array.from(this.therapeuticResources.values()).flat()
        ];

        return allResources.find(resource => resource.title === resourceId) || null;
    }
}
