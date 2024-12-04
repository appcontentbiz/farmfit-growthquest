import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
import {
  Card,
  Text,
  useTheme,
  Button,
  DataTable,
  IconButton,
  Portal,
  Modal,
  List,
  Divider,
  ProgressBar,
  Chip,
  Menu,
} from 'react-native-paper';
import {
  VictoryChart,
  VictoryLine,
  VictoryScatter,
  VictoryAxis,
  VictoryTooltip,
  VictoryVoronoiContainer,
  VictoryLegend,
} from 'victory-native';
import { format } from 'date-fns';
import ModelManagementService from '../../services/ModelManagementService';

interface ModelManagerProps {
  onModelSelect?: (modelId: string) => void;
}

const ModelManager: React.FC<ModelManagerProps> = ({ onModelSelect }) => {
  const theme = useTheme();
  const [models, setModels] = useState<any[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [comparison, setComparison] = useState<any>(null);
  const [showModelDetails, setShowModelDetails] = useState(false);
  const [selectedModel, setSelectedModel] = useState<any>(null);
  const [autoMLConfig, setAutoMLConfig] = useState<any>(null);
  const [showAutoMLModal, setShowAutoMLModal] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState<any>(null);

  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 32;

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      const modelList = await ModelManagementService.listModels();
      setModels(modelList);
    } catch (error) {
      console.error('Error loading models:', error);
    }
  };

  const handleModelSelect = (modelId: string) => {
    const newSelection = selectedModels.includes(modelId)
      ? selectedModels.filter(id => id !== modelId)
      : [...selectedModels, modelId];
    setSelectedModels(newSelection);
  };

  const compareSelectedModels = async () => {
    try {
      const result = await ModelManagementService.compareModels(selectedModels);
      setComparison(result);
    } catch (error) {
      console.error('Error comparing models:', error);
    }
  };

  const startAutoML = async () => {
    try {
      setTrainingProgress({
        status: 'initializing',
        progress: 0,
        message: 'Initializing AutoML...',
      });

      const config = {
        maxTrials: 10,
        maxEpochs: 50,
        validationSplit: 0.2,
        optimizeMetric: 'accuracy',
        searchSpace: {
          learningRate: {
            type: 'float',
            values: [0.0001, 0.001, 0.01],
          },
          units: {
            type: 'int',
            values: [32, 64, 128],
          },
          numLayers: {
            type: 'int',
            values: [2, 3, 4],
          },
          layerType: {
            type: 'categorical',
            values: ['lstm', 'gru', 'dense'],
          },
          activation: {
            type: 'categorical',
            values: ['relu', 'tanh', 'sigmoid'],
          },
          dropoutRate: {
            type: 'float',
            values: [0.1, 0.3, 0.5],
          },
        },
      };

      setAutoMLConfig(config);
      setShowAutoMLModal(true);
    } catch (error) {
      console.error('Error starting AutoML:', error);
    }
  };

  const renderModelList = () => (
    <Card style={styles.card}>
      <Card.Title title="Available Models" />
      <Card.Content>
        <DataTable>
          <DataTable.Header>
            <DataTable.Title>Model</DataTable.Title>
            <DataTable.Title numeric>Accuracy</DataTable.Title>
            <DataTable.Title numeric>Size</DataTable.Title>
            <DataTable.Title>Actions</DataTable.Title>
          </DataTable.Header>

          {models.map((model) => (
            <DataTable.Row key={model.id}>
              <DataTable.Cell>{model.type}</DataTable.Cell>
              <DataTable.Cell numeric>
                {(model.metrics.accuracy * 100).toFixed(1)}%
              </DataTable.Cell>
              <DataTable.Cell numeric>
                {(model.size / 1024 / 1024).toFixed(1)}MB
              </DataTable.Cell>
              <DataTable.Cell>
                <View style={styles.actionButtons}>
                  <IconButton
                    icon="information"
                    size={20}
                    onPress={() => {
                      setSelectedModel(model);
                      setShowModelDetails(true);
                    }}
                  />
                  <IconButton
                    icon={selectedModels.includes(model.id) ? 'check' : 'plus'}
                    size={20}
                    onPress={() => handleModelSelect(model.id)}
                  />
                </View>
              </DataTable.Cell>
            </DataTable.Row>
          ))}
        </DataTable>
      </Card.Content>
    </Card>
  );

  const renderModelComparison = () => {
    if (!comparison) return null;

    return (
      <Card style={styles.card}>
        <Card.Title title="Model Comparison" />
        <Card.Content>
          <VictoryChart
            width={chartWidth}
            height={300}
            containerComponent={
              <VictoryVoronoiContainer
                labels={({ datum }) => `
                  Model: ${datum.modelId}
                  Metric: ${datum.metric}
                  Value: ${(datum.value * 100).toFixed(1)}%
                `}
                labelComponent={<VictoryTooltip />}
              />
            }
          >
            <VictoryLegend
              x={50}
              y={0}
              orientation="horizontal"
              data={selectedModels.map((id) => ({
                name: id,
                symbol: { fill: theme.colors.primary },
              }))}
            />

            {selectedModels.map((modelId, index) => (
              <VictoryLine
                key={modelId}
                data={Object.entries(comparison.metrics[modelId]).map(
                  ([metric, value]) => ({
                    x: metric,
                    y: value,
                    modelId,
                  })
                )}
                style={{
                  data: {
                    stroke: theme.colors.primary,
                    opacity: 0.7,
                  },
                }}
              />
            ))}

            <VictoryAxis
              style={{
                tickLabels: { fontSize: 10, padding: 5, angle: -45 },
              }}
            />
            <VictoryAxis
              dependentAxis
              tickFormat={(value) => `${(value * 100).toFixed(0)}%`}
              style={{
                tickLabels: { fontSize: 10, padding: 5 },
              }}
            />
          </VictoryChart>

          <Divider style={styles.divider} />

          <Text style={styles.recommendationsTitle}>Recommendations</Text>
          {comparison.recommendations.map((rec: string, index: number) => (
            <Text key={index} style={styles.recommendation}>
              • {rec}
            </Text>
          ))}
        </Card.Content>
      </Card>
    );
  };

  const renderModelDetails = () => (
    <Portal>
      <Modal
        visible={showModelDetails}
        onDismiss={() => setShowModelDetails(false)}
        contentContainerStyle={styles.modalContent}
      >
        {selectedModel && (
          <>
            <Text style={styles.modalTitle}>{selectedModel.type} Model Details</Text>
            <ScrollView>
              <List.Section>
                <List.Subheader>General Information</List.Subheader>
                <List.Item
                  title="Created"
                  description={format(new Date(selectedModel.createdAt), 'PP')}
                />
                <List.Item
                  title="Version"
                  description={selectedModel.version}
                />
                <List.Item
                  title="Size"
                  description={`${(selectedModel.size / 1024 / 1024).toFixed(2)}MB`}
                />

                <List.Subheader>Performance Metrics</List.Subheader>
                <List.Item
                  title="Accuracy"
                  description={`${(selectedModel.metrics.accuracy * 100).toFixed(1)}%`}
                />
                <List.Item
                  title="Loss"
                  description={selectedModel.metrics.loss.toFixed(4)}
                />
                <List.Item
                  title="MSE"
                  description={selectedModel.metrics.mse.toFixed(4)}
                />
                <List.Item
                  title="MAE"
                  description={selectedModel.metrics.mae.toFixed(4)}
                />
                <List.Item
                  title="R²"
                  description={selectedModel.metrics.r2.toFixed(4)}
                />

                <List.Subheader>Hyperparameters</List.Subheader>
                {Object.entries(selectedModel.hyperparameters).map(([key, value]) => (
                  <List.Item
                    key={key}
                    title={key}
                    description={String(value)}
                  />
                ))}
              </List.Section>
            </ScrollView>
            <Button
              mode="contained"
              onPress={() => setShowModelDetails(false)}
              style={styles.modalButton}
            >
              Close
            </Button>
          </>
        )}
      </Modal>
    </Portal>
  );

  const renderAutoMLModal = () => (
    <Portal>
      <Modal
        visible={showAutoMLModal}
        onDismiss={() => setShowAutoMLModal(false)}
        contentContainerStyle={styles.modalContent}
      >
        <Text style={styles.modalTitle}>AutoML Progress</Text>
        {trainingProgress && (
          <View>
            <Text style={styles.progressStatus}>{trainingProgress.status}</Text>
            <ProgressBar
              progress={trainingProgress.progress}
              color={theme.colors.primary}
              style={styles.progressBar}
            />
            <Text style={styles.progressMessage}>{trainingProgress.message}</Text>
          </View>
        )}
        <Button
          mode="contained"
          onPress={() => setShowAutoMLModal(false)}
          style={styles.modalButton}
          disabled={trainingProgress?.status === 'running'}
        >
          Close
        </Button>
      </Modal>
    </Portal>
  );

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Button
            mode="contained"
            onPress={startAutoML}
            style={styles.autoMLButton}
          >
            Start AutoML
          </Button>
        </View>

        {renderModelList()}

        {selectedModels.length > 1 && (
          <Button
            mode="contained"
            onPress={compareSelectedModels}
            style={styles.compareButton}
          >
            Compare Selected Models
          </Button>
        )}

        {renderModelComparison()}
        {renderModelDetails()}
        {renderAutoMLModal()}
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
  autoMLButton: {
    marginBottom: 8,
  },
  card: {
    margin: 16,
    elevation: 4,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  compareButton: {
    margin: 16,
  },
  divider: {
    marginVertical: 16,
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  recommendation: {
    marginBottom: 4,
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
  progressStatus: {
    fontSize: 16,
    marginBottom: 8,
  },
  progressBar: {
    marginVertical: 8,
  },
  progressMessage: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
  },
});

export default ModelManager;
