import * as tf from '@tensorflow/tfjs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import ModelManagementService from './ModelManagementService';

interface TrainingConfig {
  batchSize: number;
  epochs: number;
  validationSplit: number;
  distributedConfig: {
    workerCount: number;
    batchesPerWorker: number;
    syncInterval: number;
  };
}

interface ModelUpdateConfig {
  updateInterval: number;
  minSamples: number;
  maxStaleness: number;
  performanceThreshold: number;
}

interface WorkerState {
  id: string;
  status: 'idle' | 'training' | 'error';
  progress: number;
  lastSync: Date;
  metrics: {
    loss: number;
    accuracy: number;
    [key: string]: number;
  };
}

class DistributedTrainingService {
  private workers: Map<string, WorkerState> = new Map();
  private modelUpdates: Map<string, any[]> = new Map();
  private readonly WORKER_STATE_KEY = '@FarmFit:WorkerState';
  private readonly MODEL_UPDATES_KEY = '@FarmFit:ModelUpdates';

  constructor() {
    this.initializeState();
  }

  private async initializeState() {
    try {
      const storedWorkerState = await AsyncStorage.getItem(this.WORKER_STATE_KEY);
      if (storedWorkerState) {
        const parsedState = JSON.parse(storedWorkerState);
        this.workers = new Map(Object.entries(parsedState));
      }

      const storedUpdates = await AsyncStorage.getItem(this.MODEL_UPDATES_KEY);
      if (storedUpdates) {
        const parsedUpdates = JSON.parse(storedUpdates);
        this.modelUpdates = new Map(Object.entries(parsedUpdates));
      }
    } catch (error) {
      console.error('Error initializing distributed training state:', error);
    }
  }

  async startDistributedTraining(
    model: tf.LayersModel,
    data: { x: tf.Tensor; y: tf.Tensor },
    config: TrainingConfig
  ) {
    const workerId = `worker_${format(new Date(), 'yyyyMMdd_HHmmss')}`;
    
    try {
      // Initialize worker state
      const workerState: WorkerState = {
        id: workerId,
        status: 'training',
        progress: 0,
        lastSync: new Date(),
        metrics: {
          loss: 0,
          accuracy: 0,
        },
      };
      
      this.workers.set(workerId, workerState);
      await this.saveWorkerState();

      // Split data for distributed training
      const dataBatches = this.splitDataForWorkers(
        data,
        config.distributedConfig.workerCount,
        config.distributedConfig.batchesPerWorker
      );

      // Start distributed training
      const trainingPromises = dataBatches.map((batch, index) =>
        this.trainWorker(
          model,
          batch,
          config,
          `${workerId}_${index}`,
          index === 0 // First worker is primary
        )
      );

      // Monitor training progress
      const progressInterval = setInterval(async () => {
        const overallProgress = Array.from(this.workers.values()).reduce(
          (acc, worker) => acc + worker.progress,
          0
        ) / this.workers.size;

        if (overallProgress >= 1) {
          clearInterval(progressInterval);
          await this.finalizeTraining(model, workerId);
        }
      }, 1000);

      await Promise.all(trainingPromises);
      return workerId;
    } catch (error) {
      console.error('Error in distributed training:', error);
      throw error;
    }
  }

  private splitDataForWorkers(
    data: { x: tf.Tensor; y: tf.Tensor },
    workerCount: number,
    batchesPerWorker: number
  ) {
    const { x, y } = data;
    const totalSamples = x.shape[0];
    const samplesPerWorker = Math.floor(totalSamples / workerCount);

    return Array.from({ length: workerCount }, (_, i) => {
      const start = i * samplesPerWorker;
      const end = i === workerCount - 1 ? totalSamples : (i + 1) * samplesPerWorker;

      return {
        x: x.slice([start, 0], [end - start, -1]),
        y: y.slice([start, 0], [end - start, -1]),
      };
    });
  }

  private async trainWorker(
    model: tf.LayersModel,
    data: { x: tf.Tensor; y: tf.Tensor },
    config: TrainingConfig,
    workerId: string,
    isPrimary: boolean
  ) {
    try {
      const worker = this.workers.get(workerId);
      if (!worker) throw new Error(`Worker ${workerId} not found`);

      const history = await model.fit(data.x, data.y, {
        epochs: config.epochs,
        batchSize: config.batchSize,
        validationSplit: config.validationSplit,
        callbacks: {
          onEpochEnd: async (epoch, logs) => {
            if (logs) {
              worker.metrics = logs;
              worker.progress = (epoch + 1) / config.epochs;
              await this.saveWorkerState();

              if (isPrimary && (epoch + 1) % config.distributedConfig.syncInterval === 0) {
                await this.synchronizeWorkers(model, workerId);
              }
            }
          },
        },
      });

      worker.status = 'idle';
      await this.saveWorkerState();

      return history;
    } catch (error) {
      console.error(`Error in worker ${workerId}:`, error);
      const worker = this.workers.get(workerId);
      if (worker) {
        worker.status = 'error';
        await this.saveWorkerState();
      }
      throw error;
    }
  }

