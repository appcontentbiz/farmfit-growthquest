import { UserProfile } from '../types/user';
import { NotificationSystem } from './notification_system';

export enum AchievementCategory {
    SUSTAINABILITY = 'sustainability',
    ANALYTICS = 'analytics',
    COMMUNITY = 'community',
    LIVESTOCK = 'livestock',
    MARKET = 'market',
    THERAPEUTIC = 'therapeutic'
}

interface Achievement {
    id: string;
    name: string;
    description: string;
    category: AchievementCategory;
    points: number;
    icon: string;
    requirements: {
        type: string;
        value: number;
    }[];
}

interface Quest {
    id: string;
    name: string;
    description: string;
    category: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    rewards: {
        points: number;
        achievements?: string[];
        badges?: string[];
    };
    steps: {
        description: string;
        completed: boolean;
    }[];
    deadline?: Date;
}

interface UserProgress {
    userId: string;
    level: number;
    experience: number;
    achievements: string[];
    badges: string[];
    currentQuests: Quest[];
    completedQuests: string[];
    streaks: {
        daily: number;
        weekly: number;
    };
}

export class GamificationSystem {
    private achievements: Map<string, Achievement>;
    private quests: Map<string, Quest>;
    private userProgress: Map<string, UserProgress>;
    private notificationSystem: NotificationSystem;

    constructor(notificationSystem: NotificationSystem) {
        this.achievements = new Map();
        this.quests = new Map();
        this.userProgress = new Map();
        this.notificationSystem = notificationSystem;
        this.initializeAchievements();
        this.initializeQuests();
    }

    private initializeAchievements() {
        const achievements: Achievement[] = [
            {
                id: 'first_harvest',
                name: 'First Harvest',
                description: 'Complete your first hemp harvest',
                category: AchievementCategory.SUSTAINABILITY,
                points: 100,
                icon: 'harvest_icon',
                requirements: [
                    { type: 'harvest_count', value: 1 }
                ]
            },
            {
                id: 'therapeutic_master',
                name: 'Therapeutic Master',
                description: 'Complete 10 therapeutic gardening sessions',
                category: AchievementCategory.THERAPEUTIC,
                points: 200,
                icon: 'therapy_icon',
                requirements: [
                    { type: 'therapy_sessions', value: 10 }
                ]
            },
            {
                id: 'community_helper',
                name: 'Community Helper',
                description: 'Help 5 other farmers with their questions',
                category: AchievementCategory.COMMUNITY,
                points: 150,
                icon: 'helper_icon',
                requirements: [
                    { type: 'help_count', value: 5 }
                ]
            },
            {
                id: 'sustainable_pioneer',
                name: 'Sustainable Pioneer',
                description: 'Achieve excellent resource efficiency across all farming operations',
                category: AchievementCategory.SUSTAINABILITY,
                points: 500,
                icon: 'eco_leaf',
                requirements: [
                    { type: 'water_efficiency', value: 0.9 },
                    { type: 'energy_efficiency', value: 0.85 },
                    { type: 'waste_reduction', value: 0.8 }
                ]
            },
            {
                id: 'analytics_master',
                name: 'Analytics Master',
                description: 'Successfully utilize all specialized analytics systems',
                category: AchievementCategory.ANALYTICS,
                points: 750,
                icon: 'analytics_chart',
                requirements: [
                    { type: 'grain_analytics_usage', value: 10 },
                    { type: 'hemp_analytics_usage', value: 10 },
                    { type: 'aquaponics_analytics_usage', value: 10 }
                ]
            },
            {
                id: 'community_mentor',
                name: 'Community Mentor',
                description: 'Help other farmers by sharing knowledge and experience',
                category: AchievementCategory.COMMUNITY,
                points: 600,
                icon: 'mentor_star',
                requirements: [
                    { type: 'knowledge_shares', value: 20 },
                    { type: 'helpful_votes', value: 50 },
                    { type: 'mentor_sessions', value: 5 }
                ]
            },
            {
                id: 'livestock_master',
                name: 'Livestock Master',
                description: 'Demonstrate excellence in livestock care and management',
                category: AchievementCategory.LIVESTOCK,
                points: 500,
                icon: 'livestock_icon',
                requirements: [
                    { type: 'livestock_health_score', value: 90 }
                ]
            },
            {
                id: 'veterinary_network',
                name: 'Veterinary Network',
                description: 'Build a comprehensive network of veterinary care providers',
                category: AchievementCategory.LIVESTOCK,
                points: 300,
                icon: 'veterinary_icon',
                requirements: [
                    { type: 'veterinary_connections', value: 5 }
                ]
            },
            {
                id: 'market_pioneer',
                name: 'Market Pioneer',
                description: 'Actively participate in local farmers markets',
                category: AchievementCategory.MARKET,
                points: 400,
                icon: 'market_icon',
                requirements: [
                    { type: 'market_participation', value: 10 }
                ]
            },
            {
                id: 'supply_chain_master',
                name: 'Supply Chain Master',
                description: 'Optimize farm supply management',
                category: AchievementCategory.MARKET,
                points: 350,
                icon: 'supply_chain_icon',
                requirements: [
                    { type: 'supply_chain_efficiency', value: 85 }
                ]
            }
        ];

        achievements.forEach(achievement => {
            this.achievements.set(achievement.id, achievement);
        });
    }

