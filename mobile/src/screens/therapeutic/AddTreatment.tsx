import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import {
  TextInput,
  Button,
  Title,
  useTheme,
  HelperText,
  Chip,
  Portal,
  Dialog,
  List,
  IconButton,
  Divider,
  Menu,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQuery } from '@apollo/client';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import {
  ADD_TREATMENT,
  GET_LIVESTOCK_LIST,
  GET_THERAPEUTIC_OVERVIEW,
} from '../../graphql/queries';
import { formatDate } from '../../utils/date';
import { priorityColors } from '../../theme/colors';
import NotificationService from '../../services/NotificationService';

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: number;
}

const AddTreatment = () => {
  const theme = useTheme();
  const navigation = useNavigation();

  // Form state
  const [selectedAnimal, setSelectedAnimal] = useState('');
  const [condition, setCondition] = useState('');
  const [treatment, setTreatment] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [nextCheckup, setNextCheckup] = useState<Date | null>(null);
  const [priority, setPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM');
  const [prescribedBy, setPrescribedBy] = useState('');
  const [notes, setNotes] = useState('');
  const [medications, setMedications] = useState<Medication[]>([]);

  // UI state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<
    'start' | 'end' | 'checkup'
  >('start');
  const [showMedicationDialog, setShowMedicationDialog] = useState(false);
  const [showAnimalMenu, setShowAnimalMenu] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // New medication form state
  const [newMedication, setNewMedication] = useState<Medication>({
    id: '',
    name: '',
    dosage: '',
    frequency: '',
    duration: 7,
  });

  // Queries and mutations
  const { data: livestockData } = useQuery(GET_LIVESTOCK_LIST);
  const [addTreatment, { loading }] = useMutation(ADD_TREATMENT, {
    refetchQueries: [{ query: GET_THERAPEUTIC_OVERVIEW }],
    onCompleted: () => {
      navigation.goBack();
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!selectedAnimal) {
      newErrors.animal = 'Please select an animal';
    }
    if (!condition.trim()) {
      newErrors.condition = 'Please enter the condition';
    }
    if (!treatment.trim()) {
      newErrors.treatment = 'Please enter the treatment';
    }
    if (!prescribedBy.trim()) {
      newErrors.prescribedBy = 'Please enter who prescribed the treatment';
    }
    if (endDate < startDate) {
      newErrors.date = 'End date must be after start date';
    }
    if (medications.length === 0) {
      newErrors.medications = 'Please add at least one medication';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const result = await addTreatment({
        variables: {
          input: {
            animalId: selectedAnimal,
            condition: condition.trim(),
            treatment: treatment.trim(),
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            nextCheckup: nextCheckup?.toISOString(),
            priority,
            prescribedBy: prescribedBy.trim(),
            notes: notes.trim(),
            medications: medications.map(({ id, ...med }) => med),
          },
        },
      });

      if (result.data?.addTreatment) {
        const treatment = result.data.addTreatment;
        
        // Schedule notifications for the new treatment
        NotificationService.scheduleTreatmentReminders(treatment);

        navigation.goBack();
      }
    } catch (error) {
      console.error('Error creating treatment:', error);
    }
  };

  const handleDateSelect = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      switch (datePickerMode) {
        case 'start':
          setStartDate(selectedDate);
          break;
        case 'end':
          setEndDate(selectedDate);
          break;
        case 'checkup':
          setNextCheckup(selectedDate);
          break;
      }
    }
  };

  const handleAddMedication = () => {
    if (
      newMedication.name.trim() &&
      newMedication.dosage.trim() &&
      newMedication.frequency.trim()
    ) {
      setMedications([
        ...medications,
        {
          ...newMedication,
          id: Math.random().toString(),
        },
      ]);
      setNewMedication({
        id: '',
        name: '',
        dosage: '',
        frequency: '',
        duration: 7,
      });
      setShowMedicationDialog(false);
    }
  };

  const handleRemoveMedication = (id: string) => {
    setMedications(medications.filter((med) => med.id !== id));
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <Title style={styles.title}>New Treatment</Title>

        {/* Animal Selection */}
        <Menu
          visible={showAnimalMenu}
          onDismiss={() => setShowAnimalMenu(false)}
          anchor={
            <TextInput
              label="Select Animal"
              value={
                livestockData?.livestock.find((l) => l.id === selectedAnimal)
                  ?.name || ''
              }
              right={
                <TextInput.Icon
                  name="chevron-down"
                  onPress={() => setShowAnimalMenu(true)}
                />
              }
              mode="outlined"
              error={!!errors.animal}
              onFocus={() => setShowAnimalMenu(true)}
            />
          }
        >
          {livestockData?.livestock.map((animal) => (
            <Menu.Item
              key={animal.id}
              onPress={() => {
                setSelectedAnimal(animal.id);
                setShowAnimalMenu(false);
              }}
              title={animal.name}
            />
          ))}
        </Menu>
        {errors.animal && (
          <HelperText type="error" visible>
            {errors.animal}
          </HelperText>
        )}

        {/* Condition and Treatment */}
        <TextInput
          label="Condition"
          value={condition}
          onChangeText={setCondition}
          mode="outlined"
          error={!!errors.condition}
          style={styles.input}
        />
        {errors.condition && (
          <HelperText type="error" visible>
            {errors.condition}
          </HelperText>
        )}

        <TextInput
          label="Treatment"
          value={treatment}
          onChangeText={setTreatment}
          mode="outlined"
          error={!!errors.treatment}
          style={styles.input}
        />
        {errors.treatment && (
          <HelperText type="error" visible>
            {errors.treatment}
          </HelperText>
        )}

        {/* Dates */}
        <View style={styles.dateContainer}>
          <Button
            mode="outlined"
            onPress={() => {
              setDatePickerMode('start');
              setShowDatePicker(true);
            }}
            style={styles.dateButton}
          >
            Start: {formatDate(startDate)}
          </Button>
          <Button
            mode="outlined"
            onPress={() => {
              setDatePickerMode('end');
              setShowDatePicker(true);
            }}
            style={styles.dateButton}
          >
            End: {formatDate(endDate)}
          </Button>
        </View>
        {errors.date && (
          <HelperText type="error" visible>
            {errors.date}
          </HelperText>
        )}

        <Button
          mode="outlined"
          onPress={() => {
            setDatePickerMode('checkup');
            setShowDatePicker(true);
          }}
          style={styles.checkupButton}
        >
          {nextCheckup
            ? `Next Checkup: ${formatDate(nextCheckup)}`
            : 'Set Next Checkup'}
        </Button>

        {/* Priority */}
        <View style={styles.priorityContainer}>
          <Title style={styles.sectionTitle}>Priority</Title>
          <View style={styles.chipContainer}>
            {(['HIGH', 'MEDIUM', 'LOW'] as const).map((p) => (
              <Chip
                key={p}
                selected={priority === p}
                onPress={() => setPriority(p)}
                style={[
                  styles.priorityChip,
                  {
                    backgroundColor:
                      priority === p
                        ? priorityColors[p]
                        : theme.colors.surface,
                  },
                ]}
                textStyle={{
                  color: priority === p ? 'white' : theme.colors.text,
                }}
              >
                {p}
              </Chip>
            ))}
          </View>
        </View>

        {/* Prescribed By */}
        <TextInput
          label="Prescribed By"
          value={prescribedBy}
          onChangeText={setPrescribedBy}
          mode="outlined"
          error={!!errors.prescribedBy}
          style={styles.input}
        />
        {errors.prescribedBy && (
          <HelperText type="error" visible>
            {errors.prescribedBy}
          </HelperText>
        )}

        {/* Medications */}
        <View style={styles.medicationsContainer}>
          <View style={styles.medicationsHeader}>
            <Title style={styles.sectionTitle}>Medications</Title>
            <IconButton
              icon="plus"
              onPress={() => setShowMedicationDialog(true)}
            />
          </View>
          {medications.map((medication) => (
            <List.Item
              key={medication.id}
              title={medication.name}
              description={`${medication.dosage} - ${medication.frequency} for ${medication.duration} days`}
              left={(props) => <List.Icon {...props} icon="pill" />}
              right={(props) => (
                <IconButton
                  {...props}
                  icon="delete"
                  onPress={() => handleRemoveMedication(medication.id)}
                />
              )}
            />
          ))}
          {errors.medications && (
            <HelperText type="error" visible>
              {errors.medications}
            </HelperText>
          )}
        </View>

        {/* Notes */}
        <TextInput
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          mode="outlined"
          multiline
          numberOfLines={4}
          style={styles.input}
        />

        {/* Submit Button */}
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading}
          style={styles.submitButton}
        >
          Add Treatment
        </Button>
      </ScrollView>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={
            datePickerMode === 'start'
              ? startDate
              : datePickerMode === 'end'
              ? endDate
              : nextCheckup || new Date()
          }
          mode="date"
          display="default"
          onChange={handleDateSelect}
          minimumDate={
            datePickerMode === 'end' ? startDate : new Date()
          }
        />
      )}

      {/* Add Medication Dialog */}
      <Portal>
        <Dialog
          visible={showMedicationDialog}
          onDismiss={() => setShowMedicationDialog(false)}
        >
          <Dialog.Title>Add Medication</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Medication Name"
              value={newMedication.name}
              onChangeText={(text) =>
                setNewMedication({ ...newMedication, name: text })
              }
              mode="outlined"
              style={styles.dialogInput}
            />
            <TextInput
              label="Dosage"
              value={newMedication.dosage}
              onChangeText={(text) =>
                setNewMedication({ ...newMedication, dosage: text })
              }
              mode="outlined"
              style={styles.dialogInput}
            />
            <TextInput
              label="Frequency"
              value={newMedication.frequency}
              onChangeText={(text) =>
                setNewMedication({ ...newMedication, frequency: text })
              }
              mode="outlined"
              style={styles.dialogInput}
            />
            <TextInput
              label="Duration (days)"
              value={newMedication.duration.toString()}
              onChangeText={(text) =>
                setNewMedication({
                  ...newMedication,
                  duration: parseInt(text) || 7,
                })
              }
              mode="outlined"
              keyboardType="number-pad"
              style={styles.dialogInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowMedicationDialog(false)}>
              Cancel
            </Button>
            <Button onPress={handleAddMedication}>Add</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  title: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dateButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  checkupButton: {
    marginBottom: 16,
  },
  priorityContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  priorityChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  medicationsContainer: {
    marginBottom: 16,
  },
  medicationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dialogInput: {
    marginBottom: 12,
  },
  submitButton: {
    marginVertical: 16,
  },
});

export default AddTreatment;
