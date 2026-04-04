import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { theme } from '../constants/theme';
import { EtaCard } from '../components/EtaCard';
import { MOCK_HOSPITALS, DEFAULT_LOCATION } from '../constants/mockData';
import MapView, { Marker } from 'react-native-maps';

const EnRouteAnimation = () => {
  const dotPosition = useSharedValue(0);

  useEffect(() => {
    dotPosition.value = withRepeat(
      withTiming(1, { duration: 3000 }),
      -1,
      false
    );
  }, []);

  const animatedDotStyle = useAnimatedStyle(() => ({
    left: `${dotPosition.value * 95}%`, // 95% so it doesn't go completely off screen
  }));

  return (
    <View style={styles.enRouteContainer}>
      <Text style={styles.enRouteText}>🚑 En route - Help is approaching</Text>
      <View style={styles.lineContainer}>
        <View style={styles.line} />
        <Animated.View style={[styles.dot, animatedDotStyle]} />
      </View>
    </View>
  );
};

export const ConfirmationScreen = ({ navigation }) => {
  const scale = useSharedValue(0);
  const pulse = useSharedValue(1);
  const [countdown, setCountdown] = useState(10);
  const [etaTimer, setEtaTimer] = useState(240); // 4 minutes

  useEffect(() => {
    scale.value = withSpring(1.2, { damping: 5 }, () => {
      scale.value = withSpring(1.0);
    });

    pulse.value = withRepeat(
      withSequence(withTiming(1.1, { duration: 1000 }), withTiming(1, { duration: 1000 })),
      -1,
      true
    );

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const etaInterval = setInterval(() => {
      setEtaTimer(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);

    return () => {
      clearInterval(timer);
      clearInterval(etaInterval);
    };
  }, []);

  const animatedCheckmarkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const formatEta = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.iconContainer, animatedPulseStyle]}>
        <Animated.Text style={[styles.checkmark, animatedCheckmarkStyle]}>✅</Animated.Text>
      </Animated.View>
      
      <Text style={styles.heading}>Help is on the way</Text>

      <View style={styles.grid}>
        <View style={styles.row}>
          <EtaCard title="Alert Status" value="Sent ✅" />
          <EtaCard title="Location" value="Shared 📍" />
        </View>
        <View style={styles.row}>
          <EtaCard title="Contacts" value="3 Notified 👥" />
          <EtaCard title="ETA" value={`~${formatEta(etaTimer)}`} />
        </View>
      </View>

      <EnRouteAnimation />

      <Text style={styles.nearestHospital}>
        Nearest hospital: {MOCK_HOSPITALS[0].name} — {MOCK_HOSPITALS[0].distance} away
      </Text>

      {countdown > 0 ? (
        <View style={styles.countdownBanner}>
          <Text style={styles.countdownText}>Calling emergency services in {countdown}s...</Text>
          <TouchableOpacity onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] })} style={styles.cancelBtnText}>
            <Text style={styles.cancelTextInner}>Cancel Call</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.callingBanner}>
          <Text style={styles.callingText}>Active phone call with Emergency Services...</Text>
        </View>
      )}

      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: DEFAULT_LOCATION.latitude,
            longitude: DEFAULT_LOCATION.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Marker coordinate={{ latitude: DEFAULT_LOCATION.latitude, longitude: DEFAULT_LOCATION.longitude }} title="Emergency Location" pinColor={theme.colors.primary} />
        </MapView>
      </View>

      <TouchableOpacity 
        style={styles.cancelAlertButton}
        onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] })}
      >
        <Text style={styles.cancelAlertText}>CANCEL ALERT</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    padding: theme.spacing.large,
    paddingTop: theme.spacing.xxl * 2,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(46, 196, 182, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.large,
  },
  checkmark: {
    fontSize: 60,
  },
  heading: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.sizes.heading,
    fontFamily: theme.typography.fontFamily,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xl,
  },
  grid: {
    width: '100%',
    marginBottom: theme.spacing.xl,
  },
  row: {
    flexDirection: 'row',
  },
  enRouteContainer: {
    width: '100%',
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.medium,
  },
  enRouteText: {
    color: theme.colors.success,
    fontSize: theme.typography.sizes.body,
    fontWeight: 'bold',
    fontFamily: theme.typography.fontFamily,
    marginBottom: theme.spacing.small,
  },
  lineContainer: {
    width: '100%',
    height: 10,
    justifyContent: 'center',
  },
  line: {
    width: '100%',
    height: 2,
    backgroundColor: theme.colors.surface,
  },
  dot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
  },
  nearestHospital: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.body,
    fontFamily: theme.typography.fontFamily,
    textAlign: 'center',
    marginBottom: theme.spacing.xxl,
  },
  countdownBanner: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.medium,
    borderRadius: theme.borderRadius.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xl,
  },
  countdownText: {
    color: theme.colors.warning,
    fontFamily: theme.typography.fontFamily,
    flex: 1,
  },
  cancelBtnText: {
    padding: theme.spacing.small,
  },
  cancelTextInner: {
    color: theme.colors.textPrimary,
    textDecorationLine: 'underline',
  },
  callingBanner: {
    width: '100%',
    backgroundColor: theme.colors.success,
    padding: theme.spacing.medium,
    borderRadius: theme.borderRadius.card,
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  callingText: {
    color: '#000',
    fontWeight: 'bold',
  },
  mapContainer: {
    width: '100%',
    height: 120,
    borderRadius: theme.borderRadius.card,
    overflow: 'hidden',
    marginBottom: 80,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  cancelAlertButton: {
    width: '100%',
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.medium,
    borderRadius: theme.borderRadius.button,
    alignItems: 'center',
    position: 'absolute',
    bottom: theme.spacing.xxl,
  },
  cancelAlertText: {
    color: theme.colors.textPrimary,
    fontWeight: 'bold',
    fontSize: theme.typography.sizes.title,
    fontFamily: theme.typography.fontFamily,
  },
});
