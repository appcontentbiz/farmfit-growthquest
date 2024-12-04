import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Card, Title, Text, useTheme } from 'react-native-paper';
import { LineChart } from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { HealthMetric } from '../../types/livestock';
import { formatHealthMetric } from '../../utils/livestock';

interface Props {
  metrics: HealthMetric[];
  title: string;
  metricKey: keyof HealthMetric;
  icon: string;
  unit: string;
  normalRange: { min: number; max: number };
}

const HealthMonitoringCard: React.FC<Props> = ({
  metrics,
  title,
  metricKey,
  icon,
  unit,
  normalRange,
}) => {
  const theme = useTheme();
  const latestValue = metrics[metrics.length - 1]?.[metricKey] as number;

  const isWithinRange = latestValue >= normalRange.min && latestValue <= normalRange.max;
  const statusColor = isWithinRange ? theme.colors.primary : theme.colors.error;

  const chartData = {
    labels: metrics.slice(-7).map(() => ''), // Show last 7 data points without labels
    datasets: [{
      data: metrics.slice(-7).map(m => m[metricKey] as number),
      color: (opacity = 1) => statusColor,
    }],
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Icon name={icon} size={24} color={statusColor} />
            <Title style={styles.title}>{title}</Title>
          </View>
          <Text style={[styles.value, { color: statusColor }]}>
            {formatHealthMetric(latestValue, metricKey)}
          </Text>
        </View>

        <LineChart
          data={chartData}
          width={Dimensions.get('window').width - 60}
          height={100}
          chartConfig={{
            backgroundColor: theme.colors.surface,
            backgroundGradientFrom: theme.colors.surface,
            backgroundGradientTo: theme.colors.surface,
            decimalPlaces: 1,
            color: (opacity = 1) => statusColor,
            labelColor: (opacity = 1) => theme.colors.text,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: '4',
              strokeWidth: '2',
              stroke: statusColor,
            },
          }}
          bezier
          style={styles.chart}
        />

        <View style={styles.rangeContainer}>
          <Text style={styles.rangeText}>
            Normal Range: {normalRange.min} - {normalRange.max} {unit}
          </Text>
          {!isWithinRange && (
            <Text style={[styles.alert, { color: theme.colors.error }]}>
              Outside normal range
            </Text>
          )}
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    marginLeft: 8,
    fontSize: 18,
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  rangeContainer: {
    marginTop: 8,
  },
  rangeText: {
    fontSize: 12,
    opacity: 0.7,
  },
  alert: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default HealthMonitoringCard;
