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
  DataTable,
  IconButton,
  Chip,
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
} from 'victory-native';
import { format } from 'date-fns';
import FederatedLearningService from '../../services/FederatedLearningService';
import ModelManagementService from '../../services/ModelManagementService';

interface FederatedLearningMonitorProps {
  modelId?: string;
  onRoundComplete?: (modelId: string) => void;
}

const FederatedLearningMonitor: React.FC<FederatedLearningMonitorProps> = ({
  modelId,
  onRoundComplete,
}) => {
  const theme = useTheme();
  const [clients, setClients] = useState<any[]>([]);
  const [rounds, setRounds] = useState<any[]>([]);
  const [currentRound, setCurrentRound] = useState<any>(null);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [showClientDetails, setShowClientDetails] = useState(false);
  const [federatedConfig, setFederatedConfig] = useState<any>({
    roundDuration: 5000,
    minClients: 3,
    clientFraction: 0.8,
    localEpochs: 5,
    aggregationStrategy: 'fedAvg',
    privacyConfig: {
      clipNorm: 1.0,
      noiseSigma: 0.1,
      secureAggregation: true,
    },
    adaptiveConfig: {
      learningRateScheduler: true,
      clientWeighting: true,
      dynamicAggregation: true,
    },
  });

  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 32;

  useEffect(() => {
    loadRoundHistory();
  }, []);

  const loadRoundHistory = async () => {
    try {
      const history = await FederatedLearningService.getRoundHistory();
      setRounds(history);
    } catch (error) {
      console.error('Error loading round history:', error);
    }
  };

  const startFederatedRound = async () => {
    if (!modelId) return;

    try {
      const model = await ModelManagementService.loadModel(modelId);
      const updatedModel = await FederatedLearningService.startFederatedTraining(
        model,
        federatedConfig
      );

      const newModelId = await ModelManagementService.saveModel(updatedModel, {
        type: 'federated',
        version: format(new Date(), 'yyyyMMdd_HHmmss'),
      });

      if (onRoundComplete) {
        onRoundComplete(newModelId);
      }

      await loadRoundHistory();
    } catch (error) {
      console.error('Error starting federated round:', error);
    }
  };

  const renderClientList = () => (
    <Card style={styles.card}>
      <Card.Title title="Connected Clients" />
      <Card.Content>
        <DataTable>
          <DataTable.Header>
            <DataTable.Title>Client ID</DataTable.Title>
            <DataTable.Title>Status</DataTable.Title>
            <DataTable.Title numeric>Data Size</DataTable.Title>
            <DataTable.Title>Actions</DataTable.Title>
          </DataTable.Header>

          {clients.map((client) => (
            <DataTable.Row key={client.id}>
              <DataTable.Cell>{client.id}</DataTable.Cell>
              <DataTable.Cell>
                <Chip
                  mode="outlined"
                  selectedColor={
                    client.status === 'training'
                      ? theme.colors.primary
                      : client.status === 'error'
                      ? theme.colors.error
                      : theme.colors.text
                  }
                >
                  {client.status}
                </Chip>
              </DataTable.Cell>
              <DataTable.Cell numeric>
                {(client.metrics.dataSize / 1024).toFixed(1)}K
              </DataTable.Cell>
              <DataTable.Cell>
                <IconButton
                  icon="information"
                  size={20}
                  onPress={() => {
                    setSelectedClient(client);
                    setShowClientDetails(true);
                  }}
                />
              </DataTable.Cell>
            </DataTable.Row>
          ))}
        </DataTable>
      </Card.Content>
    </Card>
  );

  const renderRoundHistory = () => (
    <Card style={styles.card}>
      <Card.Title title="Training Rounds" />
      <Card.Content>
        <VictoryChart
          width={chartWidth}
          height={300}
          containerComponent={
            <VictoryVoronoiContainer
              labels={({ datum }) => `
                Round ${datum.roundId}
                Accuracy: ${(datum.accuracy * 100).toFixed(1)}%
                Loss: ${datum.loss.toFixed(4)}
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
              { name: 'Accuracy', symbol: { fill: theme.colors.primary } },
              { name: 'Loss', symbol: { fill: theme.colors.error } },
            ]}
          />

          <VictoryLine
            data={rounds.map((round, index) => ({
              x: index + 1,
              y: round.metrics.globalAccuracy,
              roundId: round.id,
              accuracy: round.metrics.globalAccuracy,
              loss: round.metrics.globalLoss,
            }))}
            style={{
              data: { stroke: theme.colors.primary },
            }}
          />

          <VictoryLine
            data={rounds.map((round, index) => ({
              x: index + 1,
              y: round.metrics.globalLoss,
              roundId: round.id,
              accuracy: round.metrics.globalAccuracy,
              loss: round.metrics.globalLoss,
            }))}
            style={{
              data: { stroke: theme.colors.error },
            }}
          />

          <VictoryAxis
            label="Round"
            style={{
              axisLabel: { padding: 30 },
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

        <Divider style={styles.divider} />

        <DataTable>
          <DataTable.Header>
            <DataTable.Title>Round</DataTable.Title>
            <DataTable.Title numeric>Clients</DataTable.Title>
            <DataTable.Title numeric>Accuracy</DataTable.Title>
            <DataTable.Title numeric>Loss</DataTable.Title>
          </DataTable.Header>

          {rounds.map((round) => (
            <DataTable.Row key={round.id}>
              <DataTable.Cell>{round.id}</DataTable.Cell>
              <DataTable.Cell numeric>{round.participants.length}</DataTable.Cell>
              <DataTable.Cell numeric>
                {(round.metrics.globalAccuracy * 100).toFixed(1)}%
              </DataTable.Cell>
              <DataTable.Cell numeric>
                {round.metrics.globalLoss.toFixed(4)}
              </DataTable.Cell>
            </DataTable.Row>
          ))}
        </DataTable>
      </Card.Content>
    </Card>
  );

  const renderClientDetails = () => (
    <Portal>
      <Modal
        visible={showClientDetails}
        onDismiss={() => setShowClientDetails(false)}
        contentContainerStyle={styles.modalContent}
      >
        {selectedClient && (
          <>
            <Text style={styles.modalTitle}>Client Details</Text>
            <ScrollView>
              <List.Section>
                <List.Subheader>General Information</List.Subheader>
                <List.Item
                  title="Client ID"
                  description={selectedClient.id}
                />
                <List.Item
                  title="Status"
                  description={selectedClient.status}
                />
                <List.Item
                  title="Last Update"
                  description={format(selectedClient.lastUpdate, 'PP p')}
                />

                <List.Subheader>Metrics</List.Subheader>
                <List.Item
                  title="Data Size"
                  description={`${(selectedClient.metrics.dataSize / 1024).toFixed(1)}K samples`}
                />
                <List.Item
                  title="Compute Capability"
                  description={selectedClient.metrics.computeCapability.toFixed(2)}
                />
                <List.Item
                  title="Current Loss"
                  description={selectedClient.metrics.loss.toFixed(4)}
                />
                <List.Item
                  title="Current Accuracy"
                  description={`${(selectedClient.metrics.accuracy * 100).toFixed(1)}%`}
                />

                <List.Subheader>Privacy Budget</List.Subheader>
                <List.Item
                  title="Epsilon"
                  description={selectedClient.privacy.epsilon.toFixed(4)}
                />
                <List.Item
                  title="Delta"
                  description={selectedClient.privacy.delta.toExponential(2)}
                />
              </List.Section>
            </ScrollView>
            <Button
              mode="contained"
              onPress={() => setShowClientDetails(false)}
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
            onPress={startFederatedRound}
            style={styles.startButton}
            disabled={!modelId || clients.length < federatedConfig.minClients}
          >
            Start Federated Round
          </Button>
        </View>

        {currentRound && (
          <Card style={styles.card}>
            <Card.Title title="Current Round Status" />
            <Card.Content>
              <Text style={styles.roundInfo}>
                Round {currentRound.id} - Started{' '}
                {format(currentRound.startTime, 'pp')}
              </Text>
              <Text style={styles.participantInfo}>
                {currentRound.participants.length} participating clients
              </Text>
              <ProgressBar
                progress={
                  currentRound.endTime ? 1 : Math.random() // Replace with actual progress
                }
                color={theme.colors.primary}
                style={styles.progressBar}
              />
            </Card.Content>
          </Card>
        )}

        {renderClientList()}
        {renderRoundHistory()}
        {renderClientDetails()}
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
  startButton: {
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
  modalButton: {
    marginTop: 16,
  },
  roundInfo: {
    fontSize: 16,
    marginBottom: 4,
  },
  participantInfo: {
    fontSize: 14,
    marginBottom: 8,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  progressBar: {
    marginVertical: 8,
  },
});

export default FederatedLearningMonitor;
