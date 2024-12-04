import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Card, Title, Paragraph, Button, IconButton } from 'react-native-paper';
import { VictoryChart, VictoryLine, VictoryBar, VictoryTheme, VictoryAxis } from 'victory-native';

interface DemoData {
    x: number;
    y: number;
}

interface Feature {
    id: string;
    title: string;
    description: string;
    type: 'line' | 'bar';
    metric: string;
}

const InteractiveDemo: React.FC = () => {
    const [data, setData] = useState<DemoData[]>([]);
    const [activeFeature, setActiveFeature] = useState<Feature | null>(null);
    const [isAutoUpdating, setIsAutoUpdating] = useState(false);

    const features: Feature[] = [
        {
            id: 'yield',
            title: 'Crop Yield Tracker',
            description: 'Monitor and predict crop yields in real-time',
            type: 'line',
            metric: 'Yield (tons/acre)'
        },
        {
            id: 'resources',
            title: 'Resource Usage',
            description: 'Track water and nutrient consumption',
            type: 'bar',
            metric: 'Usage (%)'
        },
        {
            id: 'health',
            title: 'Plant Health Index',
            description: 'Monitor overall crop health status',
            type: 'line',
            metric: 'Health Score'
        }
    ];

    useEffect(() => {
        generateDemoData();
        return () => stopAutoUpdate();
    }, [activeFeature]);

    const generateDemoData = () => {
        const newData = Array.from({ length: 10 }, (_, i) => ({
            x: i + 1,
            y: Math.round((Math.random() * 60 + 40) * 10) / 10 // Generate values between 40-100
        }));
        setData(newData);
    };

    const startAutoUpdate = () => {
        setIsAutoUpdating(true);
        const interval = setInterval(() => {
            generateDemoData();
        }, 2000);
        return () => clearInterval(interval);
    };

    const stopAutoUpdate = () => {
        setIsAutoUpdating(false);
    };

    const renderChart = () => {
        if (!activeFeature) return null;

        const ChartComponent = activeFeature.type === 'line' ? VictoryLine : VictoryBar;
        
        return (
            <VictoryChart 
                theme={VictoryTheme.material}
                height={300}
                width={Dimensions.get('window').width - 40}
                domainPadding={activeFeature.type === 'bar' ? 20 : 0}
            >
                <VictoryAxis 
                    label="Time (minutes)"
                    style={{
                        axisLabel: { padding: 30 }
                    }}
                />
                <VictoryAxis 
                    dependentAxis
                    label={activeFeature.metric}
                    style={{
                        axisLabel: { padding: 40 }
                    }}
                />
                <ChartComponent
                    data={data}
                    style={{
                        data: { 
                            stroke: "#007AFF",
                            fill: activeFeature.type === 'bar' ? "#007AFF" : undefined
                        }
                    }}
                    animate={{
                        duration: 500,
                        onLoad: { duration: 500 }
                    }}
                />
            </VictoryChart>
        );
    };

    return (
        <ScrollView style={styles.container}>
            <Title style={styles.title}>Interactive Farm Demo</Title>
            
            {!activeFeature ? (
                // Feature Selection
                features.map((feature) => (
                    <Card 
                        key={feature.id}
                        style={styles.card}
                        onPress={() => setActiveFeature(feature)}
                    >
                        <Card.Content>
                            <Title>{feature.title}</Title>
                            <Paragraph>{feature.description}</Paragraph>
                        </Card.Content>
                    </Card>
                ))
            ) : (
                // Active Feature Demo
                <View>
                    <View style={styles.header}>
                        <IconButton 
                            icon="arrow-left"
                            size={24}
                            onPress={() => setActiveFeature(null)}
                        />
                        <Title>{activeFeature.title}</Title>
                    </View>
                    
                    <Card style={styles.chartCard}>
                        <Card.Content>
                            <View style={styles.chartContainer}>
                                {renderChart()}
                            </View>
                            <View style={styles.controls}>
                                <Button 
                                    mode="contained" 
                                    onPress={generateDemoData}
                                    style={styles.button}
                                >
                                    Update Data
                                </Button>
                                <Button 
                                    mode="outlined" 
                                    onPress={isAutoUpdating ? stopAutoUpdate : startAutoUpdate}
                                    style={styles.button}
                                >
                                    {isAutoUpdating ? 'Stop Auto Update' : 'Start Auto Update'}
                                </Button>
                            </View>
                        </Card.Content>
                    </Card>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16
    },
    chartCard: {
        elevation: 4,
        marginBottom: 16
    },
    chartContainer: {
        backgroundColor: 'white',
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 16
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 8
    },
    button: {
        marginHorizontal: 8
    }
});

export default InteractiveDemo;
