import { useState, useCallback } from "react";

interface Coordinates {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  permissionDenied: boolean;
  isLoading: boolean;
}

export const useUserCoordinates = () => {
  const [userCoordinates, setUserCoordinates] = useState<Coordinates>({
    latitude: null,
    longitude: null,
    error: null,
    permissionDenied: false,
    isLoading: true,
  });

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setUserCoordinates((prev) => ({
        ...prev,
        error: "Geolocation is not supported",
        permissionDenied: true,
        isLoading: false,
      }));
      return;
    }

    const handleSuccess = (position: GeolocationPosition) => {
      setUserCoordinates({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        error: null,
        permissionDenied: false,
        isLoading: false,
      });
    };

    const handleError = (error: GeolocationPositionError) => {
      setUserCoordinates((prev) => ({
        ...prev,
        error: error.message,
        permissionDenied: error.code === 1,
        isLoading: false,
      }));
    };

    navigator.geolocation.getCurrentPosition(handleSuccess, handleError);
  }, []);

  return { ...userCoordinates, requestLocation };
};
