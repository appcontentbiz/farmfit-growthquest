import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Text,
  useTheme,
  ActivityIndicator,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LineChart } from 'react-native-chart-kit';
import { useQuery, useMutation } from '@apollo/client';

import { GET_LIVESTOCK_OVERVIEW, UPDATE_HEALTH_CHECK } from '../../graphql/queries';
import { HealthStatusBadge } from '../../components/HealthStatusBadge';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { useRefreshOnFocus } from '../../hooks/useRefreshOnFocus';
import { formatDate, calculateHealthScore } from '../../utils/helpers';
import { THEME_COLORS } from '../../constants/theme';

const LivestockDashboard = () => {
  const navigation = useNavigation();
  const theme = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const { loading, error, data, refetch } = useQuery(GET_LIVESTOCK_OVERVIEW, {
    fetchPolicy: 'cache-and-network',
  });

  const [updateHealthCheck] = useMutation(UPDATE_HEALTH_CHECK);

  useRefreshOnFocus(refetch);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleHealthCheck = async (livestockId: string) => {
    try {
      await updateHealthCheck({
        variables: { livestockId, timestamp: new Date().toISOString() },
      });
      refetch();
    } catch (err) {
      console.error('Failed to update health check:', err);
    }
  };

  if (loading && !data) {
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
        <Text style={styles.errorText}>Failed to load livestock data</Text>
        <Button mode="contained" onPress={() => refetch()}>
          Retry
        </Button>
      </View>
    );
  }

  const { livestock, healthMetrics, alerts } = data?.livestockOverview || {};

  return (
    <ErrorBoundary>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Health Overview */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Health Overview</Title>
            <View style={styles.metricsContainer}>
              <View style={styles.metric}>
                <Icon name="heart-pulse" size={24} color={theme.colors.primary} />
                <Paragraph>Overall Health</Paragraph>
                <Text style={styles.metricValue}>
                  {calculateHealthScore(healthMetrics)}%
                </Text>
              </View>
              <View style={styles.metric}>
                <Icon name="alert" size={24} color={theme.colors.error} />
                <Paragraph>Active Alerts</Paragraph>
                <Text style={styles.metricValue}>{alerts?.length || 0}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Health Trends */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Health Trends</Title>
            <LineChart
              data={{
                labels: healthMetrics?.map(m => formatDate(m.date)) || [],
                datasets: [{
                  data: healthMetrics?.map(m => m.score) || []
                }]
              }}
              width={styles.chart.width}
              height={220}
              chartConfig={{
                backgroundColor: theme.colors.surface,
                backgroundGradientFrom: theme.colors.surface,
                backgroundGradientTo: theme.colors.surface,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
                style: {
                  borderRadius: 16,
                }
              }}
              style={styles.chart}
            />
          </Card.Content>
        </Card>

        {/* Livestock List */}
        {livestock?.map(animal => (
          <TouchableOpacity
            key={animal.id}
            onPress={() => navigation.navigate('LivestockDetail', { id: animal.id })}
          >
            <Card style={styles.livestockCard}>
              <Card.Content>
                <View style={styles.livestockHeader}>
                  <View>
                    <Title>{animal.name}</Title>
                    <Paragraph>{animal.breed}</Paragraph>
                  </View>
                  <HealthStatusBadge status={animal.healthStatus} />
                </View>
                <View style={styles.livestockDetails}>
                  <Text>Age: {animal.age}</Text>
                  <Text>Weight: {animal.weight}kg</Text>
                  <Text>Last Check: {formatDate(animal.lastCheckup)}</Text>
                </View>
                <Button
                  mode="outlined"
                  onPress={() => handleHealthCheck(animal.id)}
                  style={styles.checkButton}
                >
                  Perform Health Check
                </Button>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        ))}

        {/* Add Livestock Button */}
        <Button
          mode="contained"
          icon="plus"
          onPress={() => navigation.navigate('AddLivestock')}
          style={styles.addButton}
        >
          Add Livestock
        </Button>
      </ScrollView>
    </ErrorBoundary>
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
  card: {
    margin: 10,
    elevation: 4,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  metric: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 5,
  },
  chart: {
    width: '100%',
    marginVertical: 8,
    borderRadius: 16,
  },
  livestockCard: {
    margin: 10,
    elevation: 2,
  },
  livestockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  livestockDetails: {
    marginVertical: 10,
  },
  checkButton: {
    marginTop: 10,
  },
  addButton: {
    margin: 10,
    marginBottom: 20,
  },
});

export default LivestockDashboard;
