import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import QuantumAnalysisDisplay from '../components/QuantumAnalysisDisplay';
import QuantumPredictionService from '../services/QuantumPredictionService';
import { Button, Slider, Text } from 'react-native-elements';

const predictionService = new QuantumPredictionService();

const QuantumAnalysisScreen: React.FC = () => {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);
    const [analysisResults, setAnalysisResults] = useState<any>(null);
    const [environmentalFactors, setEnvironmentalFactors] = useState({
        temperature: 22,
        humidity: 50,
        soilPH: 6.5,
        lightIntensity: 50000,
        co2Level: 400
    });

    const updateFactor = (factor: string, value: number) => {
        setEnvironmentalFactors(prev => ({
            ...prev,
            [factor]: value
        }));
    };

    const runAnalysis = async () => {
        setLoading(true);
        try {
            const results = await predictionService.predict(environmentalFactors);
            setAnalysisResults(results);
        } catch (error) {
            console.error('Analysis error:', error);
            // Handle error appropriately
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Run initial analysis
        runAnalysis();
    }, []);

    const renderControls = () => (
        <View style={styles.controlsContainer}>
            <Text h4 style={styles.controlsTitle}>Environmental Controls</Text>
            
            <View style={styles.sliderContainer}>
                <Text>Temperature: {environmentalFactors.temperature}°C</Text>
                <Slider
                    value={environmentalFactors.temperature}
                    onValueChange={(value) => updateFactor('temperature', value)}
                    minimumValue={15}
                    maximumValue={30}
                    step={0.5}
                    thumbTintColor="#4CAF50"
                    minimumTrackTintColor="#4CAF50"
                />
            </View>

            <View style={styles.sliderContainer}>
                <Text>Humidity: {environmentalFactors.humidity}%</Text>
                <Slider
                    value={environmentalFactors.humidity}
                    onValueChange={(value) => updateFactor('humidity', value)}
                    minimumValue={30}
                    maximumValue={70}
                    step={1}
                    thumbTintColor="#2196F3"
                    minimumTrackTintColor="#2196F3"
                />
            </View>

            <View style={styles.sliderContainer}>
                <Text>Soil pH: {environmentalFactors.soilPH}</Text>
                <Slider
                    value={environmentalFactors.soilPH}
                    onValueChange={(value) => updateFactor('soilPH', value)}
                    minimumValue={5.5}
                    maximumValue={7.5}
                    step={0.1}
                    thumbTintColor="#9C27B0"
                    minimumTrackTintColor="#9C27B0"
                />
            </View>

            <View style={styles.sliderContainer}>
                <Text>Light Intensity: {environmentalFactors.lightIntensity} lux</Text>
                <Slider
                    value={environmentalFactors.lightIntensity}
                    onValueChange={(value) => updateFactor('lightIntensity', value)}
                    minimumValue={20000}
                    maximumValue={80000}
                    step={1000}
                    thumbTintColor="#FFC107"
                    minimumTrackTintColor="#FFC107"
                />
            </View>

            <View style={styles.sliderContainer}>
                <Text>CO2 Level: {environmentalFactors.co2Level} ppm</Text>
                <Slider
                    value={environmentalFactors.co2Level}
                    onValueChange={(value) => updateFactor('co2Level', value)}
                    minimumValue={300}
                    maximumValue={500}
                    step={5}
                    thumbTintColor="#FF5722"
                    minimumTrackTintColor="#FF5722"
                />
            </View>

            <Button
                title="Update Analysis"
                onPress={runAnalysis}
                buttonStyle={styles.updateButton}
                titleStyle={styles.updateButtonText}
            />
        </View>
    );

    return (
        <View style={styles.container}>
            {renderControls()}
            
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4CAF50" />
                    <Text style={styles.loadingText}>Analyzing quantum states...</Text>
                </View>
            ) : analysisResults ? (
                <QuantumAnalysisDisplay {...analysisResults} />
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    controlsContainer: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        margin: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
    },
    controlsTitle: {
        marginBottom: 16,
        color: '#333',
    },
    sliderContainer: {
        marginBottom: 16,
    },
    updateButton: {
        backgroundColor: '#4CAF50',
        borderRadius: 8,
        marginTop: 8,
    },
    updateButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
});

export default QuantumAnalysisScreen;
