import { addDays, subDays, format, differenceInDays } from 'date-fns';
import { store } from '../store';
import { Treatment, TreatmentPriority } from '../types/therapeutic';

interface PredictionPattern {
  dayOfWeek: number;
  timeOfDay: string;
  frequency: number;
  category: string;
  priority: TreatmentPriority;
}

interface TrendAnalysis {
  patterns: PredictionPattern[];
  peakDays: string[];
  peakTimes: string[];
  commonCategories: { [key: string]: number };
  priorityDistribution: { [key in TreatmentPriority]: number };
}

class NotificationPredictionService {
  private readonly ANALYSIS_PERIOD_DAYS = 30;
  private readonly MIN_PATTERN_FREQUENCY = 3;

  analyzeTrends(notifications: any[]): TrendAnalysis {
    const endDate = new Date();
    const startDate = subDays(endDate, this.ANALYSIS_PERIOD_DAYS);
    
    const recentNotifications = notifications.filter(
      n => new Date(n.scheduledFor) >= startDate
    );

    return {
      patterns: this.identifyPatterns(recentNotifications),
      peakDays: this.findPeakDays(recentNotifications),
      peakTimes: this.findPeakTimes(recentNotifications),
      commonCategories: this.analyzeCategories(recentNotifications),
      priorityDistribution: this.analyzePriorities(recentNotifications)
    };
  }

  predictUpcomingNotifications(days: number = 7): any[] {
    const state = store.getState();
    const notifications = state.notifications.notifications;
    const trends = this.analyzeTrends(notifications);

    const predictions: any[] = [];
    const startDate = new Date();
    const endDate = addDays(startDate, days);

    trends.patterns.forEach(pattern => {
      let currentDate = startDate;
      while (currentDate <= endDate) {
        if (currentDate.getDay() === pattern.dayOfWeek) {
          predictions.push({
            predictedDate: format(currentDate, 'yyyy-MM-dd'),
            timeOfDay: pattern.timeOfDay,
            category: pattern.category,
            priority: pattern.priority,
            confidence: this.calculateConfidence(pattern, trends),
          });
        }
        currentDate = addDays(currentDate, 1);
      }
    });

    return predictions.sort((a, b) => 
      new Date(a.predictedDate).getTime() - new Date(b.predictedDate).getTime()
    );
  }

  private identifyPatterns(notifications: any[]): PredictionPattern[] {
    const patterns: { [key: string]: PredictionPattern } = {};

    notifications.forEach(notification => {
      const date = new Date(notification.scheduledFor);
      const key = `${date.getDay()}-${this.getTimeBlock(date)}-${notification.category}`;

      if (!patterns[key]) {
        patterns[key] = {
          dayOfWeek: date.getDay(),
          timeOfDay: this.getTimeBlock(date),
          frequency: 1,
          category: notification.category,
          priority: notification.priority
        };
      } else {
        patterns[key].frequency++;
      }
    });

    return Object.values(patterns)
      .filter(p => p.frequency >= this.MIN_PATTERN_FREQUENCY)
      .sort((a, b) => b.frequency - a.frequency);
  }

  private findPeakDays(notifications: any[]): string[] {
    const dayCount: { [key: string]: number } = {};
    
    notifications.forEach(notification => {
      const day = format(new Date(notification.scheduledFor), 'EEEE');
      dayCount[day] = (dayCount[day] || 0) + 1;
    });

    return Object.entries(dayCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([day]) => day);
  }

  private findPeakTimes(notifications: any[]): string[] {
    const timeCount: { [key: string]: number } = {};
    
    notifications.forEach(notification => {
      const time = this.getTimeBlock(new Date(notification.scheduledFor));
      timeCount[time] = (timeCount[time] || 0) + 1;
    });

    return Object.entries(timeCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([time]) => time);
  }

  private analyzeCategories(notifications: any[]): { [key: string]: number } {
    const categoryCount: { [key: string]: number } = {};
    
    notifications.forEach(notification => {
      const category = notification.category;
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });

    return categoryCount;
  }

  private analyzePriorities(notifications: any[]): { [key in TreatmentPriority]: number } {
    const priorityCount: { [key in TreatmentPriority]: number } = {
      [TreatmentPriority.HIGH]: 0,
      [TreatmentPriority.MEDIUM]: 0,
      [TreatmentPriority.LOW]: 0
    };
    
    notifications.forEach(notification => {
      priorityCount[notification.priority]++;
    });

    return priorityCount;
  }

  private getTimeBlock(date: Date): string {
    const hour = date.getHours();
    if (hour < 6) return 'Night (00:00-06:00)';
    if (hour < 12) return 'Morning (06:00-12:00)';
    if (hour < 18) return 'Afternoon (12:00-18:00)';
    return 'Evening (18:00-00:00)';
  }

  private calculateConfidence(pattern: PredictionPattern, trends: TrendAnalysis): number {
    let confidence = 0;

    // Frequency-based confidence (0-40%)
    confidence += (pattern.frequency / this.ANALYSIS_PERIOD_DAYS) * 40;

    // Category relevance (0-30%)
    const categoryTotal = Object.values(trends.commonCategories).reduce((a, b) => a + b, 0);
    const categoryPercentage = (trends.commonCategories[pattern.category] || 0) / categoryTotal;
    confidence += categoryPercentage * 30;

    // Priority weight (0-30%)
    const priorityWeights = {
      [TreatmentPriority.HIGH]: 1,
      [TreatmentPriority.MEDIUM]: 0.6,
      [TreatmentPriority.LOW]: 0.3
    };
    confidence += priorityWeights[pattern.priority] * 30;

    return Math.min(Math.round(confidence), 100);
  }

  suggestOptimalTimes(category: string): string[] {
    const state = store.getState();
    const notifications = state.notifications.notifications;
    const categoryNotifications = notifications.filter(n => n.category === category);
    
    if (categoryNotifications.length === 0) {
      return this.getDefaultTimes();
    }

    const timeSuccess: { [key: string]: { total: number; read: number } } = {};
    
    categoryNotifications.forEach(notification => {
      const time = this.getTimeBlock(new Date(notification.scheduledFor));
      if (!timeSuccess[time]) {
        timeSuccess[time] = { total: 0, read: 0 };
      }
      timeSuccess[time].total++;
      if (notification.read) {
        timeSuccess[time].read++;
      }
    });

    return Object.entries(timeSuccess)
      .map(([time, stats]) => ({
        time,
        successRate: stats.read / stats.total
      }))
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 3)
      .map(result => result.time);
  }

  private getDefaultTimes(): string[] {
    return [
      'Morning (06:00-12:00)',
      'Afternoon (12:00-18:00)',
      'Evening (18:00-00:00)'
    ];
  }
}

export default new NotificationPredictionService();
