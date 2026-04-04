import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, Modal, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { BigEmergencyButton } from '../components/BigEmergencyButton';
import { OfflineBanner } from '../components/OfflineBanner';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useFallDetection } from '../hooks/useFallDetection';

const { width } = Dimensions.get('window');

export const HomeScreen = ({ navigation }) => {
  const [mode, setMode] = useState('self');
  const { isOffline } = useNetworkStatus();
  const [fallModalVisible, setFallModalVisible] = useState(false);
  const [fallCountdown, setFallCountdown] = useState(15);

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
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      {isOffline && <OfflineBanner />}
      
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoDot} />
          <Text style={styles.appName}>CrisisSense<Text style={styles.appNameAI}>AI</Text></Text>
        </View>
        <TouchableOpacity style={styles.profileButton}>
          <Ionicons name="person-circle-outline" size={32} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.modeToggleWrapper}>
          <View style={styles.modeToggle}>
            <TouchableOpacity 
              style={[styles.modeTab, mode === 'self' && styles.modeTabActive]}
              onPress={() => setMode('self')}
            >
              <Ionicons 
                name="shield-checkmark" 
                size={18} 
                color={mode === 'self' ? theme.colors.textPrimary : theme.colors.textSecondary} 
                style={styles.modeIcon}
              />
              <Text style={[styles.modeText, mode === 'self' && styles.modeTextActive]}>My Safety</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modeTab, mode === 'witness' && styles.modeTabActive]}
              onPress={() => setMode('witness')}
            >
              <Ionicons 
                name="eye" 
                size={18} 
                color={mode === 'witness' ? theme.colors.textPrimary : theme.colors.textSecondary} 
                style={styles.modeIcon}
              />
              <Text style={[styles.modeText, mode === 'witness' && styles.modeTextActive]}>Witness</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <BigEmergencyButton onTrigger={handleTrigger} isOffline={isOffline} />
          <Text style={styles.instructionText}>
            {mode === 'self' ? 'Hold for 2 seconds to alert' : 'Tap to classify emergency'}
          </Text>
        </View>

        <View style={styles.bottomActions}>
          <TouchableOpacity 
            style={styles.micButton}
            onPress={() => navigation.navigate('VoiceDetectionScreen')}
          >
            <View style={styles.micIconWrapper}>
              <Ionicons name="mic" size={24} color={theme.colors.background} />
            </View>
            <Text style={styles.micText}>Voice Command</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.systemStatus}>
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: theme.colors.success }]} />
          <Text style={styles.statusText}>Secure</Text>
        </View>
        <View style={styles.statusDivider} />
        <View style={styles.statusBadge}>
          <Ionicons name="location" size={12} color={theme.colors.success} style={{marginRight: 4}} />
          <Text style={styles.statusText}>GPS lock</Text>
        </View>
        <View style={styles.statusDivider} />
        <View style={styles.statusBadge}>
          <Ionicons name="shield" size={12} color={theme.colors.success} style={{marginRight: 4}} />
          <Text style={styles.statusText}>3 Guardians</Text>
        </View>
      </View>

      <Modal visible={fallModalVisible} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.premiumModal}>
            <View style={styles.modalIconWrapper}>
              <Ionicons name="warning" size={32} color={theme.colors.warning} />
            </View>
            <Text style={styles.modalTitle}>Fall Detected</Text>
            <Text style={styles.modalText}>Auto-dispatching alerts in</Text>
            <Text style={styles.countdownValue}>{fallCountdown}</Text>
            <Text style={styles.modalText}>seconds</Text>
            
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.btnSecondary} onPress={() => setFallModalVisible(false)}>
                <Text style={styles.btnSecondaryText}>I am OK</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.btnPrimary} 
                onPress={() => {
                  setFallModalVisible(false);
                  navigation.navigate('LocationCapture', { reason: 'fall_detected' });
                }}
              >
                <Text style={styles.btnPrimaryText}>Send Now</Text>
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
    backgroundColor: '#0A0A0E', // Deeper, more premium dark bg
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.medium,
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    marginRight: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  appName: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  appNameAI: {
    color: theme.colors.primary,
  },
  profileButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  modeToggleWrapper: {
    width: '100%',
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#16161E',
    borderRadius: 30,
    padding: 6,
    width: width * 0.8,
    borderWidth: 1,
    borderColor: '#2A2A35',
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
  },
  modeTabActive: {
    backgroundColor: '#232330',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  modeIcon: {
    marginRight: 6,
  },
  modeText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  modeTextActive: {
    color: theme.colors.textPrimary,
  },
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionText: {
    marginTop: 30,
    color: '#6e6e80',
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  bottomActions: {
    width: '100%',
    alignItems: 'center',
  },
  micButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#13131A',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#22222E',
  },
  micIconWrapper: {
    backgroundColor: '#E2E8F0',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  micText: {
    color: '#A0AEC0',
    fontSize: 14,
    fontWeight: '600',
  },
  systemStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20, 20, 30, 0.8)',
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    color: '#8a8a9e',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#2A2A35',
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.large,
  },
  premiumModal: {
    backgroundColor: '#16161E',
    padding: 30,
    borderRadius: 24,
    width: '90%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: theme.colors.textPrimary,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
  },
  countdownValue: {
    color: theme.colors.warning,
    fontSize: 48,
    fontWeight: '800',
    marginVertical: 10,
  },
  modalActions: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 20,
    justifyContent: 'space-between',
  },
  btnSecondary: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: '#22222E',
    borderRadius: 16,
    marginRight: 8,
    alignItems: 'center',
  },
  btnPrimary: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    marginLeft: 8,
    alignItems: 'center',
  },
  btnSecondaryText: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  btnPrimaryText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
