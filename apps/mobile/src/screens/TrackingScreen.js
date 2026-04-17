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
          <ActionButton label="Finish & Save" onPress={onStop} type="primary" />
          <ActionButton label="Reset" onPress={onReset} type="secondary" disabled={isTracking || isFocusingGps} />
        </View>
      </View>
    );
  }

  return (
    <>
      <Text style={styles.sectionTitle}>Tracking</Text>
      <Text style={styles.sectionSubtitle}>Siap mulai sesi. Fokus ke durasi, jarak, pace, lalu start.</Text>

      <View style={styles.metricsGrid}>
        <View style={[styles.metricCard, styles.metricCardAccent]}>
          <Text style={styles.metricLabel}>Durasi</Text>
          <Text style={styles.metricValue}>{formatDuration(durationSeconds)}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Jarak</Text>
          <Text style={styles.metricValue}>{metersToKm(distanceMeters).toFixed(2)} km</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Pace Avg</Text>
          <Text style={styles.metricValue}>{avgPace}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Pace Live</Text>
          <Text style={styles.metricValue}>{metersPerSecondToPace(currentSpeedMps)}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>GPS</Text>
          <Text style={styles.metricValue}>{gpsReady ? "Ready" : "No"}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>GPS Quality</Text>
          <Text style={styles.metricValue}>{gpsQualityLabel}</Text>
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
          label={isFocusingGps ? "Focusing GPS..." : isTracking ? "Finish & Save" : "Fokus GPS & Start"}
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
  metricsGrid: {
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between"
  },
  metricCard: {
    width: "48.5%",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(71, 85, 105, 0.45)",
    backgroundColor: "#0b1220",
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginBottom: 8
  },
  metricCardAccent: {
    borderColor: "rgba(249, 115, 22, 0.55)",
    backgroundColor: "#111827"
  },
  metricLabel: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4
  },
  metricValue: {
    marginTop: 6,
    color: "#f8fafc",
    fontSize: 20,
    fontWeight: "800"
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
    justifyContent: "space-between",
    paddingTop: 10,
    paddingBottom: 18
  },
  focusMetricStack: {
    flex: 1,
    justifyContent: "center",
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
    fontSize: 40,
    fontWeight: "900",
    letterSpacing: 0.8
  },
  focusActions: {
    marginTop: 28,
    gap: 10
  }
});
