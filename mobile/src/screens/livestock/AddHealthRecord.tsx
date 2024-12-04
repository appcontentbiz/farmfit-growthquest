import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import {
  TextInput,
  Button,
  Chip,
  Title,
  useTheme,
  HelperText,
  Snackbar,
  Portal,
  Dialog,
  Paragraph,
} from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useMutation } from '@apollo/client';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ADD_HEALTH_RECORD } from '../../graphql/queries';

const HEALTH_RECORD_TYPES = [
  'Regular Checkup',
  'Treatment',
  'Surgery',
  'Injury',
  'Disease',
  'Other'
];

const AddHealthRecord = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { livestockId } = route.params;

  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [performer, setPerformer] = useState('');
  const [medications, setMedications] = useState<string[]>([]);
  const [currentMedication, setCurrentMedication] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [confirmDialogVisible, setConfirmDialogVisible] = useState(false);

  const [addHealthRecord, { loading }] = useMutation(ADD_HEALTH_RECORD, {
    onCompleted: () => {
      setSnackbarVisible(true);
      navigation.goBack();
    },
    onError: (error) => {
      setErrors({ submit: error.message });
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!type) newErrors.type = 'Please select a record type';
    if (!description.trim()) newErrors.description = 'Description is required';
    if (!performer.trim()) newErrors.performer = 'Performer is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    addHealthRecord({
      variables: {
        livestockId,
        input: {
          date: date.toISOString(),
          type,
          description: description.trim(),
          performer: performer.trim(),
          medications,
          notes: notes.trim(),
        },
      },
    });
  };

  const handleAddMedication = () => {
    if (currentMedication.trim() && !medications.includes(currentMedication.trim())) {
      setMedications([...medications, currentMedication.trim()]);
      setCurrentMedication('');
    }
  };

  const handleRemoveMedication = (medication: string) => {
    setMedications(medications.filter(med => med !== medication));
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <Title style={styles.title}>Add Health Record</Title>

        {/* Date Selection */}
        <Button
          mode="outlined"
          onPress={() => setShowDatePicker(true)}
          style={styles.dateButton}
        >
          {date.toLocaleDateString()}
        </Button>
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) setDate(selectedDate);
            }}
          />
        )}

        {/* Record Type Selection */}
        <View style={styles.typeContainer}>
          <Title style={styles.sectionTitle}>Record Type</Title>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipContainer}>
              {HEALTH_RECORD_TYPES.map((recordType) => (
                <Chip
                  key={recordType}
                  selected={type === recordType}
                  onPress={() => setType(recordType)}
                  style={styles.chip}
                >
                  {recordType}
                </Chip>
              ))}
            </View>
          </ScrollView>
          {errors.type && (
            <HelperText type="error" visible>
              {errors.type}
            </HelperText>
          )}
        </View>

        {/* Description */}
        <TextInput
          label="Description"
          value={description}
          onChangeText={setDescription}
          mode="outlined"
          multiline
          numberOfLines={3}
          error={!!errors.description}
          style={styles.input}
        />
        {errors.description && (
          <HelperText type="error" visible>
            {errors.description}
          </HelperText>
        )}

        {/* Performer */}
        <TextInput
          label="Performed By"
          value={performer}
          onChangeText={setPerformer}
          mode="outlined"
          error={!!errors.performer}
          style={styles.input}
        />
        {errors.performer && (
          <HelperText type="error" visible>
            {errors.performer}
          </HelperText>
        )}

        {/* Medications */}
        <Title style={styles.sectionTitle}>Medications</Title>
        <View style={styles.medicationInput}>
          <TextInput
            label="Add Medication"
            value={currentMedication}
            onChangeText={setCurrentMedication}
            mode="outlined"
            style={styles.medicationTextInput}
          />
          <Button
            mode="contained"
            onPress={handleAddMedication}
            disabled={!currentMedication.trim()}
          >
            Add
          </Button>
        </View>
        <View style={styles.medicationList}>
          {medications.map((medication) => (
            <Chip
              key={medication}
              onClose={() => handleRemoveMedication(medication)}
              style={styles.medicationChip}
            >
              {medication}
            </Chip>
          ))}
        </View>

        {/* Notes */}
        <TextInput
          label="Additional Notes"
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
          onPress={() => setConfirmDialogVisible(true)}
          loading={loading}
          disabled={loading}
          style={styles.submitButton}
        >
          Add Health Record
        </Button>
      </ScrollView>

      {/* Confirmation Dialog */}
      <Portal>
        <Dialog
          visible={confirmDialogVisible}
          onDismiss={() => setConfirmDialogVisible(false)}
        >
          <Dialog.Title>Confirm Health Record</Dialog.Title>
          <Dialog.Content>
            <Paragraph>Are you sure you want to add this health record?</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmDialogVisible(false)}>Cancel</Button>
            <Button onPress={() => {
              setConfirmDialogVisible(false);
              handleSubmit();
            }}>
              Confirm
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Error Snackbar */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: 'Dismiss',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        Health record added successfully
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    marginBottom: 16,
  },
  dateButton: {
    marginBottom: 16,
  },
  typeContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  input: {
    marginBottom: 16,
  },
  medicationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  medicationTextInput: {
    flex: 1,
    marginRight: 8,
  },
  medicationList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  medicationChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  submitButton: {
    marginVertical: 16,
  },
});

export default AddHealthRecord;
