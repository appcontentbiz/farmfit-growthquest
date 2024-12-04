import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { Card, Title, Text, Button, useTheme, DataTable } from 'react-native-paper';
import { VictoryChart, VictoryLine, VictoryAxis, VictoryTooltip, VictoryVoronoiContainer } from 'victory-native';
import OptimizationService from '../services/OptimizationService';
import ABTestingService from '../services/ABTestingService';
import NotificationTemplateService from '../services/NotificationTemplateService';

interface DashboardMetrics {
  notificationStats: {
    deliveryRate: number;
    openRate: number;
    responseRate: number;
    actionRate: number;
  };
  templatePerformance: {
    templateId: string;
    name: string;
    performance: {
      openRate: number;
      responseRate: number;
      actionRate: number;
    };
  }[];
  abTestResults: {
    testId: string;
    name: string;
    status: string;
    improvement: number;
    confidence: number;
  }[];
  optimizations: {
    id: string;
    category: string;
    impact: string;
    suggestion: string;
    confidence: number;
  }[];
}

const PerformanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    notificationStats: {
      deliveryRate: 0,
      openRate: 0,
      responseRate: 0,
      actionRate: 0,
    },
    templatePerformance: [],
    abTestResults: [],
    optimizations: [],
  });

  const [selectedTimeRange, setSelectedTimeRange] = useState<'day' | 'week' | 'month'>('week');
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    loadDashboardData();
  }, [selectedTimeRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load optimization suggestions
      const optimizations = await OptimizationService.generateOptimizations();
      
      // Load template performance
      const templates = await NotificationTemplateService.getTemplatesByCategory('all');
      
      // Load A/B test results
      const activeTests = await loadActiveTests();

      setMetrics({
        notificationStats: await calculateNotificationStats(),
        templatePerformance: templates.map(template => ({
          templateId: template.id,
          name: template.name,
          performance: template.performance,
        })),
        abTestResults: activeTests,
        optimizations: optimizations.map(opt => ({
          id: opt.id,
          category: opt.category,
          impact: opt.impact,
          suggestion: opt.suggestion,
          confidence: opt.confidence,
        })),
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateNotificationStats = async () => {
    // Implementation would fetch and calculate actual stats
    return {
      deliveryRate: 0.95,
      openRate: 0.75,
      responseRate: 0.60,
      actionRate: 0.45,
    };
  };

  const loadActiveTests = async () => {
    // Implementation would fetch actual A/B test results
    return [];
  };

  const renderMetricsCards = () => (
    <ScrollView horizontal style={styles.metricsContainer}>
      <Card style={styles.metricCard}>
        <Card.Content>
          <Title>Delivery Rate</Title>
          <Text style={styles.metricValue}>{(metrics.notificationStats.deliveryRate * 100).toFixed(1)}%</Text>
        </Card.Content>
      </Card>
      <Card style={styles.metricCard}>
        <Card.Content>
          <Title>Open Rate</Title>
          <Text style={styles.metricValue}>{(metrics.notificationStats.openRate * 100).toFixed(1)}%</Text>
        </Card.Content>
      </Card>
      <Card style={styles.metricCard}>
        <Card.Content>
          <Title>Response Rate</Title>
          <Text style={styles.metricValue}>{(metrics.notificationStats.responseRate * 100).toFixed(1)}%</Text>
        </Card.Content>
      </Card>
      <Card style={styles.metricCard}>
        <Card.Content>
          <Title>Action Rate</Title>
          <Text style={styles.metricValue}>{(metrics.notificationStats.actionRate * 100).toFixed(1)}%</Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );

  const renderPerformanceChart = () => (
    <Card style={styles.chartCard}>
      <Card.Content>
        <Title>Performance Trends</Title>
        <VictoryChart
          height={250}
          containerComponent={<VictoryVoronoiContainer />}
        >
          <VictoryLine
            data={[
              { x: 1, y: metrics.notificationStats.deliveryRate },
              { x: 2, y: metrics.notificationStats.openRate },
              { x: 3, y: metrics.notificationStats.responseRate },
              { x: 4, y: metrics.notificationStats.actionRate },
            ]}
            style={{
              data: { stroke: theme.colors.primary },
            }}
            labelComponent={<VictoryTooltip />}
          />
          <VictoryAxis
            tickFormat={['Delivery', 'Open', 'Response', 'Action']}
            style={{
              tickLabels: { angle: -45, fontSize: 8 },
            }}
          />
          <VictoryAxis
            dependentAxis
            tickFormat={(t) => `${(t * 100).toFixed(0)}%`}
            style={{
              tickLabels: { fontSize: 8 },
            }}
          />
        </VictoryChart>
      </Card.Content>
    </Card>
  );

  const renderOptimizationSuggestions = () => (
    <Card style={styles.suggestionsCard}>
      <Card.Content>
        <Title>Optimization Suggestions</Title>
        <DataTable>
          <DataTable.Header>
            <DataTable.Title>Category</DataTable.Title>
            <DataTable.Title>Impact</DataTable.Title>
            <DataTable.Title>Confidence</DataTable.Title>
          </DataTable.Header>
          {metrics.optimizations.map((opt, index) => (
            <DataTable.Row key={opt.id}>
              <DataTable.Cell>{opt.category}</DataTable.Cell>
              <DataTable.Cell>{opt.impact}</DataTable.Cell>
              <DataTable.Cell>{(opt.confidence * 100).toFixed(0)}%</DataTable.Cell>
            </DataTable.Row>
          ))}
        </DataTable>
      </Card.Content>
    </Card>
  );

  const renderABTestResults = () => (
    <Card style={styles.abTestCard}>
      <Card.Content>
        <Title>A/B Test Results</Title>
        <DataTable>
          <DataTable.Header>
            <DataTable.Title>Test</DataTable.Title>
            <DataTable.Title numeric>Improvement</DataTable.Title>
            <DataTable.Title numeric>Confidence</DataTable.Title>
          </DataTable.Header>
          {metrics.abTestResults.map((test, index) => (
            <DataTable.Row key={test.testId}>
              <DataTable.Cell>{test.name}</DataTable.Cell>
              <DataTable.Cell numeric>{(test.improvement * 100).toFixed(1)}%</DataTable.Cell>
              <DataTable.Cell numeric>{(test.confidence * 100).toFixed(0)}%</DataTable.Cell>
            </DataTable.Row>
          ))}
        </DataTable>
      </Card.Content>
    </Card>
  );

  const renderTimeRangeSelector = () => (
    <View style={styles.timeRangeContainer}>
      <Button
        mode={selectedTimeRange === 'day' ? 'contained' : 'outlined'}
        onPress={() => setSelectedTimeRange('day')}
        style={styles.timeRangeButton}
      >
        Day
      </Button>
      <Button
        mode={selectedTimeRange === 'week' ? 'contained' : 'outlined'}
        onPress={() => setSelectedTimeRange('week')}
        style={styles.timeRangeButton}
      >
        Week
      </Button>
      <Button
        mode={selectedTimeRange === 'month' ? 'contained' : 'outlined'}
        onPress={() => setSelectedTimeRange('month')}
        style={styles.timeRangeButton}
      >
        Month
      </Button>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {renderTimeRangeSelector()}
      {renderMetricsCards()}
      {renderPerformanceChart()}
      {renderOptimizationSuggestions()}
      {renderABTestResults()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  timeRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
  },
  timeRangeButton: {
    marginHorizontal: 4,
  },
  metricsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  metricCard: {
    width: Dimensions.get('window').width * 0.4,
    marginRight: 16,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  chartCard: {
    margin: 16,
  },
  suggestionsCard: {
    margin: 16,
  },
  abTestCard: {
    margin: 16,
  },
});

export default PerformanceDashboard;
