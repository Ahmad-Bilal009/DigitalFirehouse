import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Linking } from 'react-native';
 // or use a custom checkbox
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import api from '../api/api';
import * as Keychain from 'react-native-keychain';

export default function LoginScreen({ route }) {
  const navigation = useNavigation();
  // Props from navigation or default values
  const canResetPassword = route?.params?.canResetPassword ?? true;
  const status = route?.params?.status ?? '';

  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [statusMsg, setStatusMsg] = useState(status);
  const [apiToken, setApiToken] = useState('');

  const handleLogin = async () => {
    setErrors({});
    if (!login || !password) {
      setErrors({
        login: !login ? 'Login is required.' : undefined,
        password: !password ? 'Password is required.' : undefined,
      });
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/login', { login, password, remember });
      // Assume the token is in response.data.token or similar
      const token = response.data.token;
      if (token) {
        await Keychain.setGenericPassword('api', token);
        navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
      } else {
        setStatusMsg('Login successful, but no token received.');
      }
    } catch (error) {
      if (error.response) {
        const data = error.response.data || {};
        console.log('Login error response:', error.response);
        console.log('Login error data:', data);
        setErrors(data.errors || {});
        setStatusMsg(data.message || 'Invalid credentials.');
      } else {
        console.log('Login network error:', error);
        setStatusMsg('Network error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.logoContainer}>
        <Image source={require('../assets/logo-white.png')} style={styles.logo} resizeMode="contain" />
      </View>
      <Text style={styles.status}>{statusMsg || 'Welcome Back'}</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email or Username"
          value={login}
          onChangeText={setLogin}
          autoCapitalize="none"
          autoFocus
        />
        {errors.login && <Text style={styles.error}>{errors.login}</Text>}
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        {errors.password && <Text style={styles.error}>{errors.password}</Text>}
        {/* <View style={styles.rememberRow}>
          <CheckBox value={remember} onValueChange={setRemember} />
          <Text style={styles.rememberText}>Remember me</Text>
        </View> */}
        {canResetPassword && (
          <TouchableOpacity onPress={() => Linking.openURL('https://app.digitalfirehouse.com/password/request')} style={styles.forgotButton}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.loginButton, loading && { opacity: 0.5 }]} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.loginText}>Login</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.signupText}>Don't have an account? Sign up</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 250,
    height: 100,
    
  },
  title: {
    color: '#142A42',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  inputContainer: {
    width: '100%',
    alignItems: 'center',
  },
  input: {
    width: '100%',
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
    color: '#142A42',
    borderWidth: 1,
    borderColor: '#B0B8C1',
  },
  forgotButton: {
    alignSelf: 'flex-start',
    marginBottom: 24,
  },
  forgotText: {
    color: '#142A42',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  loginButton: {
    width: '100%',
    height: 48,
    backgroundColor: '#142A42',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  loginText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  status: {
    color: '#142A42',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  error: {
    color: 'red',
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  rememberText: {
    color: '#142A42',
    fontSize: 14,
    marginLeft: 8,
  },
  signupText: {
    color: '#142A42',
    fontSize: 14,
    textDecorationLine: 'underline',
    marginTop: 20,
  },
}); 