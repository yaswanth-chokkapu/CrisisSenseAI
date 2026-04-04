import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Animated,
  ScrollView,
} from 'react-native';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const CATEGORIES = [
  { id: 'accident',  label: 'Accident',  emoji: '🚗', color: '#FF9500' },
  { id: 'fire',      label: 'Fire',       emoji: '🔥', color: '#FF3B30' },
  { id: 'medical',   label: 'Medical',    emoji: '🏥', color: '#30B0C7' },
  { id: 'crime',     label: 'Crime',      emoji: '🚨', color: '#AF52DE' },
  { id: 'flood',     label: 'Flood',      emoji: '🌊', color: '#5AC8FA' },
  { id: 'other',     label: 'Other',      emoji: '⚠️',  color: '#FFCC00' },
];

export default function WitnessMode({ visible, onClose }) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [phase, setPhase] = useState('select'); // 'select' | 'sending' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  // Animate in when visible
  useEffect(() => {
    if (visible) {
      setSelectedCategory(null);
      setPhase('select');
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 8, useNativeDriver: true }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.92);
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (!selectedCategory) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Select a Category', 'Please choose what type of emergency you witnessed.');
      return;
    }

    setPhase('sending');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      console.log('[WitnessMode] 📍 Getting location...');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission denied. Please enable it in Settings.');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude, accuracy } = location.coords;
      console.log(`[WitnessMode] 📍 Lat: ${latitude}, Lng: ${longitude}`);

      const category = CATEGORIES.find(c => c.id === selectedCategory);

      // Save to Firestore — same witness_reports collection checked by Crowd Signal
      const expireAt = Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000));
      const docRef = await addDoc(collection(db, 'witness_reports'), {
        categoryId: category.id,
        categoryLabel: category.label,
        timestamp: serverTimestamp(),
        expireAt,
        location: {
          latitude,
          longitude,
          accuracy: accuracy ?? null,
        },
        device: { platform: 'expo' },
      });

      console.log(`[WitnessMode] ✅ Witness report saved! ID: ${docRef.id} | Category: ${category.label}`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPhase('success');

      // Auto-close after 2.5 seconds
      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (error) {
      console.error('[WitnessMode] ❌ Failed to send report:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrorMsg(error.message || 'Failed to send report.');
      setPhase('error');
    }
  };

  const handleClose = () => {
    setSelectedCategory(null);
    setPhase('select');
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.sheet,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          {/* ── Header ── */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>👀 Witness Report</Text>
              <Text style={styles.subtitle}>What are you seeing right now?</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* ── Content ── */}
          {phase === 'select' && (
            <>
              <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
                {CATEGORIES.map(cat => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryCard,
                        isSelected && { borderColor: cat.color, backgroundColor: `${cat.color}18` },
                      ]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setSelectedCategory(cat.id);
                      }}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                      <Text style={[styles.categoryLabel, isSelected && { color: cat.color }]}>
                        {cat.label}
                      </Text>
                      {isSelected && (
                        <View style={[styles.selectedDot, { backgroundColor: cat.color }]} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  !selectedCategory && styles.submitBtnDisabled,
                ]}
                onPress={handleSubmit}
                activeOpacity={0.85}
                disabled={!selectedCategory}
              >
                <Text style={styles.submitBtnText}>
                  {selectedCategory
                    ? `Report ${CATEGORIES.find(c => c.id === selectedCategory)?.label}`
                    : 'Select a Category First'}
                </Text>
              </TouchableOpacity>

              <Text style={styles.disclaimer}>
                Your location is captured automatically to help emergency services.
              </Text>
            </>
          )}

          {phase === 'sending' && (
            <View style={styles.feedbackContainer}>
              <ActivityIndicator size="large" color="#FF3B30" />
              <Text style={styles.feedbackTitle}>Sending Report...</Text>
              <Text style={styles.feedbackSubtitle}>Capturing location and uploading</Text>
            </View>
          )}

          {phase === 'success' && (
            <View style={styles.feedbackContainer}>
              <Text style={styles.feedbackEmoji}>✅</Text>
              <Text style={[styles.feedbackTitle, { color: '#34C759' }]}>Report Sent!</Text>
              <Text style={styles.feedbackSubtitle}>
                Your report has been submitted.{'\n'}
                Emergency services are notified.
              </Text>
            </View>
          )}

          {phase === 'error' && (
            <View style={styles.feedbackContainer}>
              <Text style={styles.feedbackEmoji}>❌</Text>
              <Text style={[styles.feedbackTitle, { color: '#FF3B30' }]}>Send Failed</Text>
              <Text style={styles.feedbackSubtitle}>{errorMsg}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={() => setPhase('select')}>
                <Text style={styles.retryBtnText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#13131F',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderColor: '#2A2A40',
    minHeight: 420,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 13,
    color: '#666680',
    marginTop: 4,
    fontWeight: '500',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E1E30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#666680',
    fontSize: 14,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  categoryCard: {
    width: '47%',
    backgroundColor: '#1A1A2E',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#2A2A40',
    padding: 18,
    alignItems: 'center',
    position: 'relative',
  },
  categoryEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#CCCCDD',
    letterSpacing: 0.2,
  },
  selectedDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  submitBtn: {
    backgroundColor: '#FF3B30',
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  submitBtnDisabled: {
    backgroundColor: '#2A1A1A',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  disclaimer: {
    fontSize: 11,
    color: '#444455',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 16,
  },
  feedbackContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  feedbackEmoji: {
    fontSize: 56,
  },
  feedbackTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  feedbackSubtitle: {
    fontSize: 14,
    color: '#666680',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  retryBtn: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#333350',
  },
  retryBtnText: {
    color: '#7B9FFF',
    fontWeight: '700',
    fontSize: 15,
  },
});