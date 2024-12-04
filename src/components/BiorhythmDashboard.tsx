import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Card, Text, Button, Icon } from 'react-native-elements';
import { LineChart } from 'react-native-charts-wrapper';

interface BiorhythmData {
  timestamp: number;
  stressLevel: number;
  growthRate: number;
  circadianPhase: number;
}

export const BiorhythmDashboard: React.FC = () => {
  const [data, setData] = useState<BiorhythmData[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<string>('stressLevel');

  useEffect(() => {
    // Simulate real-time data updates
    const interval = setInterval(() => {
      updateBiorhythmData();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const updateBiorhythmData = () => {
    // Simulate new data point
    const newDataPoint: BiorhythmData = {
      timestamp: Date.now(),
      stressLevel: Math.random() * 100,
      growthRate: Math.random() * 5,
      circadianPhase: Math.sin(Date.now() / 86400000 * Math.PI * 2) * 50 + 50,
    };

    setData(prevData => [...prevData.slice(-24), newDataPoint]);
  };

  return (
    <ScrollView style={styles.container}>
      <Card containerStyle={styles.card}>
        <Card.Title>Biorhythm Monitor</Card.Title>
        <View style={styles.chartContainer}>
          <LineChart
            style={styles.chart}
            data={{
              dataSets: [{
                values: data.map(d => ({
                  x: d.timestamp,
                  y: d[selectedMetric as keyof BiorhythmData] as number
                })),
                label: selectedMetric,
              }],
            }}
            xAxis={{
              valueFormatter: 'date',
              granularityEnabled: true,
              granularity: 1,
            }}
          />
        </View>
        <View style={styles.metricButtons}>
          <Button
            title="Stress Level"
            type={selectedMetric === 'stressLevel' ? 'solid' : 'outline'}
            onPress={() => setSelectedMetric('stressLevel')}
            containerStyle={styles.button}
          />
          <Button
            title="Growth Rate"
            type={selectedMetric === 'growthRate' ? 'solid' : 'outline'}
            onPress={() => setSelectedMetric('growthRate')}
            containerStyle={styles.button}
          />
          <Button
            title="Circadian Phase"
            type={selectedMetric === 'circadianPhase' ? 'solid' : 'outline'}
            onPress={() => setSelectedMetric('circadianPhase')}
            containerStyle={styles.button}
          />
        </View>
      </Card>

      <Card containerStyle={styles.card}>
        <Card.Title>Current Readings</Card.Title>
        <View style={styles.readings}>
          <View style={styles.readingItem}>
            <Icon name="trending-up" type="material" color="#4CAF50" />
            <Text style={styles.readingLabel}>Stress Level</Text>
            <Text style={styles.readingValue}>
              {data.length > 0 ? `${data[data.length - 1].stressLevel.toFixed(1)}%` : '-'}
            </Text>
          </View>
          <View style={styles.readingItem}>
            <Icon name="speed" type="material" color="#2196F3" />
            <Text style={styles.readingLabel}>Growth Rate</Text>
            <Text style={styles.readingValue}>
              {data.length > 0 ? `${data[data.length - 1].growthRate.toFixed(2)} cm/day` : '-'}
            </Text>
          </View>
          <View style={styles.readingItem}>
            <Icon name="brightness-2" type="material" color="#9C27B0" />
            <Text style={styles.readingLabel}>Circadian Phase</Text>
            <Text style={styles.readingValue}>
              {data.length > 0 ? `${data[data.length - 1].circadianPhase.toFixed(1)}°` : '-'}
            </Text>
          </View>
        </View>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  card: {
    borderRadius: 10,
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 4,
  },
  chartContainer: {
    height: 300,
    padding: 8,
  },
  chart: {
    flex: 1,
  },
  metricButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
  readings: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  readingItem: {
    alignItems: 'center',
    flex: 1,
  },
  readingLabel: {
    fontSize: 12,
    color: '#757575',
    marginTop: 4,
  },
  readingValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
    marginTop: 4,
  },
});
