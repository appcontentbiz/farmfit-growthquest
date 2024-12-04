import { UserProfile } from '../types/user';

interface Notification {
    id: string;
    userId: string;
    type: 'message' | 'mention' | 'achievement' | 'event' | 'reminder' | 'alert';
    title: string;
    content: string;
    timestamp: Date;
    read: boolean;
    priority: 'low' | 'medium' | 'high';
    actionUrl?: string;
    category?: string;
}

interface NotificationPreferences {
    userId: string;
    channels: {
        email: boolean;
        push: boolean;
        inApp: boolean;
    };
    frequencies: {
        daily: boolean;
        weekly: boolean;
        immediate: boolean;
    };
    categories: {
        [key: string]: boolean;
    };
}

export class NotificationSystem {
    private notifications: Map<string, Notification[]>;
    private preferences: Map<string, NotificationPreferences>;

    constructor() {
        this.notifications = new Map();
        this.preferences = new Map();
    }

    public async sendNotification(
        notification: Notification
    ): Promise<boolean> {
        try {
            const userNotifications = this.notifications.get(notification.userId) || [];
            userNotifications.push(notification);
            this.notifications.set(notification.userId, userNotifications);

            await this.deliverNotification(notification);
            return true;
        } catch (error) {
            console.error('Error sending notification:', error);
            return false;
        }
    }

    public async sendAchievementNotification(
        userId: string,
        achievement: string,
        description: string
    ): Promise<void> {
        const notification: Notification = {
            id: `achievement_${Date.now()}`,
            userId,
            type: 'achievement',
            title: `New Achievement: ${achievement}`,
            content: description,
            timestamp: new Date(),
            read: false,
            priority: 'medium',
            category: 'achievements'
        };

        await this.sendNotification(notification);
    }

    public async sendEventReminder(
        userId: string,
        eventName: string,
        startTime: Date,
        description: string
    ): Promise<void> {
        const notification: Notification = {
            id: `event_${Date.now()}`,
            userId,
            type: 'event',
            title: `Upcoming Event: ${eventName}`,
            content: description,
            timestamp: startTime,
            read: false,
            priority: 'high',
            category: 'events'
        };

        await this.sendNotification(notification);
    }

    public async sendTherapyReminder(
        userId: string,
        activityName: string,
        scheduledTime: Date
    ): Promise<void> {
        const notification: Notification = {
            id: `therapy_${Date.now()}`,
            userId,
            type: 'reminder',
            title: 'Therapeutic Activity Reminder',
            content: `Time for your ${activityName} session`,
            timestamp: scheduledTime,
            read: false,
            priority: 'high',
            category: 'therapy'
        };

        await this.sendNotification(notification);
    }

    public async sendGardeningTip(
        userId: string,
        tip: string
    ): Promise<void> {
        const notification: Notification = {
            id: `tip_${Date.now()}`,
            userId,
            type: 'alert',
            title: 'Daily Gardening Tip',
            content: tip,
            timestamp: new Date(),
            read: false,
            priority: 'low',
            category: 'tips'
        };

        await this.sendNotification(notification);
    }

    private async deliverNotification(
        notification: Notification
    ): Promise<void> {
        const preferences = this.preferences.get(notification.userId);
        if (!preferences) return;

        if (preferences.channels.email) {
            await this.sendEmailNotification(notification);
        }
        if (preferences.channels.push) {
            await this.sendPushNotification(notification);
        }
        if (preferences.channels.inApp) {
            await this.sendInAppNotification(notification);
        }
    }

    private async sendEmailNotification(
        notification: Notification
    ): Promise<void> {
        // Implement email notification
    }

    private async sendPushNotification(
        notification: Notification
    ): Promise<void> {
        // Implement push notification
    }

    private async sendInAppNotification(
        notification: Notification
    ): Promise<void> {
        // Implement in-app notification
    }

    public getUnreadNotifications(
        userId: string
    ): Notification[] {
        const userNotifications = this.notifications.get(userId) || [];
        return userNotifications.filter(notification => !notification.read);
    }

    public markAsRead(
        userId: string,
        notificationId: string
    ): boolean {
        const userNotifications = this.notifications.get(userId);
        if (!userNotifications) return false;

        const notification = userNotifications.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
            return true;
        }
        return false;
    }

    public updatePreferences(
        userId: string,
        preferences: NotificationPreferences
    ): void {
        this.preferences.set(userId, preferences);
    }

    public getNotificationCategories(): string[] {
        return [
            'achievements',
            'events',
            'therapy',
            'tips',
            'community',
            'expert_sessions',
            'plant_care',
            'support_group'
        ];
    }
}
