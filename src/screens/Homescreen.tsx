import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Text,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import {
  requestMultiple,
  PERMISSIONS,
  RESULTS,
  Permission,
} from 'react-native-permissions';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Keychain from 'react-native-keychain';

const BASE_URL = 'https://testing.digitalfirehouse.com';

const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!login.trim() || !password.trim()) {
      Alert.alert('Validation Error', 'Please enter both email and password');
      return;
    }

    setIsLoading(true);
    try {
      const deviceName = Platform.OS === 'ios' 
        ? 'iPhone App' 
        : 'Android App';
      
      // Use /api/login for bearer token authentication
      const response = await fetch(`${BASE_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          login: login.trim(),
          password,
          device_name: deviceName,
        }),
      });

      const result = await response.json();
      console.log('Login response:', { status: response.status, data: result });

      if (response.ok && result.token) {
        // Store the bearer token
        await Keychain.setGenericPassword('api_token', result.token);
        
        // If remember me is checked, also store email
        if (rememberMe) {
          await Keychain.setInternetCredentials(
            'digitalfirehouse',
            login.trim(),
            password
          );
        }
        
        console.log('Login successful, token stored');
        Alert.alert('Success', 'Login successful!');
        
        navigation.replace('Dashboard');
      } else {
        Alert.alert('Login Failed', result?.message || 'Invalid credentials');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Extract error details
      const errorMessage = error?.message || 'Network error. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

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
        handleDeniedPermissions(statuses);
      }
      
      // Notification permissions are handled by FCMService
    }
    
    function handleDeniedPermissions(statuses: Record<string, string>) {
      const denied = Object.entries(statuses).filter(([, status]) => status !== RESULTS.GRANTED);
      if (denied.length > 0) {
        Alert.alert(
          'Permissions Required',
          'Some permissions were denied. The app may not function correctly without camera and storage permissions.'
        );
      }
    }
    
    requestPermissions();
  }, []);



  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.loginContainer}>
            <Text style={styles.title}>Digital Firehouse</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email / Username</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email or username"
                placeholderTextColor="#999"
                value={login}
                onChangeText={setLogin}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setRememberMe(!rememberMe)}
              disabled={isLoading}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                {rememberMe && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>Remember me</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>Login</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  loginContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#142A42',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#142A42',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#000',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#142A42',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: '#142A42',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#142A42',
  },
  loginButton: {
    height: 50,
    backgroundColor: '#142A42',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default HomeScreen;
