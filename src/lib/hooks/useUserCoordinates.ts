import { useState, useEffect } from "react";

interface Coordinates {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
}

export const useUserCoordinates = () => {
  const [userCoordinates, setUserCoordinates] = useState<Coordinates>({
    latitude: null,
    longitude: null,
    error: null,
  });

  useEffect(() => {
    // check if geolocation is supported by the browser
    if (!navigator.geolocation) {
      setUserCoordinates((prev) => ({
        ...prev,
        error: "Geolocation is not supported by your browser",
      }));
      return;
    }

    // success callback
    const handleSuccess = (position: GeolocationPosition) => {
      setUserCoordinates({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        error: null,
      });
    };

    // error callback
    const handleError = (error: GeolocationPositionError) => {
      setUserCoordinates((prev) => ({
        ...prev,
        error: error.message,
      }));
    };

    // get the current position
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError);

    // optional: use watchPosition to keep tracking location changes
    const watchId = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError
    );

    // cleanup: remove the watch when component unmounts
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return userCoordinates;
};
