import PushNotification, { Importance } from 'react-native-push-notification';
import { Platform } from 'react-native';
import { Treatment, Medication, TreatmentPriority } from '../types/therapeutic';
import { getNextMedicationTime } from '../utils/therapeutic';
import { store } from '../store';
import { addNotification } from '../store/slices/notificationSlice';

class NotificationService {
  constructor() {
    this.configure();
    this.createDefaultChannels();
  }

  configure = () => {
    PushNotification.configure({
      onRegister: function (token) {
        console.log('TOKEN:', token);
      },
      onNotification: function (notification) {
        console.log('NOTIFICATION:', notification);
        
        // Handle notification tap
        if (notification.userInteraction) {
          // Navigate to relevant screen based on notification type
          const data = notification.data || {};
          switch (data.type) {
            case 'TREATMENT':
              // Navigate to treatment details
              break;
            case 'MEDICATION':
              // Navigate to medication details
              break;
            case 'CHECKUP':
              // Navigate to checkup screen
              break;
          }
        }

        // Required on iOS
        notification.finish(PushNotification.FetchResult.NoData);
      },
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },
      popInitialNotification: true,
      requestPermissions: Platform.OS === 'ios',
    });
  };

  createDefaultChannels = () => {
    PushNotification.createChannel(
      {
        channelId: 'treatment-alerts',
        channelName: 'Treatment Alerts',
        channelDescription: 'Notifications for treatment schedules and updates',
        playSound: true,
        soundName: 'default',
        importance: Importance.HIGH,
        vibrate: true,
      },
      (created) => console.log(`Treatment channel created: ${created}`)
    );

    PushNotification.createChannel(
      {
        channelId: 'medication-reminders',
        channelName: 'Medication Reminders',
        channelDescription: 'Reminders for medication administration',
        playSound: true,
        soundName: 'default',
        importance: Importance.HIGH,
        vibrate: true,
      },
      (created) => console.log(`Medication channel created: ${created}`)
    );

    PushNotification.createChannel(
      {
        channelId: 'checkup-reminders',
        channelName: 'Checkup Reminders',
        channelDescription: 'Reminders for scheduled checkups',
        playSound: true,
        soundName: 'default',
        importance: Importance.DEFAULT,
        vibrate: true,
      },
      (created) => console.log(`Checkup channel created: ${created}`)
    );
  };

  scheduleTreatmentReminders = (treatment: Treatment) => {
    const notificationId = `treatment-${treatment.id}`;
    
    // Schedule start notification
    const startDate = new Date(treatment.startDate);
    if (startDate > new Date()) {
      this.scheduleNotification({
        id: `${notificationId}-start`,
        title: 'Treatment Starting',
        message: `Treatment for ${treatment.animalName} (${treatment.condition}) is starting today`,
        date: startDate,
        channelId: 'treatment-alerts',
        data: {
          type: 'TREATMENT',
          treatmentId: treatment.id,
          action: 'START',
        },
      });
    }

    // Schedule medication reminders
    treatment.medications.forEach((medication) => {
      this.scheduleMedicationReminders(medication, treatment);
    });

    // Schedule checkup reminder if exists
    if (treatment.nextCheckup) {
      const checkupDate = new Date(treatment.nextCheckup);
      this.scheduleNotification({
        id: `${notificationId}-checkup`,
        title: 'Treatment Checkup',
        message: `Scheduled checkup for ${treatment.animalName}'s ${treatment.condition} treatment`,
        date: checkupDate,
        channelId: 'checkup-reminders',
        data: {
          type: 'CHECKUP',
          treatmentId: treatment.id,
          action: 'CHECKUP',
        },
      });
    }

    // Schedule end notification
    const endDate = new Date(treatment.endDate);
    this.scheduleNotification({
      id: `${notificationId}-end`,
      title: 'Treatment Ending',
      message: `Treatment for ${treatment.animalName} (${treatment.condition}) is ending today`,
      date: endDate,
      channelId: 'treatment-alerts',
      data: {
        type: 'TREATMENT',
        treatmentId: treatment.id,
        action: 'END',
      },
    });
  };

  scheduleMedicationReminders = (medication: Medication, treatment: Treatment) => {
    const startDate = new Date(medication.startDate);
    const endDate = new Date(medication.endDate);
    let currentDate = startDate;

    while (currentDate <= endDate) {
      const notificationId = `medication-${treatment.id}-${medication.id}-${currentDate.getTime()}`;
      
      // Schedule reminder 15 minutes before
      const reminderDate = new Date(currentDate.getTime() - 15 * 60000);
      if (reminderDate > new Date()) {
        this.scheduleNotification({
          id: notificationId,
          title: 'Medication Reminder',
          message: `Time to administer ${medication.name} (${medication.dosage}) to ${treatment.animalName}`,
          date: reminderDate,
          channelId: 'medication-reminders',
          data: {
            type: 'MEDICATION',
            treatmentId: treatment.id,
            medicationId: medication.id,
            action: 'ADMINISTER',
          },
        });
      }

      // Calculate next medication time based on frequency
      currentDate = getNextMedicationTime(medication.frequency, currentDate);
    }
  };

  scheduleNotification = ({
    id,
    title,
    message,
    date,
    channelId,
    data,
  }: {
    id: string;
    title: string;
    message: string;
    date: Date;
    channelId: string;
    data: any;
  }) => {
    PushNotification.localNotificationSchedule({
      id: id,
      channelId: channelId,
      title: title,
      message: message,
      date: date,
      allowWhileIdle: true,
      repeatTime: 1,
      data: data,
    });

    // Store notification in Redux for tracking
    store.dispatch(
      addNotification({
        id,
        title,
        message,
        scheduledFor: date.toISOString(),
        type: data.type,
        data,
      })
    );
  };

  cancelTreatmentReminders = (treatmentId: string) => {
    // Cancel all notifications related to this treatment
    PushNotification.getScheduledLocalNotifications((notifications) => {
      notifications.forEach((notification) => {
        if (notification.data?.treatmentId === treatmentId) {
          PushNotification.cancelLocalNotification(notification.id);
        }
      });
    });
  };

  cancelMedicationReminders = (treatmentId: string, medicationId: string) => {
    // Cancel specific medication reminders
    PushNotification.getScheduledLocalNotifications((notifications) => {
      notifications.forEach((notification) => {
        if (
          notification.data?.treatmentId === treatmentId &&
          notification.data?.medicationId === medicationId
        ) {
          PushNotification.cancelLocalNotification(notification.id);
        }
      });
    });
  };

  updateTreatmentReminders = (treatment: Treatment) => {
    // Cancel existing reminders and schedule new ones
    this.cancelTreatmentReminders(treatment.id);
    this.scheduleTreatmentReminders(treatment);
  };

  clearAllNotifications = () => {
    PushNotification.cancelAllLocalNotifications();
  };

  // Utility method to determine notification priority
  private getNotificationPriority = (priority: TreatmentPriority): string => {
    switch (priority) {
      case TreatmentPriority.HIGH:
        return 'max';
      case TreatmentPriority.MEDIUM:
        return 'high';
      case TreatmentPriority.LOW:
        return 'default';
      default:
        return 'default';
    }
  };
}

export default new NotificationService();
