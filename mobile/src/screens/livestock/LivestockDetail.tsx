import React, { useCallback, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {
  useTheme,
  Text,
  FAB,
  Portal,
  Dialog,
  Button,
  ActivityIndicator,
  Snackbar,
} from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery, useMutation } from '@apollo/client';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import {
  GET_LIVESTOCK_DETAIL,
  ADD_HEALTH_RECORD,
  ADD_VACCINATION,
  UPDATE_NUTRITION_PLAN,
} from '../../graphql/queries';
import HealthMonitoringCard from '../../components/livestock/HealthMonitoringCard';
import VaccinationCard from '../../components/livestock/VaccinationCard';
import NutritionCard from '../../components/livestock/NutritionCard';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { useRefreshOnFocus } from '../../hooks/useRefreshOnFocus';
import { calculateHealthScore } from '../../utils/livestock';

const LivestockDetail = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = route.params;

  const [refreshing, setRefreshing] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [fabOpen, setFabOpen] = useState(false);

  const { loading, error, data, refetch } = useQuery(GET_LIVESTOCK_DETAIL, {
    variables: { id },
    fetchPolicy: 'cache-and-network',
  });

  const [addHealthRecord] = useMutation(ADD_HEALTH_RECORD);
  const [addVaccination] = useMutation(ADD_VACCINATION);
  const [updateNutritionPlan] = useMutation(UPDATE_NUTRITION_PLAN);

  useRefreshOnFocus(refetch);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const handleAddHealthRecord = () => {
    navigation.navigate('AddHealthRecord', { livestockId: id });
  };

  const handleAddVaccination = () => {
    navigation.navigate('AddVaccination', { livestockId: id });
  };

  const handleEditNutrition = () => {
    navigation.navigate('EditNutrition', {
      livestockId: id,
      currentPlan: data?.livestock.nutritionPlan,
    });
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
        <Text style={styles.errorText}>Failed to load livestock details</Text>
        <Button mode="contained" onPress={() => refetch()}>
          Retry
        </Button>
      </View>
    );
  }

  const { livestock } = data;
  const healthScore = calculateHealthScore(livestock.metrics);

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Basic Info */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.name}>{livestock.name}</Text>
              <Text style={styles.breed}>{livestock.breed}</Text>
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Age</Text>
                  <Text style={styles.statValue}>{livestock.age} months</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Weight</Text>
                  <Text style={styles.statValue}>{livestock.weight} kg</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Health</Text>
                  <Text style={[
                    styles.statValue,
                    { color: healthScore >= 80 ? theme.colors.primary : theme.colors.error }
                  ]}>
                    {healthScore}%
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Health Monitoring */}
          <HealthMonitoringCard
            metrics={livestock.metrics}
            title="Temperature"
            metricKey="temperature"
            icon="thermometer"
            unit="°C"
            normalRange={{ min: 38.0, max: 39.5 }}
          />

          <HealthMonitoringCard
            metrics={livestock.metrics}
            title="Heart Rate"
            metricKey="heartRate"
            icon="heart-pulse"
            unit="bpm"
            normalRange={{ min: 60, max: 80 }}
          />

          <HealthMonitoringCard
            metrics={livestock.metrics}
            title="Respiration"
            metricKey="respirationRate"
            icon="lungs"
            unit="/min"
            normalRange={{ min: 12, max: 24 }}
          />

          {/* Vaccinations */}
          <VaccinationCard
            vaccinations={livestock.vaccinations}
            onAddVaccination={handleAddVaccination}
          />

          {/* Nutrition */}
          <NutritionCard
            nutritionPlan={livestock.nutritionPlan}
            recentMetrics={livestock.metrics.slice(-7)}
            onEditPlan={handleEditNutrition}
          />
        </ScrollView>

        {/* FAB Menu */}
        <Portal>
          <FAB.Group
            open={fabOpen}
            icon={fabOpen ? 'close' : 'plus'}
            actions={[
              {
                icon: 'clipboard-pulse',
                label: 'Add Health Record',
                onPress: handleAddHealthRecord,
              },
              {
                icon: 'needle',
                label: 'Add Vaccination',
                onPress: handleAddVaccination,
              },
              {
                icon: 'food',
                label: 'Edit Nutrition Plan',
                onPress: handleEditNutrition,
              },
            ]}
            onStateChange={({ open }) => setFabOpen(open)}
            fabStyle={styles.fab}
          />
        </Portal>

        {/* Snackbar */}
        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000}
          action={{
            label: 'Dismiss',
            onPress: () => setSnackbarVisible(false),
          }}
        >
          {snackbarMessage}
        </Snackbar>
      </View>
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
  header: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
    elevation: 4,
  },
  headerContent: {
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  breed: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  fab: {
    marginBottom: 16,
  },
});

export default LivestockDetail;
