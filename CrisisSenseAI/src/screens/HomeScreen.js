import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { BigEmergencyButton } from '../components/BigEmergencyButton';
import { OfflineBanner } from '../components/OfflineBanner';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useFallDetection } from '../hooks/useFallDetection';

export const HomeScreen = ({ navigation }) => {
  const [mode, setMode] = useState('self');
  const { isOffline } = useNetworkStatus();
  const [fallModalVisible, setFallModalVisible] = useState(false);
  const [fallCountdown, setFallCountdown] = useState(15);

  // Fall detection mock
  useFallDetection(true, () => {
    setFallModalVisible(true);
    setFallCountdown(15);
  });

  useEffect(() => {
    let timer;
    if (fallModalVisible && fallCountdown > 0) {
      timer = setInterval(() => {
        setFallCountdown(prev => prev - 1);
      }, 1000);
    } else if (fallModalVisible && fallCountdown === 0) {
      setFallModalVisible(false);
      navigation.navigate('LocationCapture', { reason: 'fall_detected' });
    }
    return () => clearInterval(timer);
  }, [fallModalVisible, fallCountdown, navigation]);

  const handleTrigger = () => {
    if (mode === 'self') {
      navigation.navigate('LocationCapture');
    } else {
      navigation.navigate('WitnessScreen');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      {isOffline && <OfflineBanner />}
      
      <View style={styles.topBar}>
        <Text style={styles.appName}>RescueNow</Text>
        <Ionicons name="settings-outline" size={24} color={theme.colors.textPrimary} />
      </View>

      <View style={styles.content}>
        <BigEmergencyButton onTrigger={handleTrigger} isOffline={isOffline} />
        <Text style={styles.subtitle}>
          {mode === 'self' ? 'Press and hold for 2 seconds' : 'Tap to report an emergency'}
        </Text>

        <View style={styles.toggleContainer}>
          <TouchableOpacity 
            style={[styles.pill, mode === 'self' && styles.pillActive]}
            onPress={() => setMode('self')}
          >
            <Text style={[styles.pillText, mode === 'self' && styles.pillTextActive]}>Self Emergency</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.pill, mode === 'witness' && styles.pillActive]}
            onPress={() => setMode('witness')}
          >
            <Text style={[styles.pillText, mode === 'witness' && styles.pillTextActive]}>Report Emergency</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.micButton}
          onPress={() => navigation.navigate('VoiceDetectionScreen')}
        >
          <Ionicons name="mic-outline" size={32} color={theme.colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.statusBar}>
        <Text style={styles.statusText}>GPS Active ✓</Text>
        <Text style={styles.statusText}>3 contacts ready</Text>
      </View>

      <Modal visible={fallModalVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Fall detected!</Text>
            <Text style={styles.modalText}>Sending alert in {fallCountdown} seconds...</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setFallModalVisible(false)}>
                <Text style={styles.modalBtnTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalBtnSend} 
                onPress={() => {
                  setFallModalVisible(false);
                  navigation.navigate('LocationCapture', { reason: 'fall_detected' });
                }}
              >
                <Text style={styles.modalBtnTextSend}>Send Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: theme.spacing.medium,
    alignItems: 'center',
  },
  appName: {
    color: theme.colors.primary,
    fontSize: theme.typography.sizes.title,
    fontWeight: 'bold',
    fontFamily: theme.typography.fontFamily,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.body,
    marginTop: theme.spacing.xl,
    fontFamily: theme.typography.fontFamily,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.button,
    padding: theme.spacing.xs,
    marginTop: theme.spacing.large,
  },
  pill: {
    paddingVertical: theme.spacing.small,
    paddingHorizontal: theme.spacing.large,
    borderRadius: theme.borderRadius.button,
  },
  pillActive: {
    backgroundColor: theme.colors.primary,
  },
  pillText: {
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
    fontWeight: 'bold',
  },
  pillTextActive: {
    color: theme.colors.textPrimary,
  },
  micButton: {
    marginTop: theme.spacing.xxl,
    padding: theme.spacing.medium,
    backgroundColor: theme.colors.surface,
    borderRadius: 50,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: theme.spacing.medium,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surface,
  },
  statusText: {
    color: theme.colors.success,
    fontSize: theme.typography.sizes.small,
    fontFamily: theme.typography.fontFamily,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.large,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.card,
    width: '100%',
    alignItems: 'center',
  },
  modalTitle: {
    color: theme.colors.warning,
    fontSize: theme.typography.sizes.heading,
    fontWeight: 'bold',
    marginBottom: theme.spacing.small,
  },
  modalText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.sizes.body,
    marginBottom: theme.spacing.xl,
  },
  modalActions: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  modalBtnCancel: {
    flex: 1,
    padding: theme.spacing.medium,
    backgroundColor: '#333',
    borderRadius: theme.borderRadius.button,
    marginRight: theme.spacing.small,
    alignItems: 'center',
  },
  modalBtnSend: {
    flex: 1,
    padding: theme.spacing.medium,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.button,
    marginLeft: theme.spacing.small,
    alignItems: 'center',
  },
  modalBtnTextCancel: {
    color: theme.colors.textPrimary,
    fontWeight: 'bold',
  },
  modalBtnTextSend: {
    color: theme.colors.textPrimary,
    fontWeight: 'bold',
  },
});
