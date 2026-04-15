import { Pressable, StyleSheet, Text, View } from "react-native";
import ActionButton from "../components/common/ActionButton";
import { formatDuration, metersPerSecondToPace, metersToKm } from "../utils/tracking";

export default function TrackingScreen({
  isTracking,
  isFocusingGps,
  gpsAccuracyM,
  gpsReady,
  gpsQualityLabel,
  durationSeconds,
  distanceMeters,
  currentSpeedMps,
  avgPace,
  pointsCount,
  locationError,
  focusMode,
  showMap,
  onToggleMap,
  onStart,
  onStop,
  onReset
}) {
  const statusText = isFocusingGps
    ? "Memfokuskan GPS..."
    : gpsAccuracyM == null
      ? "GPS belum difokuskan"
      : `Akurasi GPS: ${Math.round(gpsAccuracyM)} m`;
  const sessionMetaText = `Points: ${pointsCount}`;

  if (focusMode) {
    return (
      <View style={styles.focusWrap}>
        <View style={styles.focusMetricStack}>
          <View style={styles.focusMetric}>
            <Text style={styles.focusLabel}>Durasi</Text>
            <Text style={styles.focusValue}>{formatDuration(durationSeconds)}</Text>
          </View>
          <View style={styles.focusMetric}>
            <Text style={styles.focusLabel}>Jarak</Text>
            <Text style={styles.focusValue}>{metersToKm(distanceMeters).toFixed(2)} km</Text>
          </View>
          <View style={styles.focusMetric}>
            <Text style={styles.focusLabel}>Pace</Text>
            <Text style={styles.focusValue}>{avgPace}</Text>
          </View>
        </View>

        <View style={styles.focusActions}>
          <ActionButton label="Tampilkan Map" onPress={onToggleMap} type="secondary" />
          <ActionButton label="Stop Session" onPress={onStop} type="primary" />
          <ActionButton label="Reset" onPress={onReset} type="secondary" disabled={isTracking || isFocusingGps} />
        </View>
      </View>
    );
  }

  return (
    <>
      <Text style={styles.sectionTitle}>Tracking</Text>
      <Text style={styles.sectionSubtitle}>Siap mulai sesi. Fokus ke durasi, jarak, pace, lalu start.</Text>

      <View style={styles.heroRow}>
        <View style={[styles.heroCard, styles.heroCardAccent]}>
          <Text style={styles.heroLabel}>Durasi</Text>
          <Text style={styles.heroValue}>{formatDuration(durationSeconds)}</Text>
        </View>
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Jarak</Text>
          <Text style={styles.heroValue}>{metersToKm(distanceMeters).toFixed(2)} km</Text>
        </View>
      </View>

      <View style={styles.supportGrid}>
        <View style={styles.supportCard}>
          <Text style={styles.supportLabel}>Pace Avg</Text>
          <Text style={styles.supportValue}>{avgPace}</Text>
        </View>
        <View style={styles.supportCard}>
          <Text style={styles.supportLabel}>Pace Live</Text>
          <Text style={styles.supportValue}>{metersPerSecondToPace(currentSpeedMps)}</Text>
        </View>
        <View style={styles.supportCard}>
          <Text style={styles.supportLabel}>GPS</Text>
          <Text style={styles.supportValue}>{gpsReady ? "Ready" : "No"}</Text>
        </View>
        <View style={styles.supportCard}>
          <Text style={styles.supportLabel}>GPS Quality</Text>
          <Text style={styles.supportValue}>{gpsQualityLabel}</Text>
        </View>
      </View>

      <View style={styles.statusBox}>
        <View style={styles.statusTextWrap}>
          <Text style={styles.statusText}>{statusText}</Text>
          <Text style={styles.statusMetaText}>{sessionMetaText}</Text>
        </View>
        <View style={[styles.gpsDot, gpsReady ? styles.gpsDotReady : styles.gpsDotOff]} />
      </View>

      {locationError ? <Text style={styles.errorText}>{locationError}</Text> : null}

      <View style={styles.actionsPanel}>
        <ActionButton
          label={isFocusingGps ? "Focusing GPS..." : isTracking ? "Pause Session" : "Fokus GPS & Start"}
          onPress={isTracking ? onStop : onStart}
          type="primary"
          disabled={isFocusingGps}
        />
        <View style={styles.secondaryActionsRow}>
          <Pressable style={styles.secondaryActionButton} onPress={onToggleMap}>
            <Text style={styles.secondaryActionText}>{showMap ? "Hide Map" : "Show Map"}</Text>
          </Pressable>
          <Pressable
            style={[styles.secondaryActionButton, (isTracking || isFocusingGps) ? styles.secondaryActionDisabled : null]}
            onPress={onReset}
            disabled={isTracking || isFocusingGps}
          >
            <Text style={styles.secondaryActionText}>Reset</Text>
          </Pressable>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#f8fafc"
  },
  sectionSubtitle: {
    marginTop: 6,
    color: "#94a3b8",
    fontSize: 13
  },
  heroRow: {
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  heroCard: {
    width: "48.8%",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(71, 85, 105, 0.45)",
    backgroundColor: "#0b1220",
    paddingVertical: 12,
    paddingHorizontal: 10
  },
  heroCardAccent: {
    borderColor: "rgba(249, 115, 22, 0.55)",
    backgroundColor: "#111827"
  },
  heroLabel: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4
  },
  heroValue: {
    marginTop: 6,
    color: "#f8fafc",
    fontSize: 20,
    fontWeight: "800"
  },
  supportGrid: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  supportCard: {
    width: "48.8%",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(71, 85, 105, 0.4)",
    backgroundColor: "#0b1220",
    paddingVertical: 10,
    paddingHorizontal: 11
  },
  supportLabel: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "700"
  },
  supportValue: {
    marginTop: 5,
    color: "#e2e8f0",
    fontSize: 16,
    fontWeight: "700"
  },
  statusBox: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(71, 85, 105, 0.45)",
    backgroundColor: "#0b1220",
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  statusText: {
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: "600"
  },
  statusTextWrap: {
    flex: 1,
    paddingRight: 8
  },
  statusMetaText: {
    marginTop: 3,
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "600"
  },
  gpsDot: {
    width: 11,
    height: 11,
    borderRadius: 999
  },
  gpsDotReady: {
    backgroundColor: "#22c55e"
  },
  gpsDotOff: {
    backgroundColor: "#ef4444"
  },
  actionsPanel: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(71, 85, 105, 0.4)",
    backgroundColor: "#0b1220",
    padding: 10,
    gap: 9
  },
  secondaryActionsRow: {
    flexDirection: "row",
    gap: 8
  },
  secondaryActionButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.35)",
    backgroundColor: "#0f172a"
  },
  secondaryActionDisabled: {
    opacity: 0.45
  },
  secondaryActionText: {
    color: "#cbd5e1",
    fontSize: 13,
    fontWeight: "700"
  },
  errorText: {
    marginTop: 10,
    color: "#fda4af",
    fontWeight: "600"
  },
  focusWrap: {
    flex: 1,
    justifyContent: "center",
    paddingTop: 10,
    paddingBottom: 18
  },
  focusMetricStack: {
    gap: 22
  },
  focusMetric: {
    alignItems: "center"
  },
  focusLabel: {
    color: "#94a3b8",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.4
  },
  focusValue: {
    marginTop: 6,
    color: "#f8fafc",
    fontSize: 46,
    fontWeight: "900",
    letterSpacing: 0.8
  },
  focusActions: {
    marginTop: 28,
    gap: 10
  }
});
