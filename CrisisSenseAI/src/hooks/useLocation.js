import { useCallback, useState } from 'react';
import * as Location from 'expo-location';

export const useLocation = () => {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const fetchLocation = useCallback(async () => {
    setErrorMsg(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocation(null);
        setErrorMsg('Location permission is required to send an emergency alert.');
        return null;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const result = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        timestamp: loc.timestamp,
        accuracy: loc.coords.accuracy ?? null,
      };
      setLocation(result);
      return result;
    } catch {
      setLocation(null);
      setErrorMsg('Unable to obtain your location. Please retry or call emergency services.');
      return null;
    }
  }, []);

  return { location, errorMsg, fetchLocation };
};
