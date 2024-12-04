import * as FileSystem from 'expo-file-system';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import AnalyticsService from './AnalyticsService';
import OfflineStorageService from './OfflineStorageService';
import { TreatmentPriority } from '../types/therapeutic';

interface ExportFormat {
  type: 'xlsx' | 'csv' | 'json' | 'pdf';
  includeCharts?: boolean;
  includePredictions?: boolean;
  includeWeatherData?: boolean;
}

interface ExportOptions {
  startDate?: Date;
  endDate?: Date;
  categories?: string[];
  format: ExportFormat;
  compressionLevel?: number;
}

class DataExportService {
  private readonly EXPORT_DIR = `${FileSystem.documentDirectory}exports/`;

  constructor() {
    this.initializeExportDirectory();
  }

  private async initializeExportDirectory() {
    const dirInfo = await FileSystem.getInfoAsync(this.EXPORT_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(this.EXPORT_DIR, { intermediates: true });
    }
  }

  async exportData(options: ExportOptions): Promise<string> {
    try {
      const data = await this.gatherExportData(options);
      const fileName = this.generateFileName(options.format.type);
      const filePath = `${this.EXPORT_DIR}${fileName}`;

      switch (options.format.type) {
        case 'xlsx':
          await this.exportToExcel(data, filePath);
          break;
        case 'csv':
          await this.exportToCSV(data, filePath);
          break;
        case 'json':
          await this.exportToJSON(data, filePath);
          break;
        case 'pdf':
          await this.exportToPDF(data, filePath);
          break;
      }

      if (options.compressionLevel) {
        return await this.compressExport(filePath, options.compressionLevel);
      }

      return filePath;
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  private async gatherExportData(options: ExportOptions) {
    const analytics = await AnalyticsService.getPerformanceMetrics(true);
    const historicalData = await OfflineStorageService.getHistoricalData();
    
    let exportData: any = {
      metadata: {
        exportDate: new Date().toISOString(),
        dateRange: {
          start: options.startDate?.toISOString(),
          end: options.endDate?.toISOString(),
        },
        categories: options.categories,
      },
      analytics: {
        overall: analytics.overall,
        categoryPerformance: analytics.byCategory,
        trends: analytics.trends,
      },
      historicalData: this.filterHistoricalData(
        historicalData,
        options.startDate,
        options.endDate,
        options.categories
      ),
    };

    if (options.format.includePredictions) {
      exportData.predictions = await OfflineStorageService.getOfflinePredictions();
    }

    if (options.format.includeWeatherData) {
      exportData.weatherData = await OfflineStorageService.getWeatherData();
    }

    return exportData;
  }

  private filterHistoricalData(
    data: any[],
    startDate?: Date,
    endDate?: Date,
    categories?: string[]
  ) {
    return data.filter(item => {
      const itemDate = new Date(item.timestamp);
      const dateInRange =
        (!startDate || itemDate >= startDate) && (!endDate || itemDate <= endDate);
      const categoryMatch = !categories || categories.includes(item.category);
      return dateInRange && categoryMatch;
    });
  }

  private async exportToExcel(data: any, filePath: string): Promise<void> {
    const workbook = XLSX.utils.book_new();

    // Overall Analytics Sheet
    const overallSheet = XLSX.utils.json_to_sheet([{
      successRate: data.analytics.overall.successRate,
      completionRate: data.analytics.overall.completionRate,
      averageResponseTime: data.analytics.overall.averageResponseTime,
      predictionAccuracy: data.analytics.overall.predictionAccuracy,
    }]);
    XLSX.utils.book_append_sheet(workbook, overallSheet, 'Overall Analytics');

    // Category Performance Sheet
    const categoryData = Object.entries(data.analytics.categoryPerformance).map(
      ([category, metrics]: [string, any]) => ({
        category,
        successRate: metrics.successRate,
        completionRate: metrics.completionRate,
        averageResponseTime: metrics.averageResponseTime,
        highPriority: metrics.priorityDistribution[TreatmentPriority.HIGH],
        mediumPriority: metrics.priorityDistribution[TreatmentPriority.MEDIUM],
        lowPriority: metrics.priorityDistribution[TreatmentPriority.LOW],
      })
    );
    const categorySheet = XLSX.utils.json_to_sheet(categoryData);
    XLSX.utils.book_append_sheet(workbook, categorySheet, 'Category Performance');

    // Trends Sheet
    const trendsSheet = XLSX.utils.json_to_sheet(data.analytics.trends.daily);
    XLSX.utils.book_append_sheet(workbook, trendsSheet, 'Daily Trends');

    // Historical Data Sheet
    const historicalSheet = XLSX.utils.json_to_sheet(data.historicalData);
    XLSX.utils.book_append_sheet(workbook, historicalSheet, 'Historical Data');

    // Write to file
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    await FileSystem.writeAsStringAsync(filePath, buffer.toString('base64'), {
      encoding: FileSystem.EncodingType.Base64,
    });
  }

  private async exportToCSV(data: any, filePath: string): Promise<void> {
    const csvContent = this.convertToCSV(data);
    await FileSystem.writeAsStringAsync(filePath, csvContent);
  }

  private async exportToJSON(data: any, filePath: string): Promise<void> {
    const jsonContent = JSON.stringify(data, null, 2);
    await FileSystem.writeAsStringAsync(filePath, jsonContent);
  }

  private async exportToPDF(data: any, filePath: string): Promise<void> {
    // Implement PDF generation logic here
    // This would typically involve using a library like react-native-pdf or similar
    throw new Error('PDF export not yet implemented');
  }

  private async compressExport(filePath: string, compressionLevel: number): Promise<string> {
    const compressedPath = `${filePath}.zip`;
    // Implement compression logic here
    // This would typically involve using a compression library
    return compressedPath;
  }

  private generateFileName(format: string): string {
    const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
    return `farmfit_export_${timestamp}.${format}`;
  }

  private convertToCSV(data: any): string {
    // Convert the data object to CSV format
    const headers = this.extractCSVHeaders(data);
    const rows = this.convertDataToRows(data);
    return [headers.join(','), ...rows].join('\n');
  }

  private extractCSVHeaders(data: any): string[] {
    const headers = new Set<string>();
    this.traverseObject(data, '', (path) => headers.add(path));
    return Array.from(headers);
  }

  private convertDataToRows(data: any): string[] {
    const rows: string[] = [];
    const headers = this.extractCSVHeaders(data);

    if (Array.isArray(data)) {
      data.forEach(item => {
        const row = headers.map(header => {
          const value = this.getNestedValue(item, header);
          return this.formatCSVValue(value);
        });
        rows.push(row.join(','));
      });
    } else {
      const row = headers.map(header => {
        const value = this.getNestedValue(data, header);
        return this.formatCSVValue(value);
      });
      rows.push(row.join(','));
    }

    return rows;
  }

  private traverseObject(obj: any, path: string, callback: (path: string) => void) {
    for (const key in obj) {
      const newPath = path ? `${path}.${key}` : key;
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        this.traverseObject(obj[key], newPath, callback);
      } else {
        callback(newPath);
      }
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private formatCSVValue(value: any): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
    if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
    return String(value);
  }
}

export default new DataExportService();