    private initializeQuests() {
        const quests: Quest[] = [
            {
                id: 'hemp_basics',
                name: 'Hemp Farming Basics',
                description: 'Learn the fundamentals of hemp cultivation',
                category: 'farming',
                difficulty: 'beginner',
                rewards: {
                    points: 300,
                    achievements: ['hemp_apprentice']
                },
                steps: [
                    { description: 'Complete hemp cultivation course', completed: false },
                    { description: 'Set up growing area', completed: false },
                    { description: 'Plant first hemp seeds', completed: false }
                ]
            },
            {
                id: 'therapeutic_journey',
                name: 'Therapeutic Gardening Journey',
                description: 'Start your therapeutic gardening practice',
                category: 'therapy',
                difficulty: 'beginner',
                rewards: {
                    points: 250,
                    badges: ['therapy_initiate']
                },
                steps: [
                    { description: 'Create therapeutic garden plan', completed: false },
                    { description: 'Complete first guided session', completed: false },
                    { description: 'Record your experience', completed: false }
                ]
            },
            {
                id: 'water_efficiency',
                name: 'Water Conservation Champion',
                description: 'Optimize water usage across your farming operations',
                category: 'sustainability',
                difficulty: 'intermediate',
                rewards: {
                    points: 300,
                    achievements: ['sustainable_pioneer'],
                    badges: ['water_sage']
                },
                steps: [
                    { description: 'Implement water monitoring systems', completed: false },
                    { description: 'Achieve 85% water efficiency', completed: false },
                    { description: 'Share water conservation tips', completed: false }
                ]
            },
            {
                id: 'analytics_mastery',
                name: 'Analytics Integration Expert',
                description: 'Master the use of FarmFit analytics systems',
                category: 'analytics',
                difficulty: 'advanced',
                rewards: {
                    points: 500,
                    achievements: ['analytics_master'],
                    badges: ['data_wizard']
                },
                steps: [
                    { description: 'Use all specialized analytics systems', completed: false },
                    { description: 'Generate comprehensive reports', completed: false },
                    { description: 'Optimize based on analytics insights', completed: false }
                ]
            },
            {
                id: 'community_building',
                name: 'Community Builder',
                description: 'Foster community engagement and knowledge sharing',
                category: 'community',
                difficulty: 'intermediate',
                rewards: {
                    points: 400,
                    achievements: ['community_mentor'],
                    badges: ['community_pillar']
                },
                steps: [
                    { description: 'Share farming success stories', completed: false },
                    { description: 'Mentor new platform users', completed: false },
                    { description: 'Organize community events', completed: false }
                ]
            }
        ];

        quests.forEach(quest => {
            this.quests.set(quest.id, quest);
        });
    }

    public async awardAchievement(
        userId: string,
        achievementId: string
    ): Promise<boolean> {
        const achievement = this.achievements.get(achievementId);
        const progress = this.userProgress.get(userId);

        if (!achievement || !progress) return false;

        if (!progress.achievements.includes(achievementId)) {
            progress.achievements.push(achievementId);
            progress.experience += achievement.points;
            
            await this.notificationSystem.sendAchievementNotification(
                userId,
                achievement.name,
                achievement.description
            );

            await this.checkLevelUp(userId);
            return true;
        }
        return false;
    }

