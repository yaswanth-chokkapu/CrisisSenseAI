import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { DEFAULT_LOCATION } from '../constants/mockData';

export const useLocation = () => {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const fetchLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Location unavailable — using last known');
        setLocation(DEFAULT_LOCATION);
        return DEFAULT_LOCATION;
      }

      let loc = await Location.getCurrentPositionAsync({});
      const result = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        timestamp: loc.timestamp,
        accuracy: loc.coords.accuracy,
      };
      setLocation(result);
      return result;
    } catch (error) {
      setErrorMsg('Location unavailable — using last known');
      setLocation(DEFAULT_LOCATION);
      return DEFAULT_LOCATION;
    }
  };

  return { location, errorMsg, fetchLocation };
};
