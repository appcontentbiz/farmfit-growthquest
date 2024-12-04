import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const screenWidth = Dimensions.get('window').width;

const IoTDashboardScreen = () => {
  const [sensorData, setSensorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSensor, setSelectedSensor] = useState('soil_moisture');

  // Mock sensor data - In a real app, this would come from your IoT devices
  const mockSensorData = {
    soil_moisture: {
      current: 65,
      unit: '%',
      status: 'optimal',
      history: {
        labels: ['6h', '5h', '4h', '3h', '2h', '1h'],
        data: [62, 63, 65, 64, 65, 65],
      },
    },
    temperature: {
      current: 22,
      unit: '°C',
      status: 'normal',
      history: {
        labels: ['6h', '5h', '4h', '3h', '2h', '1h'],
        data: [21, 21.5, 22, 22.5, 22, 22],
      },
    },
    humidity: {
      current: 75,
      unit: '%',
      status: 'high',
      history: {
        labels: ['6h', '5h', '4h', '3h', '2h', '1h'],
        data: [70, 72, 73, 74, 75, 75],
      },
    },
    light: {
      current: 850,
      unit: 'lux',
      status: 'optimal',
      history: {
        labels: ['6h', '5h', '4h', '3h', '2h', '1h'],
        data: [800, 820, 840, 845, 848, 850],
      },
    },
  };

  const fetchSensorData = async () => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSensorData(mockSensorData);
      setError(null);
    } catch (err) {
      setError('Error fetching sensor data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSensorData();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchSensorData();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'optimal':
        return '#4CAF50';
      case 'normal':
        return '#2196F3';
      case 'high':
        return '#FF9800';
      case 'low':
        return '#f44336';
      default:
        return '#757575';
    }
  };

  const renderSensorCard = (type, data) => {
    const isSelected = selectedSensor === type;
    return (
      <TouchableOpacity
        style={[styles.sensorCard, isSelected && styles.selectedCard]}
        onPress={() => setSelectedSensor(type)}
      >
        <View style={styles.sensorHeader}>
          <Text style={styles.sensorTitle}>
            {type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
          </Text>
          <View
            style={[
              styles.statusIndicator,
              { backgroundColor: getStatusColor(data.status) },
            ]}
          />
        </View>
        <Text style={styles.sensorValue}>
          {data.current}
          <Text style={styles.sensorUnit}>{data.unit}</Text>
        </Text>
        <Text style={[styles.statusText, { color: getStatusColor(data.status) }]}>
          {data.status.toUpperCase()}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderChart = () => {
    const data = sensorData[selectedSensor];
    return (
      <LineChart
        data={{
          labels: data.history.labels,
          datasets: [
            {
              data: data.history.data,
            },
          ],
        }}
        width={screenWidth - 40}
        height={220}
        chartConfig={{
          backgroundColor: '#ffffff',
          backgroundGradientFrom: '#ffffff',
          backgroundGradientTo: '#ffffff',
          decimalPlaces: 1,
          color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
          style: {
            borderRadius: 16,
          },
        }}
        style={{
          marginVertical: 8,
          borderRadius: 16,
        }}
        bezier
      />
    );
  };

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.sensorGrid}>
        {sensorData &&
          Object.entries(sensorData).map(([type, data]) =>
            renderSensorCard(type, data)
          )}
      </View>

      {sensorData && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>6 Hour History</Text>
          {renderChart()}
        </View>
      )}

      <View style={styles.recommendationsContainer}>
        <Text style={styles.recommendationsTitle}>
          <Ionicons name="bulb-outline" size={24} color="#4CAF50" /> Recommendations
        </Text>
        <Text style={styles.recommendationText}>
          • Soil moisture levels are optimal for current crops
        </Text>
        <Text style={styles.recommendationText}>
          • Consider increasing ventilation due to high humidity
        </Text>
        <Text style={styles.recommendationText}>
          • Light levels are perfect for photosynthesis
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sensorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    justifyContent: 'space-between',
  },
  sensorCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
  },
  selectedCard: {
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  sensorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sensorTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  sensorValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  sensorUnit: {
    fontSize: 16,
    fontWeight: 'normal',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  chartContainer: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  recommendationsContainer: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
  },
  recommendationsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  recommendationText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
    lineHeight: 24,
  },
  errorText: {
    color: '#f44336',
    fontSize: 16,
  },
});

export default IoTDashboardScreen;
