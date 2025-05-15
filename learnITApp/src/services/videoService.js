// src/services/videoService.js
import api from './api';
import { API_URL } from '../src/services/api';

export const getVideos = async () => {
  const response = await api.get(`${API_URL}/api/videos/`);
  return response.data;
};

