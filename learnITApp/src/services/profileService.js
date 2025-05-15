// src/services/profileService.js
import api from './api';  
import AsyncStorage from '@react-native-async-storage/async-storage';

export const getProfile = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    
    if (!token) {
      throw new Error('No token found. Please log in.');
    }

    const response = await api.get('/profile/', {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });
    console.log(response.data);
    return response.data;  
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;  
  }
};
