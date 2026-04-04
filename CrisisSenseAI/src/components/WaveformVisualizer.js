import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import { theme } from '../constants/theme';

const Bar = ({ index }) => {
  const height = useSharedValue(20);

  useEffect(() => {
    const randomDuration = 300 + Math.random() * 500;
    const randomHeight = 20 + Math.random() * 80;
    
    height.value = withRepeat(
      withSequence(
        withTiming(randomHeight, { duration: randomDuration }),
        withTiming(20, { duration: randomDuration })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return <Animated.View style={[styles.bar, animatedStyle]} />;
};

export const WaveformVisualizer = () => {
  return (
    <View style={styles.container}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Bar key={i} index={i} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
    gap: theme.spacing.small,
  },
  bar: {
    width: 20,
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
  },
});
