import { Pressable, StyleSheet, Text, View } from "react-native";
import Slider from "@react-native-community/slider";

function EditorRow({ label, value, onMinus, onPlus }) {
  return (
    <View style={styles.editorRow}>
      <Text style={styles.editorLabel}>{label}</Text>
      <View style={styles.editorControl}>
        <Pressable onPress={onMinus} style={styles.editorBtn}>
          <Text style={styles.editorBtnText}>-</Text>
        </Pressable>
        <Text style={styles.editorValue}>{value}</Text>
        <Pressable onPress={onPlus} style={styles.editorBtn}>
          <Text style={styles.editorBtnText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function RouteEditorPanel({
  backgroundUri,
  photoOpacity,
  setPhotoOpacity,
  routeScale,
  routeOffsetX,
  routeOffsetY,
  routeStrokeWidth,
  templateScale,
  backgroundScale,
  adjustScale,
  adjustOffsetX,
  adjustOffsetY,
  adjustStrokeWidth,
  adjustTemplateScale,
  adjustBackgroundScale,
  routeColor,
  setRouteColor,
  resetRouteEditor
}) {
  return (
    <View style={styles.editorPanel}>
      <Text style={styles.editorTitle}>Route Editor</Text>
      <Text style={styles.editorHint}>
        Story 9:16 transparan. Pilih foto dari galeri (termasuk hasil simpan dari Instagram).
      </Text>

      <EditorRow
        label="Scale"
        value={`${routeScale.toFixed(2)}x`}
        onMinus={() => adjustScale(-0.1)}
        onPlus={() => adjustScale(0.1)}
      />
      <EditorRow
        label="Offset X"
        value={String(routeOffsetX)}
        onMinus={() => adjustOffsetX(-6)}
        onPlus={() => adjustOffsetX(6)}
      />
      <EditorRow
        label="Offset Y"
        value={String(routeOffsetY)}
        onMinus={() => adjustOffsetY(-6)}
        onPlus={() => adjustOffsetY(6)}
      />
      <EditorRow
        label="Line Width"
        value={String(routeStrokeWidth)}
        onMinus={() => adjustStrokeWidth(-1)}
        onPlus={() => adjustStrokeWidth(1)}
      />
      <EditorRow
        label="Template Zoom"
        value={`${templateScale.toFixed(2)}x`}
        onMinus={() => adjustTemplateScale(-0.05)}
        onPlus={() => adjustTemplateScale(0.05)}
      />
      <EditorRow
        label="Photo Zoom"
        value={`${backgroundScale.toFixed(2)}x`}
        onMinus={() => adjustBackgroundScale(-0.1)}
        onPlus={() => adjustBackgroundScale(0.1)}
      />

      {backgroundUri ? (
        <View style={styles.opacityWrap}>
          <View style={styles.opacityHeader}>
            <Text style={styles.editorLabel}>Foto Opacity</Text>
            <Text style={styles.opacityValue}>{Math.round(photoOpacity * 100)}%</Text>
          </View>
          <Slider
            minimumValue={0.25}
            maximumValue={1}
            step={0.01}
            value={photoOpacity}
            onValueChange={setPhotoOpacity}
            minimumTrackTintColor="#38bdf8"
            maximumTrackTintColor="#334155"
            thumbTintColor="#f8fafc"
          />
        </View>
      ) : null}

      <View style={styles.colorRow}>
        {["#38bdf8", "#f97316", "#22c55e", "#f43f5e", "#f8fafc"].map((color) => (
          <Pressable
            key={color}
            onPress={() => setRouteColor(color)}
            style={[
              styles.colorChip,
              { backgroundColor: color },
              routeColor === color ? styles.colorChipActive : null
            ]}
          />
        ))}
        <Pressable onPress={resetRouteEditor} style={styles.resetEditorBtn}>
          <Text style={styles.resetEditorText}>Reset</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  editorPanel: {
    marginTop: 10,
    borderRadius: 12,
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "rgba(71, 85, 105, 0.45)",
    padding: 10,
    gap: 8
  },
  editorTitle: {
    color: "#e2e8f0",
    fontWeight: "700",
    fontSize: 13
  },
  editorHint: {
    color: "#94a3b8",
    fontSize: 11,
    lineHeight: 16
  },
  editorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  editorLabel: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "600"
  },
  editorControl: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  editorBtn: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.35)",
    alignItems: "center",
    justifyContent: "center"
  },
  editorBtnText: {
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "800"
  },
  editorValue: {
    color: "#f8fafc",
    fontSize: 12,
    fontWeight: "700",
    minWidth: 46,
    textAlign: "center"
  },
  opacityWrap: {
    marginTop: 4,
    paddingHorizontal: 2
  },
  opacityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2
  },
  opacityValue: {
    color: "#f8fafc",
    fontSize: 12,
    fontWeight: "700"
  },
  colorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap"
  },
  colorChip: {
    width: 24,
    height: 24,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "transparent"
  },
  colorChipActive: {
    borderColor: "#f8fafc"
  },
  resetEditorBtn: {
    marginLeft: 2,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.35)"
  },
  resetEditorText: {
    color: "#cbd5e1",
    fontSize: 11,
    fontWeight: "700"
  }
});

