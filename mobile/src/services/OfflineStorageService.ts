import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as tf from '@tensorflow/tfjs';
import { format } from 'date-fns';

interface StorageKeys {
  WEATHER_DATA: string;
  ML_MODEL: string;
  HISTORICAL_DATA: string;
  NOTIFICATION_PATTERNS: string;
  OFFLINE_PREDICTIONS: string;
}

const STORAGE_KEYS: StorageKeys = {
  WEATHER_DATA: '@FarmFit:weatherData',
  ML_MODEL: '@FarmFit:mlModel',
  HISTORICAL_DATA: '@FarmFit:historicalData',
  NOTIFICATION_PATTERNS: '@FarmFit:notificationPatterns',
  OFFLINE_PREDICTIONS: '@FarmFit:offlinePredictions',
};

const MODEL_DIRECTORY = `${FileSystem.documentDirectory}ml_models/`;

class OfflineStorageService {
  private weatherCache: Map<string, any> = new Map();
  private modelCache: tf.LayersModel | null = null;

  async initialize(): Promise<void> {
    try {
      await this.ensureDirectoryExists(MODEL_DIRECTORY);
      await this.loadWeatherCache();
      await this.loadModelCache();
    } catch (error) {
      console.error('Error initializing offline storage:', error);
    }
  }

  private async ensureDirectoryExists(directory: string): Promise<void> {
    const dirInfo = await FileSystem.getInfoAsync(directory);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
    }
  }

  // Weather Data Management
  async saveWeatherData(data: any, expirationDays: number = 7): Promise<void> {
    try {
      const weatherData = {
        data,
        timestamp: new Date().toISOString(),
        expirationDays,
      };
      await AsyncStorage.setItem(STORAGE_KEYS.WEATHER_DATA, JSON.stringify(weatherData));
      this.weatherCache.set('latest', weatherData);
    } catch (error) {
      console.error('Error saving weather data:', error);
    }
  }

  async getWeatherData(): Promise<any | null> {
    try {
      const cachedData = this.weatherCache.get('latest');
      if (cachedData) {
        const expirationDate = new Date(cachedData.timestamp);
        expirationDate.setDate(expirationDate.getDate() + cachedData.expirationDays);
        
        if (new Date() < expirationDate) {
          return cachedData.data;
        }
      }

      const storedData = await AsyncStorage.getItem(STORAGE_KEYS.WEATHER_DATA);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        this.weatherCache.set('latest', parsedData);
        return parsedData.data;
      }
      return null;
    } catch (error) {
      console.error('Error getting weather data:', error);
      return null;
    }
  }

  // ML Model Management
  async saveMLModel(model: tf.LayersModel): Promise<void> {
    try {
      const modelPath = `${MODEL_DIRECTORY}model.json`;
      await model.save(`file://${modelPath}`);
      this.modelCache = model;
    } catch (error) {
      console.error('Error saving ML model:', error);
    }
  }

  async loadMLModel(): Promise<tf.LayersModel | null> {
    try {
      if (this.modelCache) {
        return this.modelCache;
      }

      const modelPath = `${MODEL_DIRECTORY}model.json`;
      const modelInfo = await FileSystem.getInfoAsync(`file://${modelPath}`);
      
      if (modelInfo.exists) {
        const model = await tf.loadLayersModel(`file://${modelPath}`);
        this.modelCache = model;
        return model;
      }
      return null;
    } catch (error) {
      console.error('Error loading ML model:', error);
      return null;
    }
  }

  // Historical Data Management
  async saveHistoricalData(data: any[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.HISTORICAL_DATA, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving historical data:', error);
    }
  }

  async getHistoricalData(): Promise<any[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.HISTORICAL_DATA);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting historical data:', error);
      return [];
    }
  }

  async appendHistoricalData(newData: any): Promise<void> {
    try {
      const existingData = await this.getHistoricalData();
      existingData.push({
        ...newData,
        timestamp: new Date().toISOString(),
      });
      await this.saveHistoricalData(existingData);
    } catch (error) {
      console.error('Error appending historical data:', error);
    }
  }

  // Notification Pattern Management
  async saveNotificationPatterns(patterns: any): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_PATTERNS, JSON.stringify(patterns));
    } catch (error) {
      console.error('Error saving notification patterns:', error);
    }
  }

  async getNotificationPatterns(): Promise<any | null> {
    try {
      const patterns = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_PATTERNS);
      return patterns ? JSON.parse(patterns) : null;
    } catch (error) {
      console.error('Error getting notification patterns:', error);
      return null;
    }
  }

  // Offline Predictions Management
  async saveOfflinePredictions(predictions: any[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_PREDICTIONS, JSON.stringify({
        predictions,
        timestamp: new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Error saving offline predictions:', error);
    }
  }

  async getOfflinePredictions(): Promise<any[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_PREDICTIONS);
      if (data) {
        const { predictions, timestamp } = JSON.parse(data);
        const age = Math.abs(new Date().getTime() - new Date(timestamp).getTime());
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        if (age < maxAge) {
          return predictions;
        }
      }
      return [];
    } catch (error) {
      console.error('Error getting offline predictions:', error);
      return [];
    }
  }

  // Cache Management
  async clearCache(): Promise<void> {
    try {
      this.weatherCache.clear();
      this.modelCache = null;
      await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
      await FileSystem.deleteAsync(MODEL_DIRECTORY, { idempotent: true });
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  // Data Export
  async exportData(): Promise<string> {
    try {
      const data = {
        weather: await this.getWeatherData(),
        historical: await this.getHistoricalData(),
        patterns: await this.getNotificationPatterns(),
        predictions: await this.getOfflinePredictions(),
        exportDate: new Date().toISOString(),
      };

      const fileName = `farmfit_export_${format(new Date(), 'yyyyMMdd_HHmmss')}.json`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(filePath, JSON.stringify(data, null, 2));
      return filePath;
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  // Data Import
  async importData(filePath: string): Promise<void> {
    try {
      const content = await FileSystem.readAsStringAsync(filePath);
      const data = JSON.parse(content);

      if (data.weather) await this.saveWeatherData(data.weather);
      if (data.historical) await this.saveHistoricalData(data.historical);
      if (data.patterns) await this.saveNotificationPatterns(data.patterns);
      if (data.predictions) await this.saveOfflinePredictions(data.predictions);
    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
    }
  }
}

export default new OfflineStorageService();
