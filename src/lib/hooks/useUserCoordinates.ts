import { useState, useEffect } from "react";

interface Coordinates {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
}

export const useUserCoordinates = () => {
  const [coordinates, setCoordinates] = useState<Coordinates>({
    latitude: null,
    longitude: null,
    error: null,
  });

  useEffect(() => {
    // Check if geolocation is supported by the browser
    if (!navigator.geolocation) {
      setCoordinates((prev) => ({
        ...prev,
        error: "Geolocation is not supported by your browser",
      }));
      return;
    }

    // Success callback
    const handleSuccess = (position: GeolocationPosition) => {
      setCoordinates({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        error: null,
      });
    };

    // Error callback
    const handleError = (error: GeolocationPositionError) => {
      setCoordinates((prev) => ({
        ...prev,
        error: error.message,
      }));
    };

    // Get the current position
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError);

    // Optional: Use watchPosition to keep tracking location changes
    const watchId = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError
    );

    // Cleanup: remove the watch when component unmounts
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return coordinates;
};
