import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { theme } from '../constants/theme';

const TAGS = [
  { id: 'fire', label: '🔥 Fire' },
  { id: 'accident', label: '🚗 Accident' },
  { id: 'medical', label: '❤️ Medical' },
  { id: 'violence', label: '🔪 Violence' },
  { id: 'flood', label: '🌊 Flood' },
  { id: 'other', label: '❓ Other' },
];

export const WitnessScreen = ({ navigation }) => {
  const [selectedTag, setSelectedTag] = useState(null);
  const [description, setDescription] = useState('');

  const handleReport = () => {
    navigation.navigate('LocationCapture', { reason: selectedTag });
  };

  // Mock crowd detection
  const hasCrowdAlerts = true; // Simulating multiple nearby reports

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>What are you witnessing?</Text>
        
        {hasCrowdAlerts && (
          <View style={styles.crowdBanner}>
            <Text style={styles.crowdText}>⚠️ Multiple alerts detected in this area</Text>
            <Text style={styles.crowdSubtext}>3 reports nearby in last 5 min</Text>
          </View>
        )}

        <View style={styles.grid}>
          {TAGS.map(tag => (
            <TouchableOpacity 
              key={tag.id}
              style={[
                styles.tagButton,
                selectedTag === tag.id && styles.tagButtonSelected
              ]}
              onPress={() => setSelectedTag(tag.id)}
            >
              <Text style={styles.tagText}>{tag.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={styles.input}
          placeholder="Describe what you see (optional)"
          placeholderTextColor={theme.colors.textSecondary}
          multiline
          value={description}
          onChangeText={setDescription}
        />

        <TouchableOpacity 
          style={styles.reportButton}
          onPress={handleReport}
          disabled={!selectedTag}
        >
          <Text style={styles.reportButtonText}>REPORT NOW</Text>
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
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xl,
  },
  tagButton: {
    width: '48%',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.large,
    borderRadius: theme.borderRadius.card,
    marginBottom: theme.spacing.medium,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tagButtonSelected: {
    borderColor: theme.colors.primary,
    transform: [{ scale: 1.05 }],
  },
  tagText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.sizes.subtitle,
    fontFamily: theme.typography.fontFamily,
  },
  input: {
    backgroundColor: theme.colors.surface,
    color: theme.colors.textPrimary,
    padding: theme.spacing.medium,
    borderRadius: theme.borderRadius.card,
    height: 100,
    textAlignVertical: 'top',
    marginBottom: theme.spacing.xxl,
  },
  reportButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.large,
    borderRadius: theme.borderRadius.button,
    alignItems: 'center',
    opacity: 1,
  },
  reportButtonText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.sizes.title,
    fontWeight: 'bold',
    fontFamily: theme.typography.fontFamily,
  },
});
