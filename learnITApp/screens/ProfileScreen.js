import React, { useEffect, useState } from 'react';
import {View,Text,Image,StyleSheet, TouchableOpacity,ActivityIndicator,Alert,ScrollView, TextInput} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LITLogo from '../assets/images/LITlogo.png';
import { Video } from 'expo-av';
import { formatDistanceToNow } from 'date-fns';
import { incrementVideoView } from '../src/services/api';
import { getVideos, getComments } from '../src/services/api';
import { format } from 'date-fns';
import { postComment, deleteComment } from '../src/services/api';
import { API_URL } from '../src/services/api';
import { logout } from '../src/services/api';
import { BASE_URL } from '../src/services/api';

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return format(date, 'MMMM d, yyyy h:mm a'); 
};

const VideoPlayer = ({ videoUri, videoId }) => {
  const videoRef = React.useRef(null);
  const [hasViewed, setHasViewed] = useState(false);

  const handlePlaybackStatusUpdate = async (status) => {
    if (status.isPlaying && !hasViewed) {
      setHasViewed(true);
      await incrementVideoView(videoId);
    }
  };

  return (
    <View style={styles.thumbnail}>
      <Video
        ref={videoRef}
        source={{ uri: videoUri }}
        style={styles.video}
        useNativeControls
        resizeMode="contain"
        isLooping
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        onError={(e) => console.error('Error loading video:', e)}
      />
    </View>
  );
};

