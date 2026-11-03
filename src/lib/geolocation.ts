/** Promise wrapper around the browser Geolocation API */

export type GeolocationErrorCode =
  "unsupported" | "denied" | "unavailable" | "timeout";

export class GeolocationError extends Error {
  name = "GeolocationError";
  constructor(public code: GeolocationErrorCode) {
    super(code);
  }
}

export function getCurrentPosition(): Promise<{
  latitude: number;
  longitude: number;
}> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new GeolocationError("unsupported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        resolve({ latitude: coords.latitude, longitude: coords.longitude }),
      (error) =>
        reject(
          new GeolocationError(
            error.code === error.PERMISSION_DENIED
              ? "denied"
              : error.code === error.TIMEOUT
                ? "timeout"
                : "unavailable",
          ),
        ),
      // Generous timeout and cache for iOS Safari
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 60_000 },
    );
  });
}
