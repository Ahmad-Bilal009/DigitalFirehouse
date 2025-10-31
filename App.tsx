/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */


import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Splashscreen from './src/screens/Splashscreen';
import HomeScreen from './src/screens/HomeScreen';
import { NotificationProvider } from './src/services/NotificationContext';

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

export default function App() {
  return (
    <NotificationProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Splash" component={SplashscreenWithTimeout} />
          <Stack.Screen name="Home" component={HomeScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </NotificationProvider>
  );
}
