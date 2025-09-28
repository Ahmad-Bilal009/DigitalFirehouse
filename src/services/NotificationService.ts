import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import PushNotification from 'react-native-push-notification';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import api from '../api/api';
const Sound: any = require('react-native-sound');

export interface AlarmNotification {
  id: string;
  title: string;
  message: string;
  type: number;
  timestamp: number;
  isRead: boolean;
}

export interface AlarmType {
  title: string;
  type: number;
}

class NotificationService {
  private static instance: NotificationService;
  private soundPlayer: any = null;
  private isPlaying: boolean = false;

  // Alarm type definitions based on keywords
  private readonly alarmTypes: Record<string, AlarmType> = {
    'general': { title: 'Fire', type: 0 },
    'hazard': { title: 'Hazardous Condition', type: 1 },
    'investigation': { title: 'General Investigation', type: 2 },
    'ems': { title: 'Medical Emergency', type: 3 },
    'mva': { title: 'Motor Vehicle Accident', type: 4 },
    'structure': { title: 'Structure Fire', type: 5 },
    'vehicle': { title: 'Vehicle Fire', type: 6 },
    'outside': { title: 'Outside Fire', type: 7 },
    'co': { title: 'Carbon Monoxide Alarm', type: 8 },
    'alarm': { title: 'Alarm Activation', type: 9 },
    'assist': { title: 'Lift Assist', type: 10 },
  };

  private constructor() {
    this.initializeSound();
    this.configurePushNotifications();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private configurePushNotifications() {
    // Configure local push notifications for display
    PushNotification.configure({
      // (optional) Called when Token is generated (iOS and Android)
      onRegister: function (token: string) {
        console.log('Local notification TOKEN:', token);
      },

      // (required) Called when a remote or local notification is opened or received
      onNotification: function (notification: any) {
        console.log('Local NOTIFICATION:', notification);
        
        // Process the notification
        NotificationService.getInstance().processNotification(
          notification.title || 'Alarm',
          notification.message || notification.data?.message || '',
          notification.data || {}
        );
      },

      // IOS ONLY (optional): default: all - Permissions to register.
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },

      // Should the initial notification be popped automatically
      popInitialNotification: true,

      /**
       * (optional) default: true
       * - false: it will not call onNotification when the app is in foreground
       */
      requestPermissions: true,
    });

    // Create notification channel for Android
    PushNotification.createChannel(
      {
        channelId: 'alarm-channel',
        channelName: 'Alarm Notifications',
        channelDescription: 'Channel for alarm notifications',
        playSound: true,
        soundName: 'default',
        importance: 4,
        vibrate: true,
      },
      (created: boolean) => console.log(`Channel created: ${created}`)
    );
  }

  private async initializeSound() {
    // Initialize sound player with default sound
    try {
      this.soundPlayer = new Sound('1.mp3', Sound.MAIN_BUNDLE, (error: any) => {
        if (error) {
          console.log('Failed to load sound:', error);
        }
      });
    } catch (error) {
      console.log('Error initializing sound:', error);
    }
  }

