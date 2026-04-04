import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';

const INCIDENT_TYPES = [
  { id: 'medical', label: 'Medical', icon: 'medkit-outline', color: '#EF4444' },
  { id: 'fire', label: 'Fire', icon: 'flame-outline', color: '#F97316' },
  { id: 'accident', label: 'Accident', icon: 'car-sport-outline', color: '#EAB308' },
];

const RISK_LEVELS = [
  { id: 'low', label: 'Low' },
  { id: 'medium', label: 'Medium' },
  { id: 'high', label: 'High' },
  { id: 'critical', label: 'Critical' },
];

export const WitnessScreen = ({ navigation }) => {
  const [selectedType, setSelectedType] = useState(null);
  const [riskLevel, setRiskLevel] = useState(null);
  const [description, setDescription] = useState('');
  
  const [photoAdded, setPhotoAdded] = useState(false);
  const [photoUri, setPhotoUri] = useState(null);
  
  const [voiceAdded, setVoiceAdded] = useState(false);
  const [voiceUri, setVoiceUri] = useState(null);
  const [recording, setRecording] = useState(null);

  const handleReport = () => {
    navigation.navigate('LocationCapture', { 
      reason: selectedType,
      risk: riskLevel,
      description: description,
      photoUri,
      voiceUri
    });
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      alert("You've refused to allow this app to access your photos!");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
      setPhotoAdded(true);
    }
  };

  const toggleRecording = async () => {
    try {
      if (recording) {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setVoiceUri(uri);
        setVoiceAdded(true);
        setRecording(null);
      } else {
        await Audio.requestPermissionsAsync();
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
        const { recording: newRecording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        setRecording(newRecording);
      }
    } catch (err) {
      console.error('Failed to start/stop recording', err);
    }
  };

  // Mock crowd detection
  const hasCrowdAlerts = true;

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Report Emergency</Text>
        
        {hasCrowdAlerts && (
          <View style={styles.crowdBanner}>
            <Text style={styles.crowdText}>⚠️ Multiple alerts detected in this area</Text>
            <Text style={styles.crowdSubtext}>3 reports nearby in last 5 min</Text>
          </View>
        )}

        <Text style={styles.sectionLabel}>1. Select Incident Type</Text>
        <View style={styles.cardsContainer}>
          {INCIDENT_TYPES.map(type => (
            <TouchableOpacity 
              key={type.id}
              style={[
                styles.card,
                selectedType === type.id && { borderColor: type.color, backgroundColor: `${type.color}15` }
              ]}
              onPress={() => {
                setSelectedType(type.id);
                if (!riskLevel) setRiskLevel('medium');
              }}
            >
              <Ionicons 
                name={type.icon} 
                size={32} 
                color={selectedType === type.id ? type.color : theme.colors.textSecondary} 
                style={styles.cardIcon}
              />
              <Text style={[
                styles.cardText,
                selectedType === type.id && { color: type.color, fontWeight: 'bold' }
              ]}>{type.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {selectedType && (
          <View style={styles.animatedSection}>
            <Text style={styles.sectionLabel}>2. Level of Crisis Risk</Text>
            <View style={styles.riskContainer}>
              {RISK_LEVELS.map(level => (
                <TouchableOpacity
                  key={level.id}
                  style={[
                    styles.riskButton,
                    riskLevel === level.id && styles.riskButtonSelected
                  ]}
                  onPress={() => setRiskLevel(level.id)}
                >
                  <Text style={[
                    styles.riskText,
                    riskLevel === level.id && styles.riskTextSelected
                  ]}>
                    {level.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionLabel}>3. Optional Details</Text>
            <TextInput
              style={styles.input}
              placeholder="Summary of the issue..."
              placeholderTextColor={theme.colors.textSecondary}
              multiline
              value={description}
              onChangeText={setDescription}
            />

            <View style={styles.mediaContainer}>
              <TouchableOpacity 
                style={[styles.mediaButton, photoAdded && styles.mediaButtonActive]}
                onPress={pickImage}
              >
                <Ionicons name="camera-outline" size={24} color={photoAdded ? theme.colors.primary : theme.colors.textSecondary} />
                <Text style={[styles.mediaText, photoAdded && styles.mediaTextActive]}>
                  {photoAdded ? 'Photo Added' : 'Add Photo'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.mediaButton,
                  voiceAdded && styles.mediaButtonActive,
                  recording && styles.mediaButtonRecording
                ]}
                onPress={toggleRecording}
              >
                <Ionicons 
                  name={recording ? "stop-circle-outline" : "mic-outline"} 
                  size={24} 
                  color={recording ? '#fff' : voiceAdded ? theme.colors.primary : theme.colors.textSecondary} 
                />
                <Text style={[
                  styles.mediaText, 
                  voiceAdded && styles.mediaTextActive,
                  recording && { color: '#fff' }
                ]}>
                  {recording ? 'Stop Recording...' : voiceAdded ? 'Voice Added' : 'Record Voice'}
                </Text>
              </TouchableOpacity>
            </View>
            
            {photoUri && (
              <View style={styles.previewContainer}>
                <Image source={{ uri: photoUri }} style={styles.previewImage} />
                <TouchableOpacity style={styles.removeImage} onPress={() => { setPhotoUri(null); setPhotoAdded(false); }}>
                  <Ionicons name="close-circle" size={24} color={theme.colors.error} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        <TouchableOpacity 
          style={[styles.reportButton, !selectedType && styles.reportButtonDisabled]}
          onPress={handleReport}
          disabled={!selectedType}
        >
          <Text style={styles.reportButtonText}>SUBMIT REPORT</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    padding: theme.spacing.large,
    flexGrow: 1,
    paddingBottom: 40,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.sizes.heading,
    fontFamily: theme.typography.fontFamily,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xl,
    marginTop: theme.spacing.xxl,
  },
  crowdBanner: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: theme.colors.warning,
    borderWidth: 1,
    padding: theme.spacing.medium,
    borderRadius: theme.borderRadius.card,
    marginBottom: theme.spacing.xl,
  },
  crowdText: {
    color: theme.colors.warning,
    fontWeight: 'bold',
    fontSize: theme.typography.sizes.body,
  },
  crowdSubtext: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.small,
    marginTop: theme.spacing.xs,
  },
  sectionLabel: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.sizes.subtitle,
    fontWeight: 'bold',
    marginBottom: theme.spacing.medium,
    marginTop: theme.spacing.medium,
  },
  cardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.medium,
  },
  card: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.medium,
    borderRadius: theme.borderRadius.card,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardIcon: {
    marginBottom: theme.spacing.xs,
  },
  cardText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.small,
    fontFamily: theme.typography.fontFamily,
  },
  animatedSection: {
    marginTop: theme.spacing.small,
  },
  riskContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xl,
  },
  riskButton: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.medium,
    marginHorizontal: 3,
    borderRadius: theme.borderRadius.button,
    alignItems: 'center',
  },
  riskButtonSelected: {
    backgroundColor: theme.colors.error,
  },
  riskText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.small,
    fontWeight: '600',
  },
  riskTextSelected: {
    color: '#fff',
  },
  input: {
    backgroundColor: theme.colors.surface,
    color: theme.colors.textPrimary,
    padding: theme.spacing.medium,
    borderRadius: theme.borderRadius.card,
    height: 100,
    textAlignVertical: 'top',
    marginBottom: theme.spacing.medium,
  },
  mediaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.medium,
  },
  mediaButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.medium,
    borderRadius: theme.borderRadius.button,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: theme.colors.surface,
  },
  mediaButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(255, 62, 77, 0.1)',
  },
  mediaButtonRecording: {
    backgroundColor: theme.colors.error,
    borderColor: theme.colors.error,
  },
  mediaText: {
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
    fontSize: theme.typography.sizes.small,
    fontWeight: '600',
  },
  mediaTextActive: {
    color: theme.colors.primary,
  },
  previewContainer: {
    marginTop: 10,
    marginBottom: 20,
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removeImage: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#000',
    borderRadius: 12,
  },
  reportButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.large,
    borderRadius: theme.borderRadius.button,
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  reportButtonDisabled: {
    opacity: 0.5,
  },
  reportButtonText: {
    color: '#fff',
    fontSize: theme.typography.sizes.title,
    fontWeight: 'bold',
    fontFamily: theme.typography.fontFamily,
  },
});
