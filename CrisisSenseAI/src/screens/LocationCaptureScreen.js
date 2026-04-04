import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { theme } from '../constants/theme';
import { useLocation } from '../hooks/useLocation';

export const LocationCaptureScreen = ({ navigation }) => {
  const { location, errorMsg, fetchLocation } = useLocation();
  const [displayCoords, setDisplayCoords] = useState(null);

  useEffect(() => {
    let timeout;
    const getLoc = async () => {
      const loc = await fetchLocation();
      setDisplayCoords(loc);
      timeout = setTimeout(() => {
        navigation.replace('AlertSending');
      }, 1500);
    };
    getLoc();
    return () => clearTimeout(timeout);
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={styles.text}>Capturing your location...</Text>
      
      {errorMsg ? (
        <Text style={styles.warning}>{errorMsg}</Text>
      ) : null}

      {displayCoords && (
        <View style={styles.coordsContainer}>
          <Text style={styles.coords}>
            {displayCoords.latitude.toFixed(4)}° N, {displayCoords.longitude.toFixed(4)}° E
          </Text>
          <Text style={styles.timestamp}>
            {new Date(displayCoords.timestamp).toISOString()}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.large,
  },
  text: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.sizes.subtitle,
    fontFamily: theme.typography.fontFamily,
    marginTop: theme.spacing.large,
  },
  warning: {
    color: theme.colors.warning,
    marginTop: theme.spacing.medium,
    fontFamily: theme.typography.fontFamily,
  },
  coordsContainer: {
    marginTop: theme.spacing.xl,
    alignItems: 'center',
  },
  coords: {
    color: theme.colors.success,
    fontSize: theme.typography.sizes.title,
    fontFamily: theme.typography.fontFamily,
    fontWeight: 'bold',
  },
  timestamp: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.small,
    marginTop: theme.spacing.small,
    fontFamily: theme.typography.fontFamily,
  },
});
