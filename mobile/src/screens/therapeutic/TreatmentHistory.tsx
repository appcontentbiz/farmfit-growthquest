import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
import {
  Title,
  Card,
  Text,
  Button,
  useTheme,
  ActivityIndicator,
  Chip,
  Searchbar,
  Menu,
  Portal,
  Modal,
  List,
  DataTable,
  ProgressBar,
} from 'react-native-paper';
import { useQuery } from '@apollo/client';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { GET_ANIMAL_TREATMENT_HISTORY } from '../../graphql/queries';
import {
  Treatment,
  TreatmentStatus,
  TreatmentAnalytics,
} from '../../types/therapeutic';
import {
  calculateTreatmentProgress,
  calculateMedicationAdherence,
  generateTreatmentSummary,
} from '../../utils/therapeutic';
import { formatDate } from '../../utils/date';

const TreatmentHistory = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { animalId, animalName } = route.params;

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('6M'); // 1M, 3M, 6M, 1Y, ALL
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(
    null
  );
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Query
  const { loading, error, data, refetch } = useQuery(GET_ANIMAL_TREATMENT_HISTORY, {
    variables: {
      animalId,
      period: selectedPeriod,
    },
  });

  const filterTreatments = (treatments: Treatment[]) => {
    return treatments.filter(
      (treatment) =>
        treatment.condition.toLowerCase().includes(searchQuery.toLowerCase()) ||
        treatment.treatment.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const calculateEffectivenessStats = (treatments: Treatment[]) => {
    const completedTreatments = treatments.filter(
      (t) => t.status === TreatmentStatus.COMPLETED
    );
    const totalTreatments = treatments.length;

    const stats = {
      totalTreatments,
      completedTreatments: completedTreatments.length,
      averageAdherence:
        completedTreatments.reduce(
          (acc, t) =>
            acc +
            calculateMedicationAdherence(t.medications, t.startDate, t.endDate),
          0
        ) / (completedTreatments.length || 1),
      conditionBreakdown: treatments.reduce((acc, t) => {
        acc[t.condition] = (acc[t.condition] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    return stats;
  };

  const renderEffectivenessChart = (treatments: Treatment[]) => {
    const stats = calculateEffectivenessStats(treatments);
    const data = Object.entries(stats.conditionBreakdown)
      .slice(0, 5)
      .map(([name, count], index) => ({
        name,
        count,
        color: theme.colors.primary,
        legendFontColor: theme.colors.text,
        legendFontSize: 12,
      }));

    return (
      <Card style={styles.chartCard}>
        <Card.Content>
          <Title>Treatment Distribution</Title>
          <PieChart
            data={data}
            width={Dimensions.get('window').width - 64}
            height={200}
            chartConfig={{
              color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
            }}
            accessor="count"
            backgroundColor="transparent"
            paddingLeft="15"
          />
        </Card.Content>
      </Card>
    );
  };

  const renderTreatmentTimeline = (treatments: Treatment[]) => {
    const sortedTreatments = [...treatments].sort(
      (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );

    return (
      <Card style={styles.timelineCard}>
        <Card.Content>
          <Title>Treatment Timeline</Title>
          {sortedTreatments.map((treatment, index) => (
            <View key={treatment.id} style={styles.timelineItem}>
              <View style={styles.timelineConnector}>
                <View style={styles.timelineDot} />
                {index < sortedTreatments.length - 1 && (
                  <View style={styles.timelineLine} />
                )}
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineDate}>
                  {formatDate(treatment.startDate)}
                </Text>
                <Text style={styles.timelineTitle}>{treatment.condition}</Text>
                <Text style={styles.timelineSubtitle}>
                  {treatment.treatment}
                </Text>
                <ProgressBar
                  progress={calculateTreatmentProgress(treatment) / 100}
                  color={theme.colors.primary}
                  style={styles.progressBar}
                />
                <View style={styles.medicationList}>
                  {treatment.medications.map((med) => (
                    <Chip
                      key={med.id}
                      style={styles.medicationChip}
                      textStyle={styles.medicationChipText}
                    >
                      {med.name}
                    </Chip>
                  ))}
                </View>
              </View>
            </View>
          ))}
        </Card.Content>
      </Card>
    );
  };

  const renderAnalyticsModal = (treatment: Treatment) => {
    const analytics: TreatmentAnalytics = {
      treatmentId: treatment.id,
      progress: calculateTreatmentProgress(treatment),
      adherence: calculateMedicationAdherence(
        treatment.medications,
        treatment.startDate,
        treatment.endDate
      ),
      effectiveness: 85, // Mock data - would come from backend
      costEfficiency: 78, // Mock data - would come from backend
      timelineDeviation: 5, // Mock data - would come from backend
      recommendations: [
        'Consider adjusting medication schedule',
        'Monitor side effects closely',
      ],
    };

    return (
      <Portal>
        <Modal
          visible={showAnalytics}
          onDismiss={() => setShowAnalytics(false)}
          contentContainerStyle={styles.modalContent}
        >
          <ScrollView>
            <Title>Treatment Analytics</Title>
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Metric</DataTable.Title>
                <DataTable.Title numeric>Value</DataTable.Title>
              </DataTable.Header>

              <DataTable.Row>
                <DataTable.Cell>Progress</DataTable.Cell>
                <DataTable.Cell numeric>{analytics.progress}%</DataTable.Cell>
              </DataTable.Row>

              <DataTable.Row>
                <DataTable.Cell>Adherence</DataTable.Cell>
                <DataTable.Cell numeric>
                  {analytics.adherence.toFixed(1)}%
                </DataTable.Cell>
              </DataTable.Row>

              <DataTable.Row>
                <DataTable.Cell>Effectiveness</DataTable.Cell>
                <DataTable.Cell numeric>{analytics.effectiveness}%</DataTable.Cell>
              </DataTable.Row>

              <DataTable.Row>
                <DataTable.Cell>Cost Efficiency</DataTable.Cell>
                <DataTable.Cell numeric>
                  {analytics.costEfficiency}%
                </DataTable.Cell>
              </DataTable.Row>

              <DataTable.Row>
                <DataTable.Cell>Timeline Deviation</DataTable.Cell>
                <DataTable.Cell numeric>
                  {analytics.timelineDeviation}%
                </DataTable.Cell>
              </DataTable.Row>
            </DataTable>

            <Title style={styles.recommendationsTitle}>Recommendations</Title>
            {analytics.recommendations.map((rec, index) => (
              <List.Item
                key={index}
                title={rec}
                left={(props) => (
                  <List.Icon {...props} icon="lightbulb-outline" />
                )}
              />
            ))}
          </ScrollView>
          <Button
            mode="contained"
            onPress={() => setShowAnalytics(false)}
            style={styles.modalButton}
          >
            Close
          </Button>
        </Modal>
      </Portal>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle" size={48} color={theme.colors.error} />
        <Text style={styles.errorText}>Failed to load treatment history</Text>
        <Button mode="contained" onPress={() => refetch()}>
          Retry
        </Button>
      </View>
    );
  }

  const treatments = filterTreatments(data.animalTreatmentHistory);

  return (
    <View style={styles.container}>
      <Title style={styles.title}>{animalName}'s Treatment History</Title>

      <Searchbar
        placeholder="Search treatments..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.periodFilters}>
          {['1M', '3M', '6M', '1Y', 'ALL'].map((period) => (
            <Chip
              key={period}
              selected={selectedPeriod === period}
              onPress={() => setSelectedPeriod(period)}
              style={styles.periodChip}
            >
              {period}
            </Chip>
          ))}
        </View>
      </ScrollView>

      <ScrollView>
        {renderEffectivenessChart(treatments)}
        {renderTreatmentTimeline(treatments)}
      </ScrollView>

      {selectedTreatment && renderAnalyticsModal(selectedTreatment)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginVertical: 10,
    textAlign: 'center',
  },
  searchBar: {
    margin: 16,
    elevation: 4,
  },
  periodFilters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  periodChip: {
    marginRight: 8,
  },
  chartCard: {
    margin: 16,
    elevation: 4,
  },
  timelineCard: {
    margin: 16,
    elevation: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    marginVertical: 8,
  },
  timelineConnector: {
    width: 24,
    alignItems: 'center',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 4,
  },
  timelineContent: {
    flex: 1,
    marginLeft: 12,
  },
  timelineDate: {
    fontSize: 12,
    color: '#666',
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  timelineSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    marginVertical: 8,
  },
  medicationList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  medicationChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  medicationChipText: {
    fontSize: 12,
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  recommendationsTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  modalButton: {
    marginTop: 16,
  },
});

export default TreatmentHistory;
