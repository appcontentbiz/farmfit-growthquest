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
} from 'react-native-paper';
import { useQuery } from '@apollo/client';
import { LineChart, BarChart } from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';

import { GET_HEALTH_ANALYTICS } from '../../graphql/queries';
import { HealthAnalytics } from '../../types/livestock';
import { formatHealthMetric } from '../../utils/livestock';

const CHART_CONFIG = {
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
  strokeWidth: 2,
  barPercentage: 0.5,
  useShadowColorFromDataset: false,
};

const Analytics = () => {
  const theme = useTheme();
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  ); // 30 days ago
  const [endDate, setEndDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerType, setDatePickerType] = useState<'start' | 'end'>('start');
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const { loading, error, data, refetch } = useQuery(GET_HEALTH_ANALYTICS, {
    variables: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    },
    fetchPolicy: 'network-only',
  });

  const handleDateSelect = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      if (datePickerType === 'start') {
        setStartDate(selectedDate);
      } else {
        setEndDate(selectedDate);
      }
      refetch();
    }
  };

  const renderTrendIcon = (trend: 'UP' | 'DOWN' | 'STABLE') => {
    switch (trend) {
      case 'UP':
        return <Icon name="trending-up" size={24} color={theme.colors.primary} />;
      case 'DOWN':
        return <Icon name="trending-down" size={24} color={theme.colors.error} />;
      case 'STABLE':
        return (
          <Icon name="trending-neutral" size={24} color={theme.colors.primary} />
        );
    }
  };

  const renderMetricChart = (analytics: HealthAnalytics) => {
    const metrics = analytics.dailyMetrics;
    if (!metrics.length) return null;

    const chartData = {
      labels: metrics.map((m) =>
        new Date(m.date).toLocaleDateString(undefined, { day: '2-digit' })
      ),
      datasets: [
        {
          data: metrics.map((m) => m.score),
          color: (opacity = 1) => theme.colors.primary,
        },
      ],
    };

    return (
      <LineChart
        data={chartData}
        width={Dimensions.get('window').width - 32}
        height={220}
        chartConfig={CHART_CONFIG}
        bezier
        style={styles.chart}
      />
    );
  };

  const renderPredictions = (analytics: HealthAnalytics) => {
    if (!analytics.predictions.length) return null;

    const chartData = {
      labels: analytics.predictions.map((_, index) => `Day ${index + 1}`),
      datasets: [
        {
          data: analytics.predictions.map((p) => p.value),
        },
      ],
    };

    return (
      <Card style={styles.card}>
        <Card.Content>
          <Title>Predictions</Title>
          <LineChart
            data={chartData}
            width={Dimensions.get('window').width - 64}
            height={180}
            chartConfig={CHART_CONFIG}
            bezier
            style={styles.chart}
          />
          {analytics.predictions.map((prediction, index) => (
            <View key={index} style={styles.predictionItem}>
              <Text>
                {prediction.metric}: {prediction.value.toFixed(1)}
              </Text>
              <Text style={styles.confidence}>
                Confidence: {(prediction.confidence * 100).toFixed(0)}%
              </Text>
            </View>
          ))}
        </Card.Content>
      </Card>
    );
  };

  const renderAnomalies = (analytics: HealthAnalytics) => {
    if (!analytics.anomalies.length) return null;

    return (
      <Card style={styles.card}>
        <Card.Content>
          <Title>Detected Anomalies</Title>
          {analytics.anomalies.map((anomaly, index) => (
            <View key={index} style={styles.anomalyItem}>
              <Icon
                name="alert-circle"
                size={24}
                color={
                  anomaly.severity === 'CRITICAL'
                    ? theme.colors.error
                    : theme.colors.warning
                }
              />
              <View style={styles.anomalyContent}>
                <Text style={styles.anomalyMetric}>{anomaly.metric}</Text>
                <Text style={styles.anomalyDescription}>
                  {anomaly.description}
                </Text>
                <Text style={styles.anomalyDate}>
                  {new Date(anomaly.date).toLocaleDateString()}
                </Text>
              </View>
            </View>
          ))}
        </Card.Content>
      </Card>
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
        <Text style={styles.errorText}>Failed to load analytics data</Text>
        <Button mode="contained" onPress={() => refetch()}>
          Retry
        </Button>
      </View>
    );
  }

  const analytics: HealthAnalytics = data?.healthAnalytics;

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Date Range Selection */}
        <View style={styles.dateContainer}>
          <Button
            mode="outlined"
            onPress={() => {
              setDatePickerType('start');
              setShowDatePicker(true);
            }}
          >
            {startDate.toLocaleDateString()}
          </Button>
          <Text>to</Text>
          <Button
            mode="outlined"
            onPress={() => {
              setDatePickerType('end');
              setShowDatePicker(true);
            }}
          >
            {endDate.toLocaleDateString()}
          </Button>
        </View>

        {/* Overview Chart */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Health Score Trend</Title>
            {renderMetricChart(analytics)}
          </Card.Content>
        </Card>

        {/* Trends */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Trends</Title>
            {analytics.trends.map((trend, index) => (
              <View key={index} style={styles.trendItem}>
                {renderTrendIcon(trend.trend)}
                <View style={styles.trendContent}>
                  <Text style={styles.trendMetric}>{trend.metric}</Text>
                  <Text style={styles.trendChange}>
                    {trend.change > 0 ? '+' : ''}
                    {trend.change.toFixed(1)}%
                  </Text>
                  {trend.recommendation && (
                    <Text style={styles.recommendation}>
                      {trend.recommendation}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Predictions */}
        {renderPredictions(analytics)}

        {/* Anomalies */}
        {renderAnomalies(analytics)}
      </ScrollView>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={datePickerType === 'start' ? startDate : endDate}
          mode="date"
          display="default"
          onChange={handleDateSelect}
          maximumDate={new Date()}
        />
      )}

      {/* Metric Detail Modal */}
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modalContent}
        >
          {selectedMetric && (
            <View>
              <Title>{selectedMetric}</Title>
              {/* Add detailed metric analysis here */}
            </View>
          )}
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
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    margin: 16,
    elevation: 4,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  trendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  trendContent: {
    marginLeft: 16,
    flex: 1,
  },
  trendMetric: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  trendChange: {
    fontSize: 14,
    opacity: 0.7,
  },
  recommendation: {
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 4,
  },
  predictionItem: {
    marginVertical: 8,
  },
  confidence: {
    fontSize: 12,
    opacity: 0.7,
  },
  anomalyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 8,
  },
  anomalyContent: {
    marginLeft: 16,
    flex: 1,
  },
  anomalyMetric: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  anomalyDescription: {
    fontSize: 14,
    marginTop: 4,
  },
  anomalyDate: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
});

export default Analytics;