  public async requestUserPermission(): Promise<boolean> {
    try {
      // Request Firebase messaging permission
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === FirebaseMessagingTypes.AuthorizationStatus.AUTHORIZED ||
        authStatus === FirebaseMessagingTypes.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('Firebase messaging authorization status:', authStatus);
        await this.getFCMToken();
        await this.setupTokenRefreshListener();
      }

      return enabled;
    } catch (error) {
      console.log('Error requesting permission:', error);
      return false;
    }
  }

  public async getFCMToken(): Promise<string | null> {
    try {
      const fcmToken = await messaging().getToken();
      if (fcmToken) {
        console.log('FCM Token:', fcmToken);
        await AsyncStorage.setItem('fcmToken', fcmToken);
        
        // Send FCM token to backend
        const result = await this.sendFCMTokenToBackend(fcmToken);
        if (result.success) {
          console.log('FCM token successfully sent to backend:', result.message);
        } else {
          console.log('Failed to send FCM token to backend:', result.message);
        }
        
        return fcmToken;
      }
    } catch (error) {
      console.log('Error getting FCM token:', error);
    }
    return null;
  }

  public async getStoredFCMToken(): Promise<string | null> {
    try {
      const fcmToken = await AsyncStorage.getItem('fcmToken');
      return fcmToken;
    } catch (error) {
      console.log('Error getting stored FCM token:', error);
      return null;
    }
  }

  public async sendFCMTokenToBackend(fcmToken: string): Promise<{ success: boolean; message?: string; token?: string }> {
    try {
      const deviceName = Platform.OS === 'ios' ? 'iOS Device' : 'Android Device';
      const deviceOS = Platform.OS === 'ios' ? 'iOS' : 'Android';

      const response = await api.post('/fcm-tokens', {
        token: fcmToken,
        device_name: deviceName,
        device_os: deviceOS,
      });

      // Handle the backend response
      const { message, token } = response.data;
      console.log('FCM token sent to backend successfully:', message);
      console.log('Stored token:', token);
      
      return {
        success: true,
        message: message,
        token: token
      };
    } catch (error: any) {
      console.log('Error sending FCM token to backend:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send FCM token to backend'
      };
    }
  }

  public async resendFCMTokenToBackend(): Promise<{ success: boolean; message?: string; token?: string }> {
    try {
      const storedToken = await this.getStoredFCMToken();
      if (storedToken) {
        return await this.sendFCMTokenToBackend(storedToken);
      } else {
        console.log('No stored FCM token found, generating new one...');
        const newToken = await this.getFCMToken();
        if (newToken) {
          return await this.sendFCMTokenToBackend(newToken);
        } else {
          return {
            success: false,
            message: 'Failed to generate FCM token'
          };
        }
      }
    } catch (error) {
      console.log('Error resending FCM token to backend:', error);
      return {
        success: false,
        message: 'Error resending FCM token to backend'
      };
    }
  }

  public async setupTokenRefreshListener(): Promise<void> {
    // Listen for token refresh
    messaging().onTokenRefresh(async (fcmToken: string) => {
      console.log('FCM Token refreshed:', fcmToken);
      await AsyncStorage.setItem('fcmToken', fcmToken);
      
      const result = await this.sendFCMTokenToBackend(fcmToken);
      if (result.success) {
        console.log('Refreshed FCM token successfully sent to backend:', result.message);
      } else {
        console.log('Failed to send refreshed FCM token to backend:', result.message);
      }
    });
  }

  public async onMessageReceived(): Promise<void> {
    // Handle Firebase messages when app is in foreground
    messaging().onMessage(async (remoteMessage: any) => {
      console.log('Received foreground FCM message:', remoteMessage);
      
      // Extract notification data
      const notification = remoteMessage.notification;
      const data = remoteMessage.data;
      
      if (notification && data) {
        await this.processNotification(notification.title || 'Alarm', notification.body || '', data);
      }
    });
  }

  public async onNotificationOpenedApp(): Promise<void> {
    // Handle when app is opened from notification
    messaging().onNotificationOpenedApp((remoteMessage: any) => {
      console.log('App opened from FCM notification:', remoteMessage);
      // Handle navigation based on notification type
      this.handleNotificationNavigation(remoteMessage);
    });
  }

  public async getInitialNotification(): Promise<void> {
    // Handle initial notification if app was opened from one
    const remoteMessage = await messaging().getInitialNotification();
    if (remoteMessage) {
      console.log('Initial FCM notification:', remoteMessage);
      this.handleNotificationNavigation(remoteMessage);
    }
  }

  private handleNotificationNavigation(remoteMessage: any): void {
    // Handle navigation based on notification type
    // This can be implemented based on your navigation structure
    console.log('Handling FCM notification navigation:', remoteMessage);
  }

  public async processNotification(title: string, message: string, _data: any): Promise<void> {
    try {
      // Determine alarm type based on message content
      const alarmType = this.determineAlarmType(message);
      
      // Create notification object
      const notification: AlarmNotification = {
        id: Date.now().toString(),
        title: alarmType.title,
        message: message,
        type: alarmType.type,
        timestamp: Date.now(),
        isRead: false,
      };

      // Save notification to storage
      await this.saveNotification(notification);

      // Play appropriate sound based on alarm type
      await this.playAlarmSound(alarmType.type);

      // Show local notification
      this.showLocalNotification(notification);

      // Trigger any UI updates (you can implement event emitter here)
      this.triggerNotificationUpdate(notification);

    } catch (error) {
      console.log('Error processing notification:', error);
    }
  }

  private showLocalNotification(notification: AlarmNotification) {
    PushNotification.localNotification({
      channelId: 'alarm-channel',
      title: notification.title,
      message: notification.message,
      playSound: true,
      soundName: 'default',
      importance: 4,
      priority: 'high',
      vibrate: true,
      vibration: 300,
      data: {
        id: notification.id,
        type: notification.type,
        timestamp: notification.timestamp,
      },
    });
  }

  private determineAlarmType(message: string): AlarmType {
    const lowerMessage = message.toLowerCase();
    
    // Check for keywords in the message
    for (const [keyword, alarmType] of Object.entries(this.alarmTypes)) {
      if (lowerMessage.includes(keyword)) {
        return alarmType;
      }
    }
    
    // Default to general if no keywords found
    return this.alarmTypes.general;
  }

  private async playAlarmSound(alarmType: number): Promise<void> {
    if (this.isPlaying) {
      return; // Don't play multiple sounds simultaneously
    }

    try {
      // Determine which sound file to play based on alarm type
      let soundFile = '1.mp3'; // Default sound
      
      // Map alarm types to specific sound files
      const soundMapping: Record<number, string> = {
        0: '1.mp3',  // general
        1: '2.mp3',  // hazard
        2: '3.mp3',  // investigation
        3: '4.mp3',  // ems
        4: '5.mp3',  // mva
        5: '6.mp3',  // structure
        6: '7.mp3',  // vehicle
        7: '8.mp3',  // outside
        8: '9.mp3',  // co
        9: '10.mp3', // alarm
        10: '1.mp3', // assist (use general sound)
      };

      soundFile = soundMapping[alarmType] || '1.mp3';

      // Load and play the sound
      if (this.soundPlayer) {
        this.soundPlayer.release();
      }

      this.soundPlayer = new Sound(soundFile, Sound.MAIN_BUNDLE, (error: any) => {
        if (error) {
          console.log('Failed to load sound:', error);
          return;
        }

        this.isPlaying = true;
        this.soundPlayer?.play((success: any) => {
          this.isPlaying = false;
          if (success) {
            console.log('Sound played successfully');
          } else {
            console.log('Sound playback failed');
          }
        });
      });

    } catch (error) {
      console.log('Error playing alarm sound:', error);
      this.isPlaying = false;
    }
  }

  private async saveNotification(notification: AlarmNotification): Promise<void> {
    try {
      const existingNotifications = await this.getNotifications();
      existingNotifications.unshift(notification);
      
      // Keep only last 100 notifications
      if (existingNotifications.length > 100) {
        existingNotifications.splice(100);
      }
      
      await AsyncStorage.setItem('notifications', JSON.stringify(existingNotifications));
    } catch (error) {
      console.log('Error saving notification:', error);
    }
  }

  public async getNotifications(): Promise<AlarmNotification[]> {
    try {
      const notifications = await AsyncStorage.getItem('notifications');
      return notifications ? JSON.parse(notifications) : [];
    } catch (error) {
      console.log('Error getting notifications:', error);
      return [];
    }
  }

  public async markNotificationAsRead(id: string): Promise<void> {
    try {
      const notifications = await this.getNotifications();
      const updatedNotifications = notifications.map(notification =>
        notification.id === id ? { ...notification, isRead: true } : notification
      );
      await AsyncStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    } catch (error) {
      console.log('Error marking notification as read:', error);
    }
  }

  public async clearAllNotifications(): Promise<void> {
    try {
      await AsyncStorage.removeItem('notifications');
      // Also clear all local notifications
      PushNotification.cancelAllLocalNotifications();
    } catch (error) {
      console.log('Error clearing notifications:', error);
    }
  }

  private triggerNotificationUpdate(notification: AlarmNotification): void {
    // This can be implemented with an event emitter or callback system
    // For now, we'll just log it
    console.log('New notification received:', notification);
  }

  public async stopSound(): Promise<void> {
    if (this.soundPlayer && this.isPlaying) {
      this.soundPlayer.stop();
      this.isPlaying = false;
    }
  }

  public destroy(): void {
    if (this.soundPlayer) {
      this.soundPlayer.release();
      this.soundPlayer = null;
    }
    this.isPlaying = false;
  }

  // Method to manually trigger a notification (for testing)
  public async triggerTestNotification(keyword: string = 'general'): Promise<void> {
    const testMessage = `Test notification with keyword: ${keyword}`;
    await this.processNotification('Test Alarm', testMessage, {});
  }
}

export default NotificationService;
