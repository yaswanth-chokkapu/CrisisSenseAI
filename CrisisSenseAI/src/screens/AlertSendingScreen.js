import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { theme } from '../constants/theme';
import { ChecklistItem } from '../components/ChecklistItem';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { MOCK_HOSPITALS } from '../constants/mockData';
import { sendSilentSMSFallback } from '../services/smsService';

const TASKS = [
  "Contacting emergency services",
  "Notifying family contacts (3)",
  "Alerting nearby hospitals",
  "Sharing live location"
];

export const AlertSendingScreen = ({ route, navigation }) => {
  const [completedItems, setCompletedItems] = useState(0);
  const [dispatchError, setDispatchError] = useState(null);
  const progress = useSharedValue(0);

  useEffect(() => {
    let cancelled = false;
    let progressInterval;
    let transitionTimeout;

    const sendAlert = async () => {
      try {
        const hospital = MOCK_HOSPITALS[0];
        const deleteAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
        await addDoc(collection(db, 'alerts'), {
          ...(route?.params ?? {}),
          notifiedHospital: hospital.name,
          hospitalDistance: hospital.distance,
          status: 'dispatched',
          timestamp: serverTimestamp(),
          deleteAt: deleteAt
        });
        return true;
      } catch (e) {
        console.warn('Failed to send alert to Firebase:', e);
        return sendSilentSMSFallback(route?.params ?? {});
      }
    };

    progressInterval = setInterval(() => {
      setCompletedItems(prev => {
        if (prev < TASKS.length - 1) {
          progress.value = withTiming(((prev + 1) / TASKS.length) * 100, { duration: 300 });
          return prev + 1;
        }
        return prev;
      });
    }, 800);

    sendAlert()
      .then((sent) => {
        if (cancelled) return;
        clearInterval(progressInterval);
        if (!sent) {
          setDispatchError('Unable to send alert. Please retry or call emergency services.');
          return;
        }
        setCompletedItems(TASKS.length);
        progress.value = withTiming(100, { duration: 300 });
        transitionTimeout = setTimeout(() => {
          navigation.replace('ConfirmationScreen', route?.params ?? {});
        }, 500);
      })
      .catch(() => {
        if (!cancelled) {
          clearInterval(progressInterval);
          setDispatchError('Unable to send alert. Please retry or call emergency services.');
        }
      });

    return () => {
      cancelled = true;
      clearInterval(progressInterval);
      clearTimeout(transitionTimeout);
    };
  }, [navigation, progress, route?.params]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sending Alert...</Text>
      
      <View style={styles.listContainer}>
        {TASKS.map((task, index) => (
          <ChecklistItem 
            key={index}
            label={task}
            isChecked={index < completedItems}
            index={index}
          />
        ))}
      </View>

      <View style={styles.progressContainer}>
        <Animated.View style={[styles.progressBar, progressStyle]} />
      </View>

      {dispatchError ? (
        <Text style={styles.errorText}>{dispatchError}</Text>
      ) : null}
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
  title: {
    color: theme.colors.primary,
    fontSize: theme.typography.sizes.heading,
    fontWeight: 'bold',
    fontFamily: theme.typography.fontFamily,
    marginBottom: theme.spacing.xxl,
    textAlign: 'center',
  },
  listContainer: {
    marginBottom: theme.spacing.xxl,
  },
  progressContainer: {
    height: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'absolute',
    bottom: theme.spacing.xxl,
    left: theme.spacing.large,
    right: theme.spacing.large,
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
  },
  errorText: {
    color: theme.colors.warning,
    fontSize: theme.typography.sizes.body,
    fontFamily: theme.typography.fontFamily,
    textAlign: 'center',
    marginTop: theme.spacing.large,
  },
});
