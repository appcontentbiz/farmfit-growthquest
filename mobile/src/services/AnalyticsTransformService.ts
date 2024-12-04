import { format, subDays, eachDayOfInterval, eachHourOfInterval } from 'date-fns';
import { TreatmentPriority } from '../types/therapeutic';

interface MetricDataPoint {
  timestamp: Date;
  value: number;
  category: string;
  priority?: TreatmentPriority;
}

interface TransformedData {
  timeSeriesData: any[];
  correlationData: any[];
  distributionData: any[];
  heatmapData: any[];
  categoryData: { [key: string]: any[] };
}

class AnalyticsTransformService {
  transformMetricsData(rawData: MetricDataPoint[]): TransformedData {
    return {
      timeSeriesData: this.prepareTimeSeriesData(rawData),
      correlationData: this.prepareCorrelationData(rawData),
      distributionData: this.prepareDistributionData(rawData),
      heatmapData: this.prepareHeatmapData(rawData),
      categoryData: this.prepareCategoryData(rawData),
    };
  }

  private prepareTimeSeriesData(data: MetricDataPoint[]) {
    // Group by day and calculate average
    const groupedByDay = data.reduce((acc, point) => {
      const day = format(point.timestamp, 'yyyy-MM-dd');
      if (!acc[day]) {
        acc[day] = { sum: 0, count: 0 };
      }
      acc[day].sum += point.value;
      acc[day].count += 1;
      return acc;
    }, {} as { [key: string]: { sum: number; count: number } });

    // Convert to array and sort by date
    return Object.entries(groupedByDay)
      .map(([day, { sum, count }]) => ({
        x: new Date(day),
        y: sum / count,
      }))
      .sort((a, b) => a.x.getTime() - b.x.getTime());
  }

  private prepareCorrelationData(data: MetricDataPoint[]) {
    // Calculate correlation between consecutive days
    const correlations = [];
    for (let i = 0; i < data.length - 1; i++) {
      correlations.push({
        x: data[i].value,
        y: data[i + 1].value,
        label: `${format(data[i].timestamp, 'PP')} vs ${format(
          data[i + 1].timestamp,
          'PP'
        )}`,
      });
    }
    return correlations;
  }

  private prepareDistributionData(data: MetricDataPoint[]) {
    // Calculate quartiles and outliers
    const values = data.map((point) => point.value).sort((a, b) => a - b);
    const q1 = this.calculateQuartile(values, 0.25);
    const median = this.calculateQuartile(values, 0.5);
    const q3 = this.calculateQuartile(values, 0.75);
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    return values.map((value) => ({
      y: value,
      outlier: value < lowerBound || value > upperBound,
    }));
  }

  private prepareHeatmapData(data: MetricDataPoint[]) {
    // Create a 7x24 heatmap (days x hours)
    const today = new Date();
    const weekAgo = subDays(today, 7);

    const hourlyData = eachHourOfInterval({ start: weekAgo, end: today }).map(
      (hour) => {
        const dayIndex = hour.getDay();
        const hourIndex = hour.getHours();
        const relevantData = data.filter(
          (point) =>
            point.timestamp.getDay() === dayIndex &&
            point.timestamp.getHours() === hourIndex
        );

        const avgValue =
          relevantData.length > 0
            ? relevantData.reduce((sum, point) => sum + point.value, 0) /
              relevantData.length
            : 0;

        return {
          x: dayIndex + 1,
          y: hourIndex + 1,
          heat: this.normalizeValue(avgValue, 0, 100),
        };
      }
    );

    return hourlyData;
  }

  private prepareCategoryData(data: MetricDataPoint[]) {
    // Group data by category
    return data.reduce((acc, point) => {
      if (!acc[point.category]) {
        acc[point.category] = [];
      }
      acc[point.category].push({
        x: point.timestamp,
        y: point.value,
        priority: point.priority,
      });
      return acc;
    }, {} as { [key: string]: any[] });
  }

  private calculateQuartile(sortedValues: number[], percentile: number): number {
    const index = Math.floor(sortedValues.length * percentile);
    return sortedValues[index];
  }

  private normalizeValue(value: number, min: number, max: number): number {
    return (value - min) / (max - min);
  }

  // Additional utility methods for advanced analytics

  calculateMovingAverage(data: MetricDataPoint[], windowSize: number) {
    return data.map((point, index) => {
      const window = data.slice(
        Math.max(0, index - windowSize + 1),
        index + 1
      );
      const average =
        window.reduce((sum, p) => sum + p.value, 0) / window.length;
      return {
        timestamp: point.timestamp,
        value: average,
      };
    });
  }

  calculateTrends(data: MetricDataPoint[]) {
    const trends = [];
    for (let i = 1; i < data.length; i++) {
      const change =
        ((data[i].value - data[i - 1].value) / data[i - 1].value) * 100;
      trends.push({
        timestamp: data[i].timestamp,
        change,
        direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
      });
    }
    return trends;
  }

  calculateSeasonality(data: MetricDataPoint[], period: number) {
    const seasonalPatterns = new Array(period).fill(0);
    const counts = new Array(period).fill(0);

    data.forEach((point) => {
      const index = point.timestamp.getHours(); // For daily patterns
      seasonalPatterns[index] += point.value;
      counts[index]++;
    });

    return seasonalPatterns.map((sum, index) => ({
      period: index,
      average: sum / counts[index],
    }));
  }

  calculateCorrelationMatrix(
    datasets: { [key: string]: MetricDataPoint[] }
  ): { [key: string]: { [key: string]: number } } {
    const categories = Object.keys(datasets);
    const matrix: { [key: string]: { [key: string]: number } } = {};

    categories.forEach((cat1) => {
      matrix[cat1] = {};
      categories.forEach((cat2) => {
        matrix[cat1][cat2] = this.calculatePearsonCorrelation(
          datasets[cat1],
          datasets[cat2]
        );
      });
    });

    return matrix;
  }

  private calculatePearsonCorrelation(
    dataset1: MetricDataPoint[],
    dataset2: MetricDataPoint[]
  ): number {
    const values1 = dataset1.map((d) => d.value);
    const values2 = dataset2.map((d) => d.value);
    const mean1 = values1.reduce((a, b) => a + b) / values1.length;
    const mean2 = values2.reduce((a, b) => a + b) / values2.length;

    const numerator = values1.reduce(
      (sum, _, i) =>
        sum + (values1[i] - mean1) * (values2[i] - mean2),
      0
    );

    const denominator = Math.sqrt(
      values1.reduce((sum, val) => sum + Math.pow(val - mean1, 2), 0) *
        values2.reduce((sum, val) => sum + Math.pow(val - mean2, 2), 0)
    );

    return numerator / denominator;
  }
}

export default new AnalyticsTransformService();
