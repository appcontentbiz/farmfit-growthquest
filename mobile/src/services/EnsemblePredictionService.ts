import * as tf from '@tensorflow/tfjs';
import { addDays, subDays, eachDayOfInterval } from 'date-fns';
import PredictiveAnalyticsService from './PredictiveAnalyticsService';

interface EnsembleConfig {
  modelTypes: ('lstm' | 'gru' | 'dense' | 'cnn' | 'prophet')[];
  ensembleMethod: 'weighted' | 'stacking' | 'boosting';
  weightingStrategy: 'equal' | 'performance' | 'adaptive';
  validationSplit: number;
  crossValidationFolds: number;
  hyperparameterTuning: boolean;
}

interface ModelWeight {
  modelType: string;
  weight: number;
  performance: number;
}

class EnsemblePredictionService {
  private models: Map<string, tf.LayersModel> = new Map();
  private modelWeights: ModelWeight[] = [];
  private readonly DEFAULT_CONFIG: EnsembleConfig = {
    modelTypes: ['lstm', 'gru', 'dense'],
    ensembleMethod: 'weighted',
    weightingStrategy: 'adaptive',
    validationSplit: 0.2,
    crossValidationFolds: 5,
    hyperparameterTuning: true,
  };

  async initialize(config: Partial<EnsembleConfig> = {}) {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    await this.initializeModels(finalConfig);
  }

  private async initializeModels(config: EnsembleConfig) {
    for (const modelType of config.modelTypes) {
      const model = await this.createModel(modelType);
      this.models.set(modelType, model);
      this.modelWeights.push({
        modelType,
        weight: 1 / config.modelTypes.length,
        performance: 0,
      });
    }
  }

  private async createModel(modelType: string): Promise<tf.LayersModel> {
    const model = tf.sequential();

    switch (modelType) {
      case 'lstm':
        return this.createLSTMModel();
      case 'gru':
        return this.createGRUModel();
      case 'dense':
        return this.createDenseModel();
      case 'cnn':
        return this.createCNNModel();
      default:
        throw new Error(`Unsupported model type: ${modelType}`);
    }
  }

