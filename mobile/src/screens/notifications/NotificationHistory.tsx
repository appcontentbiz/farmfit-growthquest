import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import {
  List,
  Text,
  useTheme,
  IconButton,
  Menu,
  Divider,
  Searchbar,
  Chip,
  Portal,
  Dialog,
  Button,
  FAB,
} from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectNotifications,
  clearAllNotifications,
  markAsRead,
  dismissNotification,
  removeNotification,
} from '../../store/slices/notificationSlice';
import { formatDistanceToNow } from 'date-fns';
import AnimatedFAB from '../../components/common/AnimatedFAB';
import EmptyState from '../../components/common/EmptyState';

const NotificationHistory = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const notifications = useSelector(selectNotifications);

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [clearDialogVisible, setClearDialogVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isExtended, setIsExtended] = useState(true);

  // Filter notifications based on search and type
  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch =
      searchQuery === '' ||
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = !selectedType || notification.type === selectedType;

    return matchesSearch && matchesType;
  });

  // Sort notifications by date
  const sortedNotifications = [...filteredNotifications].sort(
    (a, b) =>
      new Date(b.scheduledFor).getTime() - new Date(a.scheduledFor).getTime()
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Implement refresh logic here
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleScroll = ({ nativeEvent }: any) => {
    const currentScrollPosition =
      nativeEvent?.contentOffset?.y ?? 0;
    setIsExtended(currentScrollPosition <= 0);
  };

  const handleNotificationPress = (notification: any) => {
    dispatch(markAsRead(notification.id));
    
    // Navigate based on notification type
    switch (notification.type) {
      case 'TREATMENT':
        navigation.navigate('TreatmentDetails', {
          treatmentId: notification.data.treatmentId,
        });
        break;
      case 'MEDICATION':
        navigation.navigate('MedicationDetails', {
          treatmentId: notification.data.treatmentId,
          medicationId: notification.data.medicationId,
        });
        break;
      case 'CHECKUP':
        navigation.navigate('CheckupDetails', {
          treatmentId: notification.data.treatmentId,
        });
        break;
    }
  };

  const handleNotificationLongPress = (notification: any) => {
    setSelectedNotification(notification);
    setMenuVisible(true);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'TREATMENT':
        return 'medical-bag';
      case 'MEDICATION':
        return 'pill';
      case 'CHECKUP':
        return 'calendar-check';
      default:
        return 'bell';
    }
  };

  const renderNotificationItem = ({ item: notification }: any) => (
    <List.Item
      title={notification.title}
      description={notification.message}
      left={(props) => (
        <List.Icon {...props} icon={getNotificationIcon(notification.type)} />
      )}
      right={(props) => (
        <View style={styles.rightContainer}>
          <Text style={styles.timestamp}>
            {formatDistanceToNow(new Date(notification.scheduledFor), {
              addSuffix: true,
            })}
          </Text>
          {!notification.read && <View style={styles.unreadDot} />}
        </View>
      )}
      onPress={() => handleNotificationPress(notification)}
      onLongPress={() => handleNotificationLongPress(notification)}
      style={[
        styles.notificationItem,
        notification.read && styles.readNotification,
      ]}
    />
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Searchbar
        placeholder="Search notifications"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
      >
        <Chip
          selected={selectedType === null}
          onPress={() => setSelectedType(null)}
          style={styles.filterChip}
        >
          All
        </Chip>
        <Chip
          selected={selectedType === 'TREATMENT'}
          onPress={() => setSelectedType('TREATMENT')}
          style={styles.filterChip}
        >
          Treatments
        </Chip>
        <Chip
          selected={selectedType === 'MEDICATION'}
          onPress={() => setSelectedType('MEDICATION')}
          style={styles.filterChip}
        >
          Medications
        </Chip>
        <Chip
          selected={selectedType === 'CHECKUP'}
          onPress={() => setSelectedType('CHECKUP')}
          style={styles.filterChip}
        >
          Checkups
        </Chip>
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={sortedNotifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onScroll={handleScroll}
        ListEmptyComponent={
          <EmptyState
            icon="bell-off-outline"
            title="No notifications"
            description="You're all caught up! New notifications will appear here."
          />
        }
      />

      <Menu
        visible={menuVisible}
        onDismiss={() => {
          setMenuVisible(false);
          setSelectedNotification(null);
        }}
        anchor={<View />}
      >
        <Menu.Item
          onPress={() => {
            dispatch(markAsRead(selectedNotification?.id));
            setMenuVisible(false);
          }}
          title="Mark as read"
          icon="check"
        />
        <Menu.Item
          onPress={() => {
            dispatch(dismissNotification(selectedNotification?.id));
            setMenuVisible(false);
          }}
          title="Dismiss"
          icon="close"
        />
        <Divider />
        <Menu.Item
          onPress={() => {
            dispatch(removeNotification(selectedNotification?.id));
            setMenuVisible(false);
          }}
          title="Delete"
          icon="delete"
        />
      </Menu>

      <Portal>
        <Dialog
          visible={clearDialogVisible}
          onDismiss={() => setClearDialogVisible(false)}
        >
          <Dialog.Title>Clear All Notifications</Dialog.Title>
          <Dialog.Content>
            <Text>
              Are you sure you want to clear all notifications? This action cannot
              be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setClearDialogVisible(false)}>Cancel</Button>
            <Button
              onPress={() => {
                dispatch(clearAllNotifications());
                setClearDialogVisible(false);
              }}
            >
              Clear All
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <AnimatedFAB
        icon="delete-sweep"
        label="Clear All"
        extended={isExtended}
        onPress={() => setClearDialogVisible(true)}
        visible={notifications.length > 0}
        animateFrom="right"
        iconMode="dynamic"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
  },
  searchBar: {
    marginBottom: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  filterChip: {
    marginRight: 8,
  },
  notificationItem: {
    backgroundColor: '#fff',
    marginVertical: 1,
  },
  readNotification: {
    opacity: 0.7,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 12,
    opacity: 0.6,
    marginRight: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2196F3',
  },
});

export default NotificationHistory;
