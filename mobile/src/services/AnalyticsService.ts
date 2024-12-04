import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import OfflineStorageService from './OfflineStorageService';
import MLPredictionService from './MLPredictionService';
import { TreatmentPriority } from '../types/therapeutic';

interface AnalyticsPeriod {
  start: Date;
  end: Date;
}

interface TrendData {
  date: string;
  value: number;
  category?: string;
}

interface CategoryAnalytics {
  category: string;
  successRate: number;
  averageResponseTime: number;
  completionRate: number;
  priorityDistribution: {
    [key in TreatmentPriority]: number;
  };
  trends: TrendData[];
}

interface PerformanceMetrics {
  overall: {
    successRate: number;
    completionRate: number;
    averageResponseTime: number;
    predictionAccuracy: number;
  };
  byCategory: {
    [category: string]: CategoryAnalytics;
  };
  trends: {
    daily: TrendData[];
    weekly: TrendData[];
    monthly: TrendData[];
  };
}

class AnalyticsService {
  private cachedMetrics: PerformanceMetrics | null = null;
  private lastUpdateTimestamp: number = 0;
  private readonly CACHE_DURATION = 1000 * 60 * 15; // 15 minutes

  async getPerformanceMetrics(forceRefresh: boolean = false): Promise<PerformanceMetrics> {
    const now = Date.now();
    if (
      !forceRefresh &&
      this.cachedMetrics &&
      now - this.lastUpdateTimestamp < this.CACHE_DURATION
    ) {
      return this.cachedMetrics;
    }

    const historicalData = await OfflineStorageService.getHistoricalData();
    const metrics = await this.calculatePerformanceMetrics(historicalData);
    
    this.cachedMetrics = metrics;
    this.lastUpdateTimestamp = now;
    
    return metrics;
  }

  private async calculatePerformanceMetrics(data: any[]): Promise<PerformanceMetrics> {
    const categories = [...new Set(data.map(item => item.category))];
    const byCategory: { [category: string]: CategoryAnalytics } = {};

    // Calculate metrics for each category
    for (const category of categories) {
      const categoryData = data.filter(item => item.category === category);
      byCategory[category] = await this.calculateCategoryAnalytics(categoryData);
    }

    // Calculate overall metrics
    const overall = {
      successRate: this.calculateAverageRate(
        Object.values(byCategory).map(c => c.successRate)
      ),
      completionRate: this.calculateAverageRate(
        Object.values(byCategory).map(c => c.completionRate)
      ),
      averageResponseTime: this.calculateAverageRate(
        Object.values(byCategory).map(c => c.averageResponseTime)
      ),
      predictionAccuracy: await this.calculatePredictionAccuracy(data),
    };

    // Calculate trends
    const trends = {
      daily: await this.calculateTrends(data, 'daily'),
      weekly: await this.calculateTrends(data, 'weekly'),
      monthly: await this.calculateTrends(data, 'monthly'),
    };

    return {
      overall,
      byCategory,
      trends,
    };
  }

  private async calculateCategoryAnalytics(data: any[]): Promise<CategoryAnalytics> {
    const successRate = this.calculateSuccessRate(data);
    const completionRate = this.calculateCompletionRate(data);
    const averageResponseTime = this.calculateAverageResponseTime(data);
    const priorityDistribution = this.calculatePriorityDistribution(data);
    const trends = await this.calculateCategoryTrends(data);

    return {
      category: data[0]?.category || 'unknown',
      successRate,
      completionRate,
      averageResponseTime,
      priorityDistribution,
      trends,
    };
  }

  private calculateSuccessRate(data: any[]): number {
    if (data.length === 0) return 0;
    const successful = data.filter(item => item.wasSuccessful).length;
    return (successful / data.length) * 100;
  }

  private calculateCompletionRate(data: any[]): number {
    if (data.length === 0) return 0;
    const completed = data.filter(item => item.status === 'completed').length;
    return (completed / data.length) * 100;
  }

  private calculateAverageResponseTime(data: any[]): number {
    if (data.length === 0) return 0;
    const totalTime = data.reduce((sum, item) => sum + (item.responseTime || 0), 0);
    return totalTime / data.length;
  }

  private calculatePriorityDistribution(data: any[]): { [key in TreatmentPriority]: number } {
    const distribution: { [key in TreatmentPriority]: number } = {
      [TreatmentPriority.HIGH]: 0,
      [TreatmentPriority.MEDIUM]: 0,
      [TreatmentPriority.LOW]: 0,
    };

    data.forEach(item => {
      distribution[item.priority as TreatmentPriority]++;
    });

    const total = data.length;
    Object.keys(distribution).forEach(key => {
      distribution[key as TreatmentPriority] = (distribution[key as TreatmentPriority] / total) * 100;
    });

    return distribution;
  }

