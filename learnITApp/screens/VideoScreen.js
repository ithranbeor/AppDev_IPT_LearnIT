// src/screens/VideoScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { API } from '../src/services/api'; 
import { getVideos } from '../src/services/videoService';

const VideoScreen = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await API.getVideos();
        setVideos(data);
      } catch (err) {
        console.error('Error loading videos', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <FlatList
      data={videos}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <View style={{ padding: 16, borderBottomWidth: 1, borderColor: '#ddd' }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{item.title}</Text>
          <Text>{item.description}</Text>
          <Text style={{ color: '#666', marginTop: 4 }}>
            Category: {item.category} · Views: {item.views}
          </Text>
        </View>
      )}
    />
  );
};

export default VideoScreen;
