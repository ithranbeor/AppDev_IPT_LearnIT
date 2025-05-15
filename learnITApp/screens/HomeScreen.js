import React, { useRef, useEffect, useState } from 'react';
import { View, FlatList, Text, StyleSheet, Image, TouchableOpacity, TextInput, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LITLogo from '../assets/images/LITlogo.png';
import { getVideos, getComments } from '../src/services/api';  
import { Video } from 'expo-av';
import { FontAwesome, Feather } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { Picker } from '@react-native-picker/picker';
import { incrementVideoView } from '../src/services/api';
import { format } from 'date-fns';
import { postComment, deleteComment } from '../src/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../src/services/api';

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return format(date, 'MMMM d, yyyy h:mm a');
};

const CATEGORY_CHOICES = [
  { label: 'Programming & Software Development', value: 'Programming & Software Development' },
  { label: 'Networking & Cybersecurity', value: 'Networking & Cybersecurity' },
  { label: 'Artificial Intelligence & Machine Learning', value: 'Artificial Intelligence & Machine Learning' },
  { label: 'Data Science & Databases', value: 'Data Science & Databases' },
  { label: 'Cloud Computing & DevOps', value: 'Cloud Computing & DevOps' },
  { label: 'IT Fundamentals & Certifications', value: 'IT Fundamentals & Certifications' },
  { label: 'UI/UX Design & Tools', value: 'UI/UX Design & Tools' },
  { label: 'Game Development & AR/VR', value: 'Game Development & AR/VR' },
  { label: 'Career & Soft Skills for IT', value: 'Career & Soft Skills for IT' },
];

const VideoPlayer = ({ videoUri, videoId }) => {
  const videoRef = useRef(null);
  const [hasViewed, setHasViewed] = useState(false);

  const handlePlaybackStatusUpdate = async (status) => {
    if (status.isPlaying && !hasViewed) {
      setHasViewed(true);
      await incrementVideoView(videoId);
    }
  };

  if (!videoUri) {
    return (
      <View style={styles.thumbnail}>
        <Text style={{ color: 'white' }}>No video available</Text>
      </View>
    );
  }

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

const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  return formatDistanceToNow(date, { addSuffix: true }).replace(/^about /, '');
};

