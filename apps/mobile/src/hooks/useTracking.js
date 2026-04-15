import { useEffect, useMemo, useRef, useState } from "react";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import {
  appendTrackingSamples,
  clearTrackingSession,
  getTrackingSession,
  initTrackingSession,
  isBackgroundTrackingActive,
  startBackgroundTracking,
  stopBackgroundTracking,
  toTrackingSample
} from "../tasks/trackingTask";

export default function useTracking() {
  const [permission, setPermission] = useState("checking");
  const [isTracking, setIsTracking] = useState(false);
  const [isFocusingGps, setIsFocusingGps] = useState(false);
  const [gpsAccuracyM, setGpsAccuracyM] = useState(null);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [distanceMeters, setDistanceMeters] = useState(0);
  const [currentSpeedMps, setCurrentSpeedMps] = useState(0);
  const [path, setPath] = useState([]);
  const [locationError, setLocationError] = useState("");
  const [showMap, setShowMap] = useState(false);
  const [startedAtMs, setStartedAtMs] = useState(null);
  const [isBackgroundActive, setIsBackgroundActive] = useState(false);

  const watchSubscriptionRef = useRef(null);
  const syncIntervalRef = useRef(null);

  const gpsReady = useMemo(() => {
    if (gpsAccuracyM == null) {
      return false;
    }
    return gpsAccuracyM <= 25;
  }, [gpsAccuracyM]);

  const gpsQualityLabel = useMemo(() => {
    if (gpsAccuracyM == null) {
      return "Unknown";
    }
    if (gpsAccuracyM <= 8) {
      return "Excellent";
    }
    if (gpsAccuracyM <= 18) {
      return "Good";
    }
    if (gpsAccuracyM <= 35) {
      return "Fair";
    }
    return "Poor";
  }, [gpsAccuracyM]);

  useEffect(() => {
    let isMounted = true;
    async function initializePermission() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (isMounted) {
        setPermission(status);
      }
    }
    initializePermission();
    return () => {
      isMounted = false;
      stopTracking();
    };
  }, []);

  useEffect(() => {
    if (!startedAtMs || !isTracking) {
      return;
    }
    const tick = () => {
      const elapsed = Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000));
      setDurationSeconds(elapsed);
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [startedAtMs, isTracking]);

  useEffect(() => {
    if (!isTracking) {
      return;
    }
    syncIntervalRef.current = setInterval(async () => {
      const session = await getTrackingSession();
      if (!session) {
        return;
      }
      setDistanceMeters(session.distanceMeters ?? 0);
      setCurrentSpeedMps(session.currentSpeedMps ?? 0);
      setPath(Array.isArray(session.path) ? session.path : []);
      if (session.startedAtMs) {
        setStartedAtMs(session.startedAtMs);
      }
    }, 2000);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
    };
  }, [isTracking]);

  useEffect(() => {
    const tick = async () => {
      const active = await isBackgroundTrackingActive();
      setIsBackgroundActive(active);
    };
    tick();
    const timer = setInterval(tick, 3000);
    return () => clearInterval(timer);
  }, []);

  async function focusGps() {
    if (permission !== "granted") {
      return false;
    }
    setLocationError("");
    setIsFocusingGps(true);

    try {
      let bestAccuracy = Number.POSITIVE_INFINITY;
      let samplesCount = 0;

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 0
        },
        (position) => {
          const acc = position.coords.accuracy ?? 999;
          if (acc < bestAccuracy) {
            bestAccuracy = acc;
            setGpsAccuracyM(acc);
          }
          samplesCount += 1;
        }
      );

      await new Promise((resolve) => setTimeout(resolve, 4000));
      subscription.remove();

      if (samplesCount === 0 || !Number.isFinite(bestAccuracy)) {
        setLocationError("GPS belum stabil. Coba pindah ke area terbuka.");
        return false;
      }

      return true;
    } catch {
      setLocationError("Gagal fokus GPS. Pastikan lokasi perangkat aktif.");
      return false;
    } finally {
      setIsFocusingGps(false);
    }
  }

  async function startTracking() {
    if (permission !== "granted" || isTracking) {
      return;
    }

    const focused = await focusGps();
    if (!focused) {
      return;
    }

    setShowMap(false);
    setPath([]);
    setDistanceMeters(0);
    setCurrentSpeedMps(0);
    setDurationSeconds(0);
    setLocationError("");

    const now = Date.now();
    setStartedAtMs(now);
    setIsTracking(true);
    await initTrackingSession(now);

    try {
      await Notifications.requestPermissionsAsync();
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.DEFAULT
      });
    } catch {
      // ignore notification setup failure
    }

    try {
      const bgPermission = await Location.requestBackgroundPermissionsAsync();
      if (bgPermission.status === "granted") {
        await startBackgroundTracking();
        setIsBackgroundActive(true);
      }
    } catch {
      // fallback to foreground-only tracking
    }

    try {
      watchSubscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 1
        },
        async (position) => {
          const sample = toTrackingSample(position);
          const session = await appendTrackingSamples([sample]);
          setDistanceMeters(session.distanceMeters ?? 0);
          setCurrentSpeedMps(session.currentSpeedMps ?? 0);
          setPath(Array.isArray(session.path) ? session.path : []);
          const acc = position.coords.accuracy;
          if (typeof acc === "number") {
            setGpsAccuracyM(acc);
          }
        }
      );
    } catch {
      await stopTracking();
      setLocationError("Gagal memulai GPS tracking. Coba aktifkan High Accuracy Location.");
    }
  }

  async function stopTracking() {
    if (watchSubscriptionRef.current) {
      watchSubscriptionRef.current.remove();
      watchSubscriptionRef.current = null;
    }
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }
    await stopBackgroundTracking();
    setIsBackgroundActive(false);
    setIsTracking(false);
    setStartedAtMs(null);
  }

  async function resetTracking() {
    await stopTracking();
    await clearTrackingSession();
    setPath([]);
    setDistanceMeters(0);
    setDurationSeconds(0);
    setCurrentSpeedMps(0);
    setLocationError("");
    setGpsAccuracyM(null);
  }

  return {
    permission,
    isTracking,
    isFocusingGps,
    gpsAccuracyM,
    gpsReady,
    gpsQualityLabel,
    isBackgroundActive,
    durationSeconds,
    distanceMeters,
    currentSpeedMps,
    path,
    locationError,
    showMap,
    setShowMap,
    startTracking,
    stopTracking,
    resetTracking,
    focusGps
  };
}
