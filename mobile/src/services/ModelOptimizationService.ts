import * as tf from '@tensorflow/tfjs';
import { format } from 'date-fns';
import ModelManagementService from './ModelManagementService';

interface CompressionConfig {
  quantizationBits: 8 | 16;
  pruningConfig: {
    initialSparsity: number;
    finalSparsity: number;
    pruningFrequency: number;
    pruningThreshold: number;
  };
  distillationConfig?: {
    teacherModelId: string;
    temperature: number;
    alpha: number;
  };
}

interface OptimizationMetrics {
  originalSize: number;
  compressedSize: number;
  accuracyDelta: number;
  latencyImprovement: number;
  memoryUsage: number;
}

class ModelOptimizationService {
  private readonly SPARSITY_SCHEDULER = {
    initial: 0.0,
    final: 0.5,
    frequency: 100,
    target: 0.75,
  };

  async compressModel(
    model: tf.LayersModel,
    config: CompressionConfig
  ): Promise<{ model: tf.LayersModel; metrics: OptimizationMetrics }> {
    try {
      const originalSize = await this.getModelSize(model);
      
      // Apply quantization
      const quantizedModel = await this.quantizeModel(model, config.quantizationBits);
      
      // Apply pruning
      const prunedModel = await this.pruneModel(
        quantizedModel,
        config.pruningConfig
      );

      // Apply knowledge distillation if teacher model is provided
      const optimizedModel = config.distillationConfig
        ? await this.applyKnowledgeDistillation(
            prunedModel,
            config.distillationConfig
          )
        : prunedModel;

      const compressedSize = await this.getModelSize(optimizedModel);
      const metrics = await this.evaluateOptimization(
        model,
        optimizedModel,
        originalSize,
        compressedSize
      );

      return { model: optimizedModel, metrics };
    } catch (error) {
      console.error('Error compressing model:', error);
      throw error;
    }
  }

  private async quantizeModel(
    model: tf.LayersModel,
    bits: 8 | 16
  ): Promise<tf.LayersModel> {
    const quantizedModel = tf.sequential();

    // Iterate through layers and quantize weights
    for (const layer of model.layers) {
      const weights = layer.getWeights();
      const quantizedWeights = weights.map((weight) => {
        // Skip quantization for 1D tensors (biases)
        if (weight.shape.length === 1) return weight;

        // Implement min-max quantization
        const min = weight.min();
        const max = weight.max();
        const range = max.sub(min);
        const step = range.div(tf.scalar(Math.pow(2, bits) - 1));
        
        // Quantize weights
        const quantized = weight
          .sub(min)
          .div(step)
          .round()
          .mul(step)
          .add(min);

        return quantized;
      });

      // Create new layer with quantized weights
      const newLayer = tf.layers[layer.getClassName()]({
        ...layer.getConfig(),
        weights: quantizedWeights,
      });

      quantizedModel.add(newLayer);
    }

    // Compile the quantized model
    quantizedModel.compile({
      optimizer: model.optimizer,
      loss: model.loss,
      metrics: model.metrics,
    });

    return quantizedModel;
  }

  private async pruneModel(
    model: tf.LayersModel,
    config: CompressionConfig['pruningConfig']
  ): Promise<tf.LayersModel> {
    const prunedModel = tf.sequential();

    // Implement magnitude-based weight pruning
    for (const layer of model.layers) {
      const weights = layer.getWeights();
      const prunedWeights = weights.map((weight) => {
        // Skip pruning for 1D tensors (biases)
        if (weight.shape.length === 1) return weight;

        // Calculate threshold for pruning
        const absValues = weight.abs();
        const threshold = absValues
          .reshape([-1])
          .sort()
          .gather(
            Math.floor(
              weight.size * (1 - config.finalSparsity)
            )
          );

        // Create pruning mask
        const mask = absValues.greater(threshold);
        
        // Apply mask to weights
        return weight.mul(mask.cast(weight.dtype));
      });

      // Create new layer with pruned weights
      const newLayer = tf.layers[layer.getClassName()]({
        ...layer.getConfig(),
        weights: prunedWeights,
      });

      prunedModel.add(newLayer);
    }

    // Compile the pruned model
    prunedModel.compile({
      optimizer: model.optimizer,
      loss: model.loss,
      metrics: model.metrics,
    });

    return prunedModel;
  }

