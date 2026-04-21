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

function formatPace(durationSec, distanceMeters) {
  if (durationSec <= 0 || distanceMeters <= 0) {
    return "--:--";
  }
  const paceSecPerKm = durationSec / (distanceMeters / 1000);
  const mm = Math.floor(paceSecPerKm / 60);
  const ss = Math.floor(paceSecPerKm % 60);
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

const MIN_SAVE_DURATION_SECONDS = 10;
const MIN_SAVE_DISTANCE_METERS = 30;
const MIN_SAVE_POINTS = 2;

export default function useTracking({ onSessionSaved } = {}) {
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
  const durationRef = useRef(0);
  const distanceRef = useRef(0);
  const startedAtRef = useRef(null);
  const pathRef = useRef([]);
  const onSessionSavedRef = useRef(onSessionSaved);

  useEffect(() => {
    onSessionSavedRef.current = onSessionSaved;
  }, [onSessionSaved]);

  useEffect(() => {
    durationRef.current = durationSeconds;
  }, [durationSeconds]);

  useEffect(() => {
    distanceRef.current = distanceMeters;
  }, [distanceMeters]);

  useEffect(() => {
    pathRef.current = path;
  }, [path]);

  useEffect(() => {
    startedAtRef.current = startedAtMs;
  }, [startedAtMs]);

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
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (isMounted) {
          setPermission(status);
        }
      } catch {
        if (isMounted) {
          setPermission("denied");
          setLocationError("Gagal mengakses modul lokasi di perangkat ini.");
        }
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

  function buildSavedSession() {
    const duration = durationRef.current;
    const distance = distanceRef.current;
    const sessionPath = Array.isArray(pathRef.current) ? pathRef.current : [];

    const hasAnyProgress = duration > 0 || distance > 0 || sessionPath.length > 0;
    if (!hasAnyProgress) {
      return {
        session: null,
        reason: "Belum ada progres track. Mulai sesi dulu sebelum simpan."
      };
    }

    if (
      duration < MIN_SAVE_DURATION_SECONDS ||
      distance < MIN_SAVE_DISTANCE_METERS ||
      sessionPath.length < MIN_SAVE_POINTS
    ) {
      return {
        session: null,
        reason: `Track terlalu pendek untuk disimpan. Minimal ${MIN_SAVE_DURATION_SECONDS} detik, ${MIN_SAVE_DISTANCE_METERS} m, dan ${MIN_SAVE_POINTS} titik GPS.`
      };
    }

    const startedAt = startedAtRef.current ?? Date.now();
    const startedDate = new Date(startedAt);
    const distanceKm = Number((distance / 1000).toFixed(2));
    const calories = Math.max(40, Math.round(distanceKm * 62));
    const sessionTime = startedDate.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit"
    });
    const sessionDate = startedDate.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short"
    });
    const title = `Run ${distanceKm.toFixed(1)}K - ${sessionDate} ${sessionTime}`;

    return {
      session: {
      id: `trk-${startedAt}`,
      title,
      startedAt: startedDate.toISOString(),
      dateLabel: startedDate.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }),
      distanceKm,
      durationSec: duration,
      avgPace: formatPace(duration, distance),
      elevationGainM: 0,
      calories,
      route: sessionPath
        .map((point) => ({
          latitude: Number(point.latitude),
          longitude: Number(point.longitude)
        }))
        .filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude))
      },
      reason: ""
    };
  }

  async function stopTracking({ saveSession = false } = {}) {
    let savedSession = null;
    let saveBlockedReason = "";
    if (saveSession) {
      const result = buildSavedSession();
      savedSession = result.session;
      saveBlockedReason = result.reason;
    }

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

    if (savedSession && typeof onSessionSavedRef.current === "function") {
      onSessionSavedRef.current(savedSession);
    } else if (saveSession && saveBlockedReason) {
      setLocationError(saveBlockedReason);
    }
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
