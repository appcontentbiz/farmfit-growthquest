import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import {
  Title,
  Card,
  Text,
  Button,
  useTheme,
  ActivityIndicator,
  Chip,
  FAB,
  Searchbar,
  List,
  IconButton,
  Portal,
  Dialog,
} from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useQuery } from '@apollo/client';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { GET_THERAPEUTIC_OVERVIEW } from '../../graphql/queries';
import { formatDate, calculateDaysRemaining } from '../../utils/date';
import { priorityColors } from '../../theme/colors';
import NotificationService from '../../services/NotificationService';

interface Treatment {
  id: string;
  animalId: string;
  animalName: string;
  condition: string;
  treatment: string;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'COMPLETED' | 'SCHEDULED';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  notes: string;
  nextCheckup?: string;
  prescribedBy: string;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: number;
  }>;
}

const TherapeuticDashboard = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(
    null
  );
  const [refreshing, setRefreshing] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const { loading, error, data, refetch } = useQuery(GET_THERAPEUTIC_OVERVIEW);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const filterTreatments = (treatments: Treatment[]) => {
    return treatments.filter((treatment) => {
      const matchesSearch =
        treatment.animalName
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        treatment.condition.toLowerCase().includes(searchQuery.toLowerCase()) ||
        treatment.treatment.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = !filterStatus || treatment.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  };

  const renderStatusChip = (status: string) => {
    const statusColors = {
      ACTIVE: theme.colors.primary,
      COMPLETED: theme.colors.success,
      SCHEDULED: theme.colors.accent,
    };

    return (
      <Chip
        selected={filterStatus === status}
        onPress={() =>
          setFilterStatus(filterStatus === status ? null : status)
        }
        style={[styles.statusChip, { borderColor: statusColors[status] }]}
        textStyle={{ color: statusColors[status] }}
      >
        {status}
      </Chip>
    );
  };

  const renderPriorityIndicator = (priority: string) => {
    return (
      <Icon
        name="circle"
        size={12}
        color={priorityColors[priority]}
        style={styles.priorityIcon}
      />
    );
  };

  const renderTreatmentDetails = (treatment: Treatment) => {
    return (
      <Dialog visible={showDetailsDialog} onDismiss={() => setShowDetailsDialog(false)}>
        <Dialog.Title>Treatment Details</Dialog.Title>
        <Dialog.Content>
          <List.Item
            title="Animal"
            description={treatment.animalName}
            left={(props) => <List.Icon {...props} icon="cow" />}
          />
          <List.Item
            title="Condition"
            description={treatment.condition}
            left={(props) => <List.Icon {...props} icon="medical-bag" />}
          />
          <List.Item
            title="Treatment"
            description={treatment.treatment}
            left={(props) => <List.Icon {...props} icon="needle" />}
          />
          <List.Item
            title="Duration"
            description={`${formatDate(treatment.startDate)} - ${formatDate(
              treatment.endDate
            )}`}
            left={(props) => <List.Icon {...props} icon="calendar-range" />}
          />
          <List.Item
            title="Prescribed By"
            description={treatment.prescribedBy}
            left={(props) => <List.Icon {...props} icon="doctor" />}
          />
          <Title style={styles.medicationsTitle}>Medications</Title>
          {treatment.medications.map((medication, index) => (
            <Card key={index} style={styles.medicationCard}>
              <Card.Content>
                <Text style={styles.medicationName}>{medication.name}</Text>
                <Text>Dosage: {medication.dosage}</Text>
                <Text>Frequency: {medication.frequency}</Text>
                <Text>Duration: {medication.duration} days</Text>
              </Card.Content>
            </Card>
          ))}
          {treatment.notes && (
            <List.Item
              title="Notes"
              description={treatment.notes}
              left={(props) => <List.Icon {...props} icon="note-text" />}
            />
          )}
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => setShowDetailsDialog(false)}>Close</Button>
          <Button
            mode="contained"
            onPress={() => {
              setShowDetailsDialog(false);
              navigation.navigate('EditTreatment', { treatmentId: treatment.id });
            }}
          >
            Edit
          </Button>
        </Dialog.Actions>
      </Dialog>
    );
  };

  const handleTreatmentUpdate = async (treatmentId: string, updates: any) => {
    try {
      const result = await updateTreatment({
        variables: {
          input: {
            id: treatmentId,
            ...updates,
          },
        },
      });

      if (result.data?.updateTreatment) {
        const treatment = result.data.updateTreatment;
        
        // Update notifications for the modified treatment
        NotificationService.updateTreatmentReminders(treatment);

        showSuccessMessage('Treatment updated successfully');
        refetch();
      }
    } catch (error) {
      console.error('Error updating treatment:', error);
      showErrorMessage('Failed to update treatment');
    }
  };

  const handleTreatmentDelete = async (treatmentId: string) => {
    try {
      const result = await deleteTreatment({
        variables: {
          id: treatmentId,
        },
      });

      if (result.data?.deleteTreatment) {
        // Cancel notifications for the deleted treatment
        NotificationService.cancelTreatmentReminders(treatmentId);

        showSuccessMessage('Treatment deleted successfully');
        refetch();
      }
    } catch (error) {
      console.error('Error deleting treatment:', error);
      showErrorMessage('Failed to delete treatment');
    }
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
        <Text style={styles.errorText}>Failed to load therapeutic data</Text>
        <Button mode="contained" onPress={() => refetch()}>
          Retry
        </Button>
      </View>
    );
  }

  const treatments = filterTreatments(data.therapeuticOverview.treatments);

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search treatments..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.statusFilters}
      >
        {renderStatusChip('ACTIVE')}
        {renderStatusChip('SCHEDULED')}
        {renderStatusChip('COMPLETED')}
      </ScrollView>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {treatments.map((treatment) => (
          <Card
            key={treatment.id}
            style={styles.treatmentCard}
            onPress={() => {
              setSelectedTreatment(treatment);
              setShowDetailsDialog(true);
            }}
          >
            <Card.Content>
              <View style={styles.cardHeader}>
                <View style={styles.titleContainer}>
                  {renderPriorityIndicator(treatment.priority)}
                  <Title style={styles.animalName}>{treatment.animalName}</Title>
                </View>
                <Chip mode="outlined" style={styles.statusChip}>
                  {treatment.status}
                </Chip>
              </View>

              <Text style={styles.condition}>{treatment.condition}</Text>
              <Text style={styles.treatment}>{treatment.treatment}</Text>

              <View style={styles.dateContainer}>
                <Icon name="calendar" size={16} color={theme.colors.primary} />
                <Text style={styles.dateText}>
                  {formatDate(treatment.startDate)} -{' '}
                  {formatDate(treatment.endDate)}
                </Text>
              </View>

              {treatment.nextCheckup && (
                <View style={styles.checkupContainer}>
                  <Icon
                    name="calendar-clock"
                    size={16}
                    color={theme.colors.accent}
                  />
                  <Text style={styles.checkupText}>
                    Next Checkup: {formatDate(treatment.nextCheckup)}
                  </Text>
                </View>
              )}
            </Card.Content>
          </Card>
        ))}
      </ScrollView>

      {selectedTreatment && renderTreatmentDetails(selectedTreatment)}

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate('AddTreatment')}
        label="New Treatment"
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
  searchBar: {
    margin: 16,
    elevation: 4,
  },
  statusFilters: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  statusChip: {
    marginRight: 8,
    borderWidth: 1,
  },
  treatmentCard: {
    margin: 16,
    marginTop: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityIcon: {
    marginRight: 8,
  },
  animalName: {
    fontSize: 18,
  },
  condition: {
    fontSize: 16,
    marginBottom: 4,
  },
  treatment: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 8,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dateText: {
    marginLeft: 8,
    fontSize: 14,
  },
  checkupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  checkupText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  medicationsTitle: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  medicationCard: {
    marginVertical: 4,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
});

export default TherapeuticDashboard;
