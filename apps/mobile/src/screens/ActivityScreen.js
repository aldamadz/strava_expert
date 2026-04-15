import { Pressable, StyleSheet, Text, View } from "react-native";
import ActionButton from "../components/common/ActionButton";
import ShareCardPreview from "../components/share/ShareCardPreview";
import RouteEditorPanel from "../components/share/RouteEditorPanel";
import { formatDuration } from "../utils/tracking";

export default function ActivityScreen({ share }) {
  return (
    <>
      <Text style={styles.sectionTitle}>Activity Dummy</Text>
      <Text style={styles.sectionSubtitle}>
        Pilih track, atur background, lalu share sebagai overlay untuk Story.
      </Text>

      <View style={styles.activityList}>
        {share.dummyActivities.map((activity) => {
          const isActive = activity.id === share.selectedDummyId;
          return (
            <View key={activity.id} style={[styles.activityCard, isActive ? styles.activityCardActive : null]}>
              <Pressable onPress={() => share.setSelectedDummyId(activity.id)}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activityMeta}>{activity.dateLabel}</Text>
                <Text style={styles.activityStats}>
                  {activity.distanceKm.toFixed(1)} km | {formatDuration(activity.durationSec)} | {activity.avgPace}/km
                </Text>
                <Text style={styles.activitySubStats}>
                  Elevation {activity.elevationGainM} m | {activity.calories} kcal
                </Text>
              </Pressable>
            </View>
          );
        })}
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

        <RouteEditorPanel
          backgroundUri={share.backgroundUri}
          photoOpacity={share.photoOpacity}
          setPhotoOpacity={share.setPhotoOpacity}
          routeScale={share.routeScale}
          routeOffsetX={share.routeOffsetX}
          routeOffsetY={share.routeOffsetY}
          routeStrokeWidth={share.routeStrokeWidth}
          templateScale={share.templateScale}
          backgroundScale={share.backgroundScale}
          adjustScale={share.adjustScale}
          adjustOffsetX={share.adjustOffsetX}
          adjustOffsetY={share.adjustOffsetY}
          adjustStrokeWidth={share.adjustStrokeWidth}
          adjustTemplateScale={share.adjustTemplateScale}
          adjustBackgroundScale={share.adjustBackgroundScale}
          routeColor={share.routeColor}
          setRouteColor={share.setRouteColor}
          resetRouteEditor={share.resetRouteEditor}
        />

        <View style={styles.builderActions}>
          <ActionButton label="Pilih Foto (Galeri)" onPress={share.pickShareBackground} type="secondary" />
          <ActionButton
            label={share.isSharingImage ? "Generating..." : "Share Overlay PNG"}
            onPress={share.shareTrackAsOverlay}
            type="primary"
            disabled={share.isSharingImage}
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
            disabled={share.isSharingImage}
          />
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
  activityList: {
    marginTop: 12,
    gap: 10
  },
  activityCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(71, 85, 105, 0.45)",
    backgroundColor: "#0b1220",
    padding: 14
  },
  activityCardActive: {
    borderColor: "rgba(34, 211, 238, 0.65)"
  },
  activityTitle: {
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "800"
  },
  activityMeta: {
    marginTop: 4,
    color: "#94a3b8",
    fontSize: 12
  },
  activityStats: {
    marginTop: 8,
    color: "#e2e8f0",
    fontSize: 13,
    fontWeight: "600"
  },
  activitySubStats: {
    marginTop: 4,
    color: "#94a3b8",
    fontSize: 12
  },
  builderSection: {
    marginTop: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(71, 85, 105, 0.45)",
    backgroundColor: "#0b1220",
    padding: 14
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
