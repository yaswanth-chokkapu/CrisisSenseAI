import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import { theme } from '../constants/theme';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

export const BigEmergencyButton = ({ onTrigger, isOffline }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.7);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(withTiming(1.08, { duration: 1000 }), withTiming(1.0, { duration: 1000 })),
      -1,
      true
    );
    opacity.value = withRepeat(
      withSequence(withTiming(1, { duration: 1000 }), withTiming(0.7, { duration: 1000 })),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const longPressGesture = Gesture.LongPress()
    .minDuration(2000)
    .onStart(() => {
      // Provide initial haptic feedback
      // Can't invoke pure expo-haptics synchronously inside worklet if not expected, 
      // but runOnJS could be used. For simplicity, just use onEnd.
    })
    .onEnd((e, success) => {
      if (success) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        onTrigger();
      }
    })
    .runOnJS(true);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.glow, animatedStyle]} />
      <GestureDetector gesture={longPressGesture}>
        <View style={[styles.button, isOffline && styles.buttonOffline]}>
          <Text style={styles.text}>{isOffline ? 'EMERGENCY\n(SMS Fallback)' : 'EMERGENCY'}</Text>
        </View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 320,
    height: 320,
  },
  glow: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: theme.borderRadius.button,
    backgroundColor: theme.colors.primary,
  },
  button: {
    width: 260,
    height: 260,
    borderRadius: theme.borderRadius.button,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  buttonOffline: {
    backgroundColor: theme.colors.warning,
  },
  text: {
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.sizes.heading,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
