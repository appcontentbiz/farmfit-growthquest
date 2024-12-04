import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import {
  List,
  Switch,
  useTheme,
  Title,
  Divider,
  Button,
  Portal,
  Dialog,
  TextInput,
  HelperText,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  updateSettings,
  selectNotificationSettings,
} from '../../store/slices/notificationSlice';
import NotificationService from '../../services/NotificationService';

const NotificationSettings = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const settings = useSelector(selectNotificationSettings);

  // Time picker state
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timePickerMode, setTimePickerMode] = useState<'start' | 'end'>('start');
  const [showResetDialog, setShowResetDialog] = useState(false);

  const handleSettingToggle = (setting: keyof typeof settings) => {
    dispatch(
      updateSettings({
        [setting]: !settings[setting],
      })
    );
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;

      dispatch(
        updateSettings({
          [timePickerMode === 'start' ? 'quietHoursStart' : 'quietHoursEnd']:
            timeString,
        })
      );
    }
  };

  const validateQuietHours = () => {
    const start = settings.quietHoursStart.split(':').map(Number);
    const end = settings.quietHoursEnd.split(':').map(Number);
    const startMinutes = start[0] * 60 + start[1];
    const endMinutes = end[0] * 60 + end[1];

    return startMinutes < endMinutes;
  };

  const resetToDefaults = () => {
    dispatch(
      updateSettings({
        treatmentAlerts: true,
        medicationReminders: true,
        checkupReminders: true,
        soundEnabled: true,
        vibrationEnabled: true,
        quietHoursEnabled: false,
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00',
      })
    );
    setShowResetDialog(false);
  };

  return (
    <ScrollView style={styles.container}>
      <Title style={styles.sectionTitle}>Alert Types</Title>
      <List.Section>
        <List.Item
          title="Treatment Alerts"
          description="Notifications for treatment schedules and updates"
          left={(props) => <List.Icon {...props} icon="medical-bag" />}
          right={() => (
            <Switch
              value={settings.treatmentAlerts}
              onValueChange={() => handleSettingToggle('treatmentAlerts')}
            />
          )}
        />
        <Divider />
        <List.Item
          title="Medication Reminders"
          description="Reminders for medication administration"
          left={(props) => <List.Icon {...props} icon="pill" />}
          right={() => (
            <Switch
              value={settings.medicationReminders}
              onValueChange={() => handleSettingToggle('medicationReminders')}
            />
          )}
        />
        <Divider />
        <List.Item
          title="Checkup Reminders"
          description="Reminders for scheduled checkups"
          left={(props) => <List.Icon {...props} icon="calendar-check" />}
          right={() => (
            <Switch
              value={settings.checkupReminders}
              onValueChange={() => handleSettingToggle('checkupReminders')}
            />
          )}
        />
      </List.Section>

      <Title style={styles.sectionTitle}>Notification Settings</Title>
      <List.Section>
        <List.Item
          title="Sound"
          description="Play sound with notifications"
          left={(props) => <List.Icon {...props} icon="volume-high" />}
          right={() => (
            <Switch
              value={settings.soundEnabled}
              onValueChange={() => handleSettingToggle('soundEnabled')}
            />
          )}
        />
        <Divider />
        <List.Item
          title="Vibration"
          description="Vibrate with notifications"
          left={(props) => <List.Icon {...props} icon="vibrate" />}
          right={() => (
            <Switch
              value={settings.vibrationEnabled}
              onValueChange={() => handleSettingToggle('vibrationEnabled')}
            />
          )}
        />
      </List.Section>

      <Title style={styles.sectionTitle}>Quiet Hours</Title>
      <List.Section>
        <List.Item
          title="Enable Quiet Hours"
          description="Mute notifications during specified hours"
          left={(props) => <List.Icon {...props} icon="moon-waning-crescent" />}
          right={() => (
            <Switch
              value={settings.quietHoursEnabled}
              onValueChange={() => handleSettingToggle('quietHoursEnabled')}
            />
          )}
        />
        {settings.quietHoursEnabled && (
          <>
            <Divider />
            <List.Item
              title="Start Time"
              description={settings.quietHoursStart}
              left={(props) => <List.Icon {...props} icon="clock-start" />}
              onPress={() => {
                setTimePickerMode('start');
                setShowTimePicker(true);
              }}
            />
            <Divider />
            <List.Item
              title="End Time"
              description={settings.quietHoursEnd}
              left={(props) => <List.Icon {...props} icon="clock-end" />}
              onPress={() => {
                setTimePickerMode('end');
                setShowTimePicker(true);
              }}
            />
            {!validateQuietHours() && (
              <HelperText type="error" visible>
                End time must be after start time
              </HelperText>
            )}
          </>
        )}
      </List.Section>

      <View style={styles.buttonContainer}>
        <Button
          mode="outlined"
          onPress={() => setShowResetDialog(true)}
          style={styles.resetButton}
        >
          Reset to Defaults
        </Button>
      </View>

      {showTimePicker && (
        <DateTimePicker
          value={(() => {
            const time =
              timePickerMode === 'start'
                ? settings.quietHoursStart
                : settings.quietHoursEnd;
            const [hours, minutes] = time.split(':').map(Number);
            const date = new Date();
            date.setHours(hours, minutes);
            return date;
          })()}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={handleTimeChange}
        />
      )}

      <Portal>
        <Dialog
          visible={showResetDialog}
          onDismiss={() => setShowResetDialog(false)}
        >
          <Dialog.Title>Reset Settings</Dialog.Title>
          <Dialog.Content>
            <List.Item
              title="Are you sure?"
              description="This will reset all notification settings to their default values"
              left={(props) => (
                <List.Icon {...props} icon="alert-circle-outline" />
              )}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowResetDialog(false)}>Cancel</Button>
            <Button onPress={resetToDefaults}>Reset</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  sectionTitle: {
    padding: 16,
    paddingBottom: 8,
  },
  buttonContainer: {
    padding: 16,
  },
  resetButton: {
    marginTop: 8,
  },
});

export default NotificationSettings;