  private async applyKnowledgeDistillation(
    studentModel: tf.LayersModel,
    config: CompressionConfig['distillationConfig']
  ): Promise<tf.LayersModel> {
    if (!config) throw new Error('Distillation config required');

    try {
      // Load teacher model
      const teacherModel = await ModelManagementService.loadModel(
        config.teacherModelId
      );

      // Create distillation loss function
      const distillationLoss = (
        yTrue: tf.Tensor,
        yPred: tf.Tensor,
        teacherPred: tf.Tensor
      ) => {
        // Soften probability distributions
        const softStudentPred = tf.softmax(yPred.div(tf.scalar(config.temperature)));
        const softTeacherPred = tf.softmax(
          teacherPred.div(tf.scalar(config.temperature))
        );

        // Calculate cross entropy loss
        const distillationLoss = tf.losses.softmaxCrossEntropy(
          softTeacherPred,
          softStudentPred
        );
        const studentLoss = tf.losses.softmaxCrossEntropy(yTrue, yPred);

        // Combine losses
        return tf.scalar(1 - config.alpha)
          .mul(studentLoss)
          .add(tf.scalar(config.alpha).mul(distillationLoss));
      };

      // Compile student model with distillation loss
      studentModel.compile({
        optimizer: studentModel.optimizer,
        loss: (yTrue: tf.Tensor, yPred: tf.Tensor) => {
          const teacherPred = teacherModel.predict(yTrue) as tf.Tensor;
          return distillationLoss(yTrue, yPred, teacherPred);
        },
        metrics: studentModel.metrics,
      });

      return studentModel;
    } catch (error) {
      console.error('Error applying knowledge distillation:', error);
      throw error;
    }
  }

  private async getModelSize(model: tf.LayersModel): Promise<number> {
    let totalSize = 0;

    for (const layer of model.layers) {
      const weights = layer.getWeights();
      for (const weight of weights) {
        totalSize += weight.size * Float32Array.BYTES_PER_ELEMENT;
      }
    }

    return totalSize;
  }

  private async evaluateOptimization(
    originalModel: tf.LayersModel,
    optimizedModel: tf.LayersModel,
    originalSize: number,
    compressedSize: number
  ): Promise<OptimizationMetrics> {
    // Measure inference latency
    const sampleInput = tf.zeros(originalModel.inputs[0].shape);
    
    const startOriginal = Date.now();
    await originalModel.predict(sampleInput);
    const originalLatency = Date.now() - startOriginal;

    const startOptimized = Date.now();
    await optimizedModel.predict(sampleInput);
    const optimizedLatency = Date.now() - startOptimized;

    // Calculate memory usage
    const memoryInfo = tf.memory();

    return {
      originalSize,
      compressedSize,
      accuracyDelta: 0, // This should be calculated with validation data
      latencyImprovement: (originalLatency - optimizedLatency) / originalLatency,
      memoryUsage: memoryInfo.numBytes,
    };
  }

  async optimizeModelArchitecture(
    model: tf.LayersModel,
    targetSize: number,
    minAccuracy: number
  ): Promise<tf.LayersModel> {
    try {
      // Start with aggressive compression
      const compressionConfig: CompressionConfig = {
        quantizationBits: 8,
        pruningConfig: {
          initialSparsity: 0.0,
          finalSparsity: 0.5,
          pruningFrequency: 100,
          pruningThreshold: 0.1,
        },
      };

      // Iteratively compress and evaluate
      let currentModel = model;
      let currentSize = await this.getModelSize(currentModel);
      
      while (currentSize > targetSize) {
        // Increase compression gradually
        compressionConfig.pruningConfig.finalSparsity += 0.1;
        
        const { model: optimizedModel, metrics } = await this.compressModel(
          currentModel,
          compressionConfig
        );

        // Check if we've hit accuracy threshold
        if (metrics.accuracyDelta < -minAccuracy) {
          break;
        }

        currentModel = optimizedModel;
        currentSize = metrics.compressedSize;
      }

      return currentModel;
    } catch (error) {
      console.error('Error optimizing model architecture:', error);
      throw error;
    }
  }

  async exportOptimizedModel(
    model: tf.LayersModel,
    metrics: OptimizationMetrics
  ): Promise<string> {
    try {
      const modelId = await ModelManagementService.saveModel(model, {
        type: 'optimized',
        version: format(new Date(), 'yyyyMMdd_HHmmss'),
        metrics: {
          compressionRatio: metrics.originalSize / metrics.compressedSize,
          latencyImprovement: metrics.latencyImprovement,
          memoryUsage: metrics.memoryUsage,
        },
      });

      return modelId;
    } catch (error) {
      console.error('Error exporting optimized model:', error);
      throw error;
    }
  }
}

export default new ModelOptimizationService();
