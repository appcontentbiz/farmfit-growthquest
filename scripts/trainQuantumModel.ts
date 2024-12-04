import * as tf from '@tensorflow/tfjs-node';
import * as fs from 'fs';
import * as path from 'path';
import Complex from 'complex.js';

interface TrainingData {
    input: number[];
    output: number[];
}

// Generate synthetic training data
function generateTrainingData(numSamples: number): TrainingData[] {
    const data: TrainingData[] = [];
    
    for (let i = 0; i < numSamples; i++) {
        // Generate random environmental factors
        const temperature = 15 + Math.random() * 15; // 15-30°C
        const humidity = 30 + Math.random() * 40; // 30-70%
        const soilPH = 5.5 + Math.random() * 2; // 5.5-7.5
        const lightIntensity = 20000 + Math.random() * 60000; // 20k-80k lux
        const co2Level = 300 + Math.random() * 200; // 300-500 ppm

        // Calculate optimal conditions score
        const tempScore = 1 - Math.abs(temperature - 22) / 15;
        const humidityScore = 1 - Math.abs(humidity - 50) / 40;
        const phScore = 1 - Math.abs(soilPH - 6.5) / 2;
        const lightScore = lightIntensity / 80000;
        const co2Score = 1 - Math.abs(co2Level - 400) / 200;

        // Calculate quantum states
        const optimalState = new Complex(Math.sqrt(0.5), 0);
        const stressState = new Complex(0, Math.sqrt(0.5));
        
        const environmentalScore = (tempScore + humidityScore + phScore + lightScore + co2Score) / 5;
        const quantumState = optimalState.mul(environmentalScore)
            .add(stressState.mul(1 - environmentalScore));

        // Generate output values
        const growthPotential = 0.4 + (environmentalScore * 0.6); // 40-100% range
        const quantumEfficiency = Math.abs(quantumState.abs() - 1) < 0.1 ? 0.9 : 0.7;

        data.push({
            input: [
                temperature,
                humidity,
                soilPH,
                lightIntensity,
                co2Level,
                quantumState.re,
                quantumState.im
            ],
            output: [
                growthPotential,
                environmentalScore,
                quantumEfficiency
            ]
        });
    }

    return data;
}

async function createAndTrainModel() {
    // Create the model architecture
    const model = tf.sequential();

    // Input layer
    model.add(tf.layers.dense({
        inputShape: [7],
        units: 64,
        activation: 'relu',
        kernelInitializer: 'glorotNormal'
    }));

    // Hidden layers
    model.add(tf.layers.dense({
        units: 32,
        activation: 'relu',
        kernelInitializer: 'glorotNormal'
    }));

    model.add(tf.layers.dense({
        units: 16,
        activation: 'relu',
        kernelInitializer: 'glorotNormal'
    }));

    // Output layer
    model.add(tf.layers.dense({
        units: 3,
        activation: 'sigmoid',
        kernelInitializer: 'glorotNormal'
    }));

    // Compile the model
    model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'meanSquaredError',
        metrics: ['accuracy']
    });

    // Generate training data
    const trainingData = generateTrainingData(10000);
    const validationData = generateTrainingData(2000);

    // Convert data to tensors
    const trainingInputs = tf.tensor2d(trainingData.map(d => d.input));
    const trainingOutputs = tf.tensor2d(trainingData.map(d => d.output));
    const validationInputs = tf.tensor2d(validationData.map(d => d.input));
    const validationOutputs = tf.tensor2d(validationData.map(d => d.output));

    // Train the model
    await model.fit(trainingInputs, trainingOutputs, {
        epochs: 50,
        batchSize: 32,
        validationData: [validationInputs, validationOutputs],
        callbacks: {
            onEpochEnd: (epoch, logs) => {
                console.log(`Epoch ${epoch + 1} - loss: ${logs?.loss.toFixed(4)} - accuracy: ${logs?.acc.toFixed(4)}`);
            }
        }
    });

    // Create model directory if it doesn't exist
    const modelDir = path.join(__dirname, '..', 'assets', 'quantum_model');
    if (!fs.existsSync(modelDir)) {
        fs.mkdirSync(modelDir, { recursive: true });
    }

    // Save the model
    await model.save(`file://${modelDir}`);
    console.log(`Model saved to ${modelDir}`);

    // Clean up tensors
    trainingInputs.dispose();
    trainingOutputs.dispose();
    validationInputs.dispose();
    validationOutputs.dispose();
}

// Run the training
createAndTrainModel().catch(console.error);
