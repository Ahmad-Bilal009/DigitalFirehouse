import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Alert, Platform, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import {
  requestMultiple,
  requestNotifications,
  PERMISSIONS,
  RESULTS,
  Permission,
} from 'react-native-permissions';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Keychain from 'react-native-keychain';

const BASE_URL = 'https://testing.digitalfirehouse.com';

const HomeScreen: React.FC = () => {
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function requestPermissions() {
      let permissionsToRequest: Permission[] = [];
      
      if (Platform.OS === 'android') {
        permissionsToRequest = [
          PERMISSIONS.ANDROID.CAMERA,
          PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
          PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
        ];
        const statuses = await requestMultiple(permissionsToRequest);
        handleDeniedPermissions(statuses);
      } else if (Platform.OS === 'ios') {
        permissionsToRequest = [
          PERMISSIONS.IOS.CAMERA,
          PERMISSIONS.IOS.PHOTO_LIBRARY,
        ];
        const statuses = await requestMultiple(permissionsToRequest);
        
        // Separate call for notification permission
        const { status: notificationStatus } = await requestNotifications(['alert', 'sound', 'badge']);
        const allStatuses = { ...statuses, NOTIFICATIONS: notificationStatus };
        handleDeniedPermissions(allStatuses);
      }
    }
    
    function handleDeniedPermissions(statuses: Record<string, string>) {
      const denied = Object.entries(statuses).filter(([, status]) => status !== RESULTS.GRANTED);
      if (denied.length > 0) {
        Alert.alert(
          'Permissions Required',
          'Some permissions were denied. The app may not function correctly without camera, storage, and notification permissions.'
        );
      }
    }
    
    requestPermissions();
  }, []);

  const handleMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      // Handle authentication token from WebView
      if (data.type === 'auth_token' && data.token) {
        await Keychain.setGenericPassword('api_token', data.token);
        console.log('Auth token stored successfully');
      }
      
      // Handle login request from WebView
      if (data.type === 'login' && data.email && data.password) {
        await handleLogin(data.email, data.password);
      }
    } catch (error) {
      console.log('Error handling WebView message:', error);
    }
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      const deviceName = Platform.OS === 'ios' 
        ? 'iPhone App' 
        : 'Android App';
      
      const response = await fetch(`${BASE_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          device_name: deviceName,
        }),
      });

      const result = await response.json();

      if (response.ok && result.token) {
        // Store the auth token
        await Keychain.setGenericPassword('api_token', result.token);
        
        // Send token back to WebView
        webViewRef.current?.injectJavaScript(`
          window.postMessage(JSON.stringify({
            type: 'login_success',
            token: '${result.token}'
          }), '*');
          true;
        `);
        
        console.log('Login successful, token stored');
      } else {
        // Send error back to WebView
        webViewRef.current?.injectJavaScript(`
          window.postMessage(JSON.stringify({
            type: 'login_error',
            message: '${result.message || 'Login failed'}'
          }), '*');
          true;
        `);
        
        Alert.alert('Login Failed', result.message || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
      
      // Send error back to WebView
      webViewRef.current?.injectJavaScript(`
        window.postMessage(JSON.stringify({
          type: 'login_error',
          message: 'Network error'
        }), '*');
        true;
      `);
    }
  };

  const injectedJavaScript = `
    (function() {
      // Intercept fetch requests to add auth token
      const originalFetch = window.fetch;
      window.fetch = async function(...args) {
        const [url, options = {}] = args;
        
        // Add Authorization header if token exists
        const token = localStorage.getItem('auth_token');
        if (token) {
          options.headers = {
            ...options.headers,
            'Authorization': 'Bearer ' + token
          };
        }
        
        return originalFetch(url, options);
      };

      // Listen for messages from React Native
      window.addEventListener('message', function(event) {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'login_success' && data.token) {
            localStorage.setItem('auth_token', data.token);
            console.log('Token stored in localStorage');
          }
        } catch (e) {
          console.error('Error processing message:', e);
        }
      });

      // Expose a function to send login requests to React Native
      window.ReactNativeWebView = {
        postMessage: function(data) {
          if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage(data);
          }
        }
      };
    })();
    true;
  `;

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.warn('WebView error: ', nativeEvent);
    Alert.alert('Error', 'Failed to load the app. Please check your internet connection.');
  };

  return (
    <SafeAreaView style={styles.container}>
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#142A42" />
        </View>
      )}
      <WebView
        ref={webViewRef}
        source={{ uri: BASE_URL }}
        style={styles.webview}
        onError={handleError}
        onMessage={handleMessage}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        injectedJavaScript={injectedJavaScript}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    zIndex: 1,
  },
});

export default HomeScreen;
