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
