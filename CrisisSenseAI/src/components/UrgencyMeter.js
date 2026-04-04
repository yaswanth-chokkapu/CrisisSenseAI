import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { theme } from '../constants/theme';

export const UrgencyMeter = ({ level }) => {
  // level: 0 to 1
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(level * 100, { duration: 1000 });
  }, [level]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  const getColor = () => {
    if (level < 0.33) return theme.colors.success;
    if (level < 0.66) return theme.colors.warning;
    return theme.colors.primary;
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.fill, animatedStyle, { backgroundColor: getColor() }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 20,
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    overflow: 'hidden',
    marginVertical: theme.spacing.medium,
  },
  fill: {
    height: '100%',
    borderRadius: 10,
  },
});
