import * as tf from '@tensorflow/tfjs';

interface DescriptiveStats {
  mean: number;
  median: number;
  std: number;
  min: number;
  max: number;
  quartiles: [number, number, number];
  skewness: number;
  kurtosis: number;
}

interface HypothesisTestResult {
  testName: string;
  statistic: number;
  pValue: number;
  significant: boolean;
  effectSize: number;
  confidenceInterval: [number, number];
}

interface TimeSeriesAnalysis {
  trend: number[];
  seasonal: number[];
  residual: number[];
  forecast: number[];
  confidenceBounds: Array<[number, number]>;
}

interface CorrelationMatrix {
  variables: string[];
  matrix: number[][];
  pValues: number[][];
}

class StatisticalAnalysisService {
  private readonly SIGNIFICANCE_LEVEL = 0.05;
  private readonly MIN_SAMPLE_SIZE = 30;

  /**
   * Calculates comprehensive descriptive statistics for a dataset
   */
  calculateDescriptiveStats(data: number[]): DescriptiveStats {
    const tensor = tf.tensor1d(data);
    const mean = tensor.mean().dataSync()[0];
    const std = tensor.std().dataSync()[0];
    
    const sorted = [...data].sort((a, b) => a - b);
    const median = this.calculateMedian(sorted);
    const quartiles = this.calculateQuartiles(sorted);
    
    return {
      mean,
      median,
      std,
      min: Math.min(...data),
      max: Math.max(...data),
      quartiles,
      skewness: this.calculateSkewness(data, mean, std),
      kurtosis: this.calculateKurtosis(data, mean, std)
    };
  }

  /**
   * Performs statistical hypothesis testing between two groups
   */
  async performHypothesisTest(
    group1: number[],
    group2: number[],
    testType: 'ttest' | 'mannwhitney' | 'wilcoxon'
  ): Promise<HypothesisTestResult> {
    switch (testType) {
      case 'ttest':
        return this.performTTest(group1, group2);
      case 'mannwhitney':
        return this.performMannWhitneyTest(group1, group2);
      case 'wilcoxon':
        return this.performWilcoxonTest(group1, group2);
      default:
        throw new Error(`Unsupported test type: ${testType}`);
    }
  }

  /**
   * Performs time series analysis and forecasting
   */
  async analyzeTimeSeries(
    data: number[],
    forecastSteps: number
  ): Promise<TimeSeriesAnalysis> {
    // Decompose time series into components
    const components = await this.decomposeTimeSeries(data);
    
    // Generate forecast using appropriate model
    const forecast = await this.generateForecast(data, forecastSteps);
    
    // Calculate confidence bounds
    const confidenceBounds = this.calculateConfidenceBounds(forecast, components.residual);

    return {
      trend: components.trend,
      seasonal: components.seasonal,
      residual: components.residual,
      forecast,
      confidenceBounds
    };
  }