  private async calculatePredictionAccuracy(data: any[]): Promise<number> {
    const recentData = data.filter(
      item => new Date(item.timestamp).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
    );

    if (recentData.length === 0) return 0;

    const accuracyScores = await Promise.all(
      recentData.map(async item => {
        const prediction = await MLPredictionService.predictSuccess(item);
        const actualSuccess = item.wasSuccessful ? 1 : 0;
        return 1 - Math.abs(prediction.probability - actualSuccess);
      })
    );

    return (
      accuracyScores.reduce((sum, score) => sum + score, 0) / accuracyScores.length
    ) * 100;
  }

  private async calculateTrends(
    data: any[],
    period: 'daily' | 'weekly' | 'monthly'
  ): Promise<TrendData[]> {
    const now = new Date();
    let interval: AnalyticsPeriod;

    switch (period) {
      case 'daily':
        interval = {
          start: subDays(now, 7),
          end: now,
        };
        break;
      case 'weekly':
        interval = {
          start: subDays(now, 28),
          end: now,
        };
        break;
      case 'monthly':
        interval = {
          start: subDays(now, 90),
          end: now,
        };
        break;
    }

    return this.calculateTrendDataForInterval(data, interval, period);
  }

  private async calculateCategoryTrends(data: any[]): Promise<TrendData[]> {
    const interval = {
      start: subDays(new Date(), 30),
      end: new Date(),
    };

    return this.calculateTrendDataForInterval(data, interval, 'daily');
  }

  private calculateTrendDataForInterval(
    data: any[],
    interval: AnalyticsPeriod,
    period: 'daily' | 'weekly' | 'monthly'
  ): TrendData[] {
    const trends: TrendData[] = [];
    const days = eachDayOfInterval(interval);

    days.forEach(day => {
      const dayStart = startOfWeek(day);
      const dayEnd = endOfWeek(day);

      const periodData = data.filter(item => {
        const itemDate = new Date(item.timestamp);
        return itemDate >= dayStart && itemDate <= dayEnd;
      });

      if (periodData.length > 0) {
        trends.push({
          date: format(day, 'yyyy-MM-dd'),
          value: this.calculateSuccessRate(periodData),
        });
      }
    });

    return trends;
  }

  private calculateAverageRate(rates: number[]): number {
    if (rates.length === 0) return 0;
    return rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
  }

  async generateReport(period: AnalyticsPeriod): Promise<string> {
    const metrics = await this.getPerformanceMetrics(true);
    
    return `
# FarmFit Analytics Report
Generated on: ${format(new Date(), 'PPP')}
Period: ${format(period.start, 'PPP')} to ${format(period.end, 'PPP')}

## Overall Performance
- Success Rate: ${metrics.overall.successRate.toFixed(1)}%
- Completion Rate: ${metrics.overall.completionRate.toFixed(1)}%
- Average Response Time: ${metrics.overall.averageResponseTime.toFixed(1)} minutes
- Prediction Accuracy: ${metrics.overall.predictionAccuracy.toFixed(1)}%

## Category Performance
${Object.entries(metrics.byCategory)
  .map(
    ([category, analytics]) => `
### ${category}
- Success Rate: ${analytics.successRate.toFixed(1)}%
- Completion Rate: ${analytics.completionRate.toFixed(1)}%
- Average Response Time: ${analytics.averageResponseTime.toFixed(1)} minutes

Priority Distribution:
- High: ${analytics.priorityDistribution[TreatmentPriority.HIGH].toFixed(1)}%
- Medium: ${analytics.priorityDistribution[TreatmentPriority.MEDIUM].toFixed(1)}%
- Low: ${analytics.priorityDistribution[TreatmentPriority.LOW].toFixed(1)}%
`
  )
  .join('\n')}

## Trends
- Daily Success Rate Range: ${this.getTrendRange(metrics.trends.daily)}%
- Weekly Success Rate Range: ${this.getTrendRange(metrics.trends.weekly)}%
- Monthly Success Rate Range: ${this.getTrendRange(metrics.trends.monthly)}%
`;
  }

  private getTrendRange(trends: TrendData[]): string {
    if (trends.length === 0) return 'N/A';
    const values = trends.map(t => t.value);
    return `${Math.min(...values).toFixed(1)} - ${Math.max(...values).toFixed(1)}`;
  }
}

export default new AnalyticsService();
