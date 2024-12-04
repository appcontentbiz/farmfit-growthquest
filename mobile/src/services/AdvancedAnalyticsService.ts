import { addDays, subDays, format, differenceInDays } from 'date-fns';
import OfflineStorageService from './OfflineStorageService';
import { TreatmentPriority } from '../types/therapeutic';

interface AnalyticsMetrics {
  successRate: number;
  responseTime: number;
  completionRate: number;
  adherenceScore: number;
  seasonalTrends: SeasonalTrend[];
  resourceUtilization: ResourceMetrics;
  predictiveInsights: PredictiveInsight[];
}

interface SeasonalTrend {
  season: string;
  successRate: number;
  averageResponseTime: number;
  commonIssues: string[];
}

interface ResourceMetrics {
  staffUtilization: number;
  equipmentEfficiency: number;
  timeManagement: number;
}

interface PredictiveInsight {
  category: string;
  prediction: string;
  confidence: number;
  suggestedActions: string[];
}

class AdvancedAnalyticsService {
  private readonly ANALYSIS_WINDOW_DAYS = 90;
  private readonly MIN_DATA_POINTS = 10;

  async generateAnalytics(): Promise<AnalyticsMetrics> {
    const historicalData = await OfflineStorageService.getHistoricalData();
    const weatherData = await OfflineStorageService.getWeatherData();
    const patterns = await OfflineStorageService.getNotificationPatterns();

    return {
      successRate: await this.calculateSuccessRate(historicalData),
      responseTime: this.calculateAverageResponseTime(historicalData),
      completionRate: await this.calculateCompletionRate(historicalData),
      adherenceScore: this.calculateAdherenceScore(historicalData),
      seasonalTrends: await this.analyzeSeasonalTrends(historicalData, weatherData),
      resourceUtilization: await this.analyzeResourceUtilization(historicalData),
      predictiveInsights: await this.generatePredictiveInsights(historicalData, patterns),
    };
  }

  private async calculateSuccessRate(historicalData: any[]): Promise<number> {
    const recentData = this.getRecentData(historicalData);
    if (recentData.length < this.MIN_DATA_POINTS) return 0;

    const successfulNotifications = recentData.filter(data => data.wasSuccessful);
    return successfulNotifications.length / recentData.length;
  }

  private calculateAverageResponseTime(historicalData: any[]): number {
    const recentData = this.getRecentData(historicalData);
    if (recentData.length < this.MIN_DATA_POINTS) return 0;

    const responseTimes = recentData
      .filter(data => data.responseTime)
      .map(data => data.responseTime);

    return responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
  }

  private async calculateCompletionRate(historicalData: any[]): Promise<number> {
    const recentData = this.getRecentData(historicalData);
    if (recentData.length < this.MIN_DATA_POINTS) return 0;

    const completedNotifications = recentData.filter(data => data.completed);
    return completedNotifications.length / recentData.length;
  }

  private calculateAdherenceScore(historicalData: any[]): number {
    const recentData = this.getRecentData(historicalData);
    if (recentData.length < this.MIN_DATA_POINTS) return 0;

    const adherenceFactors = recentData.map(data => {
      const timelinessScore = this.calculateTimelinessScore(data);
      const completionScore = data.completed ? 1 : 0;
      const followupScore = data.hadFollowup ? 1 : 0;

      return (timelinessScore + completionScore + followupScore) / 3;
    });

    return adherenceFactors.reduce((sum, score) => sum + score, 0) / adherenceFactors.length;
  }

  private calculateTimelinessScore(data: any): number {
    if (!data.scheduledFor || !data.completedAt) return 0;

    const delay = differenceInDays(
      new Date(data.completedAt),
      new Date(data.scheduledFor)
    );

    if (delay <= 0) return 1;
    if (delay <= 1) return 0.8;
    if (delay <= 2) return 0.6;
    if (delay <= 3) return 0.4;
    if (delay <= 4) return 0.2;
    return 0;
  }

  private async analyzeSeasonalTrends(
    historicalData: any[],
    weatherData: any
  ): Promise<SeasonalTrend[]> {
    const seasons = ['winter', 'spring', 'summer', 'fall'];
    const trends: SeasonalTrend[] = [];

    for (const season of seasons) {
      const seasonalData = historicalData.filter(data => {
        const month = new Date(data.scheduledFor).getMonth();
        return this.getSeasonForMonth(month) === season;
      });

      if (seasonalData.length < this.MIN_DATA_POINTS) continue;

      trends.push({
        season,
        successRate: this.calculateSeasonalSuccessRate(seasonalData),
        averageResponseTime: this.calculateSeasonalResponseTime(seasonalData),
        commonIssues: await this.identifyCommonIssues(seasonalData, weatherData),
      });
    }

    return trends;
  }

  private getSeasonForMonth(month: number): string {
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }

  private calculateSeasonalSuccessRate(seasonalData: any[]): number {
    const successfulNotifications = seasonalData.filter(data => data.wasSuccessful);
    return successfulNotifications.length / seasonalData.length;
  }

  private calculateSeasonalResponseTime(seasonalData: any[]): number {
    const responseTimes = seasonalData
      .filter(data => data.responseTime)
      .map(data => data.responseTime);

    return responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
  }

