import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { theme } from '../constants/theme';
import { useLocation } from '../hooks/useLocation';

export const LocationCaptureScreen = ({ route, navigation }) => {
  const { errorMsg, fetchLocation } = useLocation();
  const [displayCoords, setDisplayCoords] = useState(null);
  const [isCapturing, setIsCapturing] = useState(true);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;
    let timeout;

    const getLoc = async () => {
      setIsCapturing(true);
      setDisplayCoords(null);

      const loc = await fetchLocation();
      if (!active) return;

      if (!loc) {
        setIsCapturing(false);
        return;
      }

      setDisplayCoords(loc);
      timeout = setTimeout(() => {
        navigation.replace('AlertSending', {
          ...(route.params ?? {}),
          latitude: loc.latitude,
          longitude: loc.longitude,
          accuracy: loc.accuracy ?? null,
          capturedAt: loc.timestamp,
        });
      }, 1500);
    };

    getLoc();

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [fetchLocation, navigation, route.params, retryKey]);

  return (
    <View style={styles.container}>
      {isCapturing ? (
        <>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.text}>Capturing your location...</Text>
        </>
      ) : (
        <Text style={styles.text}>Location unavailable</Text>
      )}
      
      {errorMsg ? (
        <>
          <Text style={styles.warning}>{errorMsg}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => setRetryKey((value) => value + 1)}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </>
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
    textAlign: 'center',
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
  retryButton: {
    marginTop: theme.spacing.large,
    paddingVertical: theme.spacing.medium,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.button,
    backgroundColor: theme.colors.primary,
  },
  retryText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.sizes.body,
    fontFamily: theme.typography.fontFamily,
    fontWeight: 'bold',
  },
});
