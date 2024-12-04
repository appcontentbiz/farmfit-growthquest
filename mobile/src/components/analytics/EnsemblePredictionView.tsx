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
  List,
  Divider,
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
  VictoryBoxPlot,
} from 'victory-native';
import { format } from 'date-fns';
import EnsemblePredictionService from '../../services/EnsemblePredictionService';

interface EnsemblePredictionViewProps {
  data: any;
  onPredictionGenerated?: (predictions: any) => void;
}

const EnsemblePredictionView: React.FC<EnsemblePredictionViewProps> = ({
  data,
  onPredictionGenerated,
}) => {
  const theme = useTheme();
  const [predictions, setPredictions] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [modelWeights, setModelWeights] = useState<any[]>([]);
  const [showModelDetails, setShowModelDetails] = useState(false);
  const [showConfidenceInterval, setShowConfidenceInterval] = useState(true);
  const [showIndividualPredictions, setShowIndividualPredictions] = useState(false);

  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 32;

  useEffect(() => {
    initializeEnsemble();
  }, []);

  const initializeEnsemble = async () => {
    try {
      await EnsemblePredictionService.initialize({
        modelTypes: ['lstm', 'gru', 'dense', 'cnn'],
        ensembleMethod: 'weighted',
        weightingStrategy: 'adaptive',
        validationSplit: 0.2,
        crossValidationFolds: 5,
        hyperparameterTuning: true,
      });

      const status = EnsemblePredictionService.getEnsembleStatus();
      setSelectedModels(status.models);
      setModelWeights(status.weights);
    } catch (error) {
      console.error('Error initializing ensemble:', error);
    }
  };

  const generatePredictions = async () => {
    try {
      setLoading(true);
      // Implementation for generating ensemble predictions
      // This would involve processing the data and calling EnsemblePredictionService
      setPredictions(/* processed predictions */);
      onPredictionGenerated?.(predictions);
    } catch (error) {
      console.error('Error generating predictions:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderEnsembleChart = () => {
    if (!predictions) return null;

    return (
      <Card style={styles.chartCard}>
        <Card.Title title="Ensemble Predictions" />
        <Card.Content>
          <VictoryChart
            width={chartWidth}
            height={300}
            containerComponent={
              <VictoryVoronoiContainer
                labels={({ datum }) => `
                  Date: ${format(datum.x, 'PP')}
                  Value: ${datum.y.toFixed(1)}
                  ${datum.confidence ? `\nConfidence: ${(datum.confidence * 100).toFixed(1)}%` : ''}
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
                { name: 'Ensemble', symbol: { fill: theme.colors.primary } },
                ...selectedModels.map((model) => ({
                  name: model,
                  symbol: { fill: theme.colors.secondary },
                })),
              ]}
            />

            {/* Confidence interval area */}
            {showConfidenceInterval && (
              <VictoryArea
                data={predictions.ensemblePredictions}
                style={{
                  data: {
                    fill: theme.colors.primary,
                    fillOpacity: 0.1,
                  },
                }}
                y0={(d) => d.confidenceLow}
                y1={(d) => d.confidenceHigh}
              />
            )}

            {/* Individual model predictions */}
            {showIndividualPredictions &&
              predictions.modelPredictions.map((modelPred: any, index: number) => (
                <VictoryLine
                  key={index}
                  data={modelPred.predictions}
                  style={{
                    data: {
                      stroke: theme.colors.secondary,
                      strokeOpacity: 0.3,
                      strokeDasharray: '4,4',
                    },
                  }}
                />
              ))}

            {/* Ensemble prediction line */}
            <VictoryLine
              data={predictions.ensemblePredictions}
              style={{
                data: {
                  stroke: theme.colors.primary,
                  strokeWidth: 2,
                },
              }}
            />

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
              selected={showConfidenceInterval}
              onPress={() => setShowConfidenceInterval(!showConfidenceInterval)}
              style={styles.chip}
            >
              Confidence Interval
            </Chip>
            <Chip
              selected={showIndividualPredictions}
              onPress={() => setShowIndividualPredictions(!showIndividualPredictions)}
              style={styles.chip}
            >
              Individual Models
            </Chip>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderModelWeights = () => (
    <Card style={styles.weightsCard}>
      <Card.Title title="Model Weights" />
      <Card.Content>
        {modelWeights.map((weight, index) => (
          <View key={index} style={styles.weightRow}>
            <Text>{weight.modelType}</Text>
            <ProgressBar
              progress={weight.weight}
              color={theme.colors.primary}
              style={styles.weightBar}
            />
            <Text>{(weight.weight * 100).toFixed(1)}%</Text>
          </View>
        ))}
      </Card.Content>
    </Card>
  );

  const renderModelDetails = () => (
    <Portal>
      <Modal
        visible={showModelDetails}
        onDismiss={() => setShowModelDetails(false)}
        contentContainerStyle={styles.modalContent}
      >
        <Text style={styles.modalTitle}>Model Details</Text>
        <ScrollView>
          {modelWeights.map((weight, index) => (
            <React.Fragment key={index}>
              <List.Item
                title={weight.modelType}
                description={`Performance: ${(weight.performance * 100).toFixed(1)}%`}
                right={() => (
                  <Text style={styles.weightText}>
                    {(weight.weight * 100).toFixed(1)}%
                  </Text>
                )}
              />
              <Divider />
            </React.Fragment>
          ))}
        </ScrollView>
        <Button
          mode="contained"
          onPress={() => setShowModelDetails(false)}
          style={styles.modalButton}
        >
          Close
        </Button>
      </Modal>
    </Portal>
  );

  const renderMetrics = () => {
    if (!predictions) return null;

    return (
      <Card style={styles.metricsCard}>
        <Card.Title title="Ensemble Metrics" />
        <Card.Content>
          <DataTable>
            <DataTable.Header>
              <DataTable.Title>Metric</DataTable.Title>
              <DataTable.Title numeric>Value</DataTable.Title>
            </DataTable.Header>

            <DataTable.Row>
              <DataTable.Cell>Ensemble Accuracy</DataTable.Cell>
              <DataTable.Cell numeric>
                {(predictions.metrics.accuracy * 100).toFixed(1)}%
              </DataTable.Cell>
            </DataTable.Row>

            <DataTable.Row>
              <DataTable.Cell>Confidence Score</DataTable.Cell>
              <DataTable.Cell numeric>
                {(predictions.metrics.confidence * 100).toFixed(1)}%
              </DataTable.Cell>
            </DataTable.Row>

            <DataTable.Row>
              <DataTable.Cell>Model Agreement</DataTable.Cell>
              <DataTable.Cell numeric>
                {(predictions.metrics.agreement * 100).toFixed(1)}%
              </DataTable.Cell>
            </DataTable.Row>
          </DataTable>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Button
            mode="contained"
            onPress={() => setShowModelDetails(true)}
            style={styles.detailsButton}
          >
            Model Details
          </Button>
        </View>

        {renderEnsembleChart()}
        {renderModelWeights()}
        {renderMetrics()}
        {renderModelDetails()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
  },
  detailsButton: {
    marginBottom: 8,
  },
  chartCard: {
    margin: 16,
    elevation: 4,
  },
  chartControls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  chip: {
    marginRight: 8,
  },
  weightsCard: {
    margin: 16,
    elevation: 4,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  weightBar: {
    flex: 1,
    marginHorizontal: 8,
  },
  metricsCard: {
    margin: 16,
    elevation: 4,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalButton: {
    marginTop: 16,
  },
  weightText: {
    marginRight: 16,
  },
});

export default EnsemblePredictionView;
