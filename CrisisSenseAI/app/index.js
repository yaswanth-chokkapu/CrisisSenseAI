import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  Animated,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Pressable,
  Linking,
} from 'react-native';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { collection, addDoc, getDocs, query, where, serverTimestamp, Timestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../firebaseConfig';
import WitnessMode from '../components/WitnessMode';

const HOLD_DURATION = 2000; // ms required to hold the button

export default function App() {
  const [isSending, setIsSending] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [witnessVisible, setWitnessVisible] = useState(false);
  const [isVerified, setIsVerified] = useState(false);     // Crowd Signal verification
  const [verifiedWitness, setVerifiedWitness] = useState(null); // matched witness doc
  const [currentAlertId, setCurrentAlertId] = useState(null); // tracking active alert for AI
  const [isListening, setIsListening] = useState(false); // AI listening UI
  const [consentVisible, setConsentVisible] = useState(false); // Privacy consent toast

  // Permission state: 'loading' | 'granted' | 'foreground_only' | 'denied'
  const [permissionState, setPermissionState] = useState('loading');

  // Animated values
  const holdProgress = useRef(new Animated.Value(0)).current;  // 0 → 1 during hold
  const pulseAnim = useRef(new Animated.Value(1)).current;      // idle pulse
  const verifiedPulse = useRef(new Animated.Value(1)).current; // verified ring pulse
  const consentToastAnim = useRef(new Animated.Value(80)).current; // slides up from bottom
  const listeningPulse = useRef(new Animated.Value(0)).current; // AI listening pulse
  const holdAnim = useRef(null);
  const hapticInterval = useRef(null);
  const isTriggered = useRef(false);
  const recordingRef = useRef(null); // tracking AI audio

  // ─── Auto-Wipe: Cleanup expired documents locally ───────────────────────────
  useEffect(() => {
    const cleanupOldDocuments = async () => {
      try {
        const now = Timestamp.now();
        console.log('[CrisisSense] 🧹 Running Auto-Wipe cleanup for expired documents...');

        let deletedCount = 0;
        const collectionsToClean = ['alerts', 'witness_reports'];

        for (const colName of collectionsToClean) {
          const q = query(collection(db, colName), where('expireAt', '<', now));
          const snap = await getDocs(q);

          for (const document of snap.docs) {
            await deleteDoc(doc(db, colName, document.id));
            deletedCount++;
          }
        }

        if (deletedCount > 0) {
          console.log(`[CrisisSense] 🧹 Auto-Wipe complete: Deleted ${deletedCount} expired document(s).`);
        } else {
          console.log(`[CrisisSense] 🧹 Auto-Wipe complete: No expired documents found.`);
        }
      } catch (error) {
        console.error('[CrisisSense] ❌ Auto-Wipe cleanup failed:', error);
      }
    };

    cleanupOldDocuments();
  }, []);

  // ─── AI Listening Pulse ───────────────────────────────────────────────────
  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(listeningPulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
          Animated.timing(listeningPulse, { toValue: 0, duration: 0, useNativeDriver: true })
        ])
      ).start();
    } else {
      listeningPulse.setValue(0);
    }
  }, [isListening, listeningPulse]);

  // ─── Privacy Consent: show once on first launch ─────────────────────────────
  useEffect(() => {
    (async () => {
      const seen = await AsyncStorage.getItem('@crisisSense_consentSeen');
      if (!seen) {
        // Small delay so the app renders first
        setTimeout(() => {
          setConsentVisible(true);
          Animated.spring(consentToastAnim, {
            toValue: 0,
            friction: 8,
            tension: 60,
            useNativeDriver: true,
          }).start();
        }, 1200);
      }
    })();
  }, []);

  const dismissConsent = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.timing(consentToastAnim, {
      toValue: 120,
      duration: 280,
      useNativeDriver: true,
    }).start(() => setConsentVisible(false));
    await AsyncStorage.setItem('@crisisSense_consentSeen', 'true');
  };

  // ─── Permissions ────────────────────────────────────────────────────────────
  useEffect(() => {
    requestAllPermissions();
  }, []);

  const requestAllPermissions = async () => {
    setPermissionState('loading');
    try {
      // Step 1: Foreground
      console.log('[CrisisSense] Requesting foreground location...');
      const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();

      if (fgStatus !== 'granted') {
        console.warn('[CrisisSense] ⚠️  Foreground location DENIED.');
        setPermissionState('denied');
        return;
      }

      console.log('[CrisisSense] ✅ Foreground location granted.');

      // Audio (for AI Urgency)
      console.log('[CrisisSense] Requesting audio permission...');
      const { status: audioStatus } = await Audio.requestPermissionsAsync();
      if (audioStatus !== 'granted') {
        console.warn('[CrisisSense] ⚠️ Audio permission DENIED — AI Voice Urgency disabled.');
      } else {
        console.log('[CrisisSense] ✅ Audio permission granted.');
      }

      // Step 2: Background (required for real passive monitoring later)
      console.log('[CrisisSense] Requesting background location...');
      const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();

      if (bgStatus !== 'granted') {
        console.warn('[CrisisSense] ⚠️  Background location DENIED — foreground only mode.');
        setPermissionState('foreground_only');
      } else {
        console.log('[CrisisSense] ✅ Background location granted. Full mode active.');
        setPermissionState('granted');
      }
    } catch (err) {
      console.error('[CrisisSense] Permission error:', err);
      setPermissionState('denied');
    }
  };

  // ─── Idle Pulse Animation ───────────────────────────────────────────────────
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0, duration: 900, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // ─── Heartbeat Haptics ──────────────────────────────────────────────────────
  const startHeartbeatHaptics = () => {
    let beat = 0;
    hapticInterval.current = setInterval(() => {
      // "thump-thump" pattern – two quick impacts, then pause
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 180);
      beat++;
    }, 700);
  };

  const stopHeartbeatHaptics = () => {
    if (hapticInterval.current) {
      clearInterval(hapticInterval.current);
      hapticInterval.current = null;
    }
  };

  // ─── Press-In: Begin hold countdown ────────────────────────────────────────
  const handlePressIn = () => {
    if (isSending || permissionState === 'loading') return;
    isTriggered.current = false;
    setIsHolding(true);

    // Start the fill animation
    holdAnim.current = Animated.timing(holdProgress, {
      toValue: 1,
      duration: HOLD_DURATION,
      useNativeDriver: false,
    });
    holdAnim.current.start(({ finished }) => {
      if (finished && !isTriggered.current) {
        isTriggered.current = true;
        stopHeartbeatHaptics();
        setIsHolding(false);
        handleEmergency(); // ← calls our named function
      }
    });

    startHeartbeatHaptics();
  };

  // ─── Press-Out: User released early, cancel ────────────────────────────────
  const handlePressOut = () => {
    if (isTriggered.current) return; // already fired
    stopHeartbeatHaptics();
    if (holdAnim.current) {
      holdAnim.current.stop();
      holdAnim.current = null;
    }
    Animated.spring(holdProgress, {
      toValue: 0,
      useNativeDriver: false,
    }).start();
    setIsHolding(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // ─── Verified Ring Pulse (loops when isVerified is true) ───────────────────────
  useEffect(() => {
    let verifiedLoop;
    if (isVerified) {
      verifiedLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(verifiedPulse, { toValue: 1.18, duration: 700, useNativeDriver: true }),
          Animated.timing(verifiedPulse, { toValue: 1.0, duration: 700, useNativeDriver: true }),
        ])
      );
      verifiedLoop.start();
    } else {
      verifiedPulse.setValue(1);
    }
    return () => verifiedLoop?.stop();
  }, [isVerified]);

  // ─── Crowd Signal: Haversine + Firestore check ─────────────────────────────
  const haversineMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const toRad = v => (v * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const checkCrowdSignal = async (userLat, userLng) => {
    try {
      const cutoff = Timestamp.fromDate(new Date(Date.now() - 15 * 60 * 1000));
      const q = query(collection(db, 'witness_reports'), where('timestamp', '>=', cutoff));
      const snap = await getDocs(q);
      console.log(`[CrowdSignal] 🔍 ${snap.size} witness report(s) in last 15 min`);
      for (const doc of snap.docs) {
        const data = doc.data();
        if (!data.location) continue;
        const dist = haversineMeters(userLat, userLng, data.location.latitude, data.location.longitude);
        console.log(`[CrowdSignal]   → "${data.categoryLabel}" is ${dist.toFixed(0)}m away`);
        if (dist <= 500) {
          console.log(`[CrowdSignal] ✅ VERIFIED — witness within 500m (${dist.toFixed(0)}m)!`);
          return { verified: true, witness: data, distance: dist };
        }
      }
      console.log('[CrowdSignal] — No nearby witness found.');
      return { verified: false };
    } catch (err) {
      console.warn('[CrowdSignal] Check failed:', err.message);
      return { verified: false };
    }
  };

  // ─── Haptic Heartbeat: triple-pulse fired after confirmed Firestore save ───────────
  // Pattern per beat: Heavy impact → 150ms → Medium impact  ("thump-thump")
  // Three beats total, 450ms apart — unmistakable even in a pocket
  const triggerHapticHeartbeat = (verified = false) => {
    const beat = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 150);
    };
    beat();                              // Beat 1 — immediate
    setTimeout(beat, 450);              // Beat 2 — 450ms later
    setTimeout(beat, 900);              // Beat 3 — 900ms later
    console.log(`[CrisisSense] 💓 Haptic Heartbeat fired — SOS dispatched and verified: ${verified}`);
  };

  // ─── AI Audio Monitoring ──────────────────────────────────────────────────
  const startVoiceAnalysis = async () => {
    setIsListening(true); // Call immediately when startVoiceAnalysis begins
    try {
      console.log('[AI Voice] 🎙️ Starting background voice analysis...');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Force metering by explicitly building custom options
      const preset = {
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        isMeteringEnabled: true,
      };

      const { recording } = await Audio.Recording.createAsync(
        preset,
        (status) => {
          if (status.isRecording && status.isMeteringEnabled && status.metering !== undefined) {
            console.log(`[AI Voice] 🎙️ Decibel level: ${status.metering.toFixed(1)} dB`);
            // -30 threshold (Sensitivity fix)
            if (status.metering > -30) {
              console.log('[AI Voice] 🚨 Loud distress detected! Escalating alert to CRITICAL.');
              updateAlertUrgency('CRITICAL');
              stopVoiceAnalysis(); // Auto-stop once escalated
            }
          }
        },
        500 // Debug Logs update interval 500ms
      );

      recordingRef.current = recording;
    } catch (err) {
      setIsListening(false);
      console.error('[AI Voice] ❌ Failed to start audio monitoring', err);
    }
  };

  const stopVoiceAnalysis = async () => {
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
        recordingRef.current = null;
        setIsListening(false);
        console.log('[AI Voice] 🛑 Audio monitoring stopped.');
      } catch (err) {
        console.error('[AI Voice] ❌ Error stopping recording:', err);
      }
    }
  };

  // ─── AI Voice Escalation ──────────────────────────────────────────────────
  const updateAlertUrgency = async (level) => {
    if (!currentAlertId) return; // Ensure we have an active alert to update

    try {
      const alertRef = doc(db, 'alerts', currentAlertId);
      await updateDoc(alertRef, {
        urgencyLevel: level,
        aiEscalated: true,
        lastUpdated: serverTimestamp()
      });
      console.log(`[AI] ⚡ Alert escalated to: ${level}`);
    } catch (error) {
      console.error('Error escalating alert:', error);
    }
  };

  // ─── handleEmergency: Core SOS function ────────────────────────────────────
  const handleEmergency = async () => {
    if (permissionState === 'denied') {
      Alert.alert(
        '📍 Location Required',
        'CrisisSense cannot function without location access. Please grant permission in your device Settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
      holdProgress.setValue(0);
      return;
    }

    setIsSending(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      console.log('[CrisisSense] 🚨 Emergency triggered — fetching high-accuracy GPS...');

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });

      const { latitude, longitude, altitude, speed, accuracy, heading } = location.coords;
      console.log(`[CrisisSense] 📍 Lat: ${latitude}, Lng: ${longitude} | ±${accuracy?.toFixed(1)}m`);

      // ── Step 1: Verification Check — query witness_reports BEFORE saving ──
      console.log('[CrisisSense] 🔍 Running Crowd Signal verification check...');
      const crowdResult = await checkCrowdSignal(latitude, longitude);
      const isNowVerified = crowdResult.verified;

      if (isNowVerified) {
        console.log(`[CrisisSense] 🟢 VERIFIED — witness within 500m (${crowdResult.distance?.toFixed(0)}m)`);
        setIsVerified(true);
        setVerifiedWitness(crowdResult.witness);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        console.log('[CrisisSense] 🟡 No nearby witness — status: Awaiting Peer Verification');
      }

      // ── Step 2: Save alert to Firestore with the correct verified status from the start ──
      const expireAt = Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000));
      const docRef = await addDoc(collection(db, 'alerts'), {
        mode: 'SELF_EMERGENCY',
        status: 'active',
        locationMode: permissionState,
        crowdVerified: isNowVerified,
        witnessDistanceM: crowdResult.distance ? Math.round(crowdResult.distance) : null,
        witnessCategory: crowdResult.witness?.categoryLabel ?? null,
        timestamp: serverTimestamp(),
        expireAt,
        location: {
          latitude,
          longitude,
          altitude: altitude ?? null,
          speed: speed ?? null,
          accuracy: accuracy ?? null,
          heading: heading ?? null,
        },
        device: { platform: 'expo' },
      });

      console.log(`[CrisisSense] ✅ Alert saved! ID: ${docRef.id} | Verified: ${isNowVerified}`);
      setCurrentAlertId(docRef.id);
      setSentSuccess(true);
      startVoiceAnalysis(); // Start actual microphone listening & UI

      // 💓 Haptic Heartbeat — triple pulse so victim knows help is coming without looking
      triggerHapticHeartbeat(isNowVerified);

    } catch (error) {
      console.error('[CrisisSense] ❌ handleEmergency failed:', error);
      Alert.alert('Send Failed', `Could not send alert: ${error.message}\n\nPlease try again.`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSending(false);
      Animated.timing(holdProgress, { toValue: 0, duration: 400, useNativeDriver: false }).start();
    }
  };

  // ─── Reset from success state ───────────────────────────────────────────────
  const handleDismissSuccess = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSentSuccess(false);
    setIsVerified(false);
    setVerifiedWitness(null);
    setIsListening(false);
    stopVoiceAnalysis();
  };

  // ─── Witness Report ─────────────────────────────────────────────────────────
  const handleWitnessReport = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setWitnessVisible(true);
  };

  // ─── Animated ring width ────────────────────────────────────────────────────
  const ringSize = holdProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [260, 310], // button expands as held
  });
  const ringOpacity = holdProgress.interpolate({
    inputRange: [0, 0.1, 1],
    outputRange: [0, 1, 1],
  });

  // ─── Permission Denied Screen ─────────────────────────────────────────────
  if (permissionState === 'denied') {
    return (
      <View style={styles.permissionContainer}>
        <StatusBar style="light" />
        <Text style={styles.permissionIcon}>📍</Text>
        <Text style={styles.permissionTitle}>Location Access Required</Text>
        <Text style={styles.permissionBody}>
          CrisisSense AI needs your location to dispatch emergency services instantly.{`\n\n`}
          Without it, the SOS button cannot function.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestAllPermissions}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.permissionSettingsBtn} onPress={() => Linking.openSettings()}>
          <Text style={styles.permissionSettingsText}>Open Settings</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.appName}>CrisisSense <Text style={styles.appNameAccent}>AI</Text></Text>
        <Text style={styles.subtitle}>EMERGENCY ASSISTANCE</Text>
      </View>

      {/* ── SOS Button Area ── */}
      <View style={styles.buttonContainer}>

        {sentSuccess ? (
          <View style={styles.successContainer}>
            <Text style={styles.successIcon}>🚨</Text>
            <Text style={styles.successTitle}>Help is on the way!</Text>

            {/* ── Crowd Signal Status Badge ── */}
            {isVerified ? (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedBadgeText}>
                  🟢  Verified by Nearby Witnesses
                </Text>
                {verifiedWitness && (
                  <Text style={styles.verifiedBadgeSub}>
                    {verifiedWitness.categoryLabel} confirmed within 500m
                  </Text>
                )}
              </View>
            ) : (
              <View style={styles.awaitingBadge}>
                <Text style={styles.awaitingBadgeText}>
                  🟡  Awaiting Verification
                </Text>
                <Text style={styles.awaitingBadgeSub}>
                  No witness reports found nearby yet
                </Text>
              </View>
            )}

            <Text style={styles.successSubtitle}>
              Your location has been dispatched to emergency services.
            </Text>

            {/* ── AI Monitoring Feedback ── */}
            {isListening && (
              <View style={styles.listeningContainer}>
                <Animated.View
                  style={[
                    styles.pulseRing,
                    {
                      transform: [{
                        scale: listeningPulse.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.5],
                        })
                      }],
                      opacity: listeningPulse.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.5, 0],
                      })
                    }
                  ]}
                />
                <Text style={styles.listeningText}>🎙️ AI Monitoring Urgency...</Text>
              </View>
            )}

            <TouchableOpacity style={styles.successDismiss} onPress={handleDismissSuccess}>
              <Text style={styles.successDismissText}>Back to Standby</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Verified ring — pulses green when crowd verified */}
            {isVerified && (
              <Animated.View
                style={[
                  styles.verifiedRing,
                  { transform: [{ scale: verifiedPulse }] },
                ]}
              />
            )}

            {/* Animated hold-ring behind button */}
            <Animated.View
              style={[
                styles.holdRing,
                {
                  width: ringSize,
                  height: ringSize,
                  borderRadius: Animated.divide(ringSize, 2),
                  opacity: ringOpacity,
                },
              ]}
            />

            {/* Idle pulse scale wrapper */}
            <Animated.View style={{ transform: [{ scale: isHolding ? 1 : pulseAnim }] }}>
              <Pressable
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={isSending}
                style={[
                  styles.sosButton,
                  isSending && styles.sosButtonDisabled,
                  isVerified && styles.sosButtonVerified,
                ]}
              >
                {isSending ? (
                  <ActivityIndicator color="#FFFFFF" size="large" />
                ) : (
                  <View style={styles.sosInner}>
                    <Text style={styles.sosText}>SOS</Text>
                    <Text style={styles.sosSubtext}>
                      {isHolding ? 'Hold...' : isVerified ? 'Verified' : 'Hold to Send'}
                    </Text>
                  </View>
                )}
              </Pressable>
            </Animated.View>
          </>
        )}
      </View>

      {/* ── Status text + Encrypted badge ── */}
      <View style={styles.statusRow}>
        <Text style={styles.statusText}>
          {isSending
            ? '🛰️  Dispatching your location...'
            : permissionState === 'loading'
              ? '⏳ Checking permissions...'
              : permissionState === 'granted'
                ? '📍 GPS Ready — Full Mode'
                : permissionState === 'foreground_only'
                  ? '⚠️  Foreground only — background limited'
                  : '❌  Location permission denied'}
        </Text>
        {(permissionState === 'granted' || permissionState === 'foreground_only') && (
          <View style={styles.encryptedBadge}>
            <Text style={styles.encryptedBadgeText}>🔒 Encrypted</Text>
          </View>
        )}
      </View>

      {/* ── Witness Report Button ── */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.witnessButton}
          onPress={handleWitnessReport}
          activeOpacity={0.8}
        >
          <Text style={styles.witnessIcon}>👀</Text>
          <Text style={styles.witnessText}>Witness Report</Text>
        </TouchableOpacity>
      </View>
      {/* ── Witness Mode Modal ── */}
      <WitnessMode visible={witnessVisible} onClose={() => setWitnessVisible(false)} />

      {/* ── Privacy Consent Toast ── */}
      {consentVisible && (
        <Animated.View
          style={[
            styles.consentToast,
            { transform: [{ translateY: consentToastAnim }] },
          ]}
        >
          <Text style={styles.consentTitle}>🔒 Your Privacy Matters</Text>
          <Text style={styles.consentBody}>
            CrisisSense collects your GPS location only when you trigger an SOS or file a witness report.
            All data is encrypted, stored securely, and{' '}
            <Text style={styles.consentHighlight}>auto-deleted after 24 hours.</Text>
          </Text>
          <TouchableOpacity style={styles.consentBtn} onPress={dismissConsent}>
            <Text style={styles.consentBtnText}>Got it — I Consent</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D14',
    alignItems: 'center',
  },

  // ── Header ──
  header: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 20,
  },
  appName: {
    fontSize: 30,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  appNameAccent: {
    color: '#FF3B30',
  },
  subtitle: {
    fontSize: 11,
    color: '#555570',
    marginTop: 4,
    letterSpacing: 3,
    fontWeight: '600',
  },

  // ── SOS Button Area ──
  buttonContainer: {
    flex: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  holdRing: {
    position: 'absolute',
    backgroundColor: 'rgba(255,59,48,0.15)',
    borderWidth: 3,
    borderColor: 'rgba(255,59,48,0.6)',
  },
  sosButton: {
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 20,
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
  },
  sosButtonDisabled: {
    backgroundColor: '#8B1A14',
    shadowOpacity: 0.2,
    elevation: 5,
  },
  sosInner: {
    alignItems: 'center',
  },
  sosText: {
    fontSize: 68,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 3,
  },
  sosSubtext: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
    letterSpacing: 0.5,
  },

  // ── Status ──
  statusText: {
    fontSize: 13,
    color: '#555570',
    marginBottom: 20,
    fontWeight: '500',
  },

  // ── Witness Button ──
  footer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 10,
  },
  witnessButton: {
    width: '82%',
    padding: 18,
    borderRadius: 18,
    backgroundColor: '#1A1A2E',
    borderWidth: 1,
    borderColor: '#2E2E4A',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  witnessIcon: {
    fontSize: 20,
  },
  witnessText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#7B9FFF',
    letterSpacing: 0.3,
  },

  // ── Success Banner ──
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  successIcon: {
    fontSize: 72,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#34C759',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  successSubtitle: {
    fontSize: 15,
    color: '#888899',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 36,
  },
  successDismiss: {
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2E2E4A',
  },
  successDismissText: {
    fontSize: 15,
    color: '#555570',
    fontWeight: '700',
  },

  // ── Verified Badge ──
  verifiedBadge: {
    backgroundColor: 'rgba(52,199,89,0.12)',
    borderWidth: 1.5,
    borderColor: '#34C759',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginBottom: 16,
    alignItems: 'center',
  },
  verifiedBadgeText: {
    color: '#34C759',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  verifiedBadgeSub: {
    color: '#34C759',
    opacity: 0.7,
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },

  // ── Awaiting Verification Badge ──
  awaitingBadge: {
    backgroundColor: 'rgba(255,204,0,0.10)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,204,0,0.6)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginBottom: 16,
    alignItems: 'center',
  },
  awaitingBadgeText: {
    color: '#FFCC00',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  awaitingBadgeSub: {
    color: '#FFCC00',
    opacity: 0.7,
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
    textAlign: 'center',
  },

  // ── Verified Ring (pulse behind SOS button) ──
  verifiedRing: {
    position: 'absolute',
    width: 290,
    height: 290,
    borderRadius: 145,
    borderWidth: 3,
    borderColor: '#34C759',
    backgroundColor: 'rgba(52,199,89,0.08)',
  },

  // ── SOS button in verified mode ──
  sosButtonVerified: {
    shadowColor: '#34C759',
    shadowOpacity: 0.55,
    shadowRadius: 28,
    elevation: 22,
  },

  // ── Permission Denied Screen ──
  permissionContainer: {
    flex: 1,
    backgroundColor: '#0D0D14',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  permissionIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  permissionBody: {
    fontSize: 15,
    color: '#888899',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 36,
  },
  permissionButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 16,
    marginBottom: 14,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  permissionButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  permissionSettingsBtn: {
    paddingVertical: 12,
  },
  permissionSettingsText: {
    fontSize: 14,
    color: '#555570',
    fontWeight: '600',
  },

  // ── Status Row (status text + encrypted badge) ──
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  statusText: {
    fontSize: 13,
    color: '#555570',
    fontWeight: '500',
  },
  encryptedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52,199,89,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(52,199,89,0.35)',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  encryptedBadgeText: {
    fontSize: 10,
    color: '#34C759',
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // ── AI Listening ──
  listeningContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 15,
  },
  pulseRing: {
    position: 'absolute',
    width: 220,
    height: 38,
    backgroundColor: '#FF3B30',
    borderRadius: 19,
    zIndex: 0,
  },
  listeningText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
    zIndex: 1,
  },

  // ── Privacy Consent Toast ──
  consentToast: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#13131F',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: '#2A2A40',
    padding: 24,
    paddingBottom: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 20,
  },
  consentTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  consentBody: {
    fontSize: 13,
    color: '#777790',
    lineHeight: 20,
    marginBottom: 20,
  },
  consentHighlight: {
    color: '#34C759',
    fontWeight: '700',
  },
  consentBtn: {
    backgroundColor: '#FF3B30',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  consentBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
