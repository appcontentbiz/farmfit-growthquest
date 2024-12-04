import React, { useState, useEffect } from 'react';
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
  Divider,
  IconButton,
} from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useMutation } from '@apollo/client';
import { UPDATE_NUTRITION_PLAN } from '../../graphql/queries';
import { NutritionPlan } from '../../types/livestock';

const FEED_TYPES = [
  'Grass',
  'Hay',
  'Silage',
  'Grain Mix',
  'Concentrate',
  'Custom Mix',
];

const COMMON_SUPPLEMENTS = [
  'Minerals',
  'Vitamins',
  'Protein',
  'Probiotics',
  'Electrolytes',
];

const EditNutrition = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { livestockId, currentPlan } = route.params;

  // Form state
  const [feedType, setFeedType] = useState(currentPlan?.feedType || '');
  const [customFeedType, setCustomFeedType] = useState('');
  const [showCustomFeedType, setShowCustomFeedType] = useState(false);
  const [dailyAmount, setDailyAmount] = useState(
    currentPlan?.dailyAmount?.toString() || ''
  );
  const [frequency, setFrequency] = useState(
    currentPlan?.frequency?.toString() || '2'
  );
  const [supplements, setSupplements] = useState<string[]>(
    currentPlan?.supplements || []
  );
  const [customSupplement, setCustomSupplement] = useState('');
  const [notes, setNotes] = useState(currentPlan?.notes || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [confirmDialogVisible, setConfirmDialogVisible] = useState(false);

  const [updateNutritionPlan, { loading }] = useMutation(UPDATE_NUTRITION_PLAN, {
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

    if (!feedType && !customFeedType) {
      newErrors.feedType = 'Please select or enter a feed type';
    }

    const amount = parseFloat(dailyAmount);
    if (isNaN(amount) || amount <= 0) {
      newErrors.dailyAmount = 'Please enter a valid daily amount';
    }

    const freq = parseInt(frequency);
    if (isNaN(freq) || freq < 1 || freq > 6) {
      newErrors.frequency = 'Frequency must be between 1 and 6 times per day';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const nutritionPlan: NutritionPlan = {
      feedType: showCustomFeedType ? customFeedType.trim() : feedType,
      dailyAmount: parseFloat(dailyAmount),
      frequency: parseInt(frequency),
      supplements,
      notes: notes.trim(),
    };

    updateNutritionPlan({
      variables: {
        livestockId,
        input: nutritionPlan,
      },
    });
  };

  const handleAddSupplement = () => {
    if (
      customSupplement.trim() &&
      !supplements.includes(customSupplement.trim())
    ) {
      setSupplements([...supplements, customSupplement.trim()]);
      setCustomSupplement('');
    }
  };

  const handleRemoveSupplement = (supplement: string) => {
    setSupplements(supplements.filter((s) => s !== supplement));
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <Title style={styles.title}>Edit Nutrition Plan</Title>

        {/* Feed Type Selection */}
        <Title style={styles.sectionTitle}>Feed Type</Title>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chipContainer}>
            {FEED_TYPES.map((type) => (
              <Chip
                key={type}
                selected={feedType === type && !showCustomFeedType}
                onPress={() => {
                  setFeedType(type);
                  setShowCustomFeedType(false);
                }}
                style={styles.chip}
              >
                {type}
              </Chip>
            ))}
            <Chip
              selected={showCustomFeedType}
              onPress={() => setShowCustomFeedType(true)}
              style={styles.chip}
            >
              Other
            </Chip>
          </View>
        </ScrollView>

        {showCustomFeedType && (
          <TextInput
            label="Custom Feed Type"
            value={customFeedType}
            onChangeText={setCustomFeedType}
            mode="outlined"
            error={!!errors.feedType && !customFeedType}
            style={styles.input}
          />
        )}

        {errors.feedType && (
          <HelperText type="error" visible>
            {errors.feedType}
          </HelperText>
        )}

        {/* Daily Amount */}
        <TextInput
          label="Daily Amount (kg)"
          value={dailyAmount}
          onChangeText={setDailyAmount}
          mode="outlined"
          keyboardType="decimal-pad"
          error={!!errors.dailyAmount}
          style={styles.input}
        />
        {errors.dailyAmount && (
          <HelperText type="error" visible>
            {errors.dailyAmount}
          </HelperText>
        )}

        {/* Feeding Frequency */}
        <TextInput
          label="Feeding Frequency (times per day)"
          value={frequency}
          onChangeText={setFrequency}
          mode="outlined"
          keyboardType="number-pad"
          error={!!errors.frequency}
          style={styles.input}
        />
        {errors.frequency && (
          <HelperText type="error" visible>
            {errors.frequency}
          </HelperText>
        )}

        {/* Supplements */}
        <Title style={styles.sectionTitle}>Supplements</Title>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chipContainer}>
            {COMMON_SUPPLEMENTS.map((supplement) => (
              <Chip
                key={supplement}
                selected={supplements.includes(supplement)}
                onPress={() => {
                  if (supplements.includes(supplement)) {
                    handleRemoveSupplement(supplement);
                  } else {
                    setSupplements([...supplements, supplement]);
                  }
                }}
                style={styles.chip}
              >
                {supplement}
              </Chip>
            ))}
          </View>
        </ScrollView>

        <View style={styles.supplementInput}>
          <TextInput
            label="Add Custom Supplement"
            value={customSupplement}
            onChangeText={setCustomSupplement}
            mode="outlined"
            style={styles.supplementTextInput}
          />
          <Button
            mode="contained"
            onPress={handleAddSupplement}
            disabled={!customSupplement.trim()}
          >
            Add
          </Button>
        </View>

        {/* Selected Supplements */}
        <View style={styles.selectedSupplements}>
          {supplements.map((supplement) => (
            <Chip
              key={supplement}
              onClose={() => handleRemoveSupplement(supplement)}
              style={styles.supplementChip}
            >
              {supplement}
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
          Update Nutrition Plan
        </Button>
      </ScrollView>

      {/* Confirmation Dialog */}
      <Portal>
        <Dialog
          visible={confirmDialogVisible}
          onDismiss={() => setConfirmDialogVisible(false)}
        >
          <Dialog.Title>Confirm Nutrition Plan</Dialog.Title>
          <Dialog.Content>
            <List.Item
              title="Feed Type"
              description={showCustomFeedType ? customFeedType : feedType}
            />
            <Divider />
            <List.Item
              title="Daily Amount"
              description={`${dailyAmount} kg`}
            />
            <Divider />
            <List.Item
              title="Frequency"
              description={`${frequency} times per day`}
            />
            {supplements.length > 0 && (
              <>
                <Divider />
                <List.Item
                  title="Supplements"
                  description={supplements.join(', ')}
                />
              </>
            )}
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
        Nutrition plan updated successfully
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
  supplementInput: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  supplementTextInput: {
    flex: 1,
    marginRight: 8,
  },
  selectedSupplements: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  supplementChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  submitButton: {
    marginVertical: 16,
  },
});

export default EditNutrition;
