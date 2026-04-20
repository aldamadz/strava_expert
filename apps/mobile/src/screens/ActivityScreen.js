import { Pressable, StyleSheet, Text, View } from "react-native";
import ActionButton from "../components/common/ActionButton";
import ShareCardPreview from "../components/share/ShareCardPreview";
import { formatDuration } from "../utils/tracking";

export default function ActivityScreen({ share }) {
  const hasActivities = share.activities.length > 0;
  const hasSelected = Boolean(share.selectedDummy);

  return (
    <>
      <Text style={styles.sectionTitle}>Activity</Text>
      <Text style={styles.sectionSubtitle}>
        Riwayat track tersimpan. Pilih aktivitas, tambah foto jika perlu, lalu share overlay untuk Story.
      </Text>

      <View style={styles.activityList}>
        {hasActivities ? share.activities.map((activity) => {
          const isActive = activity.id === share.selectedDummyId;
          return (
            <View key={activity.id} style={[styles.activityCard, isActive ? styles.activityCardActive : null]}>
              <Pressable onPress={() => share.setSelectedDummyId(activity.id)}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activityMeta}>{activity.dateLabel}</Text>
                <View style={styles.activityStatsRow}>
                  <View style={styles.statChip}>
                    <Text style={styles.statChipLabel}>Jarak</Text>
                    <Text style={styles.statChipValue}>{activity.distanceKm.toFixed(1)} km</Text>
                  </View>
                  <View style={styles.statChip}>
                    <Text style={styles.statChipLabel}>Waktu</Text>
                    <Text style={styles.statChipValue}>{formatDuration(activity.durationSec)}</Text>
                  </View>
                  <View style={styles.statChip}>
                    <Text style={styles.statChipLabel}>Pace</Text>
                    <Text style={styles.statChipValue}>{activity.avgPace}/km</Text>
                  </View>
                </View>
                <Text style={styles.activitySubStats}>
                  Elevation {activity.elevationGainM} m | {activity.calories} kcal
                </Text>
              </Pressable>
            </View>
          );
        }) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Belum ada aktivitas</Text>
            <Text style={styles.emptyDesc}>Selesaikan tracking lalu tekan Finish & Save untuk menambah data di sini.</Text>
          </View>
        )}
      </View>

      <View style={styles.builderSection}>
        <Text style={styles.builderTitle}>Share Card Builder</Text>
        <Text style={styles.builderDesc}>
          Template transparan untuk overlay. Bisa tambah foto di app atau langsung di Instagram Story.
        </Text>

        <ShareCardPreview
          shareCardRef={share.shareCardRef}
          overlayOnlyRef={share.overlayOnlyRef}
          setShareCardLayout={share.setShareCardLayout}
          isOverlayCaptureMode={share.isOverlayCaptureMode}
          backgroundUri={share.backgroundUri}
          backgroundScale={share.backgroundScale}
          photoOpacity={share.photoOpacity}
          routeCanvasWidth={share.routeCanvasWidth}
          routeCanvasHeight={share.routeCanvasHeight}
          templateScale={share.templateScale}
          shareRoutePath={share.shareRoutePath}
          routeStrokeWidth={share.routeStrokeWidth}
          selectedDummy={share.selectedDummy}
        />

        <View style={styles.builderActions}>
          <ActionButton label="Pilih Foto (Galeri)" onPress={share.pickShareBackground} type="secondary" />
          <ActionButton
            label={share.isSharingImage ? "Generating..." : "Share Overlay PNG"}
            onPress={share.shareTrackAsOverlay}
            type="primary"
            disabled={share.isSharingImage || !hasSelected}
          />
          <ActionButton
            label={
              share.isSharingImage
                ? "Saving..."
                : share.backgroundUri
                  ? "Save PNG (With Photo)"
                  : "Save Overlay PNG"
            }
            onPress={share.saveAutoPng}
            type="secondary"
            disabled={share.isSharingImage || !hasSelected}
          />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#f8fafc"
  },
  sectionSubtitle: {
    marginTop: 6,
    color: "#94a3b8",
    fontSize: 13
  },
  activityList: {
    marginTop: 12,
    gap: 10
  },
  activityCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(71, 85, 105, 0.45)",
    backgroundColor: "#0b1220",
    padding: 15
  },
  activityCardActive: {
    borderColor: "rgba(34, 211, 238, 0.75)",
    backgroundColor: "#111b2f"
  },
  emptyCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(71, 85, 105, 0.45)",
    backgroundColor: "#0b1220",
    padding: 14
  },
  emptyTitle: {
    color: "#f8fafc",
    fontSize: 14,
    fontWeight: "800"
  },
  emptyDesc: {
    marginTop: 6,
    color: "#94a3b8",
    fontSize: 12
  },
  activityTitle: {
    color: "#f8fafc",
    fontSize: 17,
    fontWeight: "800"
  },
  activityMeta: {
    marginTop: 4,
    color: "#94a3b8",
    fontSize: 12
  },
  activityStatsRow: {
    marginTop: 8,
    flexDirection: "row",
    gap: 10
  },
  statChip: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(71, 85, 105, 0.4)",
    backgroundColor: "#0f172a",
    paddingVertical: 8,
    paddingHorizontal: 8
  },
  statChipLabel: {
    color: "#94a3b8",
    fontSize: 10,
    fontWeight: "700"
  },
  statChipValue: {
    marginTop: 4,
    color: "#e2e8f0",
    fontSize: 13,
    fontWeight: "700"
  },
  activitySubStats: {
    marginTop: 4,
    color: "#94a3b8",
    fontSize: 12
  },
  builderSection: {
    marginTop: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(71, 85, 105, 0.45)",
    backgroundColor: "#0b1220",
    padding: 15
  },
  builderTitle: {
    color: "#f8fafc",
    fontSize: 17,
    fontWeight: "800"
  },
  builderDesc: {
    marginTop: 6,
    color: "#94a3b8",
    fontSize: 12
  },
  builderActions: {
    marginTop: 10,
    gap: 8
  }
});
