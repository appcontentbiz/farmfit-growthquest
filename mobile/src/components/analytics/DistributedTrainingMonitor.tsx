import React, { useState, useEffect } from 'react';
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
  IconButton,
  DataTable,
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
import DistributedTrainingService from '../../services/DistributedTrainingService';

interface DistributedTrainingMonitorProps {
  modelId?: string;
  onTrainingComplete?: (modelId: string) => void;
}

const DistributedTrainingMonitor: React.FC<DistributedTrainingMonitorProps> = ({
  modelId,
  onTrainingComplete,
}) => {
  const theme = useTheme();
  const [workers, setWorkers] = useState<any[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<any>(null);
  const [showWorkerDetails, setShowWorkerDetails] = useState(false);
  const [trainingMetrics, setTrainingMetrics] = useState<any[]>([]);
  const [updateConfig, setUpdateConfig] = useState<any>(null);
  const [showUpdateConfig, setShowUpdateConfig] = useState(false);

  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 32;

  useEffect(() => {
    const fetchWorkerStatus = async () => {
      try {
        const status = await DistributedTrainingService.getAllWorkerStatus();
        setWorkers(status);
      } catch (error) {
        console.error('Error fetching worker status:', error);
      }
    };

    const interval = setInterval(fetchWorkerStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  const startRealTimeUpdates = async () => {
    if (!modelId) return;

    const config = {
      updateInterval: 5000, // 5 seconds
      minSamples: 10,
      maxStaleness: 3600000, // 1 hour
      performanceThreshold: 0.1,
    };

    setUpdateConfig(config);
    await DistributedTrainingService.setupRealTimeUpdates(modelId, config);
    setShowUpdateConfig(true);
  };

  const renderWorkerList = () => (
    <Card style={styles.card}>
      <Card.Title title="Training Workers" />
      <Card.Content>
        <DataTable>
          <DataTable.Header>
            <DataTable.Title>Worker ID</DataTable.Title>
            <DataTable.Title>Status</DataTable.Title>
            <DataTable.Title numeric>Progress</DataTable.Title>
            <DataTable.Title>Actions</DataTable.Title>
          </DataTable.Header>

          {workers.map((worker) => (
            <DataTable.Row key={worker.id}>
              <DataTable.Cell>{worker.id}</DataTable.Cell>
              <DataTable.Cell>
                <Text
                  style={{
                    color:
                      worker.status === 'training'
                        ? theme.colors.primary
                        : worker.status === 'error'
                        ? theme.colors.error
                        : theme.colors.text,
                  }}
                >
                  {worker.status}
                </Text>
              </DataTable.Cell>
              <DataTable.Cell numeric>
                {(worker.progress * 100).toFixed(1)}%
              </DataTable.Cell>
              <DataTable.Cell>
                <IconButton
                  icon="information"
                  size={20}
                  onPress={() => {
                    setSelectedWorker(worker);
                    setShowWorkerDetails(true);
                  }}
                />
              </DataTable.Cell>
            </DataTable.Row>
          ))}
        </DataTable>
      </Card.Content>
    </Card>
  );

  const renderMetricsChart = () => (
    <Card style={styles.card}>
      <Card.Title title="Training Metrics" />
      <Card.Content>
        <VictoryChart
          width={chartWidth}
          height={300}
          containerComponent={
            <VictoryVoronoiContainer
              labels={({ datum }) => `
                Metric: ${datum.metric}
                Value: ${datum.value.toFixed(4)}
                Time: ${format(datum.timestamp, 'HH:mm:ss')}
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
              { name: 'Loss', symbol: { fill: theme.colors.error } },
              { name: 'Accuracy', symbol: { fill: theme.colors.primary } },
            ]}
          />

          <VictoryLine
            data={trainingMetrics.map((m) => ({
              x: m.timestamp,
              y: m.loss,
              metric: 'Loss',
            }))}
            style={{
              data: { stroke: theme.colors.error },
            }}
          />

          <VictoryLine
            data={trainingMetrics.map((m) => ({
              x: m.timestamp,
              y: m.accuracy,
              metric: 'Accuracy',
            }))}
            style={{
              data: { stroke: theme.colors.primary },
            }}
          />

          <VictoryAxis
            tickFormat={(t) => format(t, 'HH:mm:ss')}
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
      </Card.Content>
    </Card>
  );

  const renderWorkerDetails = () => (
    <Portal>
      <Modal
        visible={showWorkerDetails}
        onDismiss={() => setShowWorkerDetails(false)}
        contentContainerStyle={styles.modalContent}
      >
        {selectedWorker && (
          <>
            <Text style={styles.modalTitle}>Worker Details</Text>
            <ScrollView>
              <List.Section>
                <List.Subheader>General Information</List.Subheader>
                <List.Item
                  title="Worker ID"
                  description={selectedWorker.id}
                />
                <List.Item
                  title="Status"
                  description={selectedWorker.status}
                />
                <List.Item
                  title="Progress"
                  description={`${(selectedWorker.progress * 100).toFixed(1)}%`}
                />
                <List.Item
                  title="Last Sync"
                  description={format(selectedWorker.lastSync, 'PP p')}
                />

                <List.Subheader>Current Metrics</List.Subheader>
                <List.Item
                  title="Loss"
                  description={selectedWorker.metrics.loss.toFixed(4)}
                />
                <List.Item
                  title="Accuracy"
                  description={selectedWorker.metrics.accuracy.toFixed(4)}
                />
              </List.Section>
            </ScrollView>
            <Button
              mode="contained"
              onPress={() => setShowWorkerDetails(false)}
              style={styles.modalButton}
            >
              Close
            </Button>
          </>
        )}
      </Modal>
    </Portal>
  );

  const renderUpdateConfig = () => (
    <Portal>
      <Modal
        visible={showUpdateConfig}
        onDismiss={() => setShowUpdateConfig(false)}
        contentContainerStyle={styles.modalContent}
      >
        {updateConfig && (
          <>
            <Text style={styles.modalTitle}>Real-Time Update Configuration</Text>
            <List.Section>
              <List.Item
                title="Update Interval"
                description={`${updateConfig.updateInterval / 1000} seconds`}
              />
              <List.Item
                title="Minimum Samples"
                description={String(updateConfig.minSamples)}
              />
              <List.Item
                title="Maximum Staleness"
                description={`${updateConfig.maxStaleness / 3600000} hours`}
              />
              <List.Item
                title="Performance Threshold"
                description={String(updateConfig.performanceThreshold)}
              />
            </List.Section>
            <Button
              mode="contained"
              onPress={() => setShowUpdateConfig(false)}
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
        <View style={styles.header}>
          <Button
            mode="contained"
            onPress={startRealTimeUpdates}
            style={styles.updateButton}
            disabled={!modelId}
          >
            Enable Real-Time Updates
          </Button>
        </View>

        {renderWorkerList()}
        {renderMetricsChart()}
        {renderWorkerDetails()}
        {renderUpdateConfig()}
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
  updateButton: {
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
});

export default DistributedTrainingMonitor;
