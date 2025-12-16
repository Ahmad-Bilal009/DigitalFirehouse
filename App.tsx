import HomeScreen from './src/screens/Homescreen';
import DashboardScreen from './src/screens/DashboardScreen';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import Splashscreen from './src/screens/Splashscreen';
import React, { useEffect } from 'react';
import FCMService from './src/services/FCMService';
import { Alert } from 'react-native';

const Stack = createStackNavigator();

function SplashscreenWithTimeout({ navigation }: any) {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Home');
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigation]);
  return <Splashscreen />;
}

function App() {
  useEffect(() => {
    // Initialize FCM service
    FCMService.initialize().catch(error => {
      console.error('Failed to initialize FCM:', error);
    });

    // Set up foreground message handler
    const unsubscribeForeground = FCMService.onForegroundMessage((remoteMessage) => {
      console.log('Foreground notification received:', remoteMessage);
      
      // Show alert for foreground notifications
      if (remoteMessage.notification) {
        Alert.alert(
          remoteMessage.notification.title || 'Notification',
          remoteMessage.notification.body || '',
          [{ text: 'OK' }]
        );
      }
    });

    // Set up notification opened handler (when app is in background)
    const unsubscribeOpened = FCMService.onNotificationOpenedApp((remoteMessage) => {
      console.log('Notification opened app:', remoteMessage);
      // Handle navigation or other actions when notification is tapped
    });

    // Check if app was opened from a notification
    FCMService.checkInitialNotification().then((remoteMessage) => {
      if (remoteMessage) {
        console.log('App opened from notification:', remoteMessage);
        // Handle navigation or other actions
      }
    });

    // Cleanup on unmount
    return () => {
      unsubscribeForeground();
      unsubscribeOpened();
      FCMService.cleanup();
    };
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashscreenWithTimeout} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
