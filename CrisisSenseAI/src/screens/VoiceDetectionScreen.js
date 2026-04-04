import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Audio } from 'expo-av';
import { theme } from '../constants/theme';
import { WaveformVisualizer } from '../components/WaveformVisualizer';
import { UrgencyMeter } from '../components/UrgencyMeter';

export const VoiceDetectionScreen = ({ navigation }) => {
  const [isRecording, setIsRecording] = useState(true);
  const [result, setResult] = useState(null);

  useEffect(() => {
    let timeout;
    
    const startSimulatedRecording = async () => {
      try {
        const permission = await Audio.requestPermissionsAsync();
        if (permission.status === 'granted') {
          // In a real app we'd start recording.
          // For now, simulate recording for 3 seconds then return a mock result
          timeout = setTimeout(() => {
            setIsRecording(false);
            setResult({
              urgency: 'HIGH',
              level: 0.8,
              keyword: 'pain',
            });
          }, 3000);
        } else {
          setIsRecording(false);
          setResult({
            urgency: 'MEDIUM',
            level: 0.5,
            keyword: 'stuck',
          });
        }
      } catch (err) {
        console.error(err);
      }
    };

    startSimulatedRecording();

    return () => clearTimeout(timeout);
  }, []);

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'URGENT': return theme.colors.primary;
      case 'HIGH': return theme.colors.warning;
      case 'MEDIUM': return theme.colors.success;
      default: return theme.colors.textSecondary;
    }
  };

  return (
    <View style={styles.container}>
      {isRecording ? (
        <>
          <WaveformVisualizer />
          <Text style={styles.statusText}>Listening for distress keywords...</Text>
        </>
      ) : (
        <View style={styles.resultContainer}>
          <Text style={styles.title}>Analysis Complete</Text>
          
          <View style={styles.card}>
            <Text style={styles.cardText}>
              Urgency Level:{' '}
              <Text style={{ color: getUrgencyColor(result?.urgency), fontWeight: 'bold' }}>
                {result?.urgency}
              </Text>
            </Text>
            <Text style={styles.cardText}>
              Keyword detected: <Text style={{ color: theme.colors.textPrimary }}>"{result?.keyword}"</Text>
            </Text>
            
            <UrgencyMeter level={result?.level || 0} />
          </View>

          <TouchableOpacity 
            style={styles.sendButton}
            onPress={() => navigation.navigate('LocationCapture', { reason: 'Voice Distress' })}
          >
            <Text style={styles.btnText}>Send Alert Now</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    padding: theme.spacing.large,
  },
  statusText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.subtitle,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
    fontFamily: theme.typography.fontFamily,
  },
  resultContainer: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.sizes.heading,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xl,
  },
  card: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.large,
    borderRadius: theme.borderRadius.card,
    marginBottom: theme.spacing.xxl,
  },
  cardText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.subtitle,
    marginBottom: theme.spacing.small,
  },
  sendButton: {
    width: '100%',
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.large,
    borderRadius: theme.borderRadius.button,
    alignItems: 'center',
    marginBottom: theme.spacing.medium,
  },
  btnText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.sizes.title,
    fontWeight: 'bold',
  },
  retryButton: {
    width: '100%',
    padding: theme.spacing.medium,
    alignItems: 'center',
  },
  retryBtnText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.body,
  },
});
