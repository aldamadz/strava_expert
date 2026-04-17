import { Platform } from "react-native";

const tunnelBase = "https://mobile-api.marison-testing.biz.id";
const androidEmulatorBase = tunnelBase;
const localLanBase = tunnelBase;
const REQUEST_TIMEOUT_MS = 6000;
const envBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

function normalizeBaseUrl(url) {
  if (!url || typeof url !== "string") {
    return null;
  }
  return url.replace(/\/+$/, "");
}

export const API_BASE_URL =
  normalizeBaseUrl(envBaseUrl) ??
  (Platform.OS === "android" ? androidEmulatorBase : localLanBase);
let authToken = "";

export function setApiAuthToken(token) {
  authToken = token || "";
}

function buildAuthHeaders(extra = {}) {
  if (!authToken) {
    return extra;
  }
  return {
    ...extra,
    Authorization: `Bearer ${authToken}`
  };
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export async function getHealth() {
  const response = await fetchWithTimeout(`${API_BASE_URL}/health`);
  if (!response.ok) {
    throw new Error("Failed to fetch health");
  }
  return response.json();
}

export async function getInsight() {
  const response = await fetchWithTimeout(`${API_BASE_URL}/api/v1/ai/insight`);
  if (!response.ok) {
    throw new Error("Failed to fetch insight");
  }
  return response.json();
}

export async function registerAuth({ email, password, fullName }) {
  const response = await fetchWithTimeout(`${API_BASE_URL}/api/v1/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email,
      password,
      full_name: fullName
    })
  });
  if (!response.ok) {
    throw new Error("Failed to register");
  }
  return response.json();
}

export async function loginAuth({ email, password }) {
  const response = await fetchWithTimeout(`${API_BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });
  if (!response.ok) {
    throw new Error("Failed to login");
  }
  return response.json();
}

export async function getMe() {
  const response = await fetchWithTimeout(`${API_BASE_URL}/api/v1/auth/me`, {
    headers: buildAuthHeaders()
  });
  if (!response.ok) {
    throw new Error("Failed to fetch user");
  }
  return response.json();
}

export async function getActivities() {
  const response = await fetchWithTimeout(`${API_BASE_URL}/api/v1/activities`, {
    headers: buildAuthHeaders()
  });
  if (!response.ok) {
    throw new Error("Failed to fetch activities");
  }
  return response.json();
}

export async function createActivity(activity) {
  const payload = {
    type: "run",
    distance_km: Number(activity.distanceKm ?? 0),
    moving_time_s: Number(activity.durationSec ?? 0),
    elevation_gain_m: Number(activity.elevationGainM ?? 0),
    started_at: activity.startedAt ?? new Date().toISOString(),
    route: Array.isArray(activity.route)
      ? activity.route.map((point) => ({
          latitude: Number(point.latitude),
          longitude: Number(point.longitude)
        }))
      : []
  };

  const response = await fetchWithTimeout(`${API_BASE_URL}/api/v1/activities`, {
    method: "POST",
    headers: buildAuthHeaders({
      "Content-Type": "application/json"
    }),
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error("Failed to create activity");
  }
  return response.json();
}
