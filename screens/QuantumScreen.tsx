import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Text } from 'react-native';
import { Card } from 'react-native-elements';
import QuantumVisualization from '../components/QuantumVisualization';
import QuantumControls from '../components/QuantumControls';

interface QuantumData {
    quantumState: number[][];
    probabilities: number[][];
    environmentalFactors: {
        temperature: number;
        humidity: number;
        soilPH: number;
        lightIntensity: number;
    };
    predictions: {
        optimalLocation: { row: number; col: number };
        confidence: number;
        recommendedFactors: {
            temperature: number;
            humidity: number;
            soilPH: number;
            lightIntensity: number;
        };
    };
}

const QuantumScreen: React.FC = () => {
    const [quantumData, setQuantumData] = useState<QuantumData | null>(null);

    const handleStateChange = useCallback((data: QuantumData) => {
        setQuantumData(data);
    }, []);

    const handleFactorChange = useCallback((newFactors: Partial<QuantumData['environmentalFactors']>) => {
        // The actual update is handled by the QuantumVisualization component
        // This is just for UI feedback
        if (quantumData) {
            setQuantumData({
                ...quantumData,
                environmentalFactors: {
                    ...quantumData.environmentalFactors,
                    ...newFactors,
                },
            });
        }
    }, [quantumData]);

    const renderPredictions = () => {
        if (!quantumData?.predictions) return null;

        const { predictions } = quantumData;
        const confidence = (predictions.confidence * 100).toFixed(1);

        return (
            <Card containerStyle={styles.predictionCard}>
                <Card.Title>Quantum-Enhanced Predictions</Card.Title>
                <View style={styles.predictionContent}>
                    <Text style={styles.confidenceText}>
                        Confidence: {confidence}%
                    </Text>
                    <Text style={styles.recommendationTitle}>
                        Recommended Conditions:
                    </Text>
                    <View style={styles.recommendationList}>
                        <Text style={styles.recommendationItem}>
                            🌡️ Temperature: {predictions.recommendedFactors.temperature.toFixed(1)}°C
                        </Text>
                        <Text style={styles.recommendationItem}>
                            💧 Humidity: {predictions.recommendedFactors.humidity.toFixed(1)}%
                        </Text>
                        <Text style={styles.recommendationItem}>
                            🌱 Soil pH: {predictions.recommendedFactors.soilPH.toFixed(1)}
                        </Text>
                        <Text style={styles.recommendationItem}>
                            ☀️ Light: {predictions.recommendedFactors.lightIntensity.toFixed(0)} µmol/m²/s
                        </Text>
                    </View>
                    <Text style={styles.locationText}>
                        Optimal Grid Location: ({predictions.optimalLocation.row}, {predictions.optimalLocation.col})
                    </Text>
                </View>
            </Card>
        );
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.visualizationContainer}>
                <QuantumVisualization
                    gridSize={10}
                    onStateChange={handleStateChange}
                />
            </View>
            <View style={styles.controlsContainer}>
                <QuantumControls
                    factors={quantumData?.environmentalFactors || {
                        temperature: 25,
                        humidity: 60,
                        soilPH: 7.0,
                        lightIntensity: 1000,
                    }}
                    onFactorChange={handleFactorChange}
                />
            </View>
            {renderPredictions()}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    visualizationContainer: {
        height: 300,
        marginVertical: 16,
        backgroundColor: '#000',
    },
    controlsContainer: {
        margin: 16,
    },
    predictionCard: {
        margin: 16,
        borderRadius: 8,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    predictionContent: {
        paddingHorizontal: 8,
    },
    confidenceText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4CAF50',
        marginBottom: 12,
    },
    recommendationTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#333',
    },
    recommendationList: {
        marginLeft: 8,
    },
    recommendationItem: {
        fontSize: 15,
        marginBottom: 6,
        color: '#666',
    },
    locationText: {
        marginTop: 12,
        fontSize: 14,
        color: '#666',
        fontStyle: 'italic',
    },
});

export default QuantumScreen;
