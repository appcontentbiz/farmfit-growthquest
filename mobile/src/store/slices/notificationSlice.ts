import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Notification {
  id: string;
  title: string;
  message: string;
  scheduledFor: string;
  type: 'TREATMENT' | 'MEDICATION' | 'CHECKUP';
  data: any;
  read?: boolean;
  dismissed?: boolean;
}

interface NotificationState {
  notifications: Notification[];
  settings: {
    treatmentAlerts: boolean;
    medicationReminders: boolean;
    checkupReminders: boolean;
    soundEnabled: boolean;
    vibrationEnabled: boolean;
    quietHoursEnabled: boolean;
    quietHoursStart: string;
    quietHoursEnd: string;
  };
}

const initialState: NotificationState = {
  notifications: [],
  settings: {
    treatmentAlerts: true,
    medicationReminders: true,
    checkupReminders: true,
    soundEnabled: true,
    vibrationEnabled: true,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
  },
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.push(action.payload);
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(
        (n) => n.id === action.payload
      );
      if (notification) {
        notification.read = true;
      }
    },
    dismissNotification: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(
        (n) => n.id === action.payload
      );
      if (notification) {
        notification.dismissed = true;
      }
    },
    clearAllNotifications: (state) => {
      state.notifications = [];
    },
    updateSettings: (
      state,
      action: PayloadAction<Partial<NotificationState['settings']>>
    ) => {
      state.settings = {
        ...state.settings,
        ...action.payload,
      };
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        (n) => n.id !== action.payload
      );
    },
    removeNotificationsByType: (
      state,
      action: PayloadAction<Notification['type']>
    ) => {
      state.notifications = state.notifications.filter(
        (n) => n.type !== action.payload
      );
    },
    removeNotificationsByTreatment: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        (n) => n.data?.treatmentId !== action.payload
      );
    },
  },
});

export const {
  addNotification,
  markAsRead,
  dismissNotification,
  clearAllNotifications,
  updateSettings,
  removeNotification,
  removeNotificationsByType,
  removeNotificationsByTreatment,
} = notificationSlice.actions;

export const selectNotifications = (state: { notifications: NotificationState }) =>
  state.notifications.notifications;

export const selectUnreadNotifications = (state: {
  notifications: NotificationState;
}) => state.notifications.notifications.filter((n) => !n.read);

export const selectNotificationSettings = (state: {
  notifications: NotificationState;
}) => state.notifications.settings;

export const selectNotificationsByType = (
  state: { notifications: NotificationState },
  type: Notification['type']
) => state.notifications.notifications.filter((n) => n.type === type);

export const selectNotificationsByTreatment = (
  state: { notifications: NotificationState },
  treatmentId: string
) =>
  state.notifications.notifications.filter(
    (n) => n.data?.treatmentId === treatmentId
  );

export default notificationSlice.reducer;
