import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Paragraph, Button } from 'react-native-paper';
import { VictoryChart, VictoryLine, VictoryTheme } from 'victory-native';

const BetaTestDemo: React.FC = () => {
    const [data, setData] = useState([]);
    const [activeFeature, setActiveFeature] = useState('');

    useEffect(() => {
        // Initialize demo data
        generateDemoData();
    }, []);

    const generateDemoData = () => {
        const newData = Array.from({ length: 10 }, (_, i) => ({
            x: i + 1,
            y: Math.random() * 100
        }));
        setData(newData);
    };

    const features = [
        { id: 'analytics', title: 'Real-time Analytics', description: 'Live farm data analysis' },
        { id: 'predictions', title: 'AI Predictions', description: 'Smart crop yield forecasting' },
        { id: 'monitoring', title: 'Crop Monitoring', description: 'Real-time crop health tracking' }
    ];

    const showFeatureDemo = (featureId: string) => {
        setActiveFeature(featureId);
        generateDemoData();
    };

    return (
        <ScrollView style={styles.container}>
            <Title style={styles.title}>FarmFit Beta Demo</Title>
            
            {/* Feature Cards */}
            {features.map((feature) => (
                <Card 
                    key={feature.id}
                    style={styles.card}
                    onPress={() => showFeatureDemo(feature.id)}
                >
                    <Card.Content>
                        <Title>{feature.title}</Title>
                        <Paragraph>{feature.description}</Paragraph>
                    </Card.Content>
                </Card>
            ))}

            {/* Demo Chart */}
            {activeFeature && (
                <View style={styles.chartContainer}>
                    <Title>Demo: {features.find(f => f.id === activeFeature)?.title}</Title>
                    <VictoryChart theme={VictoryTheme.material}>
                        <VictoryLine
                            data={data}
                            style={{
                                data: { stroke: "#007AFF" }
                            }}
                            animate={{
                                duration: 500,
                                onLoad: { duration: 500 }
                            }}
                        />
                    </VictoryChart>
                    <Button 
                        mode="contained" 
                        onPress={generateDemoData}
                        style={styles.button}
                    >
                        Update Data
                    </Button>
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f5f5f5'
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center'
    },
    card: {
        marginBottom: 16,
        elevation: 4
    },
    chartContainer: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 8,
        marginVertical: 16
    },
    button: {
        marginTop: 16
    }
});

export default BetaTestDemo;
