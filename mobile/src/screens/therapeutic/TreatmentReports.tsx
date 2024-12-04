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
  Portal,
  Modal,
  List,
  DataTable,
  Divider,
  Menu,
  IconButton,
} from 'react-native-paper';
import { useQuery } from '@apollo/client';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';

import { GET_TREATMENT_REPORTS } from '../../graphql/queries';
import { TreatmentReport, TreatmentStatus } from '../../types/therapeutic';
import { formatCurrency } from '../../utils/format';

const chartConfig = {
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
  strokeWidth: 2,
  barPercentage: 0.5,
  useShadowColorFromDataset: false,
};

const TreatmentReports = () => {
  const theme = useTheme();
  const [dateRange, setDateRange] = useState('1M'); // 1M, 3M, 6M, 1Y
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'start' | 'end'>('start');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [selectedReport, setSelectedReport] = useState<TreatmentReport | null>(
    null
  );
  const [showReportModal, setShowReportModal] = useState(false);
  const [groupBy, setGroupBy] = useState<'condition' | 'status' | 'animal'>(
    'condition'
  );

  const { loading, error, data, refetch } = useQuery(GET_TREATMENT_REPORTS, {
    variables: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      groupBy,
    },
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const handleDateSelect = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      if (datePickerMode === 'start') {
        setStartDate(selectedDate);
      } else {
        setEndDate(selectedDate);
      }
      refetch();
    }
  };

  const renderOverviewStats = () => {
    const stats = data.treatmentReports.overview;
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Title>Overview</Title>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalTreatments}</Text>
              <Text style={styles.statLabel}>Total Treatments</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {stats.completionRate.toFixed(1)}%
              </Text>
              <Text style={styles.statLabel}>Completion Rate</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {stats.averageEffectiveness.toFixed(1)}%
              </Text>
              <Text style={styles.statLabel}>Effectiveness</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {formatCurrency(stats.totalCost)}
              </Text>
              <Text style={styles.statLabel}>Total Cost</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderTreatmentDistribution = () => {
    const distribution = data.treatmentReports.distribution;
    const chartData = {
      labels: distribution.map((d: any) => d.label),
      datasets: [
        {
          data: distribution.map((d: any) => d.count),
        },
      ],
    };

    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.chartHeader}>
            <Title>Treatment Distribution</Title>
            <Menu
              visible={showGroupByMenu}
              onDismiss={() => setShowGroupByMenu(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setShowGroupByMenu(true)}
                >
                  Group by: {groupBy}
                </Button>
              }
            >
              <Menu.Item
                onPress={() => {
                  setGroupBy('condition');
                  setShowGroupByMenu(false);
                }}
                title="Condition"
              />
              <Menu.Item
                onPress={() => {
                  setGroupBy('status');
                  setShowGroupByMenu(false);
                }}
                title="Status"
              />
              <Menu.Item
                onPress={() => {
                  setGroupBy('animal');
                  setShowGroupByMenu(false);
                }}
                title="Animal"
              />
            </Menu>
          </View>
          <ScrollView horizontal>
            <BarChart
              data={chartData}
              width={Math.max(
                Dimensions.get('window').width - 64,
                distribution.length * 60
              )}
              height={220}
              chartConfig={chartConfig}
              verticalLabelRotation={30}
              showValuesOnTopOfBars
            />
          </ScrollView>
        </Card.Content>
      </Card>
    );
  };

  const renderCostAnalysis = () => {
    const costs = data.treatmentReports.costs;
    const chartData = {
      labels: ['Medications', 'Consultations', 'Procedures'],
      datasets: [
        {
          data: [costs.medications, costs.consultations, costs.procedures],
        },
      ],
    };

    return (
      <Card style={styles.card}>
        <Card.Content>
          <Title>Cost Analysis</Title>
          <PieChart
            data={[
              {
                name: 'Medications',
                cost: costs.medications,
                color: theme.colors.primary,
                legendFontColor: theme.colors.text,
              },
              {
                name: 'Consultations',
                cost: costs.consultations,
                color: theme.colors.accent,
                legendFontColor: theme.colors.text,
              },
              {
                name: 'Procedures',
                cost: costs.procedures,
                color: theme.colors.error,
                legendFontColor: theme.colors.text,
              },
            ]}
            width={Dimensions.get('window').width - 64}
            height={200}
            chartConfig={chartConfig}
            accessor="cost"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </Card.Content>
      </Card>
    );
  };

  const renderTreatmentTable = () => {
    const treatments = data.treatmentReports.treatments;
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Title>Recent Treatments</Title>
          <DataTable>
            <DataTable.Header>
              <DataTable.Title>Animal</DataTable.Title>
              <DataTable.Title>Condition</DataTable.Title>
              <DataTable.Title>Status</DataTable.Title>
              <DataTable.Title numeric>Cost</DataTable.Title>
            </DataTable.Header>

            {treatments.map((treatment: any) => (
              <DataTable.Row
                key={treatment.id}
                onPress={() => {
                  setSelectedReport(treatment);
                  setShowReportModal(true);
                }}
              >
                <DataTable.Cell>{treatment.animalName}</DataTable.Cell>
                <DataTable.Cell>{treatment.condition}</DataTable.Cell>
                <DataTable.Cell>{treatment.status}</DataTable.Cell>
                <DataTable.Cell numeric>
                  {formatCurrency(treatment.cost)}
                </DataTable.Cell>
              </DataTable.Row>
            ))}
          </DataTable>
        </Card.Content>
      </Card>
    );
  };

  const renderReportModal = () => {
    if (!selectedReport) return null;

    return (
      <Portal>
        <Modal
          visible={showReportModal}
          onDismiss={() => setShowReportModal(false)}
          contentContainerStyle={styles.modalContent}
        >
          <ScrollView>
            <Title>Treatment Report</Title>
            <List.Section>
              <List.Item
                title="Animal"
                description={selectedReport.animalName}
                left={(props) => <List.Icon {...props} icon="cow" />}
              />
              <List.Item
                title="Condition"
                description={selectedReport.condition}
                left={(props) => <List.Icon {...props} icon="medical-bag" />}
              />
              <List.Item
                title="Status"
                description={selectedReport.status}
                left={(props) => <List.Icon {...props} icon="check-circle" />}
              />
              <List.Item
                title="Duration"
                description={`${selectedReport.duration} days`}
                left={(props) => <List.Icon {...props} icon="calendar-range" />}
              />
              <List.Item
                title="Completion Rate"
                description={`${selectedReport.completionRate}%`}
                left={(props) => <List.Icon {...props} icon="percent" />}
              />
              <List.Item
                title="Effectiveness"
                description={`${selectedReport.effectiveness}%`}
                left={(props) => <List.Icon {...props} icon="chart-line" />}
              />

              <Divider style={styles.divider} />
              <Title style={styles.sectionTitle}>Cost Breakdown</Title>
              <List.Item
                title="Medications"
                description={formatCurrency(selectedReport.costAnalysis.medications)}
                left={(props) => <List.Icon {...props} icon="pill" />}
              />
              <List.Item
                title="Consultations"
                description={formatCurrency(
                  selectedReport.costAnalysis.consultations
                )}
                left={(props) => <List.Icon {...props} icon="doctor" />}
              />
              <List.Item
                title="Procedures"
                description={formatCurrency(selectedReport.costAnalysis.procedures)}
                left={(props) => <List.Icon {...props} icon="hospital" />}
              />
              <List.Item
                title="Total Cost"
                description={formatCurrency(selectedReport.costAnalysis.total)}
                left={(props) => <List.Icon {...props} icon="cash" />}
              />

              <Divider style={styles.divider} />
              <Title style={styles.sectionTitle}>Complications</Title>
              {selectedReport.complications.map((complication: string, index: number) => (
                <List.Item
                  key={index}
                  title={complication}
                  left={(props) => (
                    <List.Icon {...props} icon="alert-circle" />
                  )}
                />
              ))}

              <Divider style={styles.divider} />
              <Title style={styles.sectionTitle}>Recommendations</Title>
              {selectedReport.recommendations.map(
                (recommendation: string, index: number) => (
                  <List.Item
                    key={index}
                    title={recommendation}
                    left={(props) => (
                      <List.Icon {...props} icon="lightbulb-outline" />
                    )}
                  />
                )
              )}
            </List.Section>
          </ScrollView>
          <Button
            mode="contained"
            onPress={() => setShowReportModal(false)}
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
        <Text style={styles.errorText}>Failed to load reports</Text>
        <Button mode="contained" onPress={() => refetch()}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Title>Treatment Reports</Title>
        <View style={styles.dateRangeContainer}>
          <Button
            mode="outlined"
            onPress={() => {
              setDatePickerMode('start');
              setShowDatePicker(true);
            }}
          >
            {startDate.toLocaleDateString()}
          </Button>
          <Text style={styles.dateRangeSeparator}>to</Text>
          <Button
            mode="outlined"
            onPress={() => {
              setDatePickerMode('end');
              setShowDatePicker(true);
            }}
          >
            {endDate.toLocaleDateString()}
          </Button>
        </View>
      </View>

      <ScrollView>
        {renderOverviewStats()}
        {renderTreatmentDistribution()}
        {renderCostAnalysis()}
        {renderTreatmentTable()}
      </ScrollView>

      {showDatePicker && (
        <DateTimePicker
          value={datePickerMode === 'start' ? startDate : endDate}
          mode="date"
          display="default"
          onChange={handleDateSelect}
          maximumDate={new Date()}
        />
      )}

      {renderReportModal()}
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
    backgroundColor: '#fff',
    elevation: 4,
  },
  dateRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  dateRangeSeparator: {
    marginHorizontal: 8,
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
  card: {
    margin: 16,
    elevation: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
  },
  statItem: {
    width: '50%',
    paddingVertical: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  divider: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 8,
  },
  modalButton: {
    marginTop: 16,
  },
});

export default TreatmentReports;