  private async synchronizeWorkers(model: tf.LayersModel, primaryWorkerId: string) {
    try {
      // Get weights from primary worker
      const primaryWeights = model.getWeights();

      // Average weights from all workers
      const workerWeights = Array.from(this.workers.values())
        .filter((worker) => worker.status === 'training')
        .map((worker) => {
          // In a real implementation, we would get weights from each worker
          // For now, we'll use the primary weights as a placeholder
          return primaryWeights;
        });

      const averagedWeights = this.averageWeights(workerWeights);
      model.setWeights(averagedWeights);

      // Update last sync time for all workers
      for (const worker of this.workers.values()) {
        worker.lastSync = new Date();
      }
      await this.saveWorkerState();
    } catch (error) {
      console.error('Error synchronizing workers:', error);
    }
  }

  private averageWeights(weightsArray: tf.Tensor[][]) {
    return weightsArray[0].map((_, i) => {
      const tensors = weightsArray.map((w) => w[i]);
      const sum = tf.add(tensors);
      return sum.div(tf.scalar(weightsArray.length));
    });
  }

  private async finalizeTraining(model: tf.LayersModel, workerId: string) {
    try {
      // Save final model
      const modelId = await ModelManagementService.saveModel(model, {
        type: 'distributed',
        version: '1.0.0',
        metrics: this.workers.get(workerId)?.metrics || {},
      });

      // Clean up worker state
      this.workers.clear();
      await this.saveWorkerState();

      return modelId;
    } catch (error) {
      console.error('Error finalizing training:', error);
      throw error;
    }
  }

  async setupRealTimeUpdates(modelId: string, config: ModelUpdateConfig) {
    try {
      const updateInterval = setInterval(async () => {
        const updates = this.modelUpdates.get(modelId) || [];
        
        if (updates.length >= config.minSamples) {
          const model = await ModelManagementService.loadModel(modelId);
          await this.performRealTimeUpdate(model, updates, config);
          this.modelUpdates.set(modelId, []);
          await this.saveModelUpdates();
        }
      }, config.updateInterval);

      return updateInterval;
    } catch (error) {
      console.error('Error setting up real-time updates:', error);
      throw error;
    }
  }

  private async performRealTimeUpdate(
    model: tf.LayersModel,
    updates: any[],
    config: ModelUpdateConfig
  ) {
    try {
      // Convert updates to tensors
      const { x, y } = this.prepareUpdateData(updates);

      // Perform incremental update
      const history = await model.fit(x, y, {
        epochs: 1,
        batchSize: 32,
        validationSplit: 0.2,
      });

      // Check performance
      const performance = history.history.loss[0];
      if (performance <= config.performanceThreshold) {
        await ModelManagementService.saveModel(model, {
          type: 'real-time-update',
          version: format(new Date(), 'yyyyMMdd_HHmmss'),
          metrics: history.history,
        });
      }

      // Cleanup tensors
      x.dispose();
      y.dispose();
    } catch (error) {
      console.error('Error performing real-time update:', error);
      throw error;
    }
  }

  private prepareUpdateData(updates: any[]) {
    // Convert updates to appropriate tensor format
    // This is a placeholder implementation
    return {
      x: tf.tensor(updates.map((u) => u.input)),
      y: tf.tensor(updates.map((u) => u.output)),
    };
  }

  async addModelUpdate(modelId: string, update: any) {
    const updates = this.modelUpdates.get(modelId) || [];
    updates.push(update);
    this.modelUpdates.set(modelId, updates);
    await this.saveModelUpdates();
  }

  private async saveWorkerState() {
    try {
      await AsyncStorage.setItem(
        this.WORKER_STATE_KEY,
        JSON.stringify(Object.fromEntries(this.workers))
      );
    } catch (error) {
      console.error('Error saving worker state:', error);
    }
  }

  private async saveModelUpdates() {
    try {
      await AsyncStorage.setItem(
        this.MODEL_UPDATES_KEY,
        JSON.stringify(Object.fromEntries(this.modelUpdates))
      );
    } catch (error) {
      console.error('Error saving model updates:', error);
    }
  }

  async getWorkerStatus(workerId: string): Promise<WorkerState | undefined> {
    return this.workers.get(workerId);
  }

  async getAllWorkerStatus(): Promise<WorkerState[]> {
    return Array.from(this.workers.values());
  }
}

export default new DistributedTrainingService();
