import { format, subDays, eachDayOfInterval } from 'date-fns';
import * as FileSystem from 'expo-file-system';
import AdvancedStatisticsService from './AdvancedStatisticsService';
import OfflineStorageService from './OfflineStorageService';
import NotificationTemplateService from './NotificationTemplateService';
import OptimizationService from './OptimizationService';
import ABTestingService from './ABTestingService';

interface ReportConfig {
  id: string;
  name: string;
  description: string;
  metrics: ReportMetric[];
  filters: ReportFilter[];
  visualizations: ReportVisualization[];
  schedule?: ReportSchedule;
  exportFormat: 'pdf' | 'csv' | 'json';
}

interface ReportMetric {
  name: string;
  type: 'count' | 'average' | 'sum' | 'ratio' | 'custom';
  calculation: string;
  aggregation: 'daily' | 'weekly' | 'monthly';
  baseline?: number;
  target?: number;
}

interface ReportFilter {
  field: string;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'between';
  value: any;
}

interface ReportVisualization {
  type: 'line' | 'bar' | 'pie' | 'table' | 'heatmap';
  metrics: string[];
  options: Record<string, any>;
}

interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  recipients: string[];
}

interface ReportData {
  timestamp: Date;
  metrics: Record<string, any>;
  statistics: any;
  insights: string[];
}

class CustomReportingService {
  private readonly CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
  private readonly MAX_CACHE_SIZE = 100; // Maximum number of cached reports

  async generateReport(config: ReportConfig): Promise<ReportData> {
    try {
      const cachedReport = await this.getCachedReport(config.id);
      if (cachedReport) return cachedReport;

      const data = await this.collectReportData(config);
      const statistics = await this.calculateStatistics(data, config.metrics);
      const insights = await this.generateInsights(data, statistics, config);

      const report: ReportData = {
        timestamp: new Date(),
        metrics: data,
        statistics,
        insights,
      };

      await this.cacheReport(config.id, report);
      await this.exportReport(report, config);

      return report;
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  }

  async scheduleReport(config: ReportConfig): Promise<void> {
    if (!config.schedule) throw new Error('No schedule configured for report');

    try {
      // Implementation would set up actual scheduling
      console.log(`Scheduled report ${config.id} for ${config.schedule.frequency} delivery`);
    } catch (error) {
      console.error('Error scheduling report:', error);
      throw error;
    }
  }

  async exportReport(report: ReportData, config: ReportConfig): Promise<string> {
    try {
      const exportDir = `${FileSystem.documentDirectory}reports/`;
      await FileSystem.makeDirectoryAsync(exportDir, { intermediates: true });

      const filename = `report_${config.id}_${format(new Date(), 'yyyyMMdd')}.${config.exportFormat}`;
      const filepath = `${exportDir}${filename}`;

      let content: string;
      switch (config.exportFormat) {
        case 'json':
          content = JSON.stringify(report, null, 2);
          break;
        case 'csv':
          content = this.convertToCSV(report);
          break;
        case 'pdf':
          content = await this.generatePDF(report, config);
          break;
        default:
          throw new Error(`Unsupported export format: ${config.exportFormat}`);
      }

      await FileSystem.writeAsStringAsync(filepath, content);
      return filepath;
    } catch (error) {
      console.error('Error exporting report:', error);
      throw error;
    }
  }

  private async collectReportData(config: ReportConfig): Promise<Record<string, any>> {
    const data: Record<string, any> = {};

    for (const metric of config.metrics) {
      const values = await this.calculateMetric(metric, config.filters);
      data[metric.name] = values;
    }

    return data;
  }

  private async calculateMetric(
    metric: ReportMetric,
    filters: ReportFilter[]
  ): Promise<number[]> {
    try {
      const historicalData = await OfflineStorageService.getHistoricalData();
      const filteredData = this.applyFilters(historicalData, filters);

      switch (metric.type) {
        case 'count':
          return this.calculateCount(filteredData, metric);
        case 'average':
          return this.calculateAverage(filteredData, metric);
        case 'sum':
          return this.calculateSum(filteredData, metric);
        case 'ratio':
          return this.calculateRatio(filteredData, metric);
        case 'custom':
          return this.executeCustomCalculation(filteredData, metric.calculation);
        default:
          throw new Error(`Unsupported metric type: ${metric.type}`);
      }
    } catch (error) {
      console.error('Error calculating metric:', error);
      throw error;
    }
  }

  private applyFilters(data: any[], filters: ReportFilter[]): any[] {
    return data.filter(item => {
      return filters.every(filter => {
        const value = item[filter.field];
        switch (filter.operator) {
          case 'equals':
            return value === filter.value;
          case 'contains':
            return value.includes(filter.value);
          case 'greater':
            return value > filter.value;
          case 'less':
            return value < filter.value;
          case 'between':
            return value >= filter.value[0] && value <= filter.value[1];
          default:
            return true;
        }
      });
    });
  }

  private calculateCount(data: any[], metric: ReportMetric): number[] {
    const grouped = this.groupByAggregation(data, metric.aggregation);
    return Object.values(grouped).map(group => group.length);
  }

  private calculateAverage(data: any[], metric: ReportMetric): number[] {
    const grouped = this.groupByAggregation(data, metric.aggregation);
    return Object.values(grouped).map(group => {
      const values = group.map(item => this.extractValue(item, metric.calculation));
      return values.reduce((sum, val) => sum + val, 0) / values.length;
    });
  }

  private calculateSum(data: any[], metric: ReportMetric): number[] {
    const grouped = this.groupByAggregation(data, metric.aggregation);
    return Object.values(grouped).map(group => {
      const values = group.map(item => this.extractValue(item, metric.calculation));
      return values.reduce((sum, val) => sum + val, 0);
    });
  }

  private calculateRatio(data: any[], metric: ReportMetric): number[] {
    const [numerator, denominator] = metric.calculation.split('/');
    const grouped = this.groupByAggregation(data, metric.aggregation);
    
    return Object.values(grouped).map(group => {
      const numeratorSum = group.reduce(
        (sum, item) => sum + this.extractValue(item, numerator),
        0
      );
      const denominatorSum = group.reduce(
        (sum, item) => sum + this.extractValue(item, denominator),
        0
      );
      return denominatorSum === 0 ? 0 : numeratorSum / denominatorSum;
    });
  }

  private executeCustomCalculation(data: any[], calculation: string): number[] {
    // Implementation would execute custom calculation logic
    return [];
  }

  private groupByAggregation(data: any[], aggregation: string): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};

