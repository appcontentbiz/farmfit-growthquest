import { subDays, eachDayOfInterval, format } from 'date-fns';
import * as tf from '@tensorflow/tfjs';
import OfflineStorageService from './OfflineStorageService';

interface TimeSeriesData {
  timestamp: Date;
  value: number;
}

interface StatisticalSummary {
  mean: number;
  median: number;
  standardDeviation: number;
  quartiles: number[];
  outliers: number[];
  trend: 'increasing' | 'decreasing' | 'stable';
  seasonality: boolean;
  confidenceInterval: [number, number];
}

interface ForecastResult {
  predictions: number[];
  confidence: number[];
  trend: number[];
  seasonal: number[];
  residual: number[];
}

interface CorrelationMatrix {
  variables: string[];
  matrix: number[][];
}

interface AnomalyDetectionResult {
  timestamp: Date;
  value: number;
  isAnomaly: boolean;
  score: number;
  threshold: number;
}

class AdvancedStatisticsService {
  private readonly CONFIDENCE_LEVEL = 0.95;
  private readonly ANOMALY_THRESHOLD = 3; // Standard deviations
  private readonly MIN_SAMPLES = 30;

  async analyzeTimeSeries(data: TimeSeriesData[]): Promise<StatisticalSummary> {
    try {
      const values = data.map(d => d.value);
      const tensor = tf.tensor1d(values);

      const mean = await this.calculateMean(tensor);
      const std = await this.calculateStandardDeviation(tensor, mean);
      const [q1, median, q3] = await this.calculateQuantiles(tensor);
      const outliers = await this.findOutliers(values, q1, q3);
      const trend = await this.analyzeTrend(values);
      const seasonality = await this.detectSeasonality(values);
      const ci = await this.calculateConfidenceInterval(mean, std, values.length);

      tensor.dispose();

      return {
        mean,
        median,
        standardDeviation: std,
        quartiles: [q1, median, q3],
        outliers,
        trend,
        seasonality,
        confidenceInterval: ci,
      };
    } catch (error) {
      console.error('Error analyzing time series:', error);
      throw error;
    }
  }

  async forecast(data: TimeSeriesData[], horizon: number): Promise<ForecastResult> {
    try {
      const values = data.map(d => d.value);
      const decomposition = await this.decomposeSeries(values);
      const model = await this.buildForecastModel(decomposition);
      
      const predictions = await this.generatePredictions(model, decomposition, horizon);
      const confidence = await this.calculatePredictionIntervals(predictions, decomposition.residual);

      return {
        predictions: predictions,
        confidence: confidence,
        trend: decomposition.trend,
        seasonal: decomposition.seasonal,
        residual: decomposition.residual,
      };
    } catch (error) {
      console.error('Error generating forecast:', error);
      throw error;
    }
  }

  async detectAnomalies(data: TimeSeriesData[]): Promise<AnomalyDetectionResult[]> {
    try {
      const values = data.map(d => d.value);
      const tensor = tf.tensor1d(values);

      const mean = await this.calculateMean(tensor);
      const std = await this.calculateStandardDeviation(tensor, mean);
      const threshold = this.ANOMALY_THRESHOLD * std;

      const results: AnomalyDetectionResult[] = data.map(point => {
        const zscore = Math.abs(point.value - mean) / std;
        return {
          timestamp: point.timestamp,
          value: point.value,
          isAnomaly: zscore > this.ANOMALY_THRESHOLD,
          score: zscore,
          threshold: threshold,
        };
      });

      tensor.dispose();
      return results;
    } catch (error) {
      console.error('Error detecting anomalies:', error);
      throw error;
    }
  }

  async calculateCorrelations(variables: Record<string, number[]>): Promise<CorrelationMatrix> {
    try {
      const varNames = Object.keys(variables);
      const matrix: number[][] = [];

      for (const var1 of varNames) {
        const row: number[] = [];
        for (const var2 of varNames) {
          const correlation = await this.calculatePearsonCorrelation(
            variables[var1],
            variables[var2]
          );
          row.push(correlation);
        }
        matrix.push(row);
      }

      return {
        variables: varNames,
        matrix: matrix,
      };
    } catch (error) {
      console.error('Error calculating correlations:', error);
      throw error;
    }
  }

