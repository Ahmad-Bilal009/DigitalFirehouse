import React, { useEffect } from 'react';
import { View, StyleSheet, Alert, Platform, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import {
    requestMultiple,
    requestNotifications,
    checkNotifications,
    PERMISSIONS,
    RESULTS,
    Permission,
  } from 'react-native-permissions';
import { SafeAreaView } from 'react-native-safe-area-context';
  

export default function Homescreen() {
  useEffect(() => {
    async function requestPermissions() {
        let permissionsToRequest: Permission[] = [];
      
        if (Platform.OS === 'android') {
          permissionsToRequest = [
            PERMISSIONS.ANDROID.CAMERA,
            PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
            PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
            PERMISSIONS.ANDROID.POST_NOTIFICATIONS,
          ];
          const statuses = await requestMultiple(permissionsToRequest);
          handleDeniedPermissions(statuses);
        } else if (Platform.OS === 'ios') {
          permissionsToRequest = [
            PERMISSIONS.IOS.CAMERA,
            PERMISSIONS.IOS.PHOTO_LIBRARY,
          ];
          const statuses = await requestMultiple(permissionsToRequest);
      
          // ✅ Separate call for notification permission
          const { status: notificationStatus } = await requestNotifications(['alert', 'sound', 'badge']);
          statuses['NOTIFICATIONS'] = notificationStatus;
      
          handleDeniedPermissions(statuses);
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

  const [hasError, setHasError] = React.useState(false);
  const webViewUrl = 'https://app.digitalfirehouse.com/alert';

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.warn('WebView error: ', nativeEvent);
    setHasError(true);
    Alert.alert('Error', 'Failed to load the App. Please check your internet connection.');
  };

  if (hasError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load webpage</Text>
        <Text style={styles.errorSubText}>Please check your internet connection and try again.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        source={{ uri: webViewUrl }}
        style={styles.webview}
        onError={handleError}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 10,
  },
  errorSubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});