import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function RegisterScreen() {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [statusMsg, setStatusMsg] = useState('');

  const handleRegister = async () => {
    setErrors({});
    setStatusMsg('');
    if (!name || !email || !password || !passwordConfirmation) {
      setErrors({
        name: !name ? 'Name is required.' : undefined,
        email: !email ? 'Email is required.' : undefined,
        password: !password ? 'Password is required.' : undefined,
        passwordConfirmation: !passwordConfirmation ? 'Password confirmation is required.' : undefined,
      });
      return;
    }
    if (password !== passwordConfirmation) {
      setErrors({ passwordConfirmation: 'Passwords do not match.' });
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('https://app.digitalfirehouse.com/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ name, email, password, password_confirmation: passwordConfirmation }),
      });
      const text = await response.text();
      let data;
      try { data = JSON.parse(text); } catch { data = {}; }
      if (response.ok) {
        setStatusMsg('Registration successful! Please log in.');
        setTimeout(() => navigation.navigate('Login'), 1500);
      } else {
        setErrors(data.errors || {});
        setStatusMsg(data.message || 'Registration failed.');
      }
    } catch (error) {
      setStatusMsg('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={styles.title}>Create Account</Text>
      {statusMsg ? <Text style={styles.status}>{statusMsg}</Text> : null}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Name"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
        {errors.name && <Text style={styles.error}>{errors.name}</Text>}
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        {errors.email && <Text style={styles.error}>{errors.email}</Text>}
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        {errors.password && <Text style={styles.error}>{errors.password}</Text>}
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          value={passwordConfirmation}
          onChangeText={setPasswordConfirmation}
          secureTextEntry
        />
        {errors.passwordConfirmation && <Text style={styles.error}>{errors.passwordConfirmation}</Text>}
        <TouchableOpacity style={[styles.registerButton, loading && { opacity: 0.5 }]} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.registerText}>Register</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginText}>Already have an account? Log in</Text>
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
  title: {
    color: '#142A42',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  status: {
    color: '#142A42',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
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
    marginBottom: 12,
    color: '#142A42',
    borderWidth: 1,
    borderColor: '#B0B8C1',
  },
  error: {
    color: 'red',
    fontSize: 12,
    marginTop: -8,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  registerButton: {
    width: '100%',
    height: 48,
    backgroundColor: '#142A42',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  registerText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginText: {
    color: '#142A42',
    fontSize: 14,
    textDecorationLine: 'underline',
    marginTop: 20,
  },
}); 