import React, { useState, useEffect, useMemo } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import {
  Card,
  Text,
  useTheme,
  Button,
  Chip,
  DataTable,
  Portal,
  Modal,
  IconButton,
} from 'react-native-paper';
import {
  VictoryChart,
  VictoryLine,
  VictoryBar,
  VictoryAxis,
  VictoryLegend,
  VictoryTooltip,
  VictoryVoronoiContainer,
  VictoryTheme,
} from 'victory-native';
import { format, subDays, subMonths, startOfDay, endOfDay } from 'date-fns';
import AnalyticsService from '../../services/AnalyticsService';
import AnimatedNumber from '../AnimatedNumber';

interface TimeRange {
  start: Date;
  end: Date;
  label: string;
}

interface ComparisonMetric {
  name: string;
  current: number;
  previous: number;
  trend: 'up' | 'down' | 'stable';
  percentageChange: number;
}

interface ComparisonData {
  metrics: ComparisonMetric[];
  trends: {
    dates: string[];
    currentValues: number[];
    previousValues: number[];
  };
}

const ComparativeAnalysis: React.FC = () => {
  const theme = useTheme();
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>({
    start: subDays(new Date(), 7),
    end: new Date(),
    label: '7 Days',
  });
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const timeRanges: TimeRange[] = useMemo(
    () => [
      {
        start: subDays(new Date(), 7),
        end: new Date(),
        label: '7 Days',
      },
      {
        start: subDays(new Date(), 30),
        end: new Date(),
        label: '30 Days',
      },
      {
        start: subMonths(new Date(), 3),
        end: new Date(),
        label: '3 Months',
      },
    ],
    []
  );

  useEffect(() => {
    loadComparisonData();
  }, [selectedTimeRange, selectedCategories]);

  const loadComparisonData = async () => {
    try {
      setLoading(true);
      const currentPeriod = {
        start: selectedTimeRange.start,
        end: selectedTimeRange.end,
      };

      const previousPeriod = {
        start: subDays(selectedTimeRange.start, getDaysDifference(selectedTimeRange)),
        end: subDays(selectedTimeRange.end, getDaysDifference(selectedTimeRange)),
      };

      const [currentMetrics, previousMetrics] = await Promise.all([
        AnalyticsService.getPerformanceMetrics(true),
        AnalyticsService.getPerformanceMetrics(true),
      ]);

      const comparisonMetrics = calculateComparisonMetrics(
        currentMetrics,
        previousMetrics,
        selectedCategories
      );

      const trendData = await calculateTrendData(
        currentPeriod,
        previousPeriod,
        selectedCategories
      );

      setComparisonData({
        metrics: comparisonMetrics,
        trends: trendData,
      });
    } catch (error) {
      console.error('Error loading comparison data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysDifference = (range: TimeRange): number => {
    return Math.ceil(
      (range.end.getTime() - range.start.getTime()) / (1000 * 60 * 60 * 24)
    );
  };

  const calculateComparisonMetrics = (
    current: any,
    previous: any,
    categories: string[]
  ): ComparisonMetric[] => {
    const metrics: ComparisonMetric[] = [];

    // Overall Success Rate
    const currentSuccess = categories.length
      ? calculateCategoryAverage(current.byCategory, categories, 'successRate')
      : current.overall.successRate;
    const previousSuccess = categories.length
      ? calculateCategoryAverage(previous.byCategory, categories, 'successRate')
      : previous.overall.successRate;

    metrics.push(createComparisonMetric(
      'Success Rate',
      currentSuccess,
      previousSuccess
    ));

    // Completion Rate
    const currentCompletion = categories.length
      ? calculateCategoryAverage(current.byCategory, categories, 'completionRate')
      : current.overall.completionRate;
    const previousCompletion = categories.length
      ? calculateCategoryAverage(previous.byCategory, categories, 'completionRate')
      : previous.overall.completionRate;

    metrics.push(createComparisonMetric(
      'Completion Rate',
      currentCompletion,
      previousCompletion
    ));

    // Response Time
    const currentResponse = categories.length
      ? calculateCategoryAverage(current.byCategory, categories, 'averageResponseTime')
      : current.overall.averageResponseTime;
    const previousResponse = categories.length
      ? calculateCategoryAverage(previous.byCategory, categories, 'averageResponseTime')
      : previous.overall.averageResponseTime;

    metrics.push(createComparisonMetric(
      'Response Time',
      currentResponse,
      previousResponse
    ));

    // Prediction Accuracy
    metrics.push(createComparisonMetric(
      'Prediction Accuracy',
      current.overall.predictionAccuracy,
      previous.overall.predictionAccuracy
    ));

    return metrics;
  };

  const calculateCategoryAverage = (
    categoryData: any,
    categories: string[],
    metric: string
  ): number => {
    const values = categories.map(cat => categoryData[cat]?.[metric] || 0);
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  };

  const createComparisonMetric = (
    name: string,
    current: number,
    previous: number
  ): ComparisonMetric => {
    const percentageChange = ((current - previous) / previous) * 100;
    return {
      name,
      current,
      previous,
      trend: percentageChange > 0 ? 'up' : percentageChange < 0 ? 'down' : 'stable',
      percentageChange,
    };
  };

  const calculateTrendData = async (
    currentPeriod: any,
    previousPeriod: any,
    categories: string[]
  ) => {
    // Implementation for trend data calculation
    // This would involve processing historical data for the selected periods
    return {
      dates: [],
      currentValues: [],
      previousValues: [],
    };
  };

  const renderMetricComparison = (metric: ComparisonMetric) => (
    <Card style={styles.metricCard} key={metric.name}>
      <Card.Content>
        <Text style={styles.metricTitle}>{metric.name}</Text>
        <View style={styles.metricContent}>
          <View style={styles.metricValues}>
            <AnimatedNumber
              value={metric.current}
              style={styles.currentValue}
              suffix="%"
            />
            <Text style={styles.previousValue}>
              Previous: {metric.previous.toFixed(1)}%
            </Text>
          </View>
          <View style={styles.changeIndicator}>
            <IconButton
              icon={metric.trend === 'up' ? 'arrow-up' : 'arrow-down'}
              iconColor={metric.trend === 'up' ? theme.colors.success : theme.colors.error}
              size={24}
            />
            <Text
              style={[
                styles.changeValue,
                {
                  color:
                    metric.trend === 'up'
                      ? theme.colors.success
                      : theme.colors.error,
                },
              ]}
            >
              {Math.abs(metric.percentageChange).toFixed(1)}%
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderTrendChart = () => {
    if (!comparisonData?.trends) return null;

    return (
      <Card style={styles.chartCard}>
        <Card.Title title="Performance Trend Comparison" />
        <Card.Content>
          <VictoryChart
            theme={VictoryTheme.material}
            height={300}
            containerComponent={
              <VictoryVoronoiContainer
                labels={({ datum }) =>
                  `${format(new Date(datum.x), 'PP')}\n${datum.y.toFixed(1)}%`
                }
                labelComponent={<VictoryTooltip />}
              />
            }
          >
            <VictoryLegend
              x={50}
              y={0}
              orientation="horizontal"
              data={[
                { name: 'Current Period', symbol: { fill: theme.colors.primary } },
                { name: 'Previous Period', symbol: { fill: theme.colors.secondary } },
              ]}
            />
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
              data={comparisonData.trends.dates.map((date, i) => ({
                x: date,
                y: comparisonData.trends.currentValues[i],
              }))}
              style={{
                data: { stroke: theme.colors.primary },
              }}
            />
            <VictoryLine
              data={comparisonData.trends.dates.map((date, i) => ({
                x: date,
                y: comparisonData.trends.previousValues[i],
              }))}
              style={{
                data: { stroke: theme.colors.secondary, strokeDasharray: '4,4' },
              }}
            />
          </VictoryChart>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Comparative Analysis</Text>
          <View style={styles.timeRangeContainer}>
            {timeRanges.map((range) => (
              <Chip
                key={range.label}
                selected={range.label === selectedTimeRange.label}
                onPress={() => setSelectedTimeRange(range)}
                style={styles.timeRangeChip}
              >
                {range.label}
              </Chip>
            ))}
          </View>
          <Button
            mode="outlined"
            onPress={() => setModalVisible(true)}
            style={styles.categoryButton}
          >
            Select Categories
          </Button>
        </View>

        {comparisonData?.metrics.map(renderMetricComparison)}
        {renderTrendChart()}
      </ScrollView>

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Text style={styles.modalTitle}>Select Categories</Text>
          <View style={styles.categoryList}>
            {/* Implement category selection UI */}
          </View>
          <Button mode="contained" onPress={() => setModalVisible(false)}>
            Apply
          </Button>
        </Modal>
      </Portal>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  timeRangeChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  categoryButton: {
    marginTop: 8,
  },
  metricCard: {
    margin: 8,
  },
  metricTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  metricContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricValues: {
    flex: 1,
  },
  currentValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  previousValue: {
    fontSize: 12,
    opacity: 0.7,
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  chartCard: {
    margin: 8,
    marginTop: 16,
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
  categoryList: {
    marginVertical: 16,
  },
});

export default ComparativeAnalysis;