  private async calculateMean(tensor: tf.Tensor1D): Promise<number> {
    const mean = await tensor.mean().data();
    return mean[0];
  }

  private async calculateStandardDeviation(tensor: tf.Tensor1D, mean: number): Promise<number> {
    const devSquared = tensor.sub(tf.scalar(mean)).square();
    const variance = await devSquared.mean().data();
    return Math.sqrt(variance[0]);
  }

  private async calculateQuantiles(tensor: tf.Tensor1D): Promise<number[]> {
    const sorted = tf.sort(tensor);
    const length = tensor.shape[0];
    
    const q1Index = Math.floor(length * 0.25);
    const medianIndex = Math.floor(length * 0.5);
    const q3Index = Math.floor(length * 0.75);

    const values = await sorted.array();
    sorted.dispose();

    return [values[q1Index], values[medianIndex], values[q3Index]];
  }

  private async findOutliers(values: number[], q1: number, q3: number): Promise<number[]> {
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    return values.filter(v => v < lowerBound || v > upperBound);
  }

  private async analyzeTrend(values: number[]): Promise<'increasing' | 'decreasing' | 'stable'> {
    const x = tf.tensor1d(Array.from({ length: values.length }, (_, i) => i));
    const y = tf.tensor1d(values);
    
    const slope = await this.calculateSlope(x, y);
    x.dispose();
    y.dispose();

    if (Math.abs(slope) < 0.01) return 'stable';
    return slope > 0 ? 'increasing' : 'decreasing';
  }

  private async calculateSlope(x: tf.Tensor1D, y: tf.Tensor1D): Promise<number> {
    const xMean = await x.mean().data();
    const yMean = await y.mean().data();
    
    const xDev = x.sub(tf.scalar(xMean[0]));
    const yDev = y.sub(tf.scalar(yMean[0]));
    
    const numerator = await xDev.mul(yDev).sum().data();
    const denominator = await xDev.square().sum().data();
    
    xDev.dispose();
    yDev.dispose();
    
    return numerator[0] / denominator[0];
  }

  private async detectSeasonality(values: number[]): Promise<boolean> {
    if (values.length < this.MIN_SAMPLES) return false;

    const fft = tf.spectral.rfft(tf.tensor1d(values));
    const spectrum = tf.abs(fft);
    
    const maxFreq = await spectrum.max().data();
    const mean = await spectrum.mean().data();
    
    fft.dispose();
    spectrum.dispose();

    return maxFreq[0] / mean[0] > 2;
  }

  private async calculateConfidenceInterval(
    mean: number,
    std: number,
    n: number
  ): Promise<[number, number]> {
    const tValue = 1.96; // Approximate t-value for 95% confidence
    const margin = tValue * (std / Math.sqrt(n));
    return [mean - margin, mean + margin];
  }

  private async decomposeSeries(values: number[]): Promise<{
    trend: number[];
    seasonal: number[];
    residual: number[];
  }> {
    // Simple moving average for trend
    const windowSize = Math.min(7, Math.floor(values.length / 4));
    const trend = await this.calculateMovingAverage(values, windowSize);

    // Calculate seasonal component
    const detrended = values.map((v, i) => v - trend[i]);
    const seasonal = await this.extractSeasonalComponent(detrended, windowSize);

    // Calculate residual
    const residual = values.map((v, i) => v - trend[i] - seasonal[i]);

    return { trend, seasonal, residual };
  }

  private async calculateMovingAverage(values: number[], window: number): Promise<number[]> {
    const result: number[] = [];
    for (let i = 0; i < values.length; i++) {
      let sum = 0;
      let count = 0;
      for (let j = Math.max(0, i - window); j < Math.min(values.length, i + window + 1); j++) {
        sum += values[j];
        count++;
      }
      result.push(sum / count);
    }
    return result;
  }

  private async extractSeasonalComponent(
    detrended: number[],
    period: number
  ): Promise<number[]> {
    const seasonal: number[] = new Array(detrended.length).fill(0);
    
    for (let i = 0; i < period; i++) {
      let sum = 0;
      let count = 0;
      for (let j = i; j < detrended.length; j += period) {
        sum += detrended[j];
        count++;
      }
      const avg = sum / count;
      for (let j = i; j < detrended.length; j += period) {
        seasonal[j] = avg;
      }
    }
    
    return seasonal;
  }

