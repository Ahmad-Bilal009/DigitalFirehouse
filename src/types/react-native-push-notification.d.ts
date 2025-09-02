declare module 'react-native-push-notification' {
  interface PushNotificationObject {
    title?: string;
    message?: string;
    data?: any;
  }

  interface PushNotificationPermissions {
    alert?: boolean;
    badge?: boolean;
    sound?: boolean;
  }

  interface PushNotificationConfigure {
    onRegister?: (token: string) => void;
    onNotification?: (notification: PushNotificationObject) => void;
    onAction?: (notification: PushNotificationObject) => void;
    onRegistrationError?: (error: any) => void;
    permissions?: PushNotificationPermissions;
    popInitialNotification?: boolean;
    requestPermissions?: boolean;
    senderID?: string;
    id?: string;
  }

  interface PushNotificationChannel {
    channelId: string;
    channelName: string;
    channelDescription?: string;
    playSound?: boolean;
    soundName?: string;
    importance?: number;
    vibrate?: boolean;
    vibration?: number;
  }

  interface PushNotificationLocalObject {
    channelId?: string;
    title?: string;
    message?: string;
    playSound?: boolean;
    soundName?: string;
    importance?: number;
    priority?: string;
    vibrate?: boolean;
    vibration?: number;
    data?: any;
  }

  const PushNotification: {
    configure(options: PushNotificationConfigure): void;
    createChannel(channel: PushNotificationChannel, callback: (created: boolean) => void): void;
    localNotification(details: PushNotificationLocalObject): void;
    cancelAllLocalNotifications(): void;
    cancelLocalNotifications(details: any): void;
    scheduleNotification(details: any): void;
    cancelScheduledNotification(id: string): void;
    cancelAllScheduledNotifications(): void;
    getScheduledLocalNotifications(callback: (notifications: any[]) => void): void;
    getDeliveredNotifications(callback: (notifications: any[]) => void): void;
    removeDeliveredNotifications(identifiers: string[]): void;
    removeAllDeliveredNotifications(): void;
    requestPermissions(permissions?: string[]): Promise<PushNotificationPermissions>;
    abandonPermissions(): void;
    checkPermissions(callback: (permissions: PushNotificationPermissions) => void): void;
    getInitialNotification(callback: (notification: PushNotificationObject | null) => void): void;
    getBadgeCount(callback: (count: number) => void): void;
    setBadgeCount(count: number): void;
    clearAllNotifications(): void;
    getChannels(callback: (channel_ids: string[]) => void): void;
    channelExists(channelId: string, callback: (exists: boolean) => void): void;
    deleteChannel(channelId: string): void;
  };

  export = PushNotification;
}
