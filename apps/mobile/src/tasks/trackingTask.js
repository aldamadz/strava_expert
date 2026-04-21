import AsyncStorage from "@react-native-async-storage/async-storage";
import * as TaskManager from "expo-task-manager";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";

export const TRACKING_TASK_NAME = "auratrack-background-location-task";
const TRACKING_SESSION_KEY = "auratrack_tracking_session_v1";
const PROGRESS_NOTIFY_MIN_INTERVAL_MS = 60 * 1000;

function haversineDistanceInMeters(a, b) {
  const toRad = (value) => (value * Math.PI) / 180;
  const earthRadiusM = 6371000;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const value = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon;
  return 2 * earthRadiusM * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function toSample(location) {
  const ts = location.timestamp ?? Date.now();
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    speed: location.coords.speed ?? 0,
    timestamp: ts
  };
}

function appendSamplesToSession(session, samples) {
  let distanceMeters = session.distanceMeters ?? 0;
  let path = Array.isArray(session.path) ? [...session.path] : [];
  let lastPoint = path.length > 0 ? path[path.length - 1] : null;
  let currentSpeedMps = session.currentSpeedMps ?? 0;

  for (const sample of samples) {
    if (lastPoint) {
      distanceMeters += haversineDistanceInMeters(lastPoint, sample);
    }
    path.push(sample);
    if (path.length > 2500) {
      path = path.slice(path.length - 2500);
    }
    currentSpeedMps = sample.speed ?? 0;
    lastPoint = sample;
  }

  return {
    ...session,
    distanceMeters,
    path,
    currentSpeedMps,
    updatedAt: Date.now()
  };
}

export async function getTrackingSession() {
  const raw = await AsyncStorage.getItem(TRACKING_SESSION_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function setTrackingSession(session) {
  await AsyncStorage.setItem(TRACKING_SESSION_KEY, JSON.stringify(session));
}

function formatDuration(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((v) => String(v).padStart(2, "0")).join(":");
}

function formatPace(durationSec, distanceMeters) {
  if (!distanceMeters || distanceMeters <= 0) {
    return "--:--";
  }
  const paceSecPerKm = durationSec / (distanceMeters / 1000);
  const mm = Math.floor(paceSecPerKm / 60);
  const ss = Math.floor(paceSecPerKm % 60);
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

async function maybeNotifyProgress(session) {
  const now = Date.now();
  const lastNotifiedAt = session.lastNotifiedAtMs ?? 0;
  if (now - lastNotifiedAt < PROGRESS_NOTIFY_MIN_INTERVAL_MS) {
    return session;
  }

  const durationSec = Math.max(0, Math.floor((now - (session.startedAtMs ?? now)) / 1000));
  const distanceKm = (session.distanceMeters ?? 0) / 1000;
  const pace = formatPace(durationSec, session.distanceMeters ?? 0);
  const body = `Durasi ${formatDuration(durationSec)} | Jarak ${distanceKm.toFixed(2)} km | Pace ${pace}/km`;

  if (session.lastProgressNotificationId) {
    try {
      await Notifications.dismissNotificationAsync(session.lastProgressNotificationId);
    } catch {
      // ignore
    }
  }

  let newNotificationId = null;
  try {
    newNotificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "AuraTrack Progress",
        body,
        sticky: false,
        sound: null
      },
      trigger: null
    });
  } catch {
    return session;
  }

  return {
    ...session,
    lastNotifiedAtMs: now,
    lastProgressNotificationId: newNotificationId
  };
}

export async function initTrackingSession(startedAtMs) {
  const baseSession = {
    startedAtMs,
    distanceMeters: 0,
    currentSpeedMps: 0,
    path: [],
    updatedAt: Date.now(),
    lastNotifiedAtMs: 0,
    lastProgressNotificationId: null
  };
  await setTrackingSession(baseSession);
}

export async function clearTrackingSession() {
  await AsyncStorage.removeItem(TRACKING_SESSION_KEY);
}

export async function appendTrackingSamples(samples) {
  const current = (await getTrackingSession()) ?? {
    startedAtMs: Date.now(),
    distanceMeters: 0,
    currentSpeedMps: 0,
    path: [],
    updatedAt: Date.now(),
    lastNotifiedAtMs: 0,
    lastProgressNotificationId: null
  };
  const next = appendSamplesToSession(current, samples);
  const withNotificationState = await maybeNotifyProgress(next);
  await setTrackingSession(withNotificationState);
  return withNotificationState;
}

try {
  if (!TaskManager.isTaskDefined(TRACKING_TASK_NAME)) {
    TaskManager.defineTask(TRACKING_TASK_NAME, async ({ data, error }) => {
      if (error) {
        return;
      }
      const locations = data?.locations ?? [];
      if (locations.length === 0) {
        return;
      }
      const samples = locations.map(toSample);
      await appendTrackingSamples(samples);
    });
  }
} catch {
  // Do not crash app startup if task registration is unavailable on a device/build.
}

export async function startBackgroundTracking() {
  try {
    const started = await Location.hasStartedLocationUpdatesAsync(TRACKING_TASK_NAME);
    if (started) {
      return;
    }

    await Location.startLocationUpdatesAsync(TRACKING_TASK_NAME, {
      accuracy: Location.Accuracy.BestForNavigation,
      timeInterval: 1000,
      distanceInterval: 1,
      pausesUpdatesAutomatically: false,
      activityType: Location.ActivityType.Fitness,
      foregroundService: {
        notificationTitle: "AuraTrack Tracking Aktif",
        notificationBody: "Tracking tetap berjalan di background",
        notificationColor: "#ea580c"
      }
    });
  } catch {
    // Allow foreground tracking to continue even if background tracking can't start.
  }
}

export async function stopBackgroundTracking() {
  try {
    const started = await Location.hasStartedLocationUpdatesAsync(TRACKING_TASK_NAME);
    if (started) {
      await Location.stopLocationUpdatesAsync(TRACKING_TASK_NAME);
    }
  } catch {
    // ignore cleanup failures
  }
}

export async function isBackgroundTrackingActive() {
  try {
    return await Location.hasStartedLocationUpdatesAsync(TRACKING_TASK_NAME);
  } catch {
    return false;
  }
}

export function toTrackingSample(location) {
  return toSample(location);
}
