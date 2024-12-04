import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Share,
  Platform,
} from 'react-native';
import {
  Text,
  Card,
  useTheme,
  Button,
  Portal,
  Modal,
  DataTable,
  FAB,
  SegmentedButtons,
  ProgressBar,
} from 'react-native-paper';
import {
  VictoryChart,
  VictoryLine,
  VictoryAxis,
  VictoryTooltip,
  VictoryVoronoiContainer,
  VictoryTheme,
  VictoryPie,
  VictoryBar,
} from 'victory-native';
import { format, subDays } from 'date-fns';
import AnalyticsService from '../../services/AnalyticsService';
import { TreatmentPriority } from '../../types/therapeutic';
import AnimatedNumber from '../../components/AnimatedNumber';
import { useNavigation } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';

const AnalyticsDashboard = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const [metrics, setMetrics] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('daily');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

  const loadMetrics = useCallback(async (forceRefresh: boolean = false) => {
    try {
      const data = await AnalyticsService.getPerformanceMetrics(forceRefresh);
      setMetrics(data);
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMetrics(true);
    setRefreshing(false);
  }, [loadMetrics]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  const generateAndShareReport = async () => {
    try {
      setGeneratingReport(true);
      const report = await AnalyticsService.generateReport({
        start: subDays(new Date(), 30),
        end: new Date(),
      });

      const reportPath = `${FileSystem.documentDirectory}farmfit_report.md`;
      await FileSystem.writeAsStringAsync(reportPath, report);

      await Share.share({
        title: 'FarmFit Analytics Report',
        url: Platform.OS === 'ios' ? reportPath : `file://${reportPath}`,
      });
    } catch (error) {
      console.error('Error sharing report:', error);
    } finally {
      setGeneratingReport(false);
    }
  };

  const renderOverallMetrics = () => (
    <Card style={styles.card}>
      <Card.Title title="Overall Performance" />
      <Card.Content>
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Success Rate</Text>
            <AnimatedNumber
              value={metrics?.overall.successRate || 0}
              style={styles.metricValue}
              suffix="%"
            />
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Completion Rate</Text>
            <AnimatedNumber
              value={metrics?.overall.completionRate || 0}
              style={styles.metricValue}
              suffix="%"
            />
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Response Time</Text>
            <AnimatedNumber
              value={metrics?.overall.averageResponseTime || 0}
              style={styles.metricValue}
              suffix="min"
            />
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Prediction Accuracy</Text>
            <AnimatedNumber
              value={metrics?.overall.predictionAccuracy || 0}
              style={styles.metricValue}
              suffix="%"
            />
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderTrendChart = () => {
    if (!metrics?.trends) return null;

    const trendData = metrics.trends[selectedPeriod];
    return (
      <Card style={styles.card}>
        <Card.Title title="Success Rate Trends" />
        <Card.Content>
          <SegmentedButtons
            value={selectedPeriod}
            onValueChange={setSelectedPeriod}
            buttons={[
              { value: 'daily', label: 'Daily' },
              { value: 'weekly', label: 'Weekly' },
              { value: 'monthly', label: 'Monthly' },
            ]}
            style={styles.segmentedButtons}
          />
          <VictoryChart
            theme={VictoryTheme.material}
            height={250}
            containerComponent={
              <VictoryVoronoiContainer
                labels={({ datum }) =>
                  `${format(new Date(datum.date), 'PP')}\n${datum.value.toFixed(1)}%`
                }
                labelComponent={<VictoryTooltip />}
              />
            }
          >
            <VictoryAxis
              tickFormat={(date) => format(new Date(date), 'MM/dd')}
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
            <VictoryLine
              data={trendData}
              x="date"
              y="value"
              style={{
                data: { stroke: theme.colors.primary },
              }}
            />
          </VictoryChart>
        </Card.Content>
      </Card>
    );
  };

  const renderCategoryMetrics = () => {
    if (!metrics?.byCategory) return null;

    return (
      <Card style={styles.card}>
        <Card.Title title="Category Performance" />
        <Card.Content>
          <DataTable>
            <DataTable.Header>
              <DataTable.Title>Category</DataTable.Title>
              <DataTable.Title numeric>Success</DataTable.Title>
              <DataTable.Title numeric>Response</DataTable.Title>
            </DataTable.Header>

            {Object.entries(metrics.byCategory).map(([category, data]: [string, any]) => (
              <DataTable.Row
                key={category}
                onPress={() => setSelectedCategory(category)}
                style={
                  selectedCategory === category
                    ? { backgroundColor: theme.colors.primaryContainer }
                    : undefined
                }
              >
                <DataTable.Cell>{category}</DataTable.Cell>
                <DataTable.Cell numeric>{data.successRate.toFixed(1)}%</DataTable.Cell>
                <DataTable.Cell numeric>{data.averageResponseTime.toFixed(1)}m</DataTable.Cell>
              </DataTable.Row>
            ))}
          </DataTable>
        </Card.Content>
      </Card>
    );
  };

  const renderPriorityDistribution = () => {
    if (!selectedCategory || !metrics?.byCategory[selectedCategory]) return null;

    const distribution = metrics.byCategory[selectedCategory].priorityDistribution;
    const data = Object.entries(distribution).map(([priority, value]) => ({
      x: priority,
      y: value,
      label: `${priority}\n${value.toFixed(1)}%`,
    }));

    return (
      <Card style={styles.card}>
        <Card.Title title={`${selectedCategory} Priority Distribution`} />
        <Card.Content>
          <VictoryPie
            data={data}
            height={250}
            colorScale={['#FF6B6B', '#FFB366', '#66CC66']}
            style={{ labels: { fontSize: 12 } }}
            labelRadius={({ radius }) => radius - 30}
          />
        </Card.Content>
      </Card>
    );
  };

  const renderCategoryTrends = () => {
    if (!selectedCategory || !metrics?.byCategory[selectedCategory]) return null;

    const trends = metrics.byCategory[selectedCategory].trends;
    return (
      <Card style={styles.card}>
        <Card.Title title={`${selectedCategory} Success Rate Trend`} />
        <Card.Content>
          <VictoryChart
            theme={VictoryTheme.material}
            height={250}
            containerComponent={
              <VictoryVoronoiContainer
                labels={({ datum }) =>
                  `${format(new Date(datum.date), 'PP')}\n${datum.value.toFixed(1)}%`
                }
                labelComponent={<VictoryTooltip />}
              />
            }
          >
            <VictoryAxis
              tickFormat={(date) => format(new Date(date), 'MM/dd')}
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
            <VictoryBar
              data={trends}
              x="date"
              y="value"
              style={{
                data: { fill: theme.colors.primary },
              }}
            />
          </VictoryChart>
        </Card.Content>
      </Card>
    );
  };

  if (!metrics) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading analytics...</Text>
        <ProgressBar indeterminate style={styles.progressBar} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderOverallMetrics()}
        {renderTrendChart()}
        {renderCategoryMetrics()}
        {renderPriorityDistribution()}
        {renderCategoryTrends()}
      </ScrollView>

      <Portal>
        <Modal
          visible={reportModalVisible}
          onDismiss={() => setReportModalVisible(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Text style={styles.modalTitle}>Generate Report</Text>
          <Text style={styles.modalText}>
            Generate and share a detailed analytics report for the last 30 days?
          </Text>
          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={() => setReportModalVisible(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={generateAndShareReport}
              loading={generatingReport}
              style={styles.modalButton}
            >
              Generate
            </Button>
          </View>
        </Modal>
      </Portal>

      <FAB
        icon="file-document"
        label="Report"
        style={styles.fab}
        onPress={() => setReportModalVisible(true)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  progressBar: {
    width: 200,
    marginTop: 10,
  },
  card: {
    margin: 8,
    elevation: 2,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  metricItem: {
    width: '48%',
    marginBottom: 16,
  },
  metricLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  segmentedButtons: {
    marginBottom: 16,
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
  modalText: {
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    marginLeft: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default AnalyticsDashboard;
