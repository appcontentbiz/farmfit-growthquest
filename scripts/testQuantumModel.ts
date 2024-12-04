import * as tf from '@tensorflow/tfjs-node';
import * as path from 'path';
import Complex from 'complex.js';

async function testModel() {
    // Load the model
    const modelDir = path.join(__dirname, '..', 'assets', 'quantum_model');
    const model = await tf.loadLayersModel(`file://${modelDir}/model.json`);

    // Test cases with different environmental conditions
    const testCases = [
        {
            name: 'Optimal Conditions',
            factors: {
                temperature: 22,
                humidity: 50,
                soilPH: 6.5,
                lightIntensity: 50000,
                co2Level: 400
            }
        },
        {
            name: 'High Stress Conditions',
            factors: {
                temperature: 30,
                humidity: 70,
                soilPH: 7.5,
                lightIntensity: 80000,
                co2Level: 500
            }
        },
        {
            name: 'Low Resource Conditions',
            factors: {
                temperature: 15,
                humidity: 30,
                soilPH: 5.5,
                lightIntensity: 20000,
                co2Level: 300
            }
        }
    ];

    // Test each case
    for (const testCase of testCases) {
        console.log(`\nTesting ${testCase.name}:`);
        console.log('Input factors:', testCase.factors);

        // Calculate quantum state
        const optimalState = new Complex(Math.sqrt(0.5), 0);
        const stressState = new Complex(0, Math.sqrt(0.5));
        
        // Calculate environmental score
        const tempScore = 1 - Math.abs(testCase.factors.temperature - 22) / 15;
        const humidityScore = 1 - Math.abs(testCase.factors.humidity - 50) / 40;
        const phScore = 1 - Math.abs(testCase.factors.soilPH - 6.5) / 2;
        const lightScore = testCase.factors.lightIntensity / 80000;
        const co2Score = 1 - Math.abs(testCase.factors.co2Level - 400) / 200;
        
        const environmentalScore = (tempScore + humidityScore + phScore + lightScore + co2Score) / 5;
        const quantumState = optimalState.mul(environmentalScore)
            .add(stressState.mul(1 - environmentalScore));

        // Create input tensor
        const input = tf.tensor2d([[
            testCase.factors.temperature,
            testCase.factors.humidity,
            testCase.factors.soilPH,
            testCase.factors.lightIntensity,
            testCase.factors.co2Level,
            quantumState.re,
            quantumState.im
        ]]);

        // Make prediction
        const prediction = model.predict(input) as tf.Tensor;
        const [growthPotential, predEnvironmentalScore, quantumEfficiency] = 
            Array.from(await prediction.data());

        console.log('\nPrediction Results:');
        console.log(`Growth Potential: ${(growthPotential * 100).toFixed(1)}%`);
        console.log(`Environmental Score: ${(predEnvironmentalScore * 100).toFixed(1)}%`);
        console.log(`Quantum Efficiency: ${(quantumEfficiency * 100).toFixed(1)}%`);

        // Clean up tensors
        input.dispose();
        prediction.dispose();
    }

    // Memory cleanup
    model.dispose();
}

// Run the tests
console.log('Starting Quantum Model Tests...\n');
testModel()
    .then(() => console.log('\nTests completed successfully'))
    .catch(error => console.error('Error during testing:', error));
