import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

interface LocationCoords {
  latitude: number;
  longitude: number;
}

interface UseLocationReturn {
  location: LocationCoords | null;
  errorMsg: string | null;
  isLoading: boolean;
}

export function useLocation(): UseLocationReturn {
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function requestAndGetLocation() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (isMounted) {
            setErrorMsg('Permission to access location was denied');
            setIsLoading(false);
          }
          return;
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (isMounted) {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        }
      } catch (err) {
        if (isMounted) {
          const message =
            err instanceof Error ? err.message : 'Failed to get location';
          setErrorMsg(message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    requestAndGetLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  return { location, errorMsg, isLoading };
}
