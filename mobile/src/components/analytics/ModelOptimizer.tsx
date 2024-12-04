import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
import {
  Card,
  Text,
  useTheme,
  Button,
  Portal,
  Modal,
  ProgressBar,
  List,
  Divider,
  DataTable,
  Slider,
} from 'react-native-paper';
import {
  VictoryChart,
  VictoryBar,
  VictoryAxis,
  VictoryTooltip,
  VictoryVoronoiContainer,
  VictoryLegend,
  VictoryGroup,
} from 'victory-native';
import ModelOptimizationService from '../../services/ModelOptimizationService';
import ModelManagementService from '../../services/ModelManagementService';

interface ModelOptimizerProps {
  modelId?: string;
  onOptimizationComplete?: (optimizedModelId: string) => void;
}

const ModelOptimizer: React.FC<ModelOptimizerProps> = ({
  modelId,
  onOptimizationComplete,
}) => {
  const theme = useTheme();
  const [optimizationConfig, setOptimizationConfig] = useState({
    quantizationBits: 8,
    pruningSparsity: 0.5,
    pruningFrequency: 100,
    pruningThreshold: 0.1,
    useDistillation: false,
    distillationTemp: 2.0,
    distillationAlpha: 0.5,
  });
  const [optimizationStatus, setOptimizationStatus] = useState<any>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);

  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 32;

  const startOptimization = async () => {
    if (!modelId) return;

    try {
      setOptimizationStatus({
        status: 'running',
        progress: 0,
        message: 'Starting optimization...',
      });

      const model = await ModelManagementService.loadModel(modelId);

      const config = {
        quantizationBits: optimizationConfig.quantizationBits,
        pruningConfig: {
          initialSparsity: 0.0,
          finalSparsity: optimizationConfig.pruningSparsity,
          pruningFrequency: optimizationConfig.pruningFrequency,
          pruningThreshold: optimizationConfig.pruningThreshold,
        },
        ...(optimizationConfig.useDistillation && {
          distillationConfig: {
            teacherModelId: modelId,
            temperature: optimizationConfig.distillationTemp,
            alpha: optimizationConfig.distillationAlpha,
          },
        }),
      };

      setOptimizationStatus({
        status: 'running',
        progress: 0.2,
        message: 'Applying compression...',
      });

      const { model: optimizedModel, metrics } = await ModelOptimizationService.compressModel(
        model,
        config
      );

      setOptimizationStatus({
        status: 'running',
        progress: 0.8,
        message: 'Saving optimized model...',
      });

      const optimizedModelId = await ModelOptimizationService.exportOptimizedModel(
        optimizedModel,
        metrics
      );

      setMetrics(metrics);
      setOptimizationStatus({
        status: 'complete',
        progress: 1,
        message: 'Optimization complete',
      });

      if (onOptimizationComplete) {
        onOptimizationComplete(optimizedModelId);
      }
    } catch (error) {
      console.error('Error during optimization:', error);
      setOptimizationStatus({
        status: 'error',
        progress: 0,
        message: 'Optimization failed',
      });
    }
  };

  const renderOptimizationConfig = () => (
    <Portal>
      <Modal
        visible={showConfig}
        onDismiss={() => setShowConfig(false)}
        contentContainerStyle={styles.modalContent}
      >
        <Text style={styles.modalTitle}>Optimization Configuration</Text>
        <ScrollView>
          <List.Section>
            <List.Subheader>Quantization</List.Subheader>
            <View style={styles.sliderContainer}>
              <Text>Quantization Bits: {optimizationConfig.quantizationBits}</Text>
              <Slider
                value={optimizationConfig.quantizationBits}
                onValueChange={(value) =>
                  setOptimizationConfig({
                    ...optimizationConfig,
                    quantizationBits: value === 16 ? 16 : 8,
                  })
                }
                minimumValue={8}
                maximumValue={16}
                step={8}
              />
            </View>

            <List.Subheader>Pruning</List.Subheader>
            <View style={styles.sliderContainer}>
              <Text>
                Pruning Sparsity: {optimizationConfig.pruningSparsity.toFixed(2)}
              </Text>
              <Slider
                value={optimizationConfig.pruningSparsity}
                onValueChange={(value) =>
                  setOptimizationConfig({
                    ...optimizationConfig,
                    pruningSparsity: value,
                  })
                }
                minimumValue={0}
                maximumValue={0.9}
                step={0.1}
              />
            </View>

            <View style={styles.sliderContainer}>
              <Text>
                Pruning Threshold: {optimizationConfig.pruningThreshold.toFixed(2)}
              </Text>
              <Slider
                value={optimizationConfig.pruningThreshold}
                onValueChange={(value) =>
                  setOptimizationConfig({
                    ...optimizationConfig,
                    pruningThreshold: value,
                  })
                }
                minimumValue={0.05}
                maximumValue={0.5}
                step={0.05}
              />
            </View>

            <List.Subheader>Knowledge Distillation</List.Subheader>
            <List.Item
              title="Use Distillation"
              right={() => (
                <Button
                  mode={optimizationConfig.useDistillation ? 'contained' : 'outlined'}
                  onPress={() =>
                    setOptimizationConfig({
                      ...optimizationConfig,
                      useDistillation: !optimizationConfig.useDistillation,
                    })
                  }
                >
                  {optimizationConfig.useDistillation ? 'On' : 'Off'}
                </Button>
              )}
            />

            {optimizationConfig.useDistillation && (
              <>
                <View style={styles.sliderContainer}>
                  <Text>
                    Temperature: {optimizationConfig.distillationTemp.toFixed(1)}
                  </Text>
                  <Slider
                    value={optimizationConfig.distillationTemp}
                    onValueChange={(value) =>
                      setOptimizationConfig({
                        ...optimizationConfig,
                        distillationTemp: value,
                      })
                    }
                    minimumValue={1}
                    maximumValue={5}
                    step={0.1}
                  />
                </View>

                <View style={styles.sliderContainer}>
                  <Text>
                    Alpha: {optimizationConfig.distillationAlpha.toFixed(2)}
                  </Text>
                  <Slider
                    value={optimizationConfig.distillationAlpha}
                    onValueChange={(value) =>
                      setOptimizationConfig({
                        ...optimizationConfig,
                        distillationAlpha: value,
                      })
                    }
                    minimumValue={0}
                    maximumValue={1}
                    step={0.1}
                  />
                </View>
              </>
            )}
          </List.Section>
        </ScrollView>
        <Button
          mode="contained"
          onPress={() => setShowConfig(false)}
          style={styles.modalButton}
        >
          Done
        </Button>
      </Modal>
    </Portal>
  );

  const renderMetricsChart = () => {
    if (!metrics) return null;

    const data = [
      {
        metric: 'Size',
        original: metrics.originalSize / 1024 / 1024,
        optimized: metrics.compressedSize / 1024 / 1024,
      },
      {
        metric: 'Latency',
        original: 1,
        optimized: 1 - metrics.latencyImprovement,
      },
      {
        metric: 'Memory',
        original: metrics.memoryUsage / 1024 / 1024,
        optimized: (metrics.memoryUsage * (1 - metrics.latencyImprovement)) / 1024 / 1024,
      },
    ];

    return (
      <Card style={styles.card}>
        <Card.Title title="Optimization Metrics" />
        <Card.Content>
          <VictoryChart
            width={chartWidth}
            height={300}
            domainPadding={{ x: 50 }}
            containerComponent={
              <VictoryVoronoiContainer
                labels={({ datum }) => `
                  ${datum.metric}
                  Original: ${datum.original.toFixed(2)}
                  Optimized: ${datum.optimized.toFixed(2)}
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
                { name: 'Original', symbol: { fill: theme.colors.primary } },
                { name: 'Optimized', symbol: { fill: theme.colors.accent } },
              ]}
            />

            <VictoryGroup offset={20}>
              <VictoryBar
                data={data}
                x="metric"
                y="original"
                style={{ data: { fill: theme.colors.primary } }}
              />
              <VictoryBar
                data={data}
                x="metric"
                y="optimized"
                style={{ data: { fill: theme.colors.accent } }}
              />
            </VictoryGroup>

            <VictoryAxis
              style={{
                tickLabels: { fontSize: 10, padding: 5 },
              }}
            />
            <VictoryAxis
              dependentAxis
              style={{
                tickLabels: { fontSize: 10, padding: 5 },
              }}
            />
          </VictoryChart>

          <DataTable>
            <DataTable.Header>
              <DataTable.Title>Metric</DataTable.Title>
              <DataTable.Title numeric>Original</DataTable.Title>
              <DataTable.Title numeric>Optimized</DataTable.Title>
              <DataTable.Title numeric>Improvement</DataTable.Title>
            </DataTable.Header>

            <DataTable.Row>
              <DataTable.Cell>Size (MB)</DataTable.Cell>
              <DataTable.Cell numeric>
                {(metrics.originalSize / 1024 / 1024).toFixed(2)}
              </DataTable.Cell>
              <DataTable.Cell numeric>
                {(metrics.compressedSize / 1024 / 1024).toFixed(2)}
              </DataTable.Cell>
              <DataTable.Cell numeric>
                {(
                  ((metrics.originalSize - metrics.compressedSize) /
                    metrics.originalSize) *
                  100
                ).toFixed(1)}%
              </DataTable.Cell>
            </DataTable.Row>

            <DataTable.Row>
              <DataTable.Cell>Latency</DataTable.Cell>
              <DataTable.Cell numeric>1.00</DataTable.Cell>
              <DataTable.Cell numeric>
                {(1 - metrics.latencyImprovement).toFixed(2)}
              </DataTable.Cell>
              <DataTable.Cell numeric>
                {(metrics.latencyImprovement * 100).toFixed(1)}%
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
            onPress={() => setShowConfig(true)}
            style={styles.configButton}
          >
            Configure Optimization
          </Button>
          <Button
            mode="contained"
            onPress={startOptimization}
            style={styles.optimizeButton}
            disabled={!modelId || optimizationStatus?.status === 'running'}
          >
            Start Optimization
          </Button>
        </View>

        {optimizationStatus && (
          <Card style={styles.card}>
            <Card.Title title="Optimization Status" />
            <Card.Content>
              <Text style={styles.statusMessage}>{optimizationStatus.message}</Text>
              <ProgressBar
                progress={optimizationStatus.progress}
                color={
                  optimizationStatus.status === 'error'
                    ? theme.colors.error
                    : theme.colors.primary
                }
                style={styles.progressBar}
              />
            </Card.Content>
          </Card>
        )}

        {renderMetricsChart()}
        {renderOptimizationConfig()}
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
  configButton: {
    marginBottom: 8,
  },
  optimizeButton: {
    marginBottom: 8,
  },
  card: {
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
  sliderContainer: {
    padding: 16,
  },
  statusMessage: {
    marginBottom: 8,
  },
  progressBar: {
    marginVertical: 8,
  },
});

export default ModelOptimizer;
