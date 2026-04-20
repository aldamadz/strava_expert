import { Alert, Linking } from "react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import { captureRef } from "react-native-view-shot";
import { buildNormalizedRoute, buildSmoothSvgPath, fitRouteToBounds } from "../utils/shareRoute";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export default function useShareCardEditor({ savedActivities = [] } = {}) {
  const activities = useMemo(() => savedActivities, [savedActivities]);
  const [selectedDummyId, setSelectedDummyId] = useState(activities[0]?.id ?? "");
  const [backgroundUri, setBackgroundUri] = useState("");
  const [photoOpacity, setPhotoOpacity] = useState(0.75);
  const [isSharingImage, setIsSharingImage] = useState(false);
  const [isOverlayCaptureMode, setIsOverlayCaptureMode] = useState(false);
  const [shareCardLayout, setShareCardLayout] = useState({ width: 320, height: 560 });
  const [backgroundScale, setBackgroundScale] = useState(1);
  const [templateScale, setTemplateScale] = useState(1);
  const [routeScale, setRouteScale] = useState(1.28);
  const [routeOffsetX, setRouteOffsetX] = useState(0);
  const [routeOffsetY, setRouteOffsetY] = useState(0);
  const [routeStrokeWidth, setRouteStrokeWidth] = useState(5);
  const [routeColor, setRouteColor] = useState("#38bdf8");

  const shareCardRef = useRef(null);
  const overlayOnlyRef = useRef(null);

  const selectedDummy = activities.find((item) => item.id === selectedDummyId) ?? activities[0];

  useEffect(() => {
    if (!selectedDummyId && activities[0]?.id) {
      setSelectedDummyId(activities[0].id);
      return;
    }
    const exists = activities.some((item) => item.id === selectedDummyId);
    if (!exists && activities[0]?.id) {
      setSelectedDummyId(activities[0].id);
    }
  }, [activities, selectedDummyId]);

  const baseCanvasWidth = Math.max(shareCardLayout.width - 24, 220);
  const baseCanvasHeight = Math.max(shareCardLayout.height - 120, 260);
  const routeCanvasWidth = Math.max(Math.round(baseCanvasWidth * 0.68), 180);
  const routeCanvasHeight = Math.max(Math.round(baseCanvasHeight * 0.5), 140);

  const baseShareRoute = useMemo(
    () => buildNormalizedRoute(selectedDummy?.route ?? [], routeCanvasWidth, routeCanvasHeight, 8),
    [selectedDummy?.route, routeCanvasWidth, routeCanvasHeight]
  );
  const transformedShareRoute = useMemo(() => {
    if (baseShareRoute.length === 0) {
      return [];
    }
    const centerX = routeCanvasWidth / 2;
    const centerY = routeCanvasHeight / 2;
    return baseShareRoute.map((point) => {
      const scaledX = centerX + (point.x - centerX) * routeScale + routeOffsetX;
      const scaledY = centerY + (point.y - centerY) * routeScale + routeOffsetY;
      return { x: scaledX, y: scaledY };
    });
  }, [baseShareRoute, routeScale, routeOffsetX, routeOffsetY, routeCanvasWidth, routeCanvasHeight]);

  const fittedShareRoute = useMemo(
    () => fitRouteToBounds(transformedShareRoute, routeCanvasWidth, routeCanvasHeight, routeStrokeWidth + 18),
    [transformedShareRoute, routeCanvasWidth, routeCanvasHeight, routeStrokeWidth]
  );

  const shareRoutePath = useMemo(() => buildSmoothSvgPath(fittedShareRoute), [fittedShareRoute]);

  async function pickShareBackground() {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert(
          "Izin Ditolak",
          "Aktifkan izin Photos and Videos untuk AuraTrack di Settings.",
          [
            { text: "Batal", style: "cancel" },
            { text: "Buka Settings", onPress: () => Linking.openSettings() }
          ]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: false,
        quality: 1,
        legacy: true
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setBackgroundUri(result.assets[0].uri);
        setPhotoOpacity(0.75);
      } else {
        Alert.alert("Tidak Ada Gambar", "Pilih minimal satu gambar dari galeri.");
      }
    } catch {
      Alert.alert(
        "Gagal Buka Galeri",
        "Image picker gagal dibuka. Pastikan emulator punya aplikasi Photos/Gallery dan berisi gambar."
      );
    }
  }

  async function savePngToGallery({ overlay }) {
    if (!shareCardRef.current || (overlay && !overlayOnlyRef.current)) {
      return;
    }

    try {
      setIsSharingImage(true);
      if (overlay) {
        setIsOverlayCaptureMode(true);
        await new Promise((resolve) => setTimeout(resolve, 80));
      }

      const permission = await MediaLibrary.requestPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert("Izin Ditolak", "Aktifkan izin media agar bisa menyimpan PNG.");
        return;
      }

      const captureTarget = overlay ? overlayOnlyRef : shareCardRef;
      const uri = await captureRef(captureTarget, {
        format: "png",
        quality: 1
      });

      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert("Berhasil", overlay ? "Overlay PNG tersimpan di galeri." : "PNG tersimpan di galeri.");
    } catch {
      Alert.alert("Gagal Simpan", "Tidak bisa menyimpan PNG ke galeri.");
    } finally {
      setIsOverlayCaptureMode(false);
      setIsSharingImage(false);
    }
  }

  async function shareTrackAsOverlay() {
    if (!overlayOnlyRef.current) {
      return;
    }

    try {
      setIsSharingImage(true);
      setIsOverlayCaptureMode(true);
      await new Promise((resolve) => setTimeout(resolve, 80));
      const uri = await captureRef(overlayOnlyRef, { format: "png", quality: 1 });

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert("Share Tidak Tersedia", "Perangkat ini tidak mendukung image share.");
        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType: "image/png",
        dialogTitle: `Share Overlay ${selectedDummy?.title ?? "AuraTrack"}`
      });
    } catch {
      Alert.alert("Gagal Share", "Tidak bisa membuat overlay PNG. Coba lagi.");
    } finally {
      setIsOverlayCaptureMode(false);
      setIsSharingImage(false);
    }
  }

  function saveAutoPng() {
    if (backgroundUri) {
      return savePngToGallery({ overlay: false });
    }
    return savePngToGallery({ overlay: true });
  }

  function adjustScale(delta) {
    setRouteScale((prev) => clamp(Number((prev + delta).toFixed(2)), 0.6, 1.8));
  }

  function adjustOffsetX(delta) {
    setRouteOffsetX((prev) => clamp(prev + delta, -70, 70));
  }

  function adjustOffsetY(delta) {
    setRouteOffsetY((prev) => clamp(prev + delta, -70, 70));
  }

  function adjustStrokeWidth(delta) {
    setRouteStrokeWidth((prev) => clamp(prev + delta, 2, 10));
  }

  function adjustBackgroundScale(delta) {
    setBackgroundScale((prev) => clamp(Number((prev + delta).toFixed(2)), 1, 2.2));
  }

  function adjustTemplateScale(delta) {
    setTemplateScale((prev) => clamp(Number((prev + delta).toFixed(2)), 0.8, 1.4));
  }

  function resetRouteEditor() {
    setRouteScale(1.28);
    setRouteOffsetX(0);
    setRouteOffsetY(0);
    setRouteStrokeWidth(5);
    setRouteColor("#38bdf8");
    setBackgroundScale(1);
    setTemplateScale(1);
  }

  return {
    activities,
    selectedDummy,
    selectedDummyId,
    setSelectedDummyId,
    backgroundUri,
    photoOpacity,
    setPhotoOpacity,
    isSharingImage,
    isOverlayCaptureMode,
    backgroundScale,
    templateScale,
    routeScale,
    routeOffsetX,
    routeOffsetY,
    routeStrokeWidth,
    routeColor,
    setRouteColor,
    routeCanvasWidth,
    routeCanvasHeight,
    shareRoutePath,
    shareCardRef,
    overlayOnlyRef,
    setShareCardLayout,
    pickShareBackground,
    shareTrackAsOverlay,
    saveAutoPng,
    adjustScale,
    adjustOffsetX,
    adjustOffsetY,
    adjustStrokeWidth,
    adjustBackgroundScale,
    adjustTemplateScale,
    resetRouteEditor
  };
}
