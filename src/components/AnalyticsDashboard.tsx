import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Dimensions } from 'react-native';
import { Card, Text, Button, Icon } from 'react-native-elements';
import { LineChart, BarChart, PieChart } from 'react-native-charts-wrapper';

interface CropYield {
  crop: string;
  yield: number;
  target: number;
  variance: number;
}

interface ResourceUsage {
  resource: string;
  used: number;
  total: number;
  unit: string;
}

interface WeatherData {
  timestamp: number;
  temperature: number;
  humidity: number;
  rainfall: number;
}

const cropYields: CropYield[] = [
  { crop: 'Tomatoes', yield: 85, target: 90, variance: -5 },
  { crop: 'Wheat', yield: 92, target: 85, variance: 7 },
  { crop: 'Corn', yield: 78, target: 80, variance: -2 }
];

const resourceUsage: ResourceUsage[] = [
  { resource: 'Water', used: 850, total: 1000, unit: 'gallons' },
  { resource: 'Fertilizer', used: 45, total: 50, unit: 'kg' },
  { resource: 'Energy', used: 750, total: 1000, unit: 'kWh' }
];

export const AnalyticsDashboard: React.FC = () => {
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<'yield' | 'resources' | 'weather'>('yield');

  useEffect(() => {
    generateWeatherData();
  }, []);

  const generateWeatherData = () => {
    const data: WeatherData[] = [];
    for (let i = 0; i < 24; i++) {
      data.push({
        timestamp: Date.now() - (23 - i) * 60 * 60 * 1000,
        temperature: 20 + Math.sin(i / 4) * 5 + Math.random() * 2,
        humidity: 60 + Math.sin(i / 6) * 15 + Math.random() * 5,
        rainfall: Math.max(0, Math.sin(i / 8) * 5 + Math.random() * 2)
      });
    }
    setWeatherData(data);
  };

  const renderYieldAnalysis = () => (
    <Card containerStyle={styles.card}>
      <Card.Title>Crop Yield Analysis</Card.Title>
      <View style={styles.chartContainer}>
        <BarChart
          style={styles.chart}
          data={{
            dataSets: [{
              values: cropYields.map(crop => ({
                y: [crop.yield, crop.target]
              })),
              label: 'Yield vs Target',
            }],
            config: {
              barWidth: 0.7,
              group: {
                fromX: 0,
                groupSpace: 0.2,
                barSpace: 0.1
              }
            }
          }}
          xAxis={{
            valueFormatter: cropYields.map(crop => crop.crop),
            granularityEnabled: true,
            granularity: 1,
            position: 'BOTTOM'
          }}
          legend={{
            enabled: true,
            textSize: 14,
            form: 'SQUARE',
            formSize: 14,
            xEntrySpace: 10,
            yEntrySpace: 5,
            formToTextSpace: 5
          }}
        />
      </View>
    </Card>
  );

  const renderResourceUsage = () => (
    <Card containerStyle={styles.card}>
      <Card.Title>Resource Utilization</Card.Title>
      <View style={styles.chartContainer}>
        <PieChart
          style={styles.chart}
          data={{
            dataSets: [{
              values: resourceUsage.map(resource => ({
                value: (resource.used / resource.total) * 100,
                label: resource.resource
              })),
              label: 'Resources',
              config: {
                colors: ['#2196F3', '#4CAF50', '#FFC107'],
                valueTextSize: 14,
                valueTextColor: '#000000',
                sliceSpace: 5,
                selectionShift: 15
              }
            }]
          }}
          legend={{
            enabled: true,
            textSize: 14,
            form: 'CIRCLE',
            horizontalAlignment: 'RIGHT',
            verticalAlignment: 'CENTER',
            orientation: 'VERTICAL',
            wordWrapEnabled: true
          }}
          highlights={[]}
        />
      </View>
      <View style={styles.resourceList}>
        {resourceUsage.map((resource, index) => (
          <View key={index} style={styles.resourceItem}>
            <Text style={styles.resourceName}>{resource.resource}</Text>
            <View style={styles.resourceBar}>
              <View 
                style={[
                  styles.resourceFill,
                  { width: `${(resource.used / resource.total) * 100}%` }
                ]} 
              />
            </View>
            <Text style={styles.resourceText}>
              {resource.used}/{resource.total} {resource.unit}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );

  const renderWeatherAnalysis = () => (
    <Card containerStyle={styles.card}>
      <Card.Title>Weather Patterns</Card.Title>
      <View style={styles.chartContainer}>
        <LineChart
          style={styles.chart}
          data={{
            dataSets: [
              {
                values: weatherData.map(data => ({
                  x: data.timestamp,
                  y: data.temperature
                })),
                label: 'Temperature (°C)',
              },
              {
                values: weatherData.map(data => ({
                  x: data.timestamp,
                  y: data.humidity
                })),
                label: 'Humidity (%)',
              },
              {
                values: weatherData.map(data => ({
                  x: data.timestamp,
                  y: data.rainfall
                })),
                label: 'Rainfall (mm)',
              }
            ]
          }}
          xAxis={{
            valueFormatter: 'date',
            granularityEnabled: true,
            granularity: 1,
          }}
          legend={{
            enabled: true,
            textSize: 14,
            form: 'LINE',
            wordWrapEnabled: true
          }}
        />
      </View>
    </Card>
  );

  const renderAIInsights = () => (
    <Card containerStyle={styles.card}>
      <Card.Title>AI-Powered Insights</Card.Title>
      <View style={styles.insightContainer}>
        {cropYields.map((crop, index) => (
          <View key={index} style={styles.insight}>
            <Icon
              name={crop.variance >= 0 ? 'trending-up' : 'trending-down'}
              type="material"
              color={crop.variance >= 0 ? '#4CAF50' : '#F44336'}
              size={24}
            />
            <View style={styles.insightText}>
              <Text style={styles.insightTitle}>{crop.crop}</Text>
              <Text style={styles.insightDetail}>
                {crop.variance >= 0 ? 'Exceeding' : 'Below'} target by {Math.abs(crop.variance)}%
              </Text>
            </View>
          </View>
        ))}
      </View>
    </Card>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.metricButtons}>
        <Button
          title="Yield"
          type={selectedMetric === 'yield' ? 'solid' : 'outline'}
          onPress={() => setSelectedMetric('yield')}
          containerStyle={styles.metricButton}
        />
        <Button
          title="Resources"
          type={selectedMetric === 'resources' ? 'solid' : 'outline'}
          onPress={() => setSelectedMetric('resources')}
          containerStyle={styles.metricButton}
        />
        <Button
          title="Weather"
          type={selectedMetric === 'weather' ? 'solid' : 'outline'}
          onPress={() => setSelectedMetric('weather')}
          containerStyle={styles.metricButton}
        />
      </View>
      {selectedMetric === 'yield' && renderYieldAnalysis()}
      {selectedMetric === 'resources' && renderResourceUsage()}
      {selectedMetric === 'weather' && renderWeatherAnalysis()}
      {renderAIInsights()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  metricButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  metricButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  card: {
    borderRadius: 10,
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 4,
  },
  chartContainer: {
    height: 300,
    marginVertical: 8,
  },
  chart: {
    flex: 1,
  },
  resourceList: {
    marginTop: 16,
  },
  resourceItem: {
    marginVertical: 8,
  },
  resourceName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  resourceBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  resourceFill: {
    height: '100%',
    backgroundColor: '#2196F3',
  },
  resourceText: {
    fontSize: 14,
    color: '#757575',
    marginTop: 4,
  },
  insightContainer: {
    marginVertical: 8,
  },
  insight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  insightText: {
    marginLeft: 16,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  insightDetail: {
    fontSize: 14,
    color: '#757575',
  },
});