    data.forEach(item => {
      const date = new Date(item.timestamp);
      let key: string;

      switch (aggregation) {
        case 'daily':
          key = format(date, 'yyyy-MM-dd');
          break;
        case 'weekly':
          key = format(date, 'yyyy-ww');
          break;
        case 'monthly':
          key = format(date, 'yyyy-MM');
          break;
        default:
          key = format(date, 'yyyy-MM-dd');
      }

      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
    });

    return grouped;
  }

  private extractValue(item: any, path: string): number {
    return path.split('.').reduce((obj, key) => obj?.[key], item) || 0;
  }

  private async calculateStatistics(
    data: Record<string, any>,
    metrics: ReportMetric[]
  ): Promise<any> {
    const statistics: Record<string, any> = {};

    for (const metric of metrics) {
      const values = data[metric.name];
      if (!values || !values.length) continue;

      const timeSeriesData = values.map((value: number, index: number) => ({
        timestamp: new Date(Date.now() - index * 24 * 60 * 60 * 1000),
        value,
      }));

      statistics[metric.name] = await AdvancedStatisticsService.analyzeTimeSeries(timeSeriesData);
    }

    return statistics;
  }

  private async generateInsights(
    data: Record<string, any>,
    statistics: any,
    config: ReportConfig
  ): Promise<string[]> {
    const insights: string[] = [];

    for (const metric of config.metrics) {
      const stats = statistics[metric.name];
      if (!stats) continue;

      // Performance insights
      if (metric.target) {
        const currentValue = data[metric.name][0];
        const performance = (currentValue / metric.target) * 100;
        insights.push(
          `${metric.name} is at ${performance.toFixed(1)}% of target (${currentValue} vs ${metric.target})`
        );
      }

      // Trend insights
      if (stats.trend !== 'stable') {
        insights.push(
          `${metric.name} shows a ${stats.trend} trend with ${stats.confidence.toFixed(1)}% confidence`
        );
      }

      // Anomaly insights
      if (stats.outliers.length > 0) {
        insights.push(
          `Detected ${stats.outliers.length} anomalies in ${metric.name}`
        );
      }

      // Seasonality insights
      if (stats.seasonality) {
        insights.push(`${metric.name} exhibits seasonal patterns`);
      }
    }

    return insights;
  }

  private async getCachedReport(reportId: string): Promise<ReportData | null> {
    try {
      const cache = await OfflineStorageService.getHistoricalData();
      const cachedReport = cache.find((report: any) => 
        report.id === reportId &&
        Date.now() - new Date(report.timestamp).getTime() < this.CACHE_EXPIRY
      );
      return cachedReport || null;
    } catch (error) {
      console.error('Error getting cached report:', error);
      return null;
    }
  }

  private async cacheReport(reportId: string, report: ReportData): Promise<void> {
    try {
      const cache = await OfflineStorageService.getHistoricalData();
      
      // Remove old cache entries if exceeding max size
      while (cache.length >= this.MAX_CACHE_SIZE) {
        cache.shift();
      }

      // Add new report to cache
      cache.push({ id: reportId, ...report });
      await OfflineStorageService.saveHistoricalData(cache);
    } catch (error) {
      console.error('Error caching report:', error);
    }
  }

  private convertToCSV(report: ReportData): string {
    const rows: string[] = [];
    const headers: string[] = ['Timestamp'];
    const metrics = Object.keys(report.metrics);
    headers.push(...metrics);
    rows.push(headers.join(','));

    const dataPoints = Math.max(...metrics.map(m => report.metrics[m].length));
    for (let i = 0; i < dataPoints; i++) {
      const row: any[] = [format(new Date(report.timestamp), 'yyyy-MM-dd')];
      metrics.forEach(metric => {
        row.push(report.metrics[metric][i] || '');
      });
      rows.push(row.join(','));
    }

    return rows.join('\n');
  }

  private async generatePDF(report: ReportData, config: ReportConfig): Promise<string> {
    // Implementation would generate PDF using a library like react-native-pdf
    // For now, return JSON as placeholder
    return JSON.stringify(report, null, 2);
  }
}

export default new CustomReportingService();
