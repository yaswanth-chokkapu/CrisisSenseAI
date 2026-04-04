import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';

export const OfflineBanner = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Low network — Fallback mode active</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.warning,
    padding: theme.spacing.small,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  text: {
    color: '#000000',
    fontFamily: theme.typography.fontFamily,
    fontWeight: 'bold',
  },
});
