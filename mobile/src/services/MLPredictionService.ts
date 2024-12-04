import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import { addDays, subDays, format, differenceInDays } from 'date-fns';
import { store } from '../store';
import { TreatmentPriority } from '../types/therapeutic';
import OfflineStorageService from './OfflineStorageService';

interface MLFeatures {
  dayOfWeek: number;
  timeOfDay: number;
  category: number;
  priority: number;
  temperature: number;
  humidity: number;
  previousNotifications: number;
  readRate: number;
  responseTime: number;
  animalHealth: number;
  treatmentHistory: number;
  seasonalPatterns: number;
  farmingActivity: number;
  staffAvailability: number;
  equipmentStatus: number;
}

interface PredictionResult {
  probability: number;
  suggestedTime: string;
  confidence: number;
  factors: {
    name: string;
    impact: number;
  }[];
  enhancedMetrics: {
    seasonalImpact: number;
    historicalSuccess: number;
    resourceAvailability: number;
    weatherCompatibility: number;
  };
}

class MLPredictionService {
  private model: tf.LayersModel | null = null;
  private readonly CATEGORIES = ['medication_reminder', 'vaccination', 'dietary_update'];
  private readonly TIME_SLOTS = [
    'early_morning',
    'morning',
    'late_morning',
    'early_afternoon',
    'afternoon',
    'late_afternoon',
    'evening',
    'night',
  ];

  private readonly ADVANCED_FEATURES = [
    'animalHealth',
    'treatmentHistory',
    'seasonalPatterns',
    'farmingActivity',
    'staffAvailability',
    'equipmentStatus',
  ];

  constructor() {
    this.initializeModel();
  }

  private async initializeModel() {
    try {
      await tf.ready();
      
      // Try to load model from offline storage
      const storedModel = await OfflineStorageService.loadMLModel();
      if (storedModel) {
        this.model = storedModel;
        return;
      }
      
      // Create a more sophisticated neural network
      const model = tf.sequential();
      
      // Input layer with more features
      model.add(tf.layers.dense({
        inputShape: [15], // Increased number of features
        units: 64,
        activation: 'relu',
      }));
      
      // Additional hidden layers
      model.add(tf.layers.dropout({ rate: 0.2 }));
      model.add(tf.layers.dense({
        units: 32,
        activation: 'relu',
      }));
      
      model.add(tf.layers.dropout({ rate: 0.1 }));
      model.add(tf.layers.dense({
        units: 16,
        activation: 'relu',
      }));
      
      // Output layer
      model.add(tf.layers.dense({
        units: 1,
        activation: 'sigmoid',
      }));
      
      // Use Adam optimizer with custom learning rate
      const optimizer = tf.train.adam(0.001);
      
      model.compile({
        optimizer,
        loss: 'binaryCrossentropy',
        metrics: ['accuracy', 'precision', 'recall'],
      });
      
      this.model = model;
      
      // Save model to offline storage
      await OfflineStorageService.saveMLModel(model);
    } catch (error) {
      console.error('Error initializing ML model:', error);
    }
  }

  private async trainModel(historicalData: any[]) {
    if (!this.model) {
      console.error('Model not initialized');
      return;
    }

    try {
      // Prepare enhanced training data
      const features = historicalData.map(data => this.extractEnhancedFeatures(data));
      const labels = historicalData.map(data => data.wasSuccessful ? 1 : 0);

      const xs = tf.tensor2d(features.map(f => Object.values(f)));
      const ys = tf.tensor2d(labels.map(l => [l]));

      // Advanced training configuration
      const trainConfig = {
        epochs: 100,
        batchSize: 32,
        validationSplit: 0.2,
        shuffle: true,
        callbacks: {
          onEpochEnd: async (epoch: number, logs: any) => {
            console.log(`Epoch ${epoch + 1}`);
            console.log(`  Loss: ${logs.loss.toFixed(4)}`);
            console.log(`  Accuracy: ${logs.acc.toFixed(4)}`);
            console.log(`  Precision: ${logs.precision.toFixed(4)}`);
            console.log(`  Recall: ${logs.recall.toFixed(4)}`);
            
            // Save training progress
            if ((epoch + 1) % 10 === 0) {
              await OfflineStorageService.saveMLModel(this.model!);
            }
          },
        },
      };

      // Train the model
      const history = await this.model.fit(xs, ys, trainConfig);

      // Save final model
      await OfflineStorageService.saveMLModel(this.model);

      // Clean up tensors
      xs.dispose();
      ys.dispose();

      return history;
    } catch (error) {
      console.error('Error training model:', error);
    }
  }

