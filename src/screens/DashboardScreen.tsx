import React, { useEffect, useState, useRef } from 'react';
import { WebView } from 'react-native-webview';
import * as Keychain from 'react-native-keychain';

export default function DashboardScreen() {
  const [token, setToken] = useState('');
  const webviewRef = useRef(null);

  useEffect(() => {
    async function loadToken() {
      const creds = await Keychain.getGenericPassword();
      if (creds) {
        setToken(creds.password);
      }
    }
    loadToken();
  }, []);

  if (!token) return null;

  return (
    <WebView
      ref={webviewRef}
      source={{
        uri: 'https://testing.digitalfirehouse.com',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }}
      sharedCookiesEnabled={true}
      thirdPartyCookiesEnabled={true}
      javaScriptEnabled={true}
      domStorageEnabled={true}
      onShouldStartLoadWithRequest={(req) => {
        if (req.url.includes('testing.digitalfirehouse.com')) return true;

        if (webviewRef.current) {
          webviewRef.current.stopLoading();
          webviewRef.current.loadUrl(req.url, {
            Authorization: `Bearer ${token}`,
          });
        }
        return false;
      }}
    />
  );
}
