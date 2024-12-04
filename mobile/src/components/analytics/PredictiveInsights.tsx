import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
import {
  Card,
  Text,
  useTheme,
  Button,
  ProgressBar,
  Chip,
  DataTable,
  IconButton,
  Portal,
  Modal,
} from 'react-native-paper';
import {
  VictoryChart,
  VictoryLine,
  VictoryScatter,
  VictoryArea,
  VictoryAxis,
  VictoryTooltip,
  VictoryVoronoiContainer,
  VictoryLegend,
  VictoryLabel,
} from 'victory-native';
import { format, addDays } from 'date-fns';
import PredictiveAnalyticsService from '../../services/PredictiveAnalyticsService';

interface PredictiveInsightsProps {
  historicalData: any[];
  onInsightGenerated?: (insight: any) => void;
}

const PredictiveInsights: React.FC<PredictiveInsightsProps> = ({
  historicalData,
  onInsightGenerated,
}) => {
  const theme = useTheme();
  const [predictions, setPredictions] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState(7);
  const [showAnomalies, setShowAnomalies] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedPrediction, setSelectedPrediction] = useState<any>(null);

  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 32;

  useEffect(() => {
    generatePredictions();
  }, [historicalData, selectedTimeframe]);

  const generatePredictions = async () => {
    try {
      setLoading(true);
      const result = await PredictiveAnalyticsService.generatePredictions(
        historicalData,
        {
          horizon: selectedTimeframe,
          confidenceInterval: 0.95,
          includeSeasonal: true,
          includeWeather: true,
          smoothingFactor: 0.3,
        }
      );
      setPredictions(result);
      onInsightGenerated?.(result);
    } catch (error) {
      console.error('Error generating predictions:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderPredictionChart = () => {
    if (!predictions) return null;

    const historicalPoints = historicalData.map((d) => ({
      x: new Date(d.date),
      y: d.value,
    }));

    const predictionPoints = predictions.predictions.map((p: any) => ({
      x: new Date(p.date),
      y: p.value,
      confidenceLow: p.confidenceLow,
      confidenceHigh: p.confidenceHigh,
      probability: p.probability,
    }));

    return (
      <Card style={styles.chartCard}>
        <Card.Title title="Performance Predictions" />
        <Card.Content>
          <VictoryChart
            width={chartWidth}
            height={300}
            containerComponent={
              <VictoryVoronoiContainer
                labels={({ datum }) => `
                  Date: ${format(datum.x, 'PP')}
                  Value: ${datum.y.toFixed(1)}
                  ${datum.probability ? `\nConfidence: ${(datum.probability * 100).toFixed(1)}%` : ''}
                `}
                labelComponent={<VictoryTooltip />}
              />
            }
          >
            <VictoryLegend
              x={50}
              y={0}
              orientation="horizontal"
              data={[
                { name: 'Historical', symbol: { fill: theme.colors.primary } },
                { name: 'Predicted', symbol: { fill: theme.colors.secondary } },
              ]}
            />
            
            {/* Confidence interval area */}
            <VictoryArea
              data={predictionPoints}
              style={{
                data: {
                  fill: theme.colors.secondary,
                  fillOpacity: 0.1,
                },
              }}
              y0={(d) => d.confidenceLow}
              y1={(d) => d.confidenceHigh}
            />

            {/* Historical line */}
            <VictoryLine
              data={historicalPoints}
              style={{
                data: { stroke: theme.colors.primary },
              }}
            />

            {/* Prediction line */}
            <VictoryLine
              data={predictionPoints}
              style={{
                data: {
                  stroke: theme.colors.secondary,
                  strokeDasharray: '4,4',
                },
              }}
            />

            {/* Anomalies */}
            {showAnomalies && predictions.anomalies && (
              <VictoryScatter
                data={predictions.anomalies.map((a: any) => ({
                  x: new Date(a.date),
                  y: a.value,
                }))}
                size={7}
                style={{
                  data: {
                    fill: theme.colors.error,
                  },
                }}
              />
            )}

            <VictoryAxis
              tickFormat={(date) => format(date, 'MM/dd')}
              style={{
                tickLabels: { fontSize: 10, padding: 5 },
              }}
            />
            <VictoryAxis
              dependentAxis
              tickFormat={(value) => `${value}%`}
              style={{
                tickLabels: { fontSize: 10, padding: 5 },
              }}
            />
          </VictoryChart>

          <View style={styles.chartControls}>
            <Chip
              selected={showAnomalies}
              onPress={() => setShowAnomalies(!showAnomalies)}
              style={styles.chip}
            >
              Show Anomalies
            </Chip>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderMetrics = () => {
    if (!predictions) return null;

    return (
      <Card style={styles.metricsCard}>
        <Card.Title title="Prediction Metrics" />
        <Card.Content>
          <View style={styles.metricRow}>
            <Text>Model Accuracy</Text>
            <ProgressBar
              progress={predictions.accuracy}
              color={theme.colors.primary}
              style={styles.progressBar}
            />
            <Text>{(predictions.accuracy * 100).toFixed(1)}%</Text>
          </View>

          <View style={styles.metricRow}>
            <Text>Confidence Score</Text>
            <ProgressBar
              progress={predictions.confidenceScore}
              color={theme.colors.secondary}
              style={styles.progressBar}
            />
            <Text>{(predictions.confidenceScore * 100).toFixed(1)}%</Text>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderPredictionTable = () => {
    if (!predictions) return null;

    return (
      <Card style={styles.tableCard}>
        <Card.Title title="Detailed Predictions" />
        <Card.Content>
          <DataTable>
            <DataTable.Header>
              <DataTable.Title>Date</DataTable.Title>
              <DataTable.Title numeric>Value</DataTable.Title>
              <DataTable.Title numeric>Confidence</DataTable.Title>
              <DataTable.Title></DataTable.Title>
            </DataTable.Header>

            {predictions.predictions.slice(0, 5).map((prediction: any, index: number) => (
              <DataTable.Row key={index}>
                <DataTable.Cell>
                  {format(new Date(prediction.date), 'MM/dd')}
                </DataTable.Cell>
                <DataTable.Cell numeric>
                  {prediction.value.toFixed(1)}%
                </DataTable.Cell>
                <DataTable.Cell numeric>
                  {(prediction.probability * 100).toFixed(1)}%
                </DataTable.Cell>
                <DataTable.Cell>
                  <IconButton
                    icon="information"
                    size={20}
                    onPress={() => {
                      setSelectedPrediction(prediction);
                      setDetailsModalVisible(true);
                    }}
                  />
                </DataTable.Cell>
              </DataTable.Row>
            ))}
          </DataTable>
        </Card.Content>
      </Card>
    );
  };

  const renderDetailsModal = () => (
    <Portal>
      <Modal
        visible={detailsModalVisible}
        onDismiss={() => setDetailsModalVisible(false)}
        contentContainerStyle={styles.modalContent}
      >
        {selectedPrediction && (
          <>
            <Text style={styles.modalTitle}>Prediction Details</Text>
            <DataTable>
              <DataTable.Row>
                <DataTable.Cell>Date</DataTable.Cell>
                <DataTable.Cell>
                  {format(new Date(selectedPrediction.date), 'PP')}
                </DataTable.Cell>
              </DataTable.Row>
              <DataTable.Row>
                <DataTable.Cell>Predicted Value</DataTable.Cell>
                <DataTable.Cell>{selectedPrediction.value.toFixed(1)}%</DataTable.Cell>
              </DataTable.Row>
              <DataTable.Row>
                <DataTable.Cell>Confidence Interval</DataTable.Cell>
                <DataTable.Cell>
                  {selectedPrediction.confidenceLow.toFixed(1)}% - {selectedPrediction.confidenceHigh.toFixed(1)}%
                </DataTable.Cell>
              </DataTable.Row>
              <DataTable.Row>
                <DataTable.Cell>Probability</DataTable.Cell>
                <DataTable.Cell>
                  {(selectedPrediction.probability * 100).toFixed(1)}%
                </DataTable.Cell>
              </DataTable.Row>
            </DataTable>
            <Button
              mode="contained"
              onPress={() => setDetailsModalVisible(false)}
              style={styles.modalButton}
            >
              Close
            </Button>
          </>
        )}
      </Modal>
    </Portal>
  );

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.timeframeContainer}>
          {[7, 14, 30].map((days) => (
            <Chip
              key={days}
              selected={selectedTimeframe === days}
              onPress={() => setSelectedTimeframe(days)}
              style={styles.timeframeChip}
            >
              {days} Days
            </Chip>
          ))}
        </View>

        {renderPredictionChart()}
        {renderMetrics()}
        {renderPredictionTable()}
        {renderDetailsModal()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  timeframeContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  timeframeChip: {
    marginRight: 8,
  },
  chartCard: {
    margin: 16,
    elevation: 4,
  },
  chartControls: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  chip: {
    marginRight: 8,
  },
  metricsCard: {
    margin: 16,
    elevation: 4,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  progressBar: {
    flex: 1,
    marginHorizontal: 8,
  },
  tableCard: {
    margin: 16,
    elevation: 4,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalButton: {
    marginTop: 16,
  },
});

export default PredictiveInsights;