  private extractEnhancedFeatures(data: any): any {
    const baseFeatures = this.extractFeatures(data);
    
    // Add advanced features
    const enhancedFeatures = {
      ...baseFeatures,
      animalHealth: this.normalizeValue(data.animalHealth || 0.5, 0, 1),
      treatmentHistory: this.normalizeValue(data.treatmentHistory || 0.5, 0, 1),
      seasonalPatterns: this.calculateSeasonalPattern(data.scheduledFor),
      farmingActivity: this.normalizeValue(data.farmingActivity || 0.5, 0, 1),
      staffAvailability: this.normalizeValue(data.staffAvailability || 0.8, 0, 1),
      equipmentStatus: this.normalizeValue(data.equipmentStatus || 0.9, 0, 1),
    };

    return enhancedFeatures;
  }

  private normalizeValue(value: number, min: number, max: number): number {
    return (value - min) / (max - min);
  }

  private calculateSeasonalPattern(date: string): number {
    const seasonalFactors = {
      spring: 0.8,
      summer: 0.6,
      fall: 0.7,
      winter: 0.9,
    };

    const month = new Date(date).getMonth();
    if (month >= 2 && month <= 4) return seasonalFactors.spring;
    if (month >= 5 && month <= 7) return seasonalFactors.summer;
    if (month >= 8 && month <= 10) return seasonalFactors.fall;
    return seasonalFactors.winter;
  }

  async predictSuccess(notificationData: any): Promise<PredictionResult> {
    try {
      // Try to get cached predictions first
      const cachedPredictions = await OfflineStorageService.getOfflinePredictions();
      const cachedPrediction = cachedPredictions.find(
        p => p.category === notificationData.category &&
            p.scheduledFor === notificationData.scheduledFor
      );

      if (cachedPrediction) {
        return cachedPrediction;
      }

      if (!this.model) {
        throw new Error('Model not initialized');
      }

      const features = this.extractEnhancedFeatures(notificationData);
      const input = tf.tensor2d([Object.values(features)]);
      
      const prediction = this.model.predict(input) as tf.Tensor;
      const probability = (await prediction.data())[0];

      // Calculate feature importance
      const factors = await this.calculateFeatureImportance(features, probability);

      // Get optimal time suggestion
      const suggestedTime = await this.suggestOptimalTime(notificationData);

      // Calculate confidence with enhanced metrics
      const confidence = this.calculateEnhancedConfidence(probability, factors, notificationData);

      const result = {
        probability,
        suggestedTime,
        confidence,
        factors,
        enhancedMetrics: await this.calculateEnhancedMetrics(notificationData),
      };

      // Cache the prediction
      await this.cachePrediction(notificationData, result);

      // Clean up tensors
      input.dispose();
      prediction.dispose();

      return result;
    } catch (error) {
      console.error('Error making prediction:', error);
      throw error;
    }
  }

  private async calculateEnhancedMetrics(notificationData: any) {
    return {
      seasonalImpact: this.calculateSeasonalPattern(notificationData.scheduledFor),
      historicalSuccess: await this.calculateHistoricalSuccess(notificationData),
      resourceAvailability: this.calculateResourceAvailability(notificationData),
      weatherCompatibility: await this.calculateWeatherCompatibility(notificationData),
    };
  }

  private async calculateHistoricalSuccess(notificationData: any): Promise<number> {
    const historicalData = await OfflineStorageService.getHistoricalData();
    const similarNotifications = historicalData.filter(
      data => data.category === notificationData.category
    );

    if (similarNotifications.length === 0) return 0.5;

    const successCount = similarNotifications.filter(data => data.wasSuccessful).length;
    return successCount / similarNotifications.length;
  }

  private calculateResourceAvailability(notificationData: any): number {
    const { staffAvailability = 0.8, equipmentStatus = 0.9 } = notificationData;
    return (staffAvailability + equipmentStatus) / 2;
  }

  private async calculateWeatherCompatibility(notificationData: any): Promise<number> {
    const weatherData = await OfflineStorageService.getWeatherData();
    if (!weatherData) return 0.5;

    // Implement weather compatibility logic based on notification category
    const { temperature, humidity, precipitation } = weatherData;
    
    const weights = {
      temperature: 0.4,
      humidity: 0.3,
      precipitation: 0.3,
    };

    const normalizedTemp = this.normalizeValue(temperature, -10, 40);
    const normalizedHumidity = this.normalizeValue(humidity, 0, 100);
    const normalizedPrecip = this.normalizeValue(precipitation, 0, 50);

    return (
      normalizedTemp * weights.temperature +
      normalizedHumidity * weights.humidity +
      normalizedPrecip * weights.precipitation
    );
  }

  private async cachePrediction(notificationData: any, result: any): Promise<void> {
    const predictions = await OfflineStorageService.getOfflinePredictions();
    predictions.push({
      ...result,
      category: notificationData.category,
      scheduledFor: notificationData.scheduledFor,
      timestamp: new Date().toISOString(),
    });

    await OfflineStorageService.saveOfflinePredictions(predictions);
  }

  async updateModel(newData: any[]): Promise<void> {
    await this.trainModel(newData);
  }
}

export default new MLPredictionService();
