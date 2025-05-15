import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

export const API_URL = 'http://192.168.1.78:8000'; 

export const BASE_URL = 'http://192.168.1.78:8000/api';
const api = axios.create({
  baseURL: 'http://192.168.1.78:8000/api', 
  headers: {
    'Content-Type': 'application/json',
  },
});

export const login = async (username, password) => {
  try {
    const response = await axios.post(`${BASE_URL}/login/`, {
      username,
      password,
    });
    const token = response.data.access_token;
    
    await AsyncStorage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const logout = async () => {
  try {
    const refreshToken = await AsyncStorage.getItem('refresh_token'); // 👈 match spelling
    if (refreshToken) {
      await axios.post(`${BASE_URL}/logout/`, { refresh_token: refreshToken });
    }

    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
  } catch (error) {
    console.error('Logout error:', error.response?.data || error.message);
    throw new Error('Failed to logout');
  }
};

export const getVideos = async () => {
  let token = await AsyncStorage.getItem('accessToken');
  try {
    const response = await axios.get(`${BASE_URL}/videos/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get profile data
export const getProfile = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new Error('No token found');
    }

    const response = await api.get('/profile/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching profile:', error.response?.data || error.message);
    throw error;
  }
};

// Refresh access token
export const refreshAccessToken = async () => {
  const refresh = await AsyncStorage.getItem('refreshToken');
  try {
    const response = await axios.post(`${BASE_URL}/token/refresh/`, {
      refresh,
    });
    const newAccessToken = response.data.access;
    await AsyncStorage.setItem('accessToken', newAccessToken);
    return newAccessToken;
  } catch (error) {
    console.error('Token refresh failed:', error.response?.data || error.message);
    throw error;
  }
};



export const updateProfile = async (token, profileData) => {
  const formData = new FormData();

  if (profileData.email) formData.append('user.email', profileData.email);
  if (profileData.description) formData.append('description', profileData.description);

  if (profileData.picture) {
    formData.append('picture', {
      uri: profileData.picture.uri,
      name: 'profile.jpg',
      type: 'image/jpeg',
    });
  }

  try {
    const response = await axios.put(`${BASE_URL}/profile/update/`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
};

export const signup = async (username, email, password) => {
  try {
    const response = await axios.post(`${BASE_URL}/signup/`, {
      username,
      email,
      password,
      password_confirm: password,
    });
    return response;
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
};

export const incrementVideoView = async (videoId) => {
  try {
    const response = await axios.post(`${BASE_URL}/videos/${videoId}/increment_view/`);
    return response.data;
  } catch (error) {
    console.error('Error incrementing video view:', error);
  }
};

export const fetchUserVideos = async (accessToken) => {
  const response = await axios.get(`${BASE_URL}/profile/videos/`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.data;
};

export const deleteOwnVideo = (videoId) => {
  return api.delete(`/profile/videos/${videoId}/`);
};

export const getComments = async (videoId) => {
  try {
    const response = await axios.get(`${BASE_URL}/comments/${videoId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }
};

export const postComment = async (videoId, content) => {
  try {
    const accessToken = await AsyncStorage.getItem('accessToken');
    const response = await axios.post(
      `${BASE_URL}/videos/${videoId}/comments/`,
      { content },
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to post comment:', error);
    throw error;
  }
};

export const deleteComment = async (commentId) => {
  try {
    const accessToken = await AsyncStorage.getItem('accessToken');
    await axios.delete(`${BASE_URL}/comments/${commentId}/delete/`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch (error) {
    console.error('Failed to delete comment:', error);
    throw error;
  }
};

export const uploadVideo = async (formData, token) => {
  try {
    const response = await axios.post(API_URL, formData, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Video upload failed:', error);
    throw error;
  }
};



export default api;