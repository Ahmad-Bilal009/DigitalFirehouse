import messaging from '@react-native-firebase/messaging';
import { Platform, PermissionsAndroid } from 'react-native';
import * as Keychain from 'react-native-keychain';

export interface NotificationData {
  title?: string;
  body?: string;
  [key: string]: any;
}

class FCMService {
  private fcmToken: string | null = null;
  private notificationListener: (() => void) | null = null;

  /**
   * Request notification permissions
   */
  async requestPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        
        if (enabled) {
          console.log('iOS: Notification permission granted');
        } else {
          console.log('iOS: Notification permission denied');
        }
        return enabled;
      } else {
        // Android 13+ requires runtime permission
        if (Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
        // Android 12 and below don't require runtime permission
        return true;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Get FCM token
   */
  async getToken(): Promise<string | null> {
    try {
      const token = await messaging().getToken();
      this.fcmToken = token;
      console.log('FCM Token:', token);
      
      // Store token in Keychain for later use
      if (token) {
        await Keychain.setGenericPassword('fcm_token', token);
      }
      
      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  /**
   * Delete FCM token
   */
  async deleteToken(): Promise<void> {
    try {
      await messaging().deleteToken();
      this.fcmToken = null;
      await Keychain.resetGenericPassword();
      console.log('FCM token deleted');
    } catch (error) {
      console.error('Error deleting FCM token:', error);
    }
  }

  /**
   * Check if app was opened from a notification
   */
  async checkInitialNotification(): Promise<any> {
    try {
      const remoteMessage = await messaging().getInitialNotification();
      if (remoteMessage) {
        console.log('Notification caused app to open:', remoteMessage);
        return remoteMessage;
      }
      return null;
    } catch (error) {
      console.error('Error checking initial notification:', error);
      return null;
    }
  }

  /**
   * Set up foreground message handler
   */
  onForegroundMessage(handler: (message: any) => void): () => void {
    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      console.log('Foreground message received:', remoteMessage);
      handler(remoteMessage);
    });

    this.notificationListener = unsubscribe;
    return unsubscribe;
  }

  /**
   * Set up background message handler
   * This must be called outside of React component lifecycle
   */
  setBackgroundMessageHandler(handler: (message: any) => Promise<void>): void {
    messaging().setBackgroundMessageHandler(handler);
  }

  /**
   * Set up notification opened handler (when app is in background)
   */
  onNotificationOpenedApp(handler: (message: any) => void): () => void {
    return messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('Notification opened app from background:', remoteMessage);
      handler(remoteMessage);
    });
  }

  /**
   * Subscribe to a topic
   */
  async subscribeToTopic(topic: string): Promise<void> {
    try {
      await messaging().subscribeToTopic(topic);
      console.log(`Subscribed to topic: ${topic}`);
    } catch (error) {
      console.error(`Error subscribing to topic ${topic}:`, error);
    }
  }

  /**
   * Unsubscribe from a topic
   */
  async unsubscribeFromTopic(topic: string): Promise<void> {
    try {
      await messaging().unsubscribeFromTopic(topic);
      console.log(`Unsubscribed from topic: ${topic}`);
    } catch (error) {
      console.error(`Error unsubscribing from topic ${topic}:`, error);
    }
  }

  /**
   * Get stored FCM token from Keychain
   */
  async getStoredToken(): Promise<string | null> {
    try {
      const credentials = await Keychain.getGenericPassword();
      if (credentials && credentials.password) {
        return credentials.password;
      }
      return null;
    } catch (error) {
      console.error('Error getting stored FCM token:', error);
      return null;
    }
  }

  /**
   * Initialize FCM service
   */
  async initialize(): Promise<void> {
    try {
      // Request permissions
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        console.warn('Notification permission not granted');
        return;
      }

      // Get FCM token
      await this.getToken();

      // Check if app was opened from notification
      await this.checkInitialNotification();

      // Listen for token refresh
      messaging().onTokenRefresh(async (token) => {
        console.log('FCM token refreshed:', token);
        this.fcmToken = token;
        await Keychain.setGenericPassword('fcm_token', token);
      });

      console.log('FCM service initialized');
    } catch (error) {
      console.error('Error initializing FCM service:', error);
    }
  }

  /**
   * Cleanup listeners
   */
  cleanup(): void {
    if (this.notificationListener) {
      this.notificationListener();
      this.notificationListener = null;
    }
  }
}

// Export singleton instance
export default new FCMService();

