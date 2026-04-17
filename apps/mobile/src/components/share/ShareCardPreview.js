import { ImageBackground, StyleSheet, Text, View } from "react-native";
import Svg, { Path as SvgPath } from "react-native-svg";
import { formatDuration } from "../../utils/tracking";

export default function ShareCardPreview({
  shareCardRef,
  overlayOnlyRef,
  setShareCardLayout,
  isOverlayCaptureMode,
  backgroundUri,
  backgroundScale,
  photoOpacity,
  routeCanvasWidth,
  routeCanvasHeight,
  templateScale,
  shareRoutePath,
  routeStrokeWidth,
  selectedDummy
}) {
  return (
    <View
      ref={shareCardRef}
      collapsable={false}
      style={styles.shareCard}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setShareCardLayout({ width, height });
      }}
    >
      {isOverlayCaptureMode ? (
        <View style={[styles.shareBackground, styles.shareBackgroundTransparent]} />
      ) : backgroundUri ? (
        <ImageBackground
          source={{ uri: backgroundUri }}
          style={[
            styles.shareBackground,
            { transform: [{ scale: backgroundScale }], opacity: photoOpacity }
          ]}
          resizeMode="cover"
        >
          <View style={[styles.shareMask, styles.shareMaskTransparent]} />
        </ImageBackground>
      ) : (
        <View style={[styles.shareBackground, styles.shareBackgroundDark]}>
          <View style={[styles.shareMask, styles.shareMaskTransparent]} />
        </View>
      )}

      <View ref={overlayOnlyRef} collapsable={false} style={styles.overlayOnlyLayer}>
        <View style={[styles.routeCanvasWrap, styles.routeCanvasWrapReference, { transform: [{ scale: templateScale }] }]}>
          <Svg width={routeCanvasWidth} height={routeCanvasHeight}>
            <SvgPath
              d={shareRoutePath}
              fill="none"
              stroke="#f97316"
              strokeWidth={routeStrokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>

        <View style={styles.referenceCenterWrap}>
          <View style={styles.referenceStatsStack}>
            <Text style={[styles.referenceLabel, { fontSize: 10 * templateScale }]}>Jarak</Text>
            <Text style={[styles.referenceValue, { fontSize: 26 * templateScale, lineHeight: 34 * templateScale }]}>
              {selectedDummy.distanceKm.toFixed(2).replace(".", ",")} km
            </Text>

            <Text style={[styles.referenceLabelGap, { fontSize: 10 * templateScale }]}>Pace</Text>
            <Text style={[styles.referenceValue, { fontSize: 26 * templateScale, lineHeight: 34 * templateScale }]}>
              {selectedDummy.avgPace} /km
            </Text>

            <Text style={[styles.referenceLabelGap, { fontSize: 10 * templateScale }]}>Waktu</Text>
            <Text style={[styles.referenceValue, { fontSize: 26 * templateScale, lineHeight: 34 * templateScale }]}>
              {formatDuration(selectedDummy.durationSec)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shareCard: {
    marginTop: 12,
    width: "100%",
    aspectRatio: 9 / 16,
    minHeight: 420,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.35)"
  },
  overlayOnlyLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent"
  },
  shareBackground: {
    ...StyleSheet.absoluteFillObject
  },
  shareBackgroundDark: {
    backgroundColor: "#111827"
  },
  shareBackgroundTransparent: {
    backgroundColor: "transparent"
  },
  shareMask: {
    flex: 1,
    backgroundColor: "rgba(2, 6, 23, 0.55)"
  },
  shareMaskTransparent: {
    backgroundColor: "rgba(2, 6, 23, 0.12)"
  },
  routeCanvasWrap: {
    position: "absolute",
    left: 12,
    right: 12,
    top: 34,
    alignItems: "center",
    justifyContent: "center"
  },
  routeCanvasWrapReference: {
    top: "56%"
  },
  referenceCenterWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 132
  },
  referenceStatsStack: {
    alignItems: "center"
  },
  referenceLabel: {
    color: "#cbd5e1",
    fontSize: 10,
    fontWeight: "700"
  },
  referenceLabelGap: {
    marginTop: 20,
    color: "#cbd5e1",
    fontSize: 10,
    fontWeight: "700"
  },
  referenceValue: {
    marginTop: 5,
    color: "#f8fafc",
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "900",
    letterSpacing: 0.2
  }
});
