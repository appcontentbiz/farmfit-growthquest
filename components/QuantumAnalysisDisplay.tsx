import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card, Icon, ProgressBar } from 'react-native-elements';
import { VictoryChart, VictoryLine, VictoryAxis, VictoryTheme } from 'victory-native';

interface AnalysisDisplayProps {
    growthPotential: number;
    environmentalScore: number;
    quantumEfficiency: number;
    recommendations: string[];
    riskFactors: string[];
    confidenceScore: number;
    historicalData?: {
        timestamp: Date;
        growthRate: number;
    }[];
}

const QuantumAnalysisDisplay: React.FC<AnalysisDisplayProps> = ({
    growthPotential,
    environmentalScore,
    quantumEfficiency,
    recommendations,
    riskFactors,
    confidenceScore,
    historicalData = []
}) => {
    const renderScoreCard = (
        title: string,
        score: number,
        icon: string,
        color: string
    ) => (
        <View style={styles.scoreCard}>
            <Icon name={icon} type="material-community" color={color} size={24} />
            <Text style={styles.scoreTitle}>{title}</Text>
            <ProgressBar
                value={score}
                color={color}
                style={styles.progressBar}
            />
            <Text style={[styles.scoreValue, { color }]}>
                {(score * 100).toFixed(1)}%
            </Text>
        </View>
    );

    const renderGrowthChart = () => {
        if (!historicalData.length) return null;

        const data = historicalData.map((point, index) => ({
            x: index,
            y: point.growthRate
        }));

        return (
            <Card containerStyle={styles.chartCard}>
                <Card.Title>Growth Rate Trend</Card.Title>
                <View style={styles.chartContainer}>
                    <VictoryChart theme={VictoryTheme.material} height={200}>
                        <VictoryLine
                            data={data}
                            style={{
                                data: { stroke: "#4CAF50" }
                            }}
                        />
                        <VictoryAxis
                            label="Time"
                            style={{
                                axisLabel: { padding: 30 }
                            }}
                        />
                        <VictoryAxis
                            dependentAxis
                            label="Growth Rate"
                            style={{
                                axisLabel: { padding: 40 }
                            }}
                        />
                    </VictoryChart>
                </View>
            </Card>
        );
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.scoresContainer}>
                {renderScoreCard(
                    'Growth Potential',
                    growthPotential,
                    'sprout',
                    '#4CAF50'
                )}
                {renderScoreCard(
                    'Environmental Score',
                    environmentalScore,
                    'earth',
                    '#2196F3'
                )}
                {renderScoreCard(
                    'Quantum Efficiency',
                    quantumEfficiency,
                    'atom',
                    '#9C27B0'
                )}
            </View>

            <Card containerStyle={styles.recommendationsCard}>
                <Card.Title>
                    <Icon
                        name="lightbulb-on"
                        type="material-community"
                        color="#FFC107"
                        size={20}
                    />
                    {' Recommendations'}
                </Card.Title>
                <Card.Divider />
                {recommendations.map((rec, index) => (
                    <View key={index} style={styles.recommendationItem}>
                        <Icon
                            name="arrow-right"
                            type="material-community"
                            color="#4CAF50"
                            size={16}
                        />
                        <Text style={styles.recommendationText}>{rec}</Text>
                    </View>
                ))}
            </Card>

            {riskFactors.length > 0 && (
                <Card containerStyle={styles.risksCard}>
                    <Card.Title>
                        <Icon
                            name="alert"
                            type="material-community"
                            color="#F44336"
                            size={20}
                        />
                        {' Risk Factors'}
                    </Card.Title>
                    <Card.Divider />
                    {riskFactors.map((risk, index) => (
                        <View key={index} style={styles.riskItem}>
                            <Icon
                                name="alert-circle"
                                type="material-community"
                                color="#F44336"
                                size={16}
                            />
                            <Text style={styles.riskText}>{risk}</Text>
                        </View>
                    ))}
                </Card>
            )}

            {renderGrowthChart()}

            <View style={styles.confidenceContainer}>
                <Icon
                    name="check-circle"
                    type="material-community"
                    color="#4CAF50"
                    size={16}
                />
                <Text style={styles.confidenceText}>
                    Analysis Confidence: {(confidenceScore * 100).toFixed(1)}%
                </Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scoresContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        flexWrap: 'wrap',
        padding: 16,
    },
    scoreCard: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        width: '30%',
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
    },
    scoreTitle: {
        fontSize: 12,
        color: '#666',
        marginVertical: 8,
        textAlign: 'center',
    },
    scoreValue: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 4,
    },
    progressBar: {
        width: '100%',
        height: 4,
        borderRadius: 2,
    },
    recommendationsCard: {
        margin: 16,
        borderRadius: 8,
        elevation: 2,
    },
    recommendationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    recommendationText: {
        marginLeft: 8,
        flex: 1,
        color: '#666',
    },
    risksCard: {
        margin: 16,
        borderRadius: 8,
        elevation: 2,
    },
    riskItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    riskText: {
        marginLeft: 8,
        flex: 1,
        color: '#F44336',
    },
    chartCard: {
        margin: 16,
        borderRadius: 8,
        elevation: 2,
    },
    chartContainer: {
        height: 200,
        padding: 8,
    },
    confidenceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    confidenceText: {
        marginLeft: 8,
        color: '#4CAF50',
        fontWeight: 'bold',
    },
});

export default QuantumAnalysisDisplay;
