import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
import {
  Card,
  Text,
  useTheme,
  Button,
  Portal,
  Modal,
  List,
  Divider,
  DataTable,
  IconButton,
  Chip,
  TextInput,
  Switch,
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
  VictoryBar,
  VictoryBoxPlot,
} from 'victory-native';
import { format } from 'date-fns';
import ExperimentManagementService from '../../services/ExperimentManagementService';
import ModelManagementService from '../../services/ModelManagementService';

interface ExperimentManagerProps {
  modelId?: string;
  onExperimentComplete?: (results: any) => void;
}

const ExperimentManager: React.FC<ExperimentManagerProps> = ({
  modelId,
  onExperimentComplete,
}) => {
  const theme = useTheme();
  const [experiments, setExperiments] = useState<any[]>([]);
  const [selectedExperiment, setSelectedExperiment] = useState<any>(null);
  const [showExperimentDetails, setShowExperimentDetails] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [newExperiment, setNewExperiment] = useState({
    name: '',
    description: '',
    type: 'ab_test',
    variants: [
      {
        id: 'control',
        config: {},
        allocation: 0.5,
      },
      {
        id: 'variant_1',
        config: {},
        allocation: 0.5,
      },
    ],
    metrics: ['accuracy', 'loss', 'latency'],
    schedule: {
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      checkpoints: 10,
      evaluationInterval: 3600000,
    },
    constraints: {
      minAccuracy: 0.8,
      maxLatency: 100,
      maxModelSize: 1024 * 1024 * 10,
    },
  });

  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 32;

  useEffect(() => {
    loadExperiments();
  }, []);

  const loadExperiments = async () => {
    try {
      const experimentList = await ExperimentManagementService.getExperiments();
      setExperiments(experimentList);
    } catch (error) {
      console.error('Error loading experiments:', error);
    }
  };

  const createExperiment = async () => {
    try {
      const experimentId = await ExperimentManagementService.createExperiment(
        newExperiment
      );
      await loadExperiments();
      setShowCreateModal(false);

      if (newExperiment.type === 'ab_test' && modelId) {
        await ExperimentManagementService.startABTest(experimentId, modelId);
      } else if (newExperiment.type === 'cross_validation' && modelId) {
        await ExperimentManagementService.startCrossValidation(
          experimentId,
          modelId
        );
      }
    } catch (error) {
      console.error('Error creating experiment:', error);
    }
  };

  const renderExperimentList = () => (
    <Card style={styles.card}>
      <Card.Title title="Experiments" />
      <Card.Content>
        <DataTable>
          <DataTable.Header>
            <DataTable.Title>Name</DataTable.Title>
            <DataTable.Title>Type</DataTable.Title>
            <DataTable.Title>Status</DataTable.Title>
            <DataTable.Title>Actions</DataTable.Title>
          </DataTable.Header>

          {experiments.map((experiment) => (
            <DataTable.Row key={experiment.id}>
              <DataTable.Cell>{experiment.name}</DataTable.Cell>
              <DataTable.Cell>
                <Chip mode="outlined">{experiment.type}</Chip>
              </DataTable.Cell>
              <DataTable.Cell>
                <Chip
                  mode="outlined"
                  selectedColor={
                    experiment.status === 'running'
                      ? theme.colors.primary
                      : experiment.status === 'completed'
                      ? theme.colors.success
                      : theme.colors.error
                  }
                >
                  {experiment.status}
                </Chip>
              </DataTable.Cell>
              <DataTable.Cell>
                <IconButton
                  icon="information"
                  size={20}
                  onPress={() => {
                    setSelectedExperiment(experiment);
                    setShowExperimentDetails(true);
                  }}
                />
              </DataTable.Cell>
            </DataTable.Row>
          ))}
        </DataTable>
      </Card.Content>
    </Card>
  );

  const renderExperimentResults = () => {
    if (!results) return null;

    return (
      <Card style={styles.card}>
        <Card.Title title="Experiment Results" />
        <Card.Content>
          <VictoryChart
            width={chartWidth}
            height={300}
            containerComponent={
              <VictoryVoronoiContainer
                labels={({ datum }) => `
                  ${datum.variantId}
                  ${datum.metric}: ${datum.value.toFixed(4)}
                  Confidence: ${(datum.confidence * 100).toFixed(1)}%
                `}
                labelComponent={<VictoryTooltip />}
              />
            }
          >
            <VictoryLegend
              x={50}
              y={0}
              orientation="horizontal"
              data={results.variants.map((variant: any) => ({
                name: variant.id,
                symbol: { fill: theme.colors.primary },
              }))}
            />

            {results.metrics.map((metric: string) => (
              <VictoryBoxPlot
                key={metric}
                data={results.variants.map((variant: any) => ({
                  x: variant.id,
                  y: variant.metrics[metric].mean,
                  min: variant.metrics[metric].min,
                  max: variant.metrics[metric].max,
                  q1: variant.metrics[metric].mean - variant.metrics[metric].std,
                  q3: variant.metrics[metric].mean + variant.metrics[metric].std,
                  variantId: variant.id,
                  metric,
                  confidence: variant.confidence,
                }))}
                style={{
                  min: { stroke: theme.colors.error },
                  max: { stroke: theme.colors.error },
                  q1: { fill: theme.colors.primary },
                  q3: { fill: theme.colors.primary },
                  median: { stroke: theme.colors.accent },
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
              style={{
                tickLabels: { fontSize: 10, padding: 5 },
              }}
            />
          </VictoryChart>

          <Divider style={styles.divider} />

          <Text style={styles.recommendationsTitle}>Recommendations</Text>
          {results.recommendations.map((rec: string, index: number) => (
            <Text key={index} style={styles.recommendation}>
              • {rec}
            </Text>
          ))}
        </Card.Content>
      </Card>
    );
  };

  const renderCreateExperiment = () => (
    <Portal>
      <Modal
        visible={showCreateModal}
        onDismiss={() => setShowCreateModal(false)}
        contentContainerStyle={styles.modalContent}
      >
        <Text style={styles.modalTitle}>Create New Experiment</Text>
        <ScrollView>
          <TextInput
            label="Name"
            value={newExperiment.name}
            onChangeText={(text) =>
              setNewExperiment({ ...newExperiment, name: text })
            }
            style={styles.input}
          />

          <TextInput
            label="Description"
            value={newExperiment.description}
            onChangeText={(text) =>
              setNewExperiment({ ...newExperiment, description: text })
            }
            multiline
            style={styles.input}
          />

          <List.Section>
            <List.Subheader>Experiment Type</List.Subheader>
            <Menu.Item
              title={newExperiment.type}
              onPress={() => {}}
              right={() => (
                <IconButton
                  icon="chevron-down"
                  onPress={() => {}}
                />
              )}
            />

            <List.Subheader>Variants</List.Subheader>
            {newExperiment.variants.map((variant, index) => (
              <View key={variant.id} style={styles.variantContainer}>
                <TextInput
                  label={`Variant ${index + 1} ID`}
                  value={variant.id}
                  onChangeText={(text) => {
                    const variants = [...newExperiment.variants];
                    variants[index].id = text;
                    setNewExperiment({ ...newExperiment, variants });
                  }}
                  style={styles.variantInput}
                />
                <TextInput
                  label="Allocation"
                  value={String(variant.allocation)}
                  onChangeText={(text) => {
                    const variants = [...newExperiment.variants];
                    variants[index].allocation = Number(text);
                    setNewExperiment({ ...newExperiment, variants });
                  }}
                  keyboardType="numeric"
                  style={styles.allocationInput}
                />
              </View>
            ))}

            <Button
              mode="outlined"
              onPress={() => {
                const variants = [...newExperiment.variants];
                variants.push({
                  id: `variant_${variants.length}`,
                  config: {},
                  allocation: 1 / (variants.length + 1),
                });
                setNewExperiment({ ...newExperiment, variants });
              }}
              style={styles.addButton}
            >
              Add Variant
            </Button>

            <List.Subheader>Constraints</List.Subheader>
            <TextInput
              label="Minimum Accuracy"
              value={String(newExperiment.constraints.minAccuracy)}
              onChangeText={(text) =>
                setNewExperiment({
                  ...newExperiment,
                  constraints: {
                    ...newExperiment.constraints,
                    minAccuracy: Number(text),
                  },
                })
              }
              keyboardType="numeric"
              style={styles.input}
            />

            <TextInput
              label="Maximum Latency (ms)"
              value={String(newExperiment.constraints.maxLatency)}
              onChangeText={(text) =>
                setNewExperiment({
                  ...newExperiment,
                  constraints: {
                    ...newExperiment.constraints,
                    maxLatency: Number(text),
                  },
                })
              }
              keyboardType="numeric"
              style={styles.input}
            />
          </List.Section>
        </ScrollView>

        <Button
          mode="contained"
          onPress={createExperiment}
          style={styles.createButton}
        >
          Create Experiment
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
            onPress={() => setShowCreateModal(true)}
            style={styles.newButton}
          >
            New Experiment
          </Button>
        </View>

        {renderExperimentList()}
        {renderExperimentResults()}
        {renderCreateExperiment()}
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
  newButton: {
    marginBottom: 8,
  },
  card: {
    margin: 16,
    elevation: 4,
  },
  divider: {
    marginVertical: 16,
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
  input: {
    marginBottom: 16,
  },
  variantContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  variantInput: {
    flex: 3,
    marginRight: 8,
  },
  allocationInput: {
    flex: 1,
  },
  addButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  createButton: {
    marginTop: 16,
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  recommendation: {
    marginBottom: 4,
  },
});

export default ExperimentManager;
