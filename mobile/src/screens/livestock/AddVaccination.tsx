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
  List,
} from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useMutation, useQuery } from '@apollo/client';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ADD_VACCINATION, GET_VACCINATION_TYPES } from '../../graphql/queries';

const COMMON_VACCINES = [
  'Foot and Mouth Disease',
  'Brucellosis',
  'Anthrax',
  'Blackleg',
  'Bovine Viral Diarrhea',
  'Infectious Bovine Rhinotracheitis',
  'Leptospirosis',
  'Rabies',
];

const AddVaccination = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { livestockId } = route.params;

  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateType, setDateType] = useState<'administered' | 'due'>('administered');
  const [type, setType] = useState('');
  const [customType, setCustomType] = useState('');
  const [showCustomType, setShowCustomType] = useState(false);
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)); // 6 months ahead
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [performer, setPerformer] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [confirmDialogVisible, setConfirmDialogVisible] = useState(false);

  const [addVaccination, { loading }] = useMutation(ADD_VACCINATION, {
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

    if (!type && !customType) newErrors.type = 'Please select or enter a vaccine type';
    if (!performer.trim()) newErrors.performer = 'Administrator is required';
    if (dueDate <= date) newErrors.dueDate = 'Due date must be after administration date';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    addVaccination({
      variables: {
        livestockId,
        input: {
          date: date.toISOString(),
          type: showCustomType ? customType.trim() : type,
          dueDate: dueDate.toISOString(),
          performer: performer.trim(),
          notes: notes.trim(),
        },
      },
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <Title style={styles.title}>Add Vaccination Record</Title>

        {/* Administration Date */}
        <Title style={styles.sectionTitle}>Administration Date</Title>
        <Button
          mode="outlined"
          onPress={() => {
            setDateType('administered');
            setShowDatePicker(true);
          }}
          style={styles.dateButton}
        >
          {date.toLocaleDateString()}
        </Button>

        {/* Vaccine Type Selection */}
        <Title style={styles.sectionTitle}>Vaccine Type</Title>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chipContainer}>
            {COMMON_VACCINES.map((vaccineType) => (
              <Chip
                key={vaccineType}
                selected={type === vaccineType && !showCustomType}
                onPress={() => {
                  setType(vaccineType);
                  setShowCustomType(false);
                }}
                style={styles.chip}
              >
                {vaccineType}
              </Chip>
            ))}
            <Chip
              selected={showCustomType}
              onPress={() => setShowCustomType(true)}
              style={styles.chip}
            >
              Other
            </Chip>
          </View>
        </ScrollView>

        {showCustomType && (
          <TextInput
            label="Custom Vaccine Type"
            value={customType}
            onChangeText={setCustomType}
            mode="outlined"
            error={!!errors.type && !customType}
            style={styles.input}
          />
        )}

        {errors.type && (
          <HelperText type="error" visible>
            {errors.type}
          </HelperText>
        )}

        {/* Due Date */}
        <Title style={styles.sectionTitle}>Due Date</Title>
        <Button
          mode="outlined"
          onPress={() => {
            setDateType('due');
            setShowDueDatePicker(true);
          }}
          style={styles.dateButton}
        >
          {dueDate.toLocaleDateString()}
        </Button>
        {errors.dueDate && (
          <HelperText type="error" visible>
            {errors.dueDate}
          </HelperText>
        )}

        {/* Date Pickers */}
        {showDatePicker && (
          <DateTimePicker
            value={dateType === 'administered' ? date : dueDate}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              if (dateType === 'administered') {
                setShowDatePicker(false);
                if (selectedDate) setDate(selectedDate);
              } else {
                setShowDueDatePicker(false);
                if (selectedDate) setDueDate(selectedDate);
              }
            }}
          />
        )}

        {/* Administrator */}
        <TextInput
          label="Administered By"
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
          Add Vaccination Record
        </Button>
      </ScrollView>

      {/* Confirmation Dialog */}
      <Portal>
        <Dialog
          visible={confirmDialogVisible}
          onDismiss={() => setConfirmDialogVisible(false)}
        >
          <Dialog.Title>Confirm Vaccination Record</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              Please confirm the following vaccination details:
            </Paragraph>
            <List.Item
              title="Vaccine Type"
              description={showCustomType ? customType : type}
            />
            <List.Item
              title="Administration Date"
              description={date.toLocaleDateString()}
            />
            <List.Item
              title="Due Date"
              description={dueDate.toLocaleDateString()}
            />
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

      {/* Success Snackbar */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: 'Dismiss',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        Vaccination record added successfully
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
  sectionTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  dateButton: {
    marginBottom: 16,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  input: {
    marginBottom: 16,
  },
  submitButton: {
    marginVertical: 16,
  },
});

export default AddVaccination;