  private async buildForecastModel(decomposition: {
    trend: number[];
    seasonal: number[];
    residual: number[];
  }): Promise<tf.LayersModel> {
    const { trend, seasonal, residual } = decomposition;
    const lookback = 10;
    const features = this.prepareFeatures(trend, seasonal, residual, lookback);
    const labels = trend.slice(lookback);

    const model = tf.sequential({
      layers: [
        tf.layers.lstm({
          units: 32,
          inputShape: [lookback, 3],
          returnSequences: false,
        }),
        tf.layers.dense({ units: 1 }),
      ],
    });

    model.compile({
      optimizer: tf.train.adam(0.01),
      loss: 'meanSquaredError',
    });

    await model.fit(features, tf.tensor2d(labels, [labels.length, 1]), {
      epochs: 50,
      batchSize: 32,
      shuffle: true,
      verbose: 0,
    });

    return model;
  }

  private prepareFeatures(
    trend: number[],
    seasonal: number[],
    residual: number[],
    lookback: number
  ): tf.Tensor3D {
    const samples: number[][][] = [];
    
    for (let i = 0; i < trend.length - lookback; i++) {
      const sample: number[][] = [];
      for (let j = 0; j < lookback; j++) {
        sample.push([
          trend[i + j],
          seasonal[i + j],
          residual[i + j],
        ]);
      }
      samples.push(sample);
    }

    return tf.tensor3d(samples);
  }

  private async generatePredictions(
    model: tf.LayersModel,
    decomposition: { trend: number[]; seasonal: number[]; residual: number[] },
    horizon: number
  ): Promise<number[]> {
    const predictions: number[] = [];
    let currentInput = this.getLastWindow(decomposition, 10);

    for (let i = 0; i < horizon; i++) {
      const prediction = await model.predict(currentInput) as tf.Tensor;
      const value = (await prediction.data())[0];
      predictions.push(value);

      // Update input for next prediction
      currentInput = this.updatePredictionInput(currentInput, value, decomposition, i);
      prediction.dispose();
    }

    return predictions;
  }

  private getLastWindow(
    decomposition: { trend: number[]; seasonal: number[]; residual: number[] },
    lookback: number
  ): tf.Tensor3D {
    const { trend, seasonal, residual } = decomposition;
    const window: number[][] = [];
    
    for (let i = trend.length - lookback; i < trend.length; i++) {
      window.push([trend[i], seasonal[i], residual[i]]);
    }

    return tf.tensor3d([window], [1, lookback, 3]);
  }

  private updatePredictionInput(
    currentInput: tf.Tensor3D,
    newValue: number,
    decomposition: { trend: number[]; seasonal: number[]; residual: number[] },
    horizon: number
  ): tf.Tensor3D {
    const values = currentInput.arraySync()[0];
    values.shift();
    values.push([
      newValue,
      decomposition.seasonal[decomposition.seasonal.length - 1],
      0, // Assume zero residual for future predictions
    ]);
    
    return tf.tensor3d([values], [1, values.length, 3]);
  }

  private async calculatePredictionIntervals(
    predictions: number[],
    residuals: number[]
  ): Promise<number[]> {
    const residualStd = await this.calculateStandardDeviation(
      tf.tensor1d(residuals),
      await this.calculateMean(tf.tensor1d(residuals))
    );

    return predictions.map((_, index) => {
      const timeUncertainty = Math.sqrt(index + 1) * residualStd;
      return 1.96 * timeUncertainty; // 95% confidence interval
    });
  }

  private async calculatePearsonCorrelation(x: number[], y: number[]): Promise<number> {
    const xTensor = tf.tensor1d(x);
    const yTensor = tf.tensor1d(y);

    const xMean = await this.calculateMean(xTensor);
    const yMean = await this.calculateMean(yTensor);

    const xDev = xTensor.sub(tf.scalar(xMean));
    const yDev = yTensor.sub(tf.scalar(yMean));

    const numerator = await xDev.mul(yDev).sum().data();
    const denominator = Math.sqrt(
      (await xDev.square().sum().data())[0] *
      (await yDev.square().sum().data())[0]
    );

    xTensor.dispose();
    yTensor.dispose();
    xDev.dispose();
    yDev.dispose();

    return numerator[0] / denominator;
  }
}

export default new AdvancedStatisticsService();
