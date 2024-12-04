import { Treatment, Medication, TreatmentStatus, TreatmentPriority } from '../types/therapeutic';

export const calculateTreatmentProgress = (treatment: Treatment): number => {
  const start = new Date(treatment.startDate).getTime();
  const end = new Date(treatment.endDate).getTime();
  const current = Date.now();

  if (current <= start) return 0;
  if (current >= end) return 100;

  const totalDuration = end - start;
  const elapsed = current - start;
  return Math.round((elapsed / totalDuration) * 100);
};

export const calculateMedicationAdherence = (
  medications: Medication[],
  startDate: string,
  endDate: string
): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  const adherenceScore = medications.reduce((acc, med) => {
    const medStart = new Date(med.startDate);
    const medEnd = new Date(med.endDate);
    const medDays = Math.ceil((medEnd.getTime() - medStart.getTime()) / (1000 * 60 * 60 * 24));
    return acc + (medDays / totalDays);
  }, 0);

  return Math.min(100, (adherenceScore / medications.length) * 100);
};

export const getTreatmentStatus = (
  startDate: string,
  endDate: string,
  currentStatus: TreatmentStatus
): TreatmentStatus => {
  if (currentStatus === TreatmentStatus.COMPLETED) {
    return TreatmentStatus.COMPLETED;
  }

  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (now < start) {
    return TreatmentStatus.SCHEDULED;
  } else if (now > end) {
    return TreatmentStatus.COMPLETED;
  } else {
    return TreatmentStatus.ACTIVE;
  }
};

export const calculateTreatmentUrgency = (
  priority: TreatmentPriority,
  startDate: string,
  endDate: string,
  medications: Medication[]
): number => {
  let urgencyScore = 0;

  // Priority weight
  switch (priority) {
    case TreatmentPriority.HIGH:
      urgencyScore += 50;
      break;
    case TreatmentPriority.MEDIUM:
      urgencyScore += 30;
      break;
    case TreatmentPriority.LOW:
      urgencyScore += 10;
      break;
  }

  // Time sensitivity
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  const totalDuration = end.getTime() - start.getTime();
  const remainingTime = end.getTime() - now.getTime();
  const timeUrgency = Math.max(0, 30 * (1 - remainingTime / totalDuration));
  urgencyScore += timeUrgency;

  // Medication complexity
  const medicationWeight = Math.min(20, medications.length * 5);
  urgencyScore += medicationWeight;

  return Math.min(100, urgencyScore);
};

export const getNextMedicationTime = (
  frequency: string,
  lastTaken?: Date
): Date => {
  const now = lastTaken || new Date();
  const [count, unit] = frequency.toLowerCase().split(' ');
  const times = parseInt(count);

  switch (unit) {
    case 'hourly':
    case 'hours':
      return new Date(now.getTime() + (24 / times) * 60 * 60 * 1000);
    case 'daily':
    case 'days':
      return new Date(now.getTime() + (24 * 60 * 60 * 1000) / times);
    case 'weekly':
    case 'weeks':
      return new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000) / times);
    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000); // Default to daily
  }
};

export const generateTreatmentSummary = (treatment: Treatment): string => {
  const progress = calculateTreatmentProgress(treatment);
  const adherence = calculateMedicationAdherence(
    treatment.medications,
    treatment.startDate,
    treatment.endDate
  );

  return `Treatment for ${treatment.condition}
Progress: ${progress}%
Medication Adherence: ${adherence.toFixed(1)}%
Status: ${treatment.status}
Priority: ${treatment.priority}
Medications: ${treatment.medications.length}
Next Checkup: ${treatment.nextCheckup ? new Date(treatment.nextCheckup).toLocaleDateString() : 'Not scheduled'}`;
};

export const shouldSendReminder = (
  treatment: Treatment,
  lastReminder?: Date
): boolean => {
  if (treatment.status !== TreatmentStatus.ACTIVE) {
    return false;
  }

  const now = new Date();
  const lastReminderTime = lastReminder?.getTime() || 0;
  const minimumInterval = 24 * 60 * 60 * 1000; // 24 hours

  if (now.getTime() - lastReminderTime < minimumInterval) {
    return false;
  }

  const urgency = calculateTreatmentUrgency(
    treatment.priority,
    treatment.startDate,
    treatment.endDate,
    treatment.medications
  );

  return urgency > 70; // Send reminder for high urgency treatments
};

export const validateMedicationSchedule = (
  medications: Medication[]
): { valid: boolean; conflicts: string[] } => {
  const conflicts: string[] = [];

  for (let i = 0; i < medications.length; i++) {
    for (let j = i + 1; j < medications.length; j++) {
      const med1 = medications[i];
      const med2 = medications[j];

      // Check for timing conflicts
      const med1Start = new Date(med1.startDate);
      const med1End = new Date(med1.endDate);
      const med2Start = new Date(med2.startDate);
      const med2End = new Date(med2.endDate);

      if (
        (med1Start <= med2End && med1End >= med2Start) ||
        (med2Start <= med1End && med2End >= med1Start)
      ) {
        conflicts.push(
          `Potential timing conflict between ${med1.name} and ${med2.name}`
        );
      }

      // Check for known drug interactions (placeholder for future implementation)
      // This would integrate with a medical database API
    }
  }

  return {
    valid: conflicts.length === 0,
    conflicts,
  };
};

export const formatMedicationSchedule = (medication: Medication): string => {
  const start = new Date(medication.startDate);
  const end = new Date(medication.endDate);
  const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  return `${medication.name}
Dosage: ${medication.dosage}
Frequency: ${medication.frequency}
Duration: ${duration} days
Start: ${start.toLocaleDateString()}
End: ${end.toLocaleDateString()}
${medication.notes ? `Notes: ${medication.notes}` : ''}`;
};