const ProfileScreen = ({ navigation }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userVideos, setUserVideos] = useState([]);
  const [comments, setComments] = useState({});
  const [showComments, setShowComments] = useState({});

  useEffect(() => {
    const fetchProfile = async () => {
      const accessToken = await AsyncStorage.getItem('accessToken');
    
      if (!accessToken) {
        Alert.alert('Error', 'Access token not found. Please login again.');
        return;
      }
    
      try {
        const [profileRes, videoRes] = await Promise.all([
          axios.get(`${API_URL}/api/profile/`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          axios.get(`${API_URL}/api/profile/videos/`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
        ]);
    
        setProfile(profileRes.data);
        setUserVideos(videoRes.data);
      } catch (error) {
        console.error('Error:', error);
        Alert.alert('Error', 'Failed to load profile or videos.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleAddComment = async (videoId, content) => {
    if (!content.trim()) return;
  
    const newComment = {
      id: Date.now(),  
      content,
      user_username: profile.user.username,
      user_profile_picture: profile.picture,
      created_at: new Date().toISOString(),
    };
  
    setComments((prev) => ({
      ...prev,
      [videoId]: [...(prev[videoId] || []), newComment],
    }));
  
    try {
      await postComment(videoId, content);  
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };
  
  const handleDeleteComment = async (commentId, videoId) => {
    try {
      await deleteComment(commentId);
      setComments((prev) => ({
        ...prev,
        [videoId]: prev[videoId].filter((comment) => comment.id !== commentId),
      }));
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const toggleComments = async (videoId) => {
      setShowComments((prev) => ({ ...prev, [videoId]: !prev[videoId] }));
  
      if (!comments[videoId]) { 
        try {
          const response = await getComments(videoId);
          setComments((prev) => ({ ...prev, [videoId]: response }));
        } catch (error) {
          console.error('Failed to load comments:', error);
        }
      }
    };

  const handleDeleteVideo = async (videoId) => {
    const accessToken = await AsyncStorage.getItem('accessToken');
    if (!accessToken) {
      Alert.alert('Error', 'Access token not found. Please login again.');
      return;
    }
  
    try {
      const response = await axios.delete(`${API_URL}/api/profile/videos/${videoId}/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
  
      if (response.status === 204) {
        Alert.alert('Success', 'Video deleted successfully');
        setUserVideos((prevVideos) => prevVideos.filter((video) => video.id !== videoId)); // Instant removal
      }
    } catch (error) {
      console.error('Error deleting video:', error.response || error.message);
      if (error.response?.status === 403) {
        Alert.alert('Error', 'You are not allowed to delete this video.');
      } else {
        Alert.alert('Error', 'Failed to delete video.');
      }
    }
  };    

  const formatRelativeTime = (dateString) => {
    if (!dateString) {
      return 'Invalid date';
    }
    
    const date = new Date(dateString);
    
    if (isNaN(date)) {
      return 'Invalid date';
    }
  
    return formatDistanceToNow(date, { addSuffix: true }).replace(/^about /, '');
  };

  const handleLogout = async () => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) {
        Alert.alert('Error', 'Access token not found. Please login again.');
        return;
      }
  
      // Send the logout time to your backend API
      const logoutTime = new Date().toISOString();
      
      await axios.post(`${BASE_URL}/logout/`, { logout_time: logoutTime }, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
  
      // Proceed with the logout
      await logout(); 
      Alert.alert('Success', 'You have logged out successfully.');
      navigation.replace('Login');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', error.message || 'There was an issue logging out.');
    }
  };
  

  if (loading) {
    return <ActivityIndicator size="large" color="#8BE9FD" style={{ flex: 1, justifyContent: 'center' }} />;
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text style={{ color: '#fff', textAlign: 'center', marginTop: 20 }}>No profile data available.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.logoContainer}>
          <Image source={LITLogo} style={styles.logoIcon} />
          <Text style={styles.logoText}>LearnIT</Text>
        </TouchableOpacity>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <Icon name="bell" size={24} color="#F8F8F2" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
            <Icon name="logout" size={24} color="#F8F8F2" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile Info */}
      <View style={styles.profileInfo}>
        <Image
          source={
            profile.picture
              ? { uri: `${API_URL}${profile.picture}` }
              : require('../assets/images/LITlogo.png') // Default image
          }
          style={styles.profileImage}
        />

        <View style={styles.profileDetails}>
          <Text style={styles.name}>{profile.user.username}</Text>
          <Text style={styles.email}>{profile.user.email}</Text>
          {/* "About me:" Section */}
          <View style={styles.aboutMeSection}>
            <Text style={styles.aboutMeLabel}>About me:</Text>
            <Text style={styles.descriptionText}>
              {profile.description ? profile.description : 'Welcome to your profile!'} {/* Default description */}
            </Text>
          </View>

        <TouchableOpacity
          style={styles.editIcon}
          onPress={() => navigation.navigate('EditProfile', { profile })}
          disabled={loading}
        >
          <FontAwesome name="edit" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
        </View>

      {/* User Videos - Scrollable part */}
      <ScrollView style={styles.userVideosContainer}>
        {userVideos.map((video) => (
          <View key={video.id} style={styles.videoContainer}>
            {/* Add a Delete button */}
            {video.uploader === profile.user.id && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteVideo(video.id)}
              >
                <FontAwesome name="trash" size={20} color="red" />
              </TouchableOpacity>
            )}
            <VideoPlayer
              videoUri={`${API_URL}${video.video_file}`}
              videoId={video.id}
            />
            <View style={styles.videoInfo}>
              <Text style={styles.title}>{video.title}</Text>
              <Text style={styles.description}>{video.description}</Text>
              <View style={styles.details}>
                <Text style={styles.views}>{video.views} views</Text>
                <Text style={styles.timeAgo}>{formatRelativeTime(video.upload_date)}</Text>
              </View>
              <TouchableOpacity onPress={() => toggleComments(video.id)}>
                <Text style={styles.toggleText}>
                  {showComments[video.id] ? 'Hide Comments' : 'Show Comments'}
                </Text>
                {showComments[video.id] && (
                  <View style={styles.commentInputContainer}>
                    <TextInput
                      style={styles.commentInput}
                      placeholder="Add a comment..."
                      placeholderTextColor="#bbb"
                      onSubmitEditing={(e) => {
                        const content = e.nativeEvent.text;
                        handleAddComment(video.id, content); 
                        e.nativeEvent.text = ''; 
                      }}
                    />
                  </View>                                     
                  )}
              </TouchableOpacity>

              {/* Show comments if toggled */}
              {showComments[video.id] && comments[video.id] && (
                <View style={styles.commentsContainer}>
                  {comments[video.id] && comments[video.id].map((comment) => (
                  <View key={comment.id} style={styles.comment}>
                    <View style={styles.commentHeader}>
                      <Image
                        source={{ uri: `http://172.20.10.3:8000${comment.user_profile_picture}` }}
                        style={styles.commentUserImage}
                      />
                      <Text style={styles.commentUser}>{comment.user_username === profile.user.username ? "You" : comment.user_username}</Text>
                    </View>
                    <Text style={styles.commentContent}>{comment.content}</Text>
                    <Text style={styles.timeAgoComment}>{formatDate(comment.created_at)}</Text>

                    {/* Show delete button only if the comment is from the logged-in user */}
                    {comment.user_username === profile.user.username && (
                      <TouchableOpacity onPress={() => handleDeleteComment(comment.id, video.id)}>
                        <FontAwesome name="trash" size={20} color="maroon" style={{ left: 330 }} />
                      </TouchableOpacity>
                    )}
                  </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Floating Bottom Navigation */}
      <View style={styles.floatingBottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.replace('Home')}>
          <Icon name="home" size={42} color="#282A3A" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.uploadButton} onPress={() => navigation.replace('Upload')}>
          <Icon name="plus-circle" size={50} color="#8BE9FD" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.replace('Profile')}>
          <Icon name="account" size={42} color="#282A3A" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#282A3A' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 50,
    paddingBottom: 10,
  },
  deleteButton: {
    position: 'absolute',
    top: 10, 
    right: 10, 
    zIndex: 10, 
    padding: 5,
  }, 
  logoContainer: { flexDirection: 'row', alignItems: 'center' },
  logoIcon: { width: 24, height: 24, tintColor: '#8BE9FD', marginRight: 8 },
  logoText: { color: '#F8F8F2', fontSize: 20, fontWeight: 'bold' },
  headerIcons: { flexDirection: 'row' },
  iconButton: { marginLeft: 15 },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 20,
    backgroundColor: '#44475A',
    borderRadius: 30,
    marginHorizontal: 15,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
    height: 300,
  },
  profileImage: {
    width: 130,
    height: 130,
    borderRadius: 100,
    marginRight: 20,
    borderWidth: 2,
    borderColor: '#8BE9FD',
  },
  profileDetails: {
    flex: 1,
  },
  name: {
    fontSize: 22,
    color: '#F8F8F2',
    fontWeight: 'bold',
    marginBottom: -5,
    top: 20,
  },
  email: {
    fontSize: 13,
    color: '#8BE9FD',
    marginBottom: 10,
    top: 20,
  },
  aboutMeSection: {
    marginTop: 20,
    right: 150,
    top: 50,
  },
  aboutMeLabel: {
    fontSize: 13,
    color: '#F8F8F2',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  descriptionText: {
    fontSize: 12,
    color: '#F8F8F2',
    lineHeight: 18,
    textAlign: 'left',
  },
  editIcon: {
    alignSelf: 'flex-end',
    marginTop: 100,
    padding: 5,
    borderRadius: 20,
  },
  userVideosContainer: {
    marginTop: 20,
    marginBottom: 30,
  },
  videoContainer: {
    backgroundColor: '#44475A',
    borderRadius: 30,
    marginHorizontal: 15,
    marginVertical: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  thumbnail: {
    width: '100%',
    height: 180,
    backgroundColor: '#6272A4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: { width: '100%', height: 180 },
  videoInfo: {
    padding: 15,
    backgroundColor: '#333C4D',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  title: {
    color: '#F8F8F2',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  description: {
    color: '#F8F8F2',
    fontSize: 14,
    marginBottom: 5,
  },
  details: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  views: {
    color: '#BD93F9',
    fontSize: 12,
  },
  timeAgo: {
    color: '#F8F8F2',
    fontSize: 12,
  },
  floatingBottomNav: {
    position: 'absolute',
    bottom: 20,
    left: 100,
    right: 100,
    height: 60,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  navItem: { padding: 2 },
  uploadButton: {
    borderRadius: 40,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#bbb',
    paddingBottom: 10,
  },
  commentInput: {
    flex: 1,
    height: 40,
    backgroundColor: 'gray',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    paddingHorizontal: 15,
    color: '#F8F8F2',
  },
  comment: { padding: 10, backgroundColor: '#686D76', borderRadius: 8, marginBottom: 5 },
  commentUser: {
    color: '#8BE9FD', fontWeight: 'bold', fontSize: 12, right: 4
  },
  commentUserImage: {
    width: 30, height: 30, borderRadius: 10, marginRight: 1, right: 10
  },
  commentHeader: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 5
  },
  commentContent: { color: '#F8F8F2' },commentContent: {
    color: '#F8F8F2', fontSize: 14
  },
  timeAgoComment: { color: 'white', fontSize: 8, textAlign: 'left', flex: 1 },

  toggleText: { color: '#8BE9FD', textAlign: 'center', marginVertical: 5 },
  
});

export default ProfileScreen;
