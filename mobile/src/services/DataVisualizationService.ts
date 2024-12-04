import { VictoryTheme } from 'victory-native';
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import AdvancedAnalyticsService from './AdvancedAnalyticsService';
import OfflineStorageService from './OfflineStorageService';

interface ChartConfig {
  theme: any;
  animation: boolean;
  interactive: boolean;
}

interface ChartData {
  data: any[];
  domain?: { x: [number, number]; y: [number, number] };
  labels?: { x: string; y: string };
  style?: any;
}

class DataVisualizationService {
  private config: ChartConfig = {
    theme: VictoryTheme.material,
    animation: true,
    interactive: true,
  };

  // Success Rate Over Time Chart
  async generateSuccessRateChart(timeframe: 'week' | 'month' | 'quarter'): Promise<ChartData> {
    const historicalData = await OfflineStorageService.getHistoricalData();
    const analytics = await AdvancedAnalyticsService.generateAnalytics();

    const timeRanges = this.getTimeRanges(timeframe);
    const data = timeRanges.map(range => {
      const rangeData = historicalData.filter(item => {
        const date = new Date(item.scheduledFor);
        return date >= range.start && date <= range.end;
      });

      const successRate = rangeData.length > 0
        ? rangeData.filter(item => item.wasSuccessful).length / rangeData.length
        : 0;

      return {
        x: range.start,
        y: successRate,
        label: `${(successRate * 100).toFixed(1)}%`,
      };
    });

    return {
      data,
      domain: {
        x: [timeRanges[0].start, timeRanges[timeRanges.length - 1].end],
        y: [0, 1],
      },
      labels: {
        x: 'Time Period',
        y: 'Success Rate',
      },
      style: {
        data: {
          fill: '#4CAF50',
          stroke: '#388E3C',
          strokeWidth: 2,
        },
        labels: {
          fontSize: 12,
          fill: '#333',
        },
      },
    };
  }

  // Response Time Distribution Chart
  async generateResponseTimeChart(): Promise<ChartData> {
    const historicalData = await OfflineStorageService.getHistoricalData();
    
    const responseTimes = historicalData
      .filter(item => item.responseTime)
      .map(item => item.responseTime);

    const bins = this.createHistogramBins(responseTimes, 10);
    const data = bins.map(bin => ({
      x: bin.range,
      y: bin.count,
      label: `${bin.count} notifications`,
    }));

    return {
      data,
      labels: {
        x: 'Response Time (minutes)',
        y: 'Number of Notifications',
      },
      style: {
        data: {
          fill: '#2196F3',
          stroke: '#1976D2',
          strokeWidth: 2,
        },
      },
    };
  }

  // Category Performance Chart
  async generateCategoryPerformanceChart(): Promise<ChartData> {
    const historicalData = await OfflineStorageService.getHistoricalData();
    const categories = new Set(historicalData.map(item => item.category));

    const data = Array.from(categories).map(category => {
      const categoryData = historicalData.filter(item => item.category === category);
      const successRate = categoryData.filter(item => item.wasSuccessful).length / categoryData.length;

      return {
        x: category,
        y: successRate,
        label: `${(successRate * 100).toFixed(1)}%`,
      };
    });

    return {
      data,
      domain: { x: [0, categories.size], y: [0, 1] },
      labels: {
        x: 'Category',
        y: 'Success Rate',
      },
      style: {
        data: {
          fill: '#9C27B0',
          stroke: '#7B1FA2',
          strokeWidth: 2,
        },
      },
    };
  }

  // Resource Utilization Chart
  async generateResourceUtilizationChart(): Promise<ChartData> {
    const analytics = await AdvancedAnalyticsService.generateAnalytics();
    const { resourceUtilization } = analytics;

    const data = [
      {
        x: 'Staff',
        y: resourceUtilization.staffUtilization,
        label: `${(resourceUtilization.staffUtilization * 100).toFixed(1)}%`,
      },
      {
        x: 'Equipment',
        y: resourceUtilization.equipmentEfficiency,
        label: `${(resourceUtilization.equipmentEfficiency * 100).toFixed(1)}%`,
      },
      {
        x: 'Time',
        y: resourceUtilization.timeManagement,
        label: `${(resourceUtilization.timeManagement * 100).toFixed(1)}%`,
      },
    ];

    return {
      data,
      domain: { x: [0, 3], y: [0, 1] },
      labels: {
        x: 'Resource Type',
        y: 'Utilization Rate',
      },
      style: {
        data: {
          fill: '#FF9800',
          stroke: '#F57C00',
          strokeWidth: 2,
        },
      },
    };
  }