  private createLSTMModel(): tf.LayersModel {
    const model = tf.sequential();
    model.add(
      tf.layers.lstm({
        units: 64,
        returnSequences: true,
        inputShape: [14, 5],
      })
    );
    model.add(tf.layers.lstm({ units: 32 }));
    model.add(tf.layers.dense({ units: 16, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 1 }));
    
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
    });
    
    return model;
  }

  private createGRUModel(): tf.LayersModel {
    const model = tf.sequential();
    model.add(
      tf.layers.gru({
        units: 64,
        returnSequences: true,
        inputShape: [14, 5],
      })
    );
    model.add(tf.layers.gru({ units: 32 }));
    model.add(tf.layers.dense({ units: 16, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 1 }));
    
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
    });
    
    return model;
  }

  private createDenseModel(): tf.LayersModel {
    const model = tf.sequential();
    model.add(tf.layers.flatten({ inputShape: [14, 5] }));
    model.add(tf.layers.dense({ units: 128, activation: 'relu' }));
    model.add(tf.layers.dropout({ rate: 0.3 }));
    model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 1 }));
    
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
    });
    
    return model;
  }

  private createCNNModel(): tf.LayersModel {
    const model = tf.sequential();
    model.add(
      tf.layers.conv1d({
        filters: 32,
        kernelSize: 3,
        activation: 'relu',
        inputShape: [14, 5],
      })
    );
    model.add(tf.layers.maxPooling1d({ poolSize: 2 }));
    model.add(tf.layers.flatten());
    model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 1 }));
    
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
    });
    
    return model;
  }

  async trainEnsemble(data: any[], config: EnsembleConfig) {
    const processedData = this.preprocessData(data);
    const folds = this.createCrossValidationFolds(processedData, config.crossValidationFolds);

    for (const [modelType, model] of this.models.entries()) {
      let totalPerformance = 0;

      for (const fold of folds) {
        await model.fit(fold.train.x, fold.train.y, {
          epochs: 50,
          batchSize: 32,
          validationData: [fold.validation.x, fold.validation.y],
          callbacks: {
            onEpochEnd: (epoch, logs) => {
              console.log(`${modelType} - Fold ${fold.index} - Epoch ${epoch + 1} - Loss: ${logs?.loss.toFixed(4)}`);
            },
          },
        });

        const performance = this.evaluateModel(model, fold.validation.x, fold.validation.y);
        totalPerformance += performance;
      }

      const averagePerformance = totalPerformance / config.crossValidationFolds;
      this.updateModelWeight(modelType, averagePerformance, config);
    }

    if (config.hyperparameterTuning) {
      await this.tuneHyperparameters(processedData);
    }
  }

  private preprocessData(data: any[]) {
    // Implement data preprocessing logic
    return {
      x: tf.tensor3d([]), // Processed input data
      y: tf.tensor2d([]), // Processed target data
    };
  }

  private createCrossValidationFolds(data: any, numFolds: number) {
    const folds = [];
    const foldSize = Math.floor(data.x.shape[0] / numFolds);

    for (let i = 0; i < numFolds; i++) {
      const validationStart = i * foldSize;
      const validationEnd = validationStart + foldSize;

      const validationX = data.x.slice(validationStart, validationEnd);
      const validationY = data.y.slice(validationStart, validationEnd);

      const trainX = tf.concat([
        data.x.slice(0, validationStart),
        data.x.slice(validationEnd),
      ]);
      const trainY = tf.concat([
        data.y.slice(0, validationStart),
        data.y.slice(validationEnd),
      ]);

      folds.push({
        index: i,
        train: { x: trainX, y: trainY },
        validation: { x: validationX, y: validationY },
      });
    }

    return folds;
  }

  private evaluateModel(
    model: tf.LayersModel,
    validationX: tf.Tensor,
    validationY: tf.Tensor
  ): number {
    const predictions = model.predict(validationX) as tf.Tensor;
    const mse = tf.metrics.meanSquaredError(validationY, predictions);
    return 1 / (1 + mse.dataSync()[0]); // Convert MSE to performance score
  }

  private updateModelWeight(
    modelType: string,
    performance: number,
    config: EnsembleConfig
  ) {
    const modelWeight = this.modelWeights.find((w) => w.modelType === modelType);
    if (!modelWeight) return;

    modelWeight.performance = performance;

    if (config.weightingStrategy === 'performance') {
      // Update weights based on relative performance
      const totalPerformance = this.modelWeights.reduce(
        (sum, w) => sum + w.performance,
        0
      );
      this.modelWeights.forEach((w) => {
        w.weight = w.performance / totalPerformance;
      });
    } else if (config.weightingStrategy === 'adaptive') {
      // Implement adaptive weighting strategy
      const temperature = 1.0; // Controls how aggressive the adaptation is
      const weights = tf.softmax(
        tf.tensor1d(this.modelWeights.map((w) => w.performance / temperature))
      );
      const weightValues = weights.dataSync();
      this.modelWeights.forEach((w, i) => {
        w.weight = weightValues[i];
      });
    }
  }

  private async tuneHyperparameters(data: any) {
    // Implement hyperparameter tuning using grid search or random search
    const hyperparameterSpace = {
      learningRate: [0.001, 0.0001],
      batchSize: [16, 32, 64],
      units: [32, 64, 128],
    };

    for (const [modelType, model] of this.models.entries()) {
      let bestParams = null;
      let bestPerformance = -Infinity;

      // Simple grid search
      for (const lr of hyperparameterSpace.learningRate) {
        for (const batchSize of hyperparameterSpace.batchSize) {
          for (const units of hyperparameterSpace.units) {
            const newModel = await this.createModel(modelType);
            newModel.compile({
              optimizer: tf.train.adam(lr),
              loss: 'meanSquaredError',
            });

            await newModel.fit(data.x, data.y, {
              epochs: 10,
              batchSize,
              validationSplit: 0.2,
            });

            const performance = this.evaluateModel(
              newModel,
              data.x,
              data.y
            );

            if (performance > bestPerformance) {
              bestPerformance = performance;
              bestParams = { lr, batchSize, units };
              this.models.set(modelType, newModel);
            }
          }
        }
      }

      console.log(`Best parameters for ${modelType}:`, bestParams);
    }
  }

  async generateEnsemblePrediction(
    input: tf.Tensor,
    config: EnsembleConfig
  ): Promise<tf.Tensor> {
    const predictions = await Promise.all(
      Array.from(this.models.entries()).map(async ([modelType, model]) => {
        const prediction = model.predict(input) as tf.Tensor;
        const weight = this.modelWeights.find((w) => w.modelType === modelType)?.weight || 0;
        return prediction.mul(tf.scalar(weight));
      })
    );

    if (config.ensembleMethod === 'weighted') {
      return tf.addN(predictions);
    } else if (config.ensembleMethod === 'stacking') {
      // Implement stacking logic
      const stackedPredictions = tf.concat(predictions, -1);
      const stackingModel = await this.createStackingModel(stackedPredictions.shape);
      return stackingModel.predict(stackedPredictions) as tf.Tensor;
    } else {
      // Default to simple averaging
      return tf.addN(predictions).div(tf.scalar(predictions.length));
    }
  }

  private async createStackingModel(inputShape: number[]): Promise<tf.LayersModel> {
    const model = tf.sequential();
    model.add(tf.layers.dense({
      units: 16,
      activation: 'relu',
      inputShape: [inputShape[inputShape.length - 1]],
    }));
    model.add(tf.layers.dense({ units: 1 }));
    
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
    });
    
    return model;
  }

  async exportEnsemble(): Promise<ArrayBuffer> {
    const modelData = await Promise.all(
      Array.from(this.models.entries()).map(async ([type, model]) => ({
        type,
        model: await model.save(tf.io.withSaveHandler(async (artifacts) => artifacts)),
        weight: this.modelWeights.find((w) => w.modelType === type)?.weight || 0,
      }))
    );
    return new Blob([JSON.stringify(modelData)]).arrayBuffer();
  }

  async importEnsemble(data: ArrayBuffer) {
    const modelData = JSON.parse(new TextDecoder().decode(data));
    this.models.clear();
    this.modelWeights = [];

    for (const { type, model, weight } of modelData) {
      this.models.set(type, await tf.loadLayersModel(tf.io.fromMemory(model)));
      this.modelWeights.push({
        modelType: type,
        weight,
        performance: 0,
      });
    }
  }

  getEnsembleStatus(): {
    models: string[];
    weights: ModelWeight[];
    totalModels: number;
  } {
    return {
      models: Array.from(this.models.keys()),
      weights: this.modelWeights,
      totalModels: this.models.size,
    };
  }
}

export default new EnsemblePredictionService();
