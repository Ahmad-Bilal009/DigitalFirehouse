import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import NotificationService, { AlarmNotification } from './NotificationService';

// Re-export the AlarmNotification interface for use in other components
export type { AlarmNotification } from './NotificationService';

interface NotificationContextType {
  notifications: AlarmNotification[];
  unreadCount: number;
  addNotification: (notification: AlarmNotification) => void;
  markAsRead: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  stopSound: () => Promise<void>;
  triggerTestNotification: (keyword?: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<AlarmNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const notificationService = NotificationService.getInstance();

  useEffect(() => {
    initializeNotifications();
    setupNotificationListeners();
  }, []);

  const initializeNotifications = async () => {
    try {
      // Request permission and setup push notifications
      await notificationService.requestUserPermission();
      
      // Setup message handlers
      await notificationService.onMessageReceived();
      await notificationService.onNotificationOpenedApp();
      await notificationService.getInitialNotification();
      
      // Load existing notifications
      await refreshNotifications();
    } catch (error) {
      console.log('Error initializing notifications:', error);
    }
  };

  const setupNotificationListeners = () => {
    // Listen for new notifications (you can implement event emitter here)
    // For now, we'll use a polling mechanism
    const interval = setInterval(async () => {
      await refreshNotifications();
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  };

  const refreshNotifications = async () => {
    try {
      const newNotifications = await notificationService.getNotifications();
      setNotifications(newNotifications);
      setUnreadCount(newNotifications.filter(n => !n.isRead).length);
    } catch (error) {
      console.log('Error refreshing notifications:', error);
    }
  };

  const addNotification = (notification: AlarmNotification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
  };

  const markAsRead = async (id: string) => {
    try {
      await notificationService.markNotificationAsRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.log('Error marking notification as read:', error);
    }
  };

  const clearAll = async () => {
    try {
      await notificationService.clearAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.log('Error clearing notifications:', error);
    }
  };

  const stopSound = async () => {
    try {
      await notificationService.stopSound();
    } catch (error) {
      console.log('Error stopping sound:', error);
    }
  };

  const triggerTestNotification = async (keyword: string = 'general') => {
    try {
      await notificationService.triggerTestNotification(keyword);
      await refreshNotifications();
    } catch (error) {
      console.log('Error triggering test notification:', error);
    }
  };

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    clearAll,
    refreshNotifications,
    stopSound,
    triggerTestNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
