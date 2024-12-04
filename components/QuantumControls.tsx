import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Slider } from 'react-native-elements';

interface EnvironmentalFactors {
    temperature: number;
    humidity: number;
    soilPH: number;
    lightIntensity: number;
}

interface QuantumControlsProps {
    factors: EnvironmentalFactors;
    onFactorChange: (newFactors: Partial<EnvironmentalFactors>) => void;
}

const QuantumControls: React.FC<QuantumControlsProps> = ({
    factors,
    onFactorChange,
}) => {
    const formatValue = (value: number, type: keyof EnvironmentalFactors) => {
        switch (type) {
            case 'temperature':
                return `${value.toFixed(1)}°C`;
            case 'humidity':
                return `${value.toFixed(1)}%`;
            case 'soilPH':
                return value.toFixed(1);
            case 'lightIntensity':
                return `${value.toFixed(0)} µmol/m²/s`;
            default:
                return value.toString();
        }
    };

    const getRange = (type: keyof EnvironmentalFactors): [number, number] => {
        switch (type) {
            case 'temperature':
                return [15, 35]; // °C
            case 'humidity':
                return [30, 90]; // %
            case 'soilPH':
                return [5.0, 8.0];
            case 'lightIntensity':
                return [0, 2000]; // µmol/m²/s
            default:
                return [0, 100];
        }
    };

    const renderSlider = (
        type: keyof EnvironmentalFactors,
        label: string,
        icon: string
    ) => {
        const [min, max] = getRange(type);
        return (
            <View style={styles.sliderContainer}>
                <View style={styles.labelContainer}>
                    <Text style={styles.icon}>{icon}</Text>
                    <Text style={styles.label}>{label}</Text>
                    <Text style={styles.value}>
                        {formatValue(factors[type], type)}
                    </Text>
                </View>
                <Slider
                    value={factors[type]}
                    onValueChange={(value) => onFactorChange({ [type]: value })}
                    minimumValue={min}
                    maximumValue={max}
                    step={(max - min) / 100}
                    thumbStyle={styles.thumb}
                    trackStyle={styles.track}
                    minimumTrackTintColor="#4CAF50"
                    maximumTrackTintColor="#ccc"
                />
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Quantum Environmental Controls</Text>
            {renderSlider('temperature', 'Temperature', '🌡️')}
            {renderSlider('humidity', 'Humidity', '💧')}
            {renderSlider('soilPH', 'Soil pH', '🌱')}
            {renderSlider('lightIntensity', 'Light Intensity', '☀️')}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 8,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
        color: '#2E7D32',
    },
    sliderContainer: {
        marginBottom: 16,
    },
    labelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    icon: {
        fontSize: 20,
        marginRight: 8,
    },
    label: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    value: {
        fontSize: 16,
        color: '#666',
        minWidth: 80,
        textAlign: 'right',
    },
    thumb: {
        backgroundColor: '#4CAF50',
        width: 20,
        height: 20,
    },
    track: {
        height: 4,
    },
});

export default QuantumControls;
