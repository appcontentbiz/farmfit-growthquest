import { store } from '../store';
import { TreatmentPriority } from '../types/therapeutic';

export interface NotificationCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  priority: TreatmentPriority;
  autoAssignRules?: {
    keywords: string[];
    animalTypes?: string[];
    conditions?: string[];
  };
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  quietHoursExempt: boolean;
}

class NotificationCategoryService {
  private readonly DEFAULT_CATEGORIES: NotificationCategory[] = [
    {
      id: 'urgent_treatment',
      name: 'Urgent Treatment',
      description: 'Critical health conditions requiring immediate attention',
      icon: 'medical-bag',
      color: '#FF4444',
      priority: TreatmentPriority.HIGH,
      autoAssignRules: {
        keywords: ['emergency', 'critical', 'urgent'],
        conditions: ['fever', 'injury', 'severe'],
      },
      soundEnabled: true,
      vibrationEnabled: true,
      quietHoursExempt: true,
    },
    {
      id: 'routine_checkup',
      name: 'Routine Checkup',
      description: 'Regular health monitoring and preventive care',
      icon: 'calendar-check',
      color: '#33B5E5',
      priority: TreatmentPriority.MEDIUM,
      autoAssignRules: {
        keywords: ['routine', 'regular', 'checkup'],
      },
      soundEnabled: true,
      vibrationEnabled: false,
      quietHoursExempt: false,
    },
    {
      id: 'medication_reminder',
      name: 'Medication',
      description: 'Medication administration schedules',
      icon: 'pill',
      color: '#00C851',
      priority: TreatmentPriority.HIGH,
      autoAssignRules: {
        keywords: ['medicine', 'medication', 'dose'],
      },
      soundEnabled: true,
      vibrationEnabled: true,
      quietHoursExempt: true,
    },
    {
      id: 'vaccination',
      name: 'Vaccination',
      description: 'Vaccination schedules and boosters',
      icon: 'needle',
      color: '#FF8800',
      priority: TreatmentPriority.MEDIUM,
      autoAssignRules: {
        keywords: ['vaccine', 'vaccination', 'booster'],
      },
      soundEnabled: true,
      vibrationEnabled: false,
      quietHoursExempt: false,
    },
    {
      id: 'dietary_update',
      name: 'Dietary Update',
      description: 'Feed changes and nutritional adjustments',
      icon: 'food',
      color: '#2BBBAD',
      priority: TreatmentPriority.LOW,
      autoAssignRules: {
        keywords: ['feed', 'diet', 'nutrition'],
      },
      soundEnabled: false,
      vibrationEnabled: false,
      quietHoursExempt: false,
    },
  ];

  getCategories(): NotificationCategory[] {
    const state = store.getState();
    return state.notifications.categories || this.DEFAULT_CATEGORIES;
  }

  getCategoryById(id: string): NotificationCategory | undefined {
    return this.getCategories().find(category => category.id === id);
  }

  suggestCategory(notification: any): string {
    const categories = this.getCategories();
    let bestMatch: { categoryId: string; matchScore: number } = {
      categoryId: 'default',
      matchScore: 0,
    };

    categories.forEach(category => {
      if (!category.autoAssignRules) return;

      let score = 0;
      const content = `${notification.title} ${notification.message}`.toLowerCase();

      // Check keywords
      category.autoAssignRules.keywords.forEach(keyword => {
        if (content.includes(keyword.toLowerCase())) {
          score += 2;
        }
      });

      // Check animal types
      if (category.autoAssignRules.animalTypes && notification.animalType) {
        if (category.autoAssignRules.animalTypes.includes(notification.animalType)) {
          score += 3;
        }
      }

      // Check conditions
      if (category.autoAssignRules.conditions && notification.condition) {
        if (category.autoAssignRules.conditions.includes(notification.condition.toLowerCase())) {
          score += 3;
        }
      }

      // Consider priority
      if (notification.priority === category.priority) {
        score += 2;
      }

      if (score > bestMatch.matchScore) {
        bestMatch = { categoryId: category.id, matchScore: score };
      }
    });

    return bestMatch.categoryId;
  }

  validateCategory(category: NotificationCategory): boolean {
    return (
      category.id &&
      category.name &&
      category.description &&
      category.icon &&
      category.color &&
      Object.values(TreatmentPriority).includes(category.priority)
    );
  }

  getCategoryStats(categoryId: string): {
    totalNotifications: number;
    readRate: number;
    averageResponseTime: number;
    mostCommonTimes: string[];
  } {
    const state = store.getState();
    const notifications = state.notifications.notifications.filter(
      n => n.categoryId === categoryId
    );

    const readNotifications = notifications.filter(n => n.read);
    const responseTimes = readNotifications.map(n => {
      const scheduleTime = new Date(n.scheduledFor).getTime();
      const readTime = new Date(n.readAt).getTime();
      return readTime - scheduleTime;
    });

    const timeDistribution: { [key: string]: number } = {};
    notifications.forEach(n => {
      const hour = new Date(n.scheduledFor).getHours();
      const timeBlock = this.getTimeBlock(hour);
      timeDistribution[timeBlock] = (timeDistribution[timeBlock] || 0) + 1;
    });

    return {
      totalNotifications: notifications.length,
      readRate: notifications.length > 0 ? readNotifications.length / notifications.length : 0,
      averageResponseTime:
        responseTimes.length > 0
          ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
          : 0,
      mostCommonTimes: Object.entries(timeDistribution)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([time]) => time),
    };
  }

  private getTimeBlock(hour: number): string {
    if (hour < 6) return 'Night (00:00-06:00)';
    if (hour < 12) return 'Morning (06:00-12:00)';
    if (hour < 18) return 'Afternoon (12:00-18:00)';
    return 'Evening (18:00-00:00)';
  }
}

export default new NotificationCategoryService();
