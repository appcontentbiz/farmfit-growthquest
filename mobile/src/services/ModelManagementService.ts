import * as tf from '@tensorflow/tfjs';
import * as FileSystem from 'expo-file-system';
import { format } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ModelMetadata {
  id: string;
  type: string;
  version: string;
  createdAt: string;
  metrics: {
    accuracy: number;
    loss: number;
    mse: number;
    mae: number;
    r2: number;
  };
  hyperparameters: any;
  trainingHistory: any[];
  size: number;
}

interface ModelConfig {
  type: string;
  hyperparameters: any;
  architecture: any[];
}

interface AutoMLConfig {
  maxTrials: number;
  maxEpochs: number;
  validationSplit: number;
  optimizeMetric: 'accuracy' | 'loss' | 'mse';
  searchSpace: {
    [key: string]: {
      type: 'int' | 'float' | 'categorical';
      values: any[];
    };
  };
}

class ModelManagementService {
  private readonly MODEL_DIR = `${FileSystem.documentDirectory}models/`;
  private readonly METADATA_KEY = '@FarmFit:ModelMetadata';
  private activeModels: Map<string, tf.LayersModel> = new Map();
  private metadata: { [key: string]: ModelMetadata } = {};

  constructor() {
    this.initializeStorage();
  }

  private async initializeStorage() {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.MODEL_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.MODEL_DIR, { intermediates: true });
      }

      const storedMetadata = await AsyncStorage.getItem(this.METADATA_KEY);
      if (storedMetadata) {
        this.metadata = JSON.parse(storedMetadata);
      }
    } catch (error) {
      console.error('Error initializing model storage:', error);
    }
  }

  async createModel(config: ModelConfig): Promise<tf.LayersModel> {
    const model = tf.sequential();

    for (const layer of config.architecture) {
      switch (layer.type) {
        case 'lstm':
          model.add(tf.layers.lstm({
            units: layer.units,
            returnSequences: layer.returnSequences,
            inputShape: layer.inputShape,
          }));
          break;
        case 'gru':
          model.add(tf.layers.gru({
            units: layer.units,
            returnSequences: layer.returnSequences,
            inputShape: layer.inputShape,
          }));
          break;
        case 'dense':
          model.add(tf.layers.dense({
            units: layer.units,
            activation: layer.activation,
          }));
          break;
        case 'dropout':
          model.add(tf.layers.dropout({ rate: layer.rate }));
          break;
        case 'conv1d':
          model.add(tf.layers.conv1d({
            filters: layer.filters,
            kernelSize: layer.kernelSize,
            activation: layer.activation,
            inputShape: layer.inputShape,
          }));
          break;
      }
    }

    model.compile({
      optimizer: tf.train.adam(config.hyperparameters.learningRate),
      loss: config.hyperparameters.loss,
      metrics: ['mse', 'mae'],
    });

    return model;
  }

  async autoMLSearch(
    data: { x: tf.Tensor, y: tf.Tensor },
    config: AutoMLConfig
  ): Promise<{ model: tf.LayersModel; hyperparameters: any }> {
    let bestModel: tf.LayersModel | null = null;
    let bestMetrics = { [config.optimizeMetric]: Infinity };
    let bestHyperparameters = null;

    for (let trial = 0; trial < config.maxTrials; trial++) {
      const hyperparameters = this.sampleHyperparameters(config.searchSpace);
      const model = await this.createModel({
        type: 'automl',
        hyperparameters,
        architecture: this.generateArchitecture(hyperparameters),
      });

      const history = await model.fit(data.x, data.y, {
        epochs: config.maxEpochs,
        validationSplit: config.validationSplit,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            console.log(`Trial ${trial + 1}, Epoch ${epoch + 1}:`, logs);
          },
        },
      });

      const metrics = history.history[config.optimizeMetric];
      const finalMetric = metrics[metrics.length - 1];

      if (finalMetric < bestMetrics[config.optimizeMetric]) {
        bestMetrics = { [config.optimizeMetric]: finalMetric };
        bestModel = model;
        bestHyperparameters = hyperparameters;
      }
    }

    if (!bestModel || !bestHyperparameters) {
      throw new Error('AutoML search failed to find a suitable model');
    }

    return { model: bestModel, hyperparameters: bestHyperparameters };
  }

  private sampleHyperparameters(searchSpace: AutoMLConfig['searchSpace']) {
    const hyperparameters: any = {};

    for (const [param, config] of Object.entries(searchSpace)) {
      if (config.type === 'int') {
        const [min, max] = config.values;
        hyperparameters[param] = Math.floor(Math.random() * (max - min + 1)) + min;
      } else if (config.type === 'float') {
        const [min, max] = config.values;
        hyperparameters[param] = Math.random() * (max - min) + min;
      } else if (config.type === 'categorical') {
        const index = Math.floor(Math.random() * config.values.length);
        hyperparameters[param] = config.values[index];
      }
    }

    return hyperparameters;
  }

  private generateArchitecture(hyperparameters: any) {
    // Generate model architecture based on hyperparameters
    const architecture = [];
    const numLayers = hyperparameters.numLayers || 3;

    for (let i = 0; i < numLayers; i++) {
      if (i === 0) {
        architecture.push({
          type: hyperparameters.layerType || 'lstm',
          units: hyperparameters.units,
          returnSequences: true,
          inputShape: [14, 5], // Example input shape
        });
      } else if (i === numLayers - 1) {
        architecture.push({
          type: 'dense',
          units: 1,
          activation: 'linear',
        });
      } else {
        architecture.push({
          type: hyperparameters.layerType || 'dense',
          units: hyperparameters.units,
          activation: hyperparameters.activation,
        });
      }

      if (hyperparameters.useDropout) {
        architecture.push({
          type: 'dropout',
          rate: hyperparameters.dropoutRate,
        });
      }
    }

    return architecture;
  }

  async saveModel(model: tf.LayersModel, metadata: Partial<ModelMetadata>): Promise<string> {
    const modelId = `model_${format(new Date(), 'yyyyMMdd_HHmmss')}`;
    const modelPath = `${this.MODEL_DIR}${modelId}`;

    try {
      await model.save(`file://${modelPath}`);

      const modelMetadata: ModelMetadata = {
        id: modelId,
        type: metadata.type || 'unknown',
        version: metadata.version || '1.0.0',
        createdAt: new Date().toISOString(),
        metrics: metadata.metrics || {
          accuracy: 0,
          loss: 0,
          mse: 0,
          mae: 0,
          r2: 0,
        },
        hyperparameters: metadata.hyperparameters || {},
        trainingHistory: metadata.trainingHistory || [],
        size: await this.getModelSize(modelPath),
      };

      this.metadata[modelId] = modelMetadata;
      await this.saveMetadata();

      return modelId;
    } catch (error) {
      console.error('Error saving model:', error);
      throw error;
    }
  }

  async loadModel(modelId: string): Promise<tf.LayersModel> {
    try {
      if (this.activeModels.has(modelId)) {
        return this.activeModels.get(modelId)!;
      }

      const modelPath = `${this.MODEL_DIR}${modelId}`;
      const model = await tf.loadLayersModel(`file://${modelPath}/model.json`);
      this.activeModels.set(modelId, model);

      return model;
    } catch (error) {
      console.error('Error loading model:', error);
      throw error;
    }
  }

  async deleteModel(modelId: string): Promise<void> {
    try {
      const modelPath = `${this.MODEL_DIR}${modelId}`;
      await FileSystem.deleteAsync(modelPath);

      delete this.metadata[modelId];
      this.activeModels.delete(modelId);
      await this.saveMetadata();
    } catch (error) {
      console.error('Error deleting model:', error);
      throw error;
    }
  }

  async updateMetadata(modelId: string, updates: Partial<ModelMetadata>): Promise<void> {
    if (!this.metadata[modelId]) {
      throw new Error(`Model ${modelId} not found`);
    }

    this.metadata[modelId] = {
      ...this.metadata[modelId],
      ...updates,
    };

    await this.saveMetadata();
  }

  private async saveMetadata(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.METADATA_KEY,
        JSON.stringify(this.metadata)
      );
    } catch (error) {
      console.error('Error saving metadata:', error);
      throw error;
    }
  }

  private async getModelSize(modelPath: string): Promise<number> {
    const info = await FileSystem.getInfoAsync(modelPath);
    return info.size || 0;
  }

  async getModelInfo(modelId: string): Promise<ModelMetadata> {
    const metadata = this.metadata[modelId];
    if (!metadata) {
      throw new Error(`Model ${modelId} not found`);
    }
    return metadata;
  }

  async listModels(): Promise<ModelMetadata[]> {
    return Object.values(this.metadata);
  }

  async compareModels(modelIds: string[]): Promise<{
    metrics: { [key: string]: any };
    recommendations: string[];
  }> {
    const comparisons = await Promise.all(
      modelIds.map(async (id) => ({
        id,
        metadata: await this.getModelInfo(id),
      }))
    );

    const metrics = comparisons.reduce(
      (acc, { id, metadata }) => ({
        ...acc,
        [id]: metadata.metrics,
      }),
      {}
    );

    const recommendations = this.generateRecommendations(comparisons);

    return { metrics, recommendations };
  }

  private generateRecommendations(comparisons: any[]): string[] {
    const recommendations: string[] = [];

    // Sort models by accuracy
    const sortedByAccuracy = [...comparisons].sort(
      (a, b) => b.metadata.metrics.accuracy - a.metadata.metrics.accuracy
    );

    // Best performing model
    recommendations.push(
      `Model ${sortedByAccuracy[0].id} shows the best overall performance with ${
        sortedByAccuracy[0].metadata.metrics.accuracy * 100
      }% accuracy`
    );

    // Size efficiency
    const sortedBySize = [...comparisons].sort(
      (a, b) => a.metadata.size - b.metadata.size
    );
    recommendations.push(
      `Model ${sortedBySize[0].id} is the most size-efficient at ${
        sortedBySize[0].metadata.size / 1024 / 1024
      }MB`
    );

    return recommendations;
  }
}

export default new ModelManagementService();