  /**
   * Calculates correlation matrix between multiple variables
   */
  calculateCorrelations(
    variables: { [key: string]: number[] }
  ): CorrelationMatrix {
    const varNames = Object.keys(variables);
    const n = varNames.length;
    const matrix: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));
    const pValues: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = i; j < n; j++) {
        const correlation = this.calculatePearsonCorrelation(
          variables[varNames[i]],
          variables[varNames[j]]
        );
        matrix[i][j] = matrix[j][i] = correlation.coefficient;
        pValues[i][j] = pValues[j][i] = correlation.pValue;
      }
    }

    return {
      variables: varNames,
      matrix,
      pValues
    };
  }

  /**
   * Performs advanced analysis on experiment results
   */
  async analyzeResults(results: any): Promise<any> {
    const analysis = {
      descriptive: {},
      inferential: {},
      timeSeries: {},
      correlations: {},
      recommendations: []
    };

    // Analyze metrics across variants
    for (const metric of Object.keys(results.metrics)) {
      const metricData = results.variants.map((v: any) => v.metrics[metric]);
      
      // Descriptive statistics
      analysis.descriptive[metric] = metricData.map(data => 
        this.calculateDescriptiveStats(data)
      );

      // Hypothesis testing between variants
      analysis.inferential[metric] = await Promise.all(
        metricData.map(async (data1, i) => 
          Promise.all(
            metricData.map(async (data2, j) => 
              i < j ? await this.performHypothesisTest(data1, data2, 'ttest') : null
            )
          )
        )
      );

      // Time series analysis if temporal data available
      if (results.temporal && results.temporal[metric]) {
        analysis.timeSeries[metric] = await this.analyzeTimeSeries(
          results.temporal[metric],
          10 // forecast next 10 points
        );
      }
    }

    // Correlation analysis between metrics
    analysis.correlations = this.calculateCorrelations(
      Object.fromEntries(
        Object.entries(results.metrics).map(([key, values]) => [
          key,
          values as number[]
        ])
      )
    );

    // Generate recommendations
    analysis.recommendations = this.generateRecommendations(analysis);

    return analysis;
  }

  /**
   * Generates final comprehensive analysis
   */
  async generateFinalAnalysis(results: any): Promise<any> {
    const analysis = await this.analyzeResults(results);

    return {
      ...analysis,
      summary: this.generateSummary(analysis),
      confidence: this.assessConfidence(analysis),
      actionableInsights: this.generateActionableInsights(analysis)
    };
  }

  // Private helper methods
  private calculateMedian(sorted: number[]): number {
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  private calculateQuartiles(sorted: number[]): [number, number, number] {
    const q2 = this.calculateMedian(sorted);
    const mid = Math.floor(sorted.length / 2);
    const lowerHalf = sorted.slice(0, mid);
    const upperHalf = sorted.slice(mid + (sorted.length % 2));
    
    return [
      this.calculateMedian(lowerHalf),
      q2,
      this.calculateMedian(upperHalf)
    ];
  }

  private calculateSkewness(data: number[], mean: number, std: number): number {
    const n = data.length;
    const m3 = data.reduce((sum, x) => sum + Math.pow(x - mean, 3), 0) / n;
    return m3 / Math.pow(std, 3);
  }

  private calculateKurtosis(data: number[], mean: number, std: number): number {
    const n = data.length;
    const m4 = data.reduce((sum, x) => sum + Math.pow(x - mean, 4), 0) / n;
    return m4 / Math.pow(std, 4) - 3;
  }

  private async performTTest(
    group1: number[],
    group2: number[]
  ): Promise<HypothesisTestResult> {
    const n1 = group1.length;
    const n2 = group2.length;
    const mean1 = tf.mean(tf.tensor1d(group1)).dataSync()[0];
    const mean2 = tf.mean(tf.tensor1d(group2)).dataSync()[0];
    const var1 = tf.moments(tf.tensor1d(group1)).variance.dataSync()[0];
    const var2 = tf.moments(tf.tensor1d(group2)).variance.dataSync()[0];

    const pooledVar = ((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2);
    const statistic = (mean1 - mean2) / Math.sqrt(pooledVar * (1/n1 + 1/n2));
    
    // Calculate p-value using t-distribution
    const df = n1 + n2 - 2;
    const pValue = this.calculateTDistributionPValue(statistic, df);
    
    // Calculate effect size (Cohen's d)
    const effectSize = Math.abs(mean1 - mean2) / Math.sqrt(pooledVar);
    
    // Calculate confidence interval
    const se = Math.sqrt(pooledVar * (1/n1 + 1/n2));
    const criticalValue = this.getTCriticalValue(df);
    const ci: [number, number] = [
      mean1 - mean2 - criticalValue * se,
      mean1 - mean2 + criticalValue * se
    ];

    return {
      testName: 'Independent t-test',
      statistic,
      pValue,
      significant: pValue < this.SIGNIFICANCE_LEVEL,
      effectSize,
      confidenceInterval: ci
    };
  }

  private async performMannWhitneyTest(
    group1: number[],
    group2: number[]
  ): Promise<HypothesisTestResult> {
    // Implementation of Mann-Whitney U test
    // This is a placeholder for the actual implementation
    return {
      testName: 'Mann-Whitney U test',
      statistic: 0,
      pValue: 0,
      significant: false,
      effectSize: 0,
      confidenceInterval: [0, 0]
    };
  }

  private async performWilcoxonTest(
    group1: number[],
    group2: number[]
  ): Promise<HypothesisTestResult> {
    // Implementation of Wilcoxon signed-rank test
    // This is a placeholder for the actual implementation
    return {
      testName: 'Wilcoxon signed-rank test',
      statistic: 0,
      pValue: 0,
      significant: false,
      effectSize: 0,
      confidenceInterval: [0, 0]
    };
  }

  private calculatePearsonCorrelation(x: number[], y: number[]): {
    coefficient: number;
    pValue: number;
  } {
    const n = x.length;
    const meanX = tf.mean(tf.tensor1d(x)).dataSync()[0];
    const meanY = tf.mean(tf.tensor1d(y)).dataSync()[0];
    
    let numerator = 0;
    let denomX = 0;
    let denomY = 0;
    
    for (let i = 0; i < n; i++) {
      const xDiff = x[i] - meanX;
      const yDiff = y[i] - meanY;
      numerator += xDiff * yDiff;
      denomX += xDiff * xDiff;
      denomY += yDiff * yDiff;
    }
    
    const r = numerator / Math.sqrt(denomX * denomY);
    
    // Calculate t-statistic for correlation
    const t = r * Math.sqrt((n - 2) / (1 - r * r));
    const pValue = this.calculateTDistributionPValue(t, n - 2);
    
    return {
      coefficient: r,
      pValue
    };
  }

  private async decomposeTimeSeries(data: number[]): Promise<{
    trend: number[];
    seasonal: number[];
    residual: number[];
  }> {
    // Implementation of time series decomposition
    // This is a placeholder for actual implementation
    return {
      trend: [],
      seasonal: [],
      residual: []
    };
  }

  private async generateForecast(
    data: number[],
    steps: number
  ): Promise<number[]> {
    // Implementation of forecasting
    // This is a placeholder for actual implementation
    return Array(steps).fill(0);
  }

  private calculateConfidenceBounds(
    forecast: number[],
    residuals: number[]
  ): Array<[number, number]> {
    // Implementation of confidence bounds calculation
    // This is a placeholder for actual implementation
    return forecast.map(f => [f - 1, f + 1]);
  }

  private generateRecommendations(analysis: any): string[] {
    const recommendations: string[] = [];

    // Add recommendations based on analysis results
    // This is a placeholder for actual implementation
    
    return recommendations;
  }

  private generateSummary(analysis: any): string {
    // Generate human-readable summary of analysis
    // This is a placeholder for actual implementation
    return '';
  }

  private assessConfidence(analysis: any): number {
    // Calculate overall confidence in results
    // This is a placeholder for actual implementation
    return 0;
  }

  private generateActionableInsights(analysis: any): string[] {
    // Generate actionable insights from analysis
    // This is a placeholder for actual implementation
    return [];
  }

  private calculateTDistributionPValue(t: number, df: number): number {
    // Implementation of t-distribution p-value calculation
    // This is a placeholder for actual implementation
    return 0;
  }

  private getTCriticalValue(df: number): number {
    // Get critical value from t-distribution
    // This is a placeholder for actual implementation
    return 1.96;
  }
}

export default new StatisticalAnalysisService();
