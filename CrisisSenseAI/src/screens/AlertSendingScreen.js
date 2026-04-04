import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { theme } from '../constants/theme';
import { ChecklistItem } from '../components/ChecklistItem';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { MOCK_HOSPITALS } from '../constants/mockData';

const TASKS = [
  "Contacting emergency services",
  "Notifying family contacts (3)",
  "Alerting nearby hospitals",
  "Sharing live location"
];

export const AlertSendingScreen = ({ route, navigation }) => {
  const [completedItems, setCompletedItems] = useState(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    // Send alert to Firebase in the background
    const sendAlert = async () => {
      try {
        const hospital = MOCK_HOSPITALS[0];
        await addDoc(collection(db, 'alerts'), {
          ...route?.params,
          notifiedHospital: hospital.name,
          hospitalDistance: hospital.distance,
          status: 'dispatched',
          timestamp: serverTimestamp()
        });
      } catch (e) {
        console.warn('Failed to send alert to Firebase:', e);
      }
    };
    sendAlert();

    let interval = setInterval(() => {
      setCompletedItems(prev => {
        if (prev < TASKS.length) {
          progress.value = withTiming(((prev + 1) / TASKS.length) * 100, { duration: 300 });
          return prev + 1;
        }
        clearInterval(interval);
        setTimeout(() => {
          navigation.replace('ConfirmationScreen', route ? route.params : {});
        }, 500);
        return prev;
      });
    }, 800);

    return () => clearInterval(interval);
  }, []);

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
});
