import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay } from 'react-native-reanimated';
import { theme } from '../constants/theme';

export const ChecklistItem = ({ label, isChecked, index }) => {
  const translateX = useSharedValue(-50);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateX.value = withDelay(index * 300, withTiming(0, { duration: 300 }));
    opacity.value = withDelay(index * 300, withTiming(1, { duration: 300 }));
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Text style={styles.icon}>{isChecked ? '✅' : '☐'}</Text>
      <Text style={styles.label}>{label}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.small,
  },
  icon: {
    fontSize: theme.typography.sizes.title,
    marginRight: theme.spacing.medium,
  },
  label: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.sizes.body,
    fontFamily: theme.typography.fontFamily,
  },
});
