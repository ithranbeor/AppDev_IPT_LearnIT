import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Text,
  Image,
  Alert,
  ActivityIndicator
} from 'react-native';
import { login } from '../src/services/api';
import AtomIcon from '../assets/images/LITlogo.png';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const checkRememberMe = async () => {
      const savedUsername = await AsyncStorage.getItem('username');
      const savedPassword = await AsyncStorage.getItem('password');
      if (savedUsername && savedPassword) {
        setUsername(savedUsername);
        setPassword(savedPassword);
        setRememberMe(true);
      }
    };
    checkRememberMe();
  }, []);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Missing Fields', 'Please enter both username and password.');
      return;
    }

    setLoading(true);
    try {
      const response = await login(username, password);

      if (response && response.access_token) {
        await AsyncStorage.setItem('accessToken', response.access_token);

        if (rememberMe) {
          await AsyncStorage.setItem('username', username);
          await AsyncStorage.setItem('password', password);
        } else {
          await AsyncStorage.removeItem('username');
          await AsyncStorage.removeItem('password');
        }

        navigation.replace('Home');
      } else {
        Alert.alert('Login Failed', 'Tokens not received, please try again.');
      }
    } catch (err) {
      Alert.alert('Oops!', err.response?.data?.detail || 'Check your username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>

      <Image source={AtomIcon} style={styles.logo} />
      <Text style={styles.welcomeText}>Welcome to LearnIT</Text>

      <View style={styles.signInContainer}>
        <Text style={styles.signInTitle}>Sign-in</Text>

        <TextInput
          placeholder="Username"
          placeholderTextColor="#999"
          value={username}
          onChangeText={setUsername}
          style={styles.input}
          editable={!loading}
        />

        <View style={styles.passwordContainer}>
          <TextInput
            placeholder="Password"
            placeholderTextColor="#999"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            style={styles.passwordInput}
            editable={!loading}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon} disabled={loading}>
            <Text style={{ fontSize: 14, color: '#444' }}>
              {showPassword ? 'Hide' : 'Show'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.rememberMeContainer}>
          <TouchableOpacity onPress={() => setRememberMe(!rememberMe)} style={styles.checkbox} disabled={loading}>
            <Text style={{ fontSize: 16, color: '#22223B' }}>
              {rememberMe ? '✓ Remember Me' : 'Remember Me'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity
          style={styles.signInButton}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#282A3A" />
          ) : (
            <Text style={styles.signInButtonText}>Sign-in</Text>
          )}
        </TouchableOpacity>

      <TouchableOpacity style={styles.signUpButton} onPress={() => navigation.navigate('Signup')} disabled={loading}>
        <Text style={styles.signUpText}>Don't have an account? Sign up</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#282A3A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  skipButton: {
    position: 'absolute',
    top: 46,
    right: 16,
  },
  skipText: {
    fontSize: 14,
    color: 'white',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: 'white',
    padding: 10,
  },
  signInContainer: {
    width: '100%',
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    paddingVertical: 30,
    borderRadius: 50,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  signInTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#22223B',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 20,
    borderRadius: 5,
  },
  passwordContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
  },
  eyeIcon: {
    position: 'absolute',
    right: 10,
    top: 10,
  },
  rememberMeContainer: {
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signInButton: {
    backgroundColor: 'white',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 50,
    alignItems: 'center',
    top: 10,
  },
  signInButtonText: {
    color: '#282A3A',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signUpButton: {
    marginTop: 150,
  },
  signUpText: {
    fontSize: 14,
    color: 'white',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});
