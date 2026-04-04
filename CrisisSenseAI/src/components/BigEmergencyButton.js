import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, runOnJS, Easing } from 'react-native-reanimated';
import { theme } from '../constants/theme';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

export const BigEmergencyButton = ({ onTrigger, isOffline }) => {
  const pulseScale = useSharedValue(1);
  const opacity = useSharedValue(0.7);
  const pressProgress = useSharedValue(0);

  useEffect(() => {
    pulseScale.value = withRepeat(
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

  const animatedGlowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: opacity.value,
  }));

  const animatedFillStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressProgress.value * 1.5 }], // Scale large enough to fill entirely
    opacity: pressProgress.value > 0 ? 0.3 : 0,
  }));

  const buttonScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressProgress.value * 0.05 }], // Pressed down effect
  }));

  const triggerAction = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onTrigger();
  };

  const longPressGesture = Gesture.LongPress()
    .minDuration(2000)
    .onTouchesDown(() => {
      pressProgress.value = withTiming(1, { duration: 2000, easing: Easing.linear });
    })
    .onTouchesUp(() => {
      pressProgress.value = withTiming(0, { duration: 300 });
    })
    .onEnd((e, success) => {
      if (success) {
        runOnJS(triggerAction)();
      }
    });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.glow, animatedGlowStyle]} />
      <GestureDetector gesture={longPressGesture}>
        <Animated.View style={[styles.button, isOffline && styles.buttonOffline, buttonScaleStyle]}>
          <Animated.View style={[styles.fillIndicator, animatedFillStyle]} />
          <Text style={styles.text}>{isOffline ? 'EMERGENCY\n(SMS Fallback)' : 'EMERGENCY'}</Text>
        </Animated.View>
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
    borderRadius: theme.borderRadius.button, // if it's 50% or large enough
    backgroundColor: theme.colors.primary,
  },
  button: {
    width: 260,
    height: 260,
    borderRadius: 130, // Make sure it's fully circle
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    overflow: 'hidden', // Contain the fill indicator
  },
  fillIndicator: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
    borderRadius: 150,
    opacity: 0,
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
    zIndex: 2, // ensure text is above the fill
  },
});
