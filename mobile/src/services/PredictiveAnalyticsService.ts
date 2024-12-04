import * as tf from '@tensorflow/tfjs';
import { addDays, subDays, eachDayOfInterval, format } from 'date-fns';
import { TreatmentPriority } from '../types/therapeutic';
import AnalyticsTransformService from './AnalyticsTransformService';

interface PredictionConfig {
  horizon: number; // Number of days to predict
  confidenceInterval: number; // Confidence interval (0-1)
  includeSeasonal: boolean;
  includeWeather: boolean;
  smoothingFactor: number; // For exponential smoothing (0-1)
}

interface PredictionResult {
  predictions: Array<{
    date: Date;
    value: number;
    confidenceLow: number;
    confidenceHigh: number;
    probability: number;
  }>;
  accuracy: number;
  confidenceScore: number;
  seasonalFactors: number[];
  anomalies: Array<{
    date: Date;
    value: number;
    expectedValue: number;
    deviation: number;
  }>;
}

interface ModelMetrics {
  mse: number; // Mean Squared Error
  mae: number; // Mean Absolute Error
  mape: number; // Mean Absolute Percentage Error
  r2: number; // R-squared score
}

class PredictiveAnalyticsService {
  private model: tf.LayersModel | null = null;
  private readonly SEQUENCE_LENGTH = 14; // Number of past days to consider
  private readonly MIN_TRAINING_SAMPLES = 30;

  async initialize() {
    try {
      this.model = await this.createModel();
      console.log('Predictive analytics model initialized');
    } catch (error) {
      console.error('Error initializing predictive model:', error);
      throw error;
    }
  }

