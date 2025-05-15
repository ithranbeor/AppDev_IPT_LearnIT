import React, { useState } from 'react';
import { View, TouchableOpacity, TextInput, StyleSheet, Text, Image, Alert } from 'react-native';
import { signup } from '../src/services/api';
import AtomIcon from '../assets/images/LITlogo.png';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Add AsyncStorage

export default function SignupScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validate form fields before submitting
  const validateForm = () => {
    if (!username || !email || !password || !confirmPassword) {
      Alert.alert('Validation Error', 'All fields are required.');
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return false;
    }
    if (password.length < 6) {
      Alert.alert('Password Error', 'Password must be at least 6 characters long.');
      return false;
    }
    return true;
  };

  const handleSignup = async () => {
    // First, validate the form
    if (!validateForm()) return;

    try {
      const response = await signup(username, email, password);
      console.log('Signup response:', response.data); // 🔍 Log this

      const accessToken = response?.data?.access_token;
      const refreshToken = response?.data?.refresh_token;

      if (accessToken && refreshToken) {
        await AsyncStorage.setItem('accessToken', accessToken);
        await AsyncStorage.setItem('refreshToken', refreshToken);
        navigation.replace('Home');
      } else {
        console.log('Missing token(s)', { accessToken, refreshToken }); // Log which is missing
        Alert.alert('Signup Failed', 'Missing tokens. Please try again.');
      }
    } catch (err) {
      console.error('Signup error:', err.response?.data || err.message);
      Alert.alert('Signup Error', 'An error occurred, please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      {/* Image component for the logo */}
      <Image source={AtomIcon} style={styles.logo} />

      <Text style={styles.signupTitle}>Sign-up</Text>

      <View style={styles.signupContainer}>
        <Text style={styles.signupLabel}>Username</Text>
        <TextInput
          placeholder="Enter your username"
          value={username}
          onChangeText={setUsername}
          style={styles.input}
        />

        <Text style={styles.signupLabel}>E-mail</Text>
        <TextInput
          placeholder="Enter your e-mail"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          keyboardType="email-address"
        />

        <Text style={styles.signupLabel}>Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            placeholder="Enter your password"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            style={styles.passwordInput}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
            <Text style={{ fontSize: 16, color: 'gray' }}>{showPassword ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.signupLabel}>Confirm Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            placeholder="Confirm your password"
            secureTextEntry={!showConfirmPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            style={styles.passwordInput}
          />
          <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
            <Text style={{ fontSize: 16, color: 'gray' }}>{showConfirmPassword ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.signupButton} onPress={handleSignup}>
        <Text style={styles.signupButtonText}>Sign-up</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#282A3A',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 90,
    paddingHorizontal: 20,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
  },
  backText: {
    color: 'white',
    fontSize: 16,
  },
  logo: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  signupTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 30,
  },
  signupContainer: {
    backgroundColor: 'white',
    borderRadius: 30,
    padding: 25,
    width: '90%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  signupLabel: {
    fontSize: 16,
    color: '#22223B',
    marginBottom: 5,
    width: '100%',
    textAlign: 'left',
  },
  input: {
    backgroundColor: '#F1F3F6',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    width: '100%',
    fontSize: 16,
    color: '#22223B',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F3F6',
    borderRadius: 10,
    marginBottom: 15,
    width: '100%',
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#22223B',
  },
  eyeIcon: {
    padding: 10,
  },
  signupButton: {
    backgroundColor: '#F1F3F6',
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 60,
    marginTop: 30,
  },
  signupButtonText: {
    color: '#22223B',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