const VideoList = ({ navigation }) => {
  const [videos, setVideos] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [comments, setComments] = useState({});
  const [showComments, setShowComments] = useState({});
  const [commentText, setCommentText] = useState({});
  const [profile, setProfile] = useState(null);

  const fetchData = async () => {
    try {
      const videoData = await getVideos();
      setVideos(videoData);
    } catch (error) {
      console.error('Error fetching videos:', error);
      alert('Failed to load videos');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      const accessToken = await AsyncStorage.getItem('accessToken');
    
      if (!accessToken) {
        Alert.alert('Error', 'Access token not found. Please login again.');
        return;
      }
    
      try {
        const [profileRes, videoRes] = await Promise.all([ // fetching profile and videos in parallel
          axios.get(`${API_URL}/api/profile/`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
        ]);
    
        setProfile(profileRes.data);
      } catch (error) {
        console.error('Error:', error);
        Alert.alert('Error', 'Failed to load profile or videos.');
      }
    };

    fetchProfile();
  }, []);

  const handleAddComment = async (videoId, content) => {
    if (!content.trim()) return;

    const newComment = {
      id: Date.now(),
      content,
      user_username: profile.user.username, // use the logged-in user's username
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
    const commentToDelete = comments[videoId]?.find((comment) => comment.id === commentId);

    if (commentToDelete?.user_username === profile.user.username) {
      try {
        await deleteComment(commentId);
        setComments((prev) => ({
          ...prev,
          [videoId]: prev[videoId].filter((comment) => comment.id !== commentId),
        }));
      } catch (error) {
        console.error('Failed to delete comment:', error);
      }
    } else {
      console.error('You cannot delete this comment.');
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

  const filteredVideos = videos.filter((video) => {
    const searchTerm = searchQuery.toLowerCase();
    const isSearchMatch =
      video.title.toLowerCase().includes(searchTerm) ||
      video.uploader_username.toLowerCase().includes(searchTerm) ||
      video.description.toLowerCase().includes(searchTerm);
    const isCategoryMatch = selectedCategory ? video.category === selectedCategory : true;
    return isSearchMatch && isCategoryMatch;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.logoContainer}>
          <Image source={LITLogo} style={styles.logoIcon} />
          <Text style={styles.logoText}>LearnIT</Text>
        </TouchableOpacity>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <Icon name="bell" size={24} color="#F8F8F2" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Search something"
          placeholderTextColor="#808090"
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity onPress={() => setShowCategoryModal(true)}>
          <Icon name="filter" size={20} color="#A0A0B0" style={styles.categoryIcon} />
        </TouchableOpacity>
        <Feather name="search" size={18} color="#A0A0B0" style={styles.searchIcon} />
      </View>

      {/* Video List */}
      <FlatList
        data={filteredVideos}
        keyExtractor={(item) => item.id?.toString() ?? Math.random().toString()}
        renderItem={({ item }) => (
          <View style={styles.videoContainer}>
            <VideoPlayer
              videoUri={`${API_URL}${item.video_file}`}
              videoId={item.id}
            />
            <View style={styles.videoInfo}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>
              <View style={styles.details}>
                <Image source={{ uri: `${API_URL}${item.uploader_profile_picture}` }} style={styles.profileImage} />
                <Text style={styles.uploaderText}>{item.uploader_username}</Text>
                <Text style={styles.views}>{item.views} views</Text>
                <Text style={styles.timeAgo}>{formatRelativeTime(item.upload_date)}</Text>
              </View>
              <TouchableOpacity onPress={() => toggleComments(item.id)}>
                <Text style={styles.toggleText}>
                  {showComments[item.id] ? 'Hide Comments' : 'Show Comments'}
                </Text>
                {showComments[item.id] && (
                  <View style={styles.commentInputContainer}>
                    <TextInput
                      style={styles.commentInput}
                      placeholder="Add a comment..."
                      placeholderTextColor="#bbb"
                      value={commentText}
                      onChangeText={setCommentText}
                      onSubmitEditing={(e) => {
                        handleAddComment(item.id, commentText);
                        setCommentText('');
                      }}
                    />
                  </View>
                )}
              </TouchableOpacity>

              {/* Show comments if toggled */}
              {showComments[item.id] && comments[item.id] && (
                <View style={styles.commentsContainer}>
                  {comments[item.id].map((comment) => (
                    <View key={comment.id} style={styles.comment}>
                      <View style={styles.commentHeader}>
                        <Image
                          source={{ uri: `${API_URL}${comment.user_profile_picture}` }}
                          style={styles.commentUserImage}
                        />
                        <Text style={styles.commentUser}>
                          {comment.user_username === profile.user.username
                            ? 'You'
                            : comment.user_username}
                        </Text>
                      </View>
                      <Text style={styles.commentContent}>{comment.content}</Text>
                      <Text style={styles.timeAgoComment}>{formatDate(comment.created_at)}</Text>

                      {/* Only show delete button for the comment owner */}
                      {comment.user_username === profile.user.username && (
                        <TouchableOpacity onPress={() => handleDeleteComment(comment.id, item.id)}>
                          <FontAwesome name="trash" size={20} color="maroon" style={{ left: 330, bottom: 30, marginTop: -20 }} />
                        </TouchableOpacity>
                    )}
                  </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}
      />

      {/* Category Modal */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Category</Text>
            <Picker
              selectedValue={selectedCategory}
              style={styles.picker}
              onValueChange={(itemValue) => setSelectedCategory(itemValue)}
            >
              {CATEGORY_CHOICES.map((category, index) => (
                <Picker.Item key={index} label={category.label} value={category.value} />
              ))}
            </Picker>
            <TouchableOpacity style={styles.modalButton} onPress={() => setShowCategoryModal(false)}>
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Floating Bottom Navigation */}
      <View style={styles.floatingBottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => {
            setSearchQuery('');
            setSelectedCategory(null);
            fetchData();
          }}
        >
          <Icon name="refresh" size={42} color="#282A3A" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={async () => {
            try {
              const token = await AsyncStorage.getItem('accessToken');
              if (!token) {
                alert('Please login first.');
                return;
              }
              navigation.replace('Upload', { token });
            } catch (error) {
              console.error('Error fetching token:', error);
              alert('Could not access token.');
            }
          }}
        />

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.replace('Profile')}>
          <Icon name="account" size={42} color="#282A3A" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#282A3A' },
  profileImage: { width: 30, height: 30, borderRadius: 15, marginRight: 8 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 15, paddingTop: 50, paddingBottom: 10
  },
  logoContainer: { flexDirection: 'row', alignItems: 'center' },
  logoIcon: { width: 24, height: 24, tintColor: '#8BE9FD', marginRight: 8 },
  logoText: { color: '#F8F8F2', fontSize: 20, fontWeight: 'bold' },
  headerIcons: { flexDirection: 'row' },
  iconButton: { marginLeft: 15 },
  videoContainer: {
    backgroundColor: '#44475A', borderRadius: 30,
    marginHorizontal: 15, marginVertical: 10, overflow: 'hidden'
  },
  thumbnail: {
    width: '100%', height: 180, backgroundColor: '#6272A4',
    justifyContent: 'center', alignItems: 'center'
  },
  video: { width: '100%', height: 180 },
  videoInfo: { padding: 15 },
  title: { color: '#F8F8F2', fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  description: { color: '#F8F8F2', fontSize: 14, marginBottom: 5 },
  details: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  uploaderText: { color: '#8BE9FD', fontSize: 12, fontWeight: 'bold', flex: 1 },
  views: { color: '#BD93F9', fontSize: 12, textAlign: 'center', flex: 1 },
  timeAgo: { color: 'white', fontSize: 12, textAlign: 'right', flex: 1 },
  commentsContainer: { marginTop: 10 },
  comment: { padding: 10, backgroundColor: '#44475A', borderRadius: 8, marginBottom: 5 },
  commentUser: {
    color: '#8BE9FD', fontWeight: 'bold', fontSize: 12, right: 4
  },
  commentUserImage: {
    width: 30, height: 30, borderRadius: 10, marginRight: 1, right: 10
  },
  commentHeader: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 5
  },
  commentContent: {
    color: '#F8F8F2', fontSize: 14
  },
  timeAgoComment: { color: 'white', fontSize: 8, textAlign: 'left', flex: 1 },

  toggleText: { color: '#8BE9FD', textAlign: 'center', marginVertical: 5 },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#44475A', padding: 20, borderRadius: 10 },
  modalTitle: { color: '#F8F8F2', fontSize: 18, marginBottom: 10 },
  picker: { height: 50, width: 200, color: '#F8F8F2' },
  modalButton: { marginTop: 10, backgroundColor: '#8BE9FD', paddingVertical: 10, paddingHorizontal: 30, borderRadius: 8 },
  modalButtonText: { color: '#282A3A', fontWeight: 'bold' },
  floatingBottomNav: {
    position: 'absolute', bottom: 20, left: 100, right: 100, height: 60,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'white', borderRadius: 20,
    paddingVertical: 10, paddingHorizontal: 20, elevation: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4
  },
  navItem: { padding: 2 },
  uploadButton: {
    borderRadius: 40, width: 50, height: 50,
    justifyContent: 'center', alignItems: 'center'
  },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 15, backgroundColor: '#fff',
    borderRadius: 50, paddingHorizontal: 10, marginBottom: 10
  },
  searchInput: {
    flex: 1, color: '#F8F8F2', padding: 10,
    fontSize: 16
  },
  searchIcon: { marginLeft: 10 },
  categoryIcon: { marginLeft: 10, marginRight: 5 },
  modalContent: {
    backgroundColor: 'white', padding: 20, borderRadius: 10,
    width: '80%'
  },
  modalTitle: {
    fontSize: 18, fontWeight: 'bold', marginBottom: 10,
    textAlign: 'center'
  },
  picker: { height: 150, width: '100%' },
  modalButton: {
    marginTop: 10, backgroundColor: '#8BE9FD',
    paddingVertical: 10, borderRadius: 8
  },
  modalButtonText: {
    textAlign: 'center', color: '#282A3A', fontWeight: 'bold'
  },
  comment: { padding: 10, backgroundColor: '#686D76', borderRadius: 10, marginBottom: 5 },
  commentInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#686D76',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    paddingHorizontal: 15,
    color: 'white',
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

});

export default VideoList;