  // Seasonal Trends Chart
  async generateSeasonalTrendsChart(): Promise<ChartData> {
    const analytics = await AdvancedAnalyticsService.generateAnalytics();
    const { seasonalTrends } = analytics;

    const data = seasonalTrends.map(trend => ({
      x: trend.season,
      y: trend.successRate,
      label: `${(trend.successRate * 100).toFixed(1)}%`,
      issues: trend.commonIssues,
    }));

    return {
      data,
      domain: { x: [0, 4], y: [0, 1] },
      labels: {
        x: 'Season',
        y: 'Success Rate',
      },
      style: {
        data: {
          fill: '#3F51B5',
          stroke: '#303F9F',
          strokeWidth: 2,
        },
      },
    };
  }

  // Predictive Insights Chart
  async generatePredictiveInsightsChart(): Promise<ChartData> {
    const analytics = await AdvancedAnalyticsService.generateAnalytics();
    const { predictiveInsights } = analytics;

    const data = predictiveInsights.map(insight => ({
      x: insight.category,
      y: insight.confidence,
      label: `${(insight.confidence * 100).toFixed(1)}%`,
      prediction: insight.prediction,
      actions: insight.suggestedActions,
    }));

    return {
      data,
      domain: { x: [0, predictiveInsights.length], y: [0, 1] },
      labels: {
        x: 'Category',
        y: 'Confidence',
      },
      style: {
        data: {
          fill: '#E91E63',
          stroke: '#C2185B',
          strokeWidth: 2,
        },
      },
    };
  }

  // Adherence Score Trends Chart
  async generateAdherenceScoreChart(timeframe: 'week' | 'month' | 'quarter'): Promise<ChartData> {
    const historicalData = await OfflineStorageService.getHistoricalData();
    const timeRanges = this.getTimeRanges(timeframe);

    const data = timeRanges.map(range => {
      const rangeData = historicalData.filter(item => {
        const date = new Date(item.scheduledFor);
        return date >= range.start && date <= range.end;
      });

      const adherenceScore = this.calculateAdherenceScore(rangeData);

      return {
        x: range.start,
        y: adherenceScore,
        label: `${(adherenceScore * 100).toFixed(1)}%`,
      };
    });

    return {
      data,
      domain: {
        x: [timeRanges[0].start, timeRanges[timeRanges.length - 1].end],
        y: [0, 1],
      },
      labels: {
        x: 'Time Period',
        y: 'Adherence Score',
      },
      style: {
        data: {
          fill: '#00BCD4',
          stroke: '#0097A7',
          strokeWidth: 2,
        },
      },
    };
  }

  private getTimeRanges(timeframe: 'week' | 'month' | 'quarter'): { start: Date; end: Date }[] {
    const now = new Date();
    const ranges: { start: Date; end: Date }[] = [];

    switch (timeframe) {
      case 'week':
        for (let i = 0; i < 7; i++) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          ranges.push({
            start: new Date(date.setHours(0, 0, 0, 0)),
            end: new Date(date.setHours(23, 59, 59, 999)),
          });
        }
        break;

      case 'month':
        for (let i = 0; i < 4; i++) {
          const start = startOfWeek(new Date(now.setDate(now.getDate() - i * 7)));
          const end = endOfWeek(start);
          ranges.push({ start, end });
        }
        break;

      case 'quarter':
        for (let i = 0; i < 3; i++) {
          const start = new Date(now);
          start.setMonth(start.getMonth() - i);
          start.setDate(1);
          const end = new Date(start);
          end.setMonth(end.getMonth() + 1);
          end.setDate(0);
          ranges.push({ start, end });
        }
        break;
    }

    return ranges.reverse();
  }

  private createHistogramBins(data: number[], binCount: number): { range: string; count: number }[] {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const binSize = (max - min) / binCount;

    const bins = Array(binCount).fill(0);
    data.forEach(value => {
      const binIndex = Math.min(Math.floor((value - min) / binSize), binCount - 1);
      bins[binIndex]++;
    });

    return bins.map((count, index) => ({
      range: `${Math.round(min + index * binSize)}-${Math.round(min + (index + 1) * binSize)}`,
      count,
    }));
  }

  private calculateAdherenceScore(data: any[]): number {
    if (data.length === 0) return 0;

    const scores = data.map(item => {
      const onTime = item.completedAt && new Date(item.completedAt) <= new Date(item.scheduledFor);
      const completed = item.completed;
      const hadFollowup = item.hadFollowup;

      return (Number(onTime) + Number(completed) + Number(hadFollowup)) / 3;
    });

    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  updateConfig(newConfig: Partial<ChartConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

export default new DataVisualizationService();