    public async startQuest(
        userId: string,
        questId: string
    ): Promise<boolean> {
        const quest = this.quests.get(questId);
        const progress = this.userProgress.get(userId);

        if (!quest || !progress) return false;

        if (!progress.currentQuests.find(q => q.id === questId)) {
            progress.currentQuests.push(quest);
            await this.notificationSystem.sendNotification({
                id: `quest_${Date.now()}`,
                userId,
                type: 'event',
                title: 'New Quest Started',
                content: `You've started the quest: ${quest.name}`,
                timestamp: new Date(),
                read: false,
                priority: 'medium',
                category: 'quests'
            });
            return true;
        }
        return false;
    }

    public async completeQuestStep(
        userId: string,
        questId: string,
        stepIndex: number
    ): Promise<boolean> {
        const progress = this.userProgress.get(userId);
        if (!progress) return false;

        const quest = progress.currentQuests.find(q => q.id === questId);
        if (!quest || stepIndex >= quest.steps.length) return false;

        quest.steps[stepIndex].completed = true;

        if (quest.steps.every(step => step.completed)) {
            await this.completeQuest(userId, questId);
        }
        return true;
    }

    private async completeQuest(
        userId: string,
        questId: string
    ): Promise<void> {
        const progress = this.userProgress.get(userId);
        if (!progress) return;

        const questIndex = progress.currentQuests.findIndex(q => q.id === questId);
        if (questIndex === -1) return;

        const quest = progress.currentQuests[questIndex];
        progress.currentQuests.splice(questIndex, 1);
        progress.completedQuests.push(questId);
        progress.experience += quest.rewards.points;

        if (quest.rewards.achievements) {
            for (const achievementId of quest.rewards.achievements) {
                await this.awardAchievement(userId, achievementId);
            }
        }

        await this.notificationSystem.sendNotification({
            id: `quest_complete_${Date.now()}`,
            userId,
            type: 'achievement',
            title: 'Quest Completed',
            content: `Congratulations! You've completed the quest: ${quest.name}`,
            timestamp: new Date(),
            read: false,
            priority: 'high',
            category: 'quests'
        });

        await this.checkLevelUp(userId);
    }

    private async checkLevelUp(userId: string): Promise<void> {
        const progress = this.userProgress.get(userId);
        if (!progress) return;

        const newLevel = Math.floor(progress.experience / 1000) + 1;
        if (newLevel > progress.level) {
            progress.level = newLevel;
            await this.notificationSystem.sendNotification({
                id: `level_up_${Date.now()}`,
                userId,
                type: 'achievement',
                title: 'Level Up!',
                content: `Congratulations! You've reached level ${newLevel}`,
                timestamp: new Date(),
                read: false,
                priority: 'high',
                category: 'achievements'
            });
        }
    }

    public async checkAnalyticsAchievements(userId: string, analyticsData: any): Promise<void> {
        const userProgress = await this.getUserProgress(userId);
        
        // Check Analytics Master achievement
        const analyticsMaster = this.achievements.get('analytics_master');
        if (analyticsMaster && !userProgress.achievements.includes('analytics_master')) {
            const requirements = analyticsMaster.requirements;
            const allMet = requirements.every(req => 
                analyticsData[req.type] >= req.value
            );
            
            if (allMet) {
                await this.awardAchievement(userId, 'analytics_master');
            }
        }
    }

    public async checkSustainabilityAchievements(userId: string, sustainabilityData: any): Promise<void> {
        const userProgress = await this.getUserProgress(userId);
        
        // Check Sustainable Pioneer achievement
        const sustainablePioneer = this.achievements.get('sustainable_pioneer');
        if (sustainablePioneer && !userProgress.achievements.includes('sustainable_pioneer')) {
            const requirements = sustainablePioneer.requirements;
            const allMet = requirements.every(req => 
                sustainabilityData[req.type] >= req.value
            );
            
            if (allMet) {
                await this.awardAchievement(userId, 'sustainable_pioneer');
            }
        }
    }

    public getLeaderboard(): {
        userId: string;
        level: number;
        experience: number;
    }[] {
        return Array.from(this.userProgress.values())
            .map(progress => ({
                userId: progress.userId,
                level: progress.level,
                experience: progress.experience
            }))
            .sort((a, b) => b.experience - a.experience);
    }

    public getUserProgress(userId: string): UserProgress | undefined {
        return this.userProgress.get(userId);
    }

    public getAvailableQuests(userId: string): Quest[] {
        const progress = this.userProgress.get(userId);
        if (!progress) return [];

        return Array.from(this.quests.values())
            .filter(quest => 
                !progress.completedQuests.includes(quest.id) &&
                !progress.currentQuests.find(q => q.id === quest.id)
            );
    }
}
