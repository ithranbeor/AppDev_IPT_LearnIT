import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { updateProfile } from '../src/services/api';
import { API_URL } from '../src/services/api';

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { profile } = route.params;

  const [username, setUsername] = useState(profile?.user?.username || '');
  const [email, setEmail] = useState(profile?.user?.email || '');
  const [description, setDescription] = useState(profile?.description || '');
  const [profilePic, setProfilePic] = useState(profile?.picture ? `${API_URL}${profile.picture}` : null);
  const [imageFile, setImageFile] = useState(null);

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Please allow access to your media library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];

      // Clear the current image before setting the new one
      setProfilePic(null);
      setImageFile(null);

      // Then set the new image
      setProfilePic(asset.uri);
      setImageFile(asset);
    }
  };

  const handleSubmit = async () => {
    const accessToken = await AsyncStorage.getItem('accessToken');
    const profileData = {
      username,
      email,
      description,
      picture: imageFile,
    };

    try {
      await updateProfile(accessToken, profileData);
      Alert.alert('Success', 'Profile updated!');
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not update profile.');
    }
  };

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity style={styles.logo}>
        <Image source={require('../assets/images/LITlogo.png')} style={styles.logoImg} />
        <Text style={styles.logoText}>Learn<Text style={styles.itPart}>IT</Text></Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.navigate('Profile')}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>

      <View style={styles.container}>
        <Text style={styles.heading}>Edit Your Profile</Text>

        {profilePic && (
          <Image source={{ uri: profilePic }} style={styles.profilePic} />
        )}

        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>Profile Picture</Text>
        <TouchableOpacity style={styles.pickBtn} onPress={handlePickImage}>
          <Text>Select Image</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.submitText}>Update Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#282A3A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    position: 'absolute',
    top: 40,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImg: {
    width: 40,
    height: 40,
    marginRight: 10,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  itPart: {
    color: '#89E9F3',
  },
  cancelBtn: {
    position: 'absolute',
    top: 40,
    right: 20,
  },
  cancelText: {
    color: '#fff',
    fontSize: 16,
  },
  container: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 30,
    borderRadius: 40,
    width: '85%',
    alignItems: 'center',
  },
  heading: {
    fontSize: 24,
    color: '#4f4557',
    marginBottom: 20,
  },
  label: {
    fontWeight: 'bold',
    color: '#333',
    alignSelf: 'flex-start',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#fff',
    borderColor: '#ccc',
    borderWidth: 2,
    borderRadius: 15,
    padding: 10,
    width: '100%',
    marginBottom: 15,
    fontSize: 16,
  },
  textarea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pickBtn: {
    backgroundColor: '#eee',
    padding: 10,
    borderRadius: 15,
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
  },
  profilePic: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#4f4557',
  },
  submitBtn: {
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 25,
  },
  submitText: {
    color: '#4f4557',
    fontSize: 16,
  },
});
