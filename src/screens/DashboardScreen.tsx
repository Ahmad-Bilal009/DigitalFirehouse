import React, { useEffect, useState, useRef } from 'react';
import { View, ActivityIndicator, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Keychain from 'react-native-keychain';
import CookieManager from '@react-native-cookies/cookies';

const BASE_URL = 'https://testing.digitalfirehouse.com';
const COOKIE_NAME = 'digital_firehouse_session';

export default function DashboardScreen() {
  const webviewRef = useRef<WebView>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function prepareSession() {
      try {
        // 1️⃣ Load saved session id (NOT JWT token)
        const creds = await Keychain.getGenericPassword();
        if (!creds?.password) {
          console.log('❌ No session found');
          return;
        }

        const sessionId = creds.password;

        // 2️⃣ Clear old cookies (important)
        await CookieManager.clearAll(true);

        // 3️⃣ Set session cookie
        await CookieManager.set(BASE_URL, {
          name: COOKIE_NAME,
          value: sessionId,
          domain: 'testing.digitalfirehouse.com',
          path: '/',
          secure: true,
          httpOnly: false, // backend JS must read
        });

        // 4️⃣ Android cookie persistence
        if (Platform.OS === 'android') {
          await CookieManager.flush();
        }

        console.log('✅ Session cookie set');

        // 5️⃣ Allow WebView to load
        setReady(true);
      } catch (e) {
        console.error('Cookie setup failed', e);
      }
    }

    prepareSession();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <WebView
      ref={webviewRef}
      source={{ uri: BASE_URL }}
      sharedCookiesEnabled
      thirdPartyCookiesEnabled
      javaScriptEnabled
      domStorageEnabled
      startInLoadingState
      onLoadEnd={() => {
        console.log('🌐 WebView loaded');
      }}
    />
  );
}