  private async identifyCommonIssues(
    seasonalData: any[],
    weatherData: any
  ): Promise<string[]> {
    const issues = new Map<string, number>();

    seasonalData.forEach(data => {
      if (!data.wasSuccessful && data.failureReason) {
        const count = issues.get(data.failureReason) || 0;
        issues.set(data.failureReason, count + 1);
      }
    });

    return Array.from(issues.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([issue]) => issue);
  }

  private async analyzeResourceUtilization(historicalData: any[]): Promise<ResourceMetrics> {
    const recentData = this.getRecentData(historicalData);
    
    return {
      staffUtilization: this.calculateStaffUtilization(recentData),
      equipmentEfficiency: this.calculateEquipmentEfficiency(recentData),
      timeManagement: this.calculateTimeManagement(recentData),
    };
  }

  private calculateStaffUtilization(data: any[]): number {
    if (data.length === 0) return 0;

    const staffMetrics = data.map(item => ({
      scheduled: item.staffAssigned || 0,
      actual: item.staffUsed || 0,
    }));

    const efficiency = staffMetrics.reduce(
      (sum, metric) => sum + (metric.actual / metric.scheduled || 0),
      0
    );

    return efficiency / staffMetrics.length;
  }

  private calculateEquipmentEfficiency(data: any[]): number {
    if (data.length === 0) return 0;

    const equipmentMetrics = data.map(item => ({
      plannedUsage: item.plannedEquipmentTime || 0,
      actualUsage: item.actualEquipmentTime || 0,
    }));

    const efficiency = equipmentMetrics.reduce(
      (sum, metric) => sum + (metric.actualUsage / metric.plannedUsage || 0),
      0
    );

    return efficiency / equipmentMetrics.length;
  }

  private calculateTimeManagement(data: any[]): number {
    if (data.length === 0) return 0;

    const timeMetrics = data.map(item => ({
      planned: new Date(item.scheduledFor).getTime(),
      actual: new Date(item.completedAt || item.scheduledFor).getTime(),
    }));

    const efficiency = timeMetrics.reduce((sum, metric) => {
      const difference = Math.abs(metric.actual - metric.planned);
      const score = Math.max(0, 1 - (difference / (24 * 60 * 60 * 1000)));
      return sum + score;
    }, 0);

    return efficiency / timeMetrics.length;
  }

  private async generatePredictiveInsights(
    historicalData: any[],
    patterns: any
  ): Promise<PredictiveInsight[]> {
    const insights: PredictiveInsight[] = [];
    const categories = new Set(historicalData.map(data => data.category));

    for (const category of categories) {
      const categoryData = historicalData.filter(data => data.category === category);
      if (categoryData.length < this.MIN_DATA_POINTS) continue;

      const trend = this.analyzeTrend(categoryData);
      const prediction = this.generatePrediction(trend, patterns?.[category]);
      
      insights.push({
        category,
        prediction: prediction.message,
        confidence: prediction.confidence,
        suggestedActions: this.generateSuggestedActions(trend, category),
      });
    }

    return insights;
  }

  private analyzeTrend(data: any[]): any {
    const recentData = this.getRecentData(data);
    const successRate = this.calculateSuccessRate(recentData);
    const responseTime = this.calculateAverageResponseTime(recentData);
    const completionRate = this.calculateCompletionRate(recentData);

    return {
      successRate,
      responseTime,
      completionRate,
      trend: this.calculateTrendDirection(recentData),
    };
  }

  private calculateTrendDirection(data: any[]): 'improving' | 'stable' | 'declining' {
    const midpoint = Math.floor(data.length / 2);
    const earlier = data.slice(0, midpoint);
    const later = data.slice(midpoint);

    const earlierSuccess = this.calculateSuccessRate(earlier);
    const laterSuccess = this.calculateSuccessRate(later);

    const difference = laterSuccess - earlierSuccess;
    if (difference > 0.1) return 'improving';
    if (difference < -0.1) return 'declining';
    return 'stable';
  }

  private generatePrediction(trend: any, pattern: any): { message: string; confidence: number } {
    const { successRate, trend: trendDirection } = trend;

    if (successRate > 0.8 && trendDirection === 'improving') {
      return {
        message: 'High performance likely to continue',
        confidence: 0.9,
      };
    }

    if (successRate < 0.5 && trendDirection === 'declining') {
      return {
        message: 'Intervention may be needed to improve performance',
        confidence: 0.8,
      };
    }

    return {
      message: 'Performance likely to remain stable',
      confidence: 0.7,
    };
  }

  private generateSuggestedActions(trend: any, category: string): string[] {
    const actions: string[] = [];

    if (trend.successRate < 0.7) {
      actions.push('Review and optimize notification timing');
      actions.push('Analyze common failure patterns');
    }

    if (trend.responseTime > 60) { // 60 minutes
      actions.push('Consider adjusting staff availability');
      actions.push('Evaluate notification urgency settings');
    }

    if (trend.completionRate < 0.8) {
      actions.push('Implement follow-up mechanism');
      actions.push('Review task complexity and requirements');
    }

    return actions;
  }

  private getRecentData(data: any[]): any[] {
    const cutoffDate = subDays(new Date(), this.ANALYSIS_WINDOW_DAYS);
    return data.filter(item => new Date(item.scheduledFor) >= cutoffDate);
  }
}

export default new AdvancedAnalyticsService();