  private async createModel(): Promise<tf.LayersModel> {
    const model = tf.sequential();

    // LSTM layer for sequence processing
    model.add(
      tf.layers.lstm({
        units: 64,
        returnSequences: true,
        inputShape: [this.SEQUENCE_LENGTH, 5], // time steps, features
      })
    );

    // Additional LSTM layer
    model.add(
      tf.layers.lstm({
        units: 32,
        returnSequences: false,
      })
    );

    // Dense layers for prediction
    model.add(tf.layers.dense({ units: 16, activation: 'relu' }));
    model.add(tf.layers.dropout({ rate: 0.2 }));
    model.add(tf.layers.dense({ units: 1 }));

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mse', 'mae'],
    });

    return model;
  }

  async generatePredictions(
    historicalData: any[],
    config: PredictionConfig
  ): Promise<PredictionResult> {
    try {
      const processedData = this.preprocessData(historicalData);
      const predictions = await this.predictValues(processedData, config);
      const metrics = this.calculateModelMetrics(processedData.validation);
      const anomalies = this.detectAnomalies(historicalData);
      const seasonalFactors = this.calculateSeasonalFactors(historicalData);

      return {
        predictions: this.enrichPredictions(predictions, config),
        accuracy: metrics.r2,
        confidenceScore: this.calculateConfidenceScore(metrics),
        seasonalFactors,
        anomalies,
      };
    } catch (error) {
      console.error('Error generating predictions:', error);
      throw error;
    }
  }

  private preprocessData(data: any[]) {
    // Normalize data
    const normalizedData = this.normalizeData(data);

    // Split into training and validation sets
    const splitIndex = Math.floor(normalizedData.length * 0.8);
    const training = normalizedData.slice(0, splitIndex);
    const validation = normalizedData.slice(splitIndex);

    // Create sequences for LSTM
    const sequences = this.createSequences(normalizedData);

    return {
      training,
      validation,
      sequences,
      normParams: {
        mean: tf.mean(normalizedData),
        std: tf.std(normalizedData),
      },
    };
  }

  private normalizeData(data: any[]): number[] {
    const values = data.map(d => d.value);
    const tensor = tf.tensor1d(values);
    const normalized = tensor.sub(tf.mean(tensor)).div(tf.std(tensor));
    return Array.from(normalized.dataSync());
  }

  private createSequences(data: number[]): tf.Tensor[][] {
    const sequences: number[][] = [];
    const targets: number[] = [];

    for (let i = 0; i <= data.length - this.SEQUENCE_LENGTH - 1; i++) {
      sequences.push(data.slice(i, i + this.SEQUENCE_LENGTH));
      targets.push(data[i + this.SEQUENCE_LENGTH]);
    }

    return [
      tf.tensor3d(sequences, [sequences.length, this.SEQUENCE_LENGTH, 1]),
      tf.tensor2d(targets, [targets.length, 1]),
    ];
  }

  private async predictValues(
    processedData: any,
    config: PredictionConfig
  ): Promise<any[]> {
    const predictions: any[] = [];
    const lastSequence = processedData.sequences[0].slice(-1);

    for (let i = 0; i < config.horizon; i++) {
      const prediction = await this.model!.predict(lastSequence) as tf.Tensor;
      const predValue = prediction.dataSync()[0];

      // Denormalize prediction
      const denormalizedValue =
        predValue * processedData.normParams.std + processedData.normParams.mean;

      predictions.push({
        value: denormalizedValue,
        date: addDays(new Date(), i + 1),
      });

      // Update sequence for next prediction
      lastSequence.slice(1).push(predValue);
    }

    return predictions;
  }

  private enrichPredictions(predictions: any[], config: PredictionConfig) {
    return predictions.map(pred => ({
      ...pred,
      confidenceLow: pred.value * (1 - config.confidenceInterval),
      confidenceHigh: pred.value * (1 + config.confidenceInterval),
      probability: this.calculatePredictionProbability(pred.value),
    }));
  }

  private calculatePredictionProbability(value: number): number {
    // Implement probability calculation based on historical distribution
    return Math.min(Math.max(0, value / 100), 1);
  }

  private calculateModelMetrics(validationData: any[]): ModelMetrics {
    const actual = validationData.map(d => d.value);
    const predicted = this.model!.predict(
      tf.tensor3d(validationData.slice(0, -1), [
        validationData.length - 1,
        this.SEQUENCE_LENGTH,
        1,
      ])
    ) as tf.Tensor;

    const mse = tf.metrics.meanSquaredError(
      tf.tensor1d(actual),
      predicted
    ).dataSync()[0];
    const mae = tf.metrics.meanAbsoluteError(
      tf.tensor1d(actual),
      predicted
    ).dataSync()[0];

    return {
      mse,
      mae,
      mape: this.calculateMAPE(actual, Array.from(predicted.dataSync())),
      r2: this.calculateR2(actual, Array.from(predicted.dataSync())),
    };
  }

  private calculateMAPE(actual: number[], predicted: number[]): number {
    const mape =
      actual.reduce(
        (sum, val, i) => sum + Math.abs((val - predicted[i]) / val),
        0
      ) / actual.length;
    return mape * 100;
  }

  private calculateR2(actual: number[], predicted: number[]): number {
    const mean = actual.reduce((sum, val) => sum + val, 0) / actual.length;
    const ssTotal = actual.reduce((sum, val) => sum + (val - mean) ** 2, 0);
    const ssResidual = actual.reduce(
      (sum, val, i) => sum + (val - predicted[i]) ** 2,
      0
    );
    return 1 - ssResidual / ssTotal;
  }

  private calculateConfidenceScore(metrics: ModelMetrics): number {
    // Combine multiple metrics into a single confidence score
    const mseScore = 1 / (1 + metrics.mse);
    const mapeScore = Math.max(0, 1 - metrics.mape / 100);
    const r2Score = Math.max(0, metrics.r2);

    return (mseScore + mapeScore + r2Score) / 3;
  }

  private detectAnomalies(data: any[]): any[] {
    const values = data.map(d => d.value);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const std = Math.sqrt(
      values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / values.length
    );

    const threshold = 2; // Number of standard deviations for anomaly detection

    return data
      .filter(d => {
        const zScore = Math.abs((d.value - mean) / std);
        return zScore > threshold;
      })
      .map(d => ({
        date: d.date,
        value: d.value,
        expectedValue: mean,
        deviation: (d.value - mean) / std,
      }));
  }

  private calculateSeasonalFactors(data: any[]): number[] {
    // Calculate seasonal factors using moving averages
    const period = 7; // Weekly seasonality
    const values = data.map(d => d.value);
    const factors = new Array(period).fill(0);
    const counts = new Array(period).fill(0);

    data.forEach((d, i) => {
      const dayOfWeek = new Date(d.date).getDay();
      factors[dayOfWeek] += d.value;
      counts[dayOfWeek]++;
    });

    return factors.map((sum, i) => sum / counts[i]);
  }

  async updateModel(newData: any[]): Promise<void> {
    if (newData.length < this.MIN_TRAINING_SAMPLES) {
      console.warn('Insufficient data for model update');
      return;
    }

    const processedData = this.preprocessData(newData);
    
    await this.model!.fit(
      processedData.sequences[0],
      processedData.sequences[1],
      {
        epochs: 50,
        batchSize: 32,
        validationSplit: 0.2,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            console.log(`Epoch ${epoch + 1} - Loss: ${logs?.loss.toFixed(4)}`);
          },
        },
      }
    );
  }

  // Utility methods for external use
  
  async exportModel(): Promise<ArrayBuffer> {
    if (!this.model) throw new Error('Model not initialized');
    const modelData = await this.model.save(tf.io.withSaveHandler(async artifacts => {
      return artifacts;
    }));
    return modelData;
  }

  async importModel(modelData: ArrayBuffer): Promise<void> {
    this.model = await tf.loadLayersModel(tf.io.fromMemory(modelData));
  }

  getModelSummary(): string {
    if (!this.model) return 'Model not initialized';
    return this.model.summary();
  }
}

export default new PredictiveAnalyticsService();
