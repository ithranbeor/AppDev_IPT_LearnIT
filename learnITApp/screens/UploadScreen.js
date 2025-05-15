import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Video } from 'expo-av';
import { uploadVideo } from '../src/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';

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

const UploadScreen = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [videoPreviewUri, setVideoPreviewUri] = useState(null);
  const [category, setCategory] = useState(CATEGORY_CHOICES[0].value);

  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Home'); // fallback if there's no screen to go back to
    }
  };

  const handleLogoPress = () => {};

  const pickVideo = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        setUploadError('Permission to access media library is required.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 1,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        setUploadError('No video was selected.');
        return;
      }

      const videoAsset = result.assets[0];

      if (videoAsset.fileSize && videoAsset.fileSize > 50 * 1024 * 1024) {  // 50 MB
        setUploadError('Video file is too large. Please select a file under 50MB.');
        return;
      }

      setVideoFile({
        uri: videoAsset.uri,
        name: videoAsset.fileName || 'video.mp4',
        type: videoAsset.type || 'video/mp4',
      });

      setVideoPreviewUri(videoAsset.uri);
    } catch (err) {
      console.error('Error picking video:', err);
      setUploadError('Could not pick video. Please try again.');
    }
  };

  const handleUpload = async () => {
    if (!title || !description || !videoFile || !category) {
      setUploadError('Please fill all fields, select a video, and choose a category.');
      return;
    }

    setUploading(true);
    setUploadError('');

    try {
      const userToken = await AsyncStorage.getItem('accessToken'); // Assuming the token is saved in AsyncStorage
      if (!userToken) {
        setUploadError('User is not authenticated.');
        setUploading(false);
        return;
      }

      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('video', {
        uri: videoFile.uri,
        name: videoFile.name,
        type: videoFile.type,
      });

      // Assuming `uploadVideo` handles API calls with the necessary token and headers
      const response = await uploadVideo(formData, userToken);

      if (response.status === 200) {
        navigation.navigate('Home');
      } else {
        setUploadError('Upload failed: ' + (response.error || 'Unknown error'));
      }

    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.body}>
      <TouchableOpacity style={styles.logo} onPress={handleLogoPress}>
        <Image source={require('../assets/images/LITlogo.png')} style={styles.logoImage} />
        <Text style={styles.logoText}>
          Learn<Text style={styles.itPart}>IT</Text>
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleGoBack} style={styles.skipButton}>
        <Text style={styles.skipButtonText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.uploadContainer}>
        <Text style={styles.heading}>Upload New Video</Text>

        {uploadError ? <Text style={styles.errorMessage}>{uploadError}</Text> : null}

        <View style={styles.formGroup}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter video title"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={styles.textarea}
            value={description}
            onChangeText={setDescription}
            placeholder="Enter video description"
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={category}
              style={styles.picker}
              mode={Platform.OS === 'android' ? 'dropdown' : 'dialog'}
              onValueChange={(itemValue) => setCategory(itemValue)}
            >
              {CATEGORY_CHOICES.map((choice) => (
                <Picker.Item key={choice.value} label={choice.label} value={choice.value} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Video File</Text>
          <TouchableOpacity style={styles.fileInputButton} onPress={pickVideo}>
            <Text style={styles.fileInputButtonText}>Choose Video</Text>
          </TouchableOpacity>
          {videoFile && <Text style={styles.fileName}>{videoFile.name}</Text>}
        </View>

        {videoPreviewUri && (
          <View style={styles.videoPreviewContainer}>
            <Video
              source={{ uri: videoPreviewUri }}
              style={styles.videoPreview}
              useNativeControls
              resizeMode="contain"
              shouldPlay
              isLooping
            />
          </View>
        )}

        <TouchableOpacity
          style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
          onPress={handleUpload}
          disabled={uploading}
        >
          <Text style={styles.uploadButtonText}>{uploading ? 'Uploading...' : 'Upload Video'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  body: {
    flexGrow: 1,
    backgroundColor: '#282A3A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logo: {
    position: 'absolute',
    top: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    cursor: 'pointer',
    paddingTop: 20,
  },
  logoImage: {
    marginRight: 10,
    height: 40,
    width: 40,
    resizeMode: 'contain',
  },
  logoText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  itPart: {
    color: '#89E9F3',
  },
  skipButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    paddingTop: 30,
  },
  skipButtonText: {
    color: '#ffffff',
    fontSize: 16,
    textDecorationLine: 'none',
  },
  uploadContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 30,
    borderRadius: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 5,
    alignItems: 'center',
    width: '90%',
    maxWidth: 400,
  },
  heading: {
    color: '#4f4557',
    marginBottom: 20,
    fontSize: 24,
  },
  formGroup: {
    marginBottom: 15,
    width: '100%',
  },
  label: {
    display: 'block',
    marginBottom: 5,
    color: '#555',
    fontWeight: 'bold',
    textAlign: 'left',
  },
  input: {
    width: '100%',
    padding: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: 15,
    marginBottom: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textarea: {
    width: '100%',
    padding: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: 15,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  pickerContainer: {
    width: '100%',
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: 15,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  fileInputButton: {
    backgroundColor: '#2C97B3',
    borderRadius: 15,
    padding: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  fileInputButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  fileName: {
    color: '#555',
    fontSize: 14,
    textAlign: 'center',
  },
  videoPreviewContainer: {
    marginVertical: 15,
    borderRadius: 10,
    overflow: 'hidden',
    width: '100%',
    height: 200,
  },
  videoPreview: {
    width: '100%',
    height: '100%',
  },
  uploadButton: {
    backgroundColor: '#2C97B3',
    padding: 15,
    borderRadius: 15,
    width: '100%',
    marginTop: 15,
    alignItems: 'center',
  },
  uploadButtonDisabled: {
    backgroundColor: '#ccc',
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 18,
  },
  errorMessage: {
    color: '#ff4d4d',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
});

export default UploadScreen;
