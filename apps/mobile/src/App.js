import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  PanResponder,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MapView, { Marker, Polyline } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BottomTab from "./components/common/BottomTab";
import useTracking from "./hooks/useTracking";
import useShareCardEditor from "./hooks/useShareCardEditor";
import { createActivity, getActivities, getMe, setApiAuthToken } from "./services/api";
import TrackingScreen from "./screens/TrackingScreen";
import ActivityScreen from "./screens/ActivityScreen";
import ProfileScreen from "./screens/ProfileScreen";
import AuthScreen from "./screens/AuthScreen";

const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#111827" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#111827" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1f2937" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#273449" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0b1220" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] }
];
const SAVED_ACTIVITIES_KEY = "auratrack_saved_activities_v1";
const AUTH_KEY = "auratrack_auth_v1";

function mapServerActivityToLocal(item) {
  const startedAt = item.started_at ? new Date(item.started_at) : new Date();
  const durationSec = Number(item.moving_time_s ?? 0);
  const distanceKm = Number(item.distance_km ?? 0);
  const calories = Math.max(40, Math.round(distanceKm * 62));
  const dateLabel = startedAt.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
  const timeLabel = startedAt.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit"
  });

  return {
    id: String(item.id),
    title: `Run ${distanceKm.toFixed(1)}K - ${dateLabel} ${timeLabel}`,
    startedAt: startedAt.toISOString(),
    dateLabel,
    distanceKm,
    durationSec,
    avgPace: String(item.avg_pace ?? "--:--"),
    elevationGainM: Number(item.elevation_gain_m ?? 0),
    calories,
    route: Array.isArray(item.route) ? item.route : []
  };
}

export default function App() {
  const [showBootSplash, setShowBootSplash] = useState(true);
  const [activeTab, setActiveTab] = useState("tracking");
  const [mapReady, setMapReady] = useState(false);
  const [savedActivities, setSavedActivities] = useState([]);
  const [authState, setAuthState] = useState({ token: "", user: null });
  const [toast, setToast] = useState({ visible: false, message: "", tone: "info" });
  const [panelSnapByTab, setPanelSnapByTab] = useState({
    tracking: "half",
    activity: "half",
    profile: "half"
  });
  const [panelHeight, setPanelHeight] = useState(360);
  const mapRef = useRef(null);
  const toastTimerRef = useRef(null);
  const panelHeightRef = useRef(360);
  const panelDragStartHeightRef = useRef(0);
  const splashOpacity = useRef(new Animated.Value(0)).current;
  const splashScale = useRef(new Animated.Value(0.94)).current;
  const splashOrbit = useRef(new Animated.Value(0)).current;
  const splashPulse = useRef(new Animated.Value(0)).current;
  const splashProgress = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();

  async function handleAuthChanged({ token, user }) {
    setApiAuthToken(token || "");
    setAuthState({ token: token || "", user: user ?? null });
    if (token) {
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify({ token, user }));
      try {
        const freshMe = await getMe();
        const normalizedUser = freshMe?.user ?? user ?? null;
        setAuthState({ token, user: normalizedUser });
        await AsyncStorage.setItem(AUTH_KEY, JSON.stringify({ token, user: normalizedUser }));
      } catch {
        // keep local auth info
      }
      try {
        const serverActivities = await getActivities();
        const mapped = Array.isArray(serverActivities) ? serverActivities.map(mapServerActivityToLocal) : [];
        setSavedActivities(mapped);
        await AsyncStorage.setItem(SAVED_ACTIVITIES_KEY, JSON.stringify(mapped));
      } catch {
        // keep offline activities
      }
    } else {
      await AsyncStorage.removeItem(AUTH_KEY);
      setSavedActivities([]);
      await AsyncStorage.removeItem(SAVED_ACTIVITIES_KEY);
    }
  }

  useEffect(() => {
    Animated.parallel([
      Animated.timing(splashOpacity, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }),
      Animated.timing(splashScale, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      })
    ]).start();

    const orbitLoop = Animated.loop(
      Animated.timing(splashOrbit, {
        toValue: 1,
        duration: 3200,
        easing: Easing.linear,
        useNativeDriver: true
      })
    );
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(splashPulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true
        }),
        Animated.timing(splashPulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true
        })
      ])
    );
    orbitLoop.start();
    pulseLoop.start();
    Animated.timing(splashProgress, {
      toValue: 1,
      duration: 2100,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true
    }).start();

    const timeoutId = setTimeout(() => {
      Animated.timing(splashOpacity, {
        toValue: 0,
        duration: 260,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true
      }).start(({ finished }) => {
        if (finished) {
          setShowBootSplash(false);
        }
      });
    }, 2400);

    return () => {
      orbitLoop.stop();
      pulseLoop.stop();
      clearTimeout(timeoutId);
    };
  }, [splashOpacity, splashScale, splashOrbit, splashPulse, splashProgress]);

  useEffect(() => {
    let mounted = true;
    Promise.all([AsyncStorage.getItem(SAVED_ACTIVITIES_KEY), AsyncStorage.getItem(AUTH_KEY)])
      .then(([savedRaw, authRaw]) => {
        if (!mounted) {
          return;
        }

        if (savedRaw) {
          const parsed = JSON.parse(savedRaw);
          if (Array.isArray(parsed)) {
            setSavedActivities(parsed);
          }
        }

        if (authRaw) {
          const authParsed = JSON.parse(authRaw);
          const token = String(authParsed?.token ?? "");
          const user = authParsed?.user ?? null;
          if (token) {
            setApiAuthToken(token);
            setAuthState({ token, user });
            getActivities()
              .then((serverActivities) => {
                const mapped = Array.isArray(serverActivities) ? serverActivities.map(mapServerActivityToLocal) : [];
                if (mapped.length > 0) {
                  setSavedActivities(mapped);
                  AsyncStorage.setItem(SAVED_ACTIVITIES_KEY, JSON.stringify(mapped)).catch(() => {});
                }
              })
              .catch(() => {});
          }
        }
      })
      .catch(() => {
        // ignore invalid payload
      });

    return () => {
      mounted = false;
    };
  }, []);

  const tracking = useTracking({
    onSessionSaved: (activity) => {
      setSavedActivities((prev) => {
        const next = [activity, ...prev].slice(0, 40);
        AsyncStorage.setItem(SAVED_ACTIVITIES_KEY, JSON.stringify(next)).catch(() => {
          // ignore storage write errors
        });
        return next;
      });
      setActiveTab("activity");

      if (authState.token) {
        createActivity(activity)
          .then(() => getActivities())
          .then((serverActivities) => {
            const mapped = Array.isArray(serverActivities) ? serverActivities.map(mapServerActivityToLocal) : [];
            if (mapped.length > 0) {
              setSavedActivities(mapped);
              AsyncStorage.setItem(SAVED_ACTIVITIES_KEY, JSON.stringify(mapped)).catch(() => {});
            }
          })
          .catch(() => {
            // keep local save when sync fails
          });
      }
    }
  });
  const share = useShareCardEditor({ savedActivities });

  const activeMapPath = activeTab === "activity" ? (share.selectedDummy?.route ?? []) : tracking.path;
  const activeLastPoint = activeMapPath.length > 0 ? activeMapPath[activeMapPath.length - 1] : null;
  const isTrackingFocusMode = activeTab === "tracking" && tracking.isTracking && !tracking.showMap;
  const showBaseMap = activeTab === "activity" || (activeTab === "tracking" && tracking.showMap);
  const tabBarBottom = Math.max(12, insets.bottom + 8);
  const panelSnap = panelSnapByTab[activeTab] ?? "half";
  const showCollapsedPanel = !isTrackingFocusMode && panelSnap === "collapsed";
  const isFullPanel = !isTrackingFocusMode && panelSnap === "full";
  const routeColor = activeTab === "activity" ? "#22d3ee" : "#f97316";
  const collapsedHeight = 118;
  const halfHeight = Math.min(Math.round(screenHeight * 0.56), 500);
  const fullHeight = Math.min(Math.round(screenHeight * 0.86), screenHeight - (insets.top + 16));
  const statusBarBackground = isTrackingFocusMode ? "#000000" : "#020617";

  function showToast(message, tone = "info") {
    if (!message) {
      return;
    }
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToast({ visible: true, message, tone });
    toastTimerRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
      toastTimerRef.current = null;
    }, 2600);
  }

  function setActivePanelSnap(nextSnap) {
    setPanelSnapByTab((prev) => ({
      ...prev,
      [activeTab]: nextSnap
    }));
  }

  function snapToNearest(nextHeight) {
    const snapPoints = [
      { key: "collapsed", value: collapsedHeight },
      { key: "half", value: halfHeight },
      { key: "full", value: fullHeight }
    ];
    const nearest = snapPoints.reduce((best, current) => {
      return Math.abs(current.value - nextHeight) < Math.abs(best.value - nextHeight) ? current : best;
    }, snapPoints[0]);
    setActivePanelSnap(nearest.key);
    panelHeightRef.current = nearest.value;
    setPanelHeight(nearest.value);
  }

  function cyclePanelSnap() {
    if (panelSnap === "collapsed") {
      setActivePanelSnap("half");
      setPanelHeight(halfHeight);
      return;
    }
    if (panelSnap === "half") {
      setActivePanelSnap("full");
      setPanelHeight(fullHeight);
      return;
    }
    setActivePanelSnap("collapsed");
    setPanelHeight(collapsedHeight);
  }

  const panelPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 2,
        onMoveShouldSetPanResponderCapture: (_, gestureState) => Math.abs(gestureState.dy) > 2,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          panelDragStartHeightRef.current = panelHeightRef.current;
        },
        onPanResponderMove: (_, gestureState) => {
          const rawHeight = panelDragStartHeightRef.current - gestureState.dy;
          const clamped = Math.max(collapsedHeight, Math.min(fullHeight, rawHeight));
          panelHeightRef.current = clamped;
          setPanelHeight(clamped);
        },
        onPanResponderRelease: () => {
          snapToNearest(panelHeightRef.current);
        },
        onPanResponderTerminate: () => {
          snapToNearest(panelHeightRef.current);
        }
      }),
    [collapsedHeight, fullHeight, activeTab]
  );

  useEffect(() => {
    if (isTrackingFocusMode) {
      return;
    }
    if (panelSnap === "collapsed") {
      panelHeightRef.current = collapsedHeight;
      setPanelHeight(collapsedHeight);
      return;
    }
    if (panelSnap === "half") {
      panelHeightRef.current = halfHeight;
      setPanelHeight(halfHeight);
      return;
    }
    panelHeightRef.current = fullHeight;
    setPanelHeight(fullHeight);
  }, [panelSnap, collapsedHeight, halfHeight, fullHeight, isTrackingFocusMode]);

  const avgPace = useMemo(() => {
    if (tracking.distanceMeters <= 0 || tracking.durationSeconds <= 0) {
      return "--:--";
    }
    const paceSecPerKm = tracking.durationSeconds / (tracking.distanceMeters / 1000);
    const mm = Math.floor(paceSecPerKm / 60);
    const ss = Math.floor(paceSecPerKm % 60);
    return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  }, [tracking.distanceMeters, tracking.durationSeconds]);

  const initialRegion = useMemo(
    () => ({
      latitude: -6.2,
      longitude: 106.816666,
      latitudeDelta: 0.012,
      longitudeDelta: 0.012
    }),
    []
  );

  useEffect(() => {
    if (!activeLastPoint || !mapRef.current) {
      return;
    }
    mapRef.current.animateToRegion(
      {
        latitude: activeLastPoint.latitude,
        longitude: activeLastPoint.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005
      },
      500
    );
  }, [activeLastPoint]);

  if (showBootSplash) {
    const orbitRotate = splashOrbit.interpolate({
      inputRange: [0, 1],
      outputRange: ["0deg", "360deg"]
    });
    const pulseScale = splashPulse.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.08]
    });
    const pulseOpacity = splashPulse.interpolate({
      inputRange: [0, 1],
      outputRange: [0.28, 0.5]
    });
    const progressTranslate = splashProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [-132, 0]
    });

    return (
      <SafeAreaView style={styles.splashSafe}>
        <StatusBar barStyle="light-content" backgroundColor="#020617" translucent={false} />
        <View style={styles.splashBackdrop}>
          <View style={styles.splashGrid} />
          <View style={styles.splashGlowPrimary} />
          <View style={styles.splashGlowSecondary} />
          <Animated.View
            style={[
              styles.splashPulseHalo,
              {
                opacity: pulseOpacity,
                transform: [{ scale: pulseScale }]
              }
            ]}
          />
          <Animated.View
            style={[
              styles.splashContent,
              {
                opacity: splashOpacity,
                transform: [{ scale: splashScale }]
              }
            ]}
          >
            <View style={styles.splashLogoRing}>
              <Animated.View
                style={[
                  styles.splashOrbitRing,
                  {
                    transform: [{ rotate: orbitRotate }]
                  }
                ]}
              >
                <View style={[styles.splashOrbitDot, styles.splashOrbitDotPrimary]} />
                <View style={[styles.splashOrbitDot, styles.splashOrbitDotSecondary]} />
              </Animated.View>
              <Image source={require("../assets/icon.png")} style={styles.splashLogo} resizeMode="contain" />
            </View>
            <Text style={styles.splashBrand}>AURATRACK</Text>
            <Text style={styles.splashTagline}>Outdoor performance, tracked cleanly.</Text>
            <View style={styles.splashProgressTrack}>
              <Animated.View
                style={[
                  styles.splashProgressFill,
                  {
                    transform: [{ translateX: progressTranslate }]
                  }
                ]}
              />
            </View>
            <Text style={styles.splashLoadingText}>Preparing your run space</Text>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  if (tracking.permission === "checking") {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Mengecek izin lokasi...</Text>
      </SafeAreaView>
    );
  }

  if (tracking.permission !== "granted") {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.permissionTitle}>Izin lokasi belum diberikan</Text>
        <Text style={styles.permissionText}>Aktifkan izin lokasi agar tracking real-time berjalan.</Text>
      </SafeAreaView>
    );
  }

  if (!authState.token) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor={statusBarBackground} translucent={false} />
        <View style={styles.authGateWrap}>
          <AuthScreen onAuthChanged={handleAuthChanged} showToast={showToast} topInset={insets.top} />
        </View>
        {toast.visible ? (
          <View style={[styles.toastWrap, { top: insets.top + 12 }]}>
            <View style={[styles.toastCard, toast.tone === "error" ? styles.toastError : styles.toastInfo]}>
              <Text style={styles.toastText}>{toast.message}</Text>
            </View>
          </View>
        ) : null}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={statusBarBackground} translucent={false} />

      {showBaseMap ? (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={initialRegion}
          customMapStyle={DARK_MAP_STYLE}
          onMapReady={() => setMapReady(true)}
        >
          {activeMapPath.length > 0 ? (
            <>
              <Polyline coordinates={activeMapPath} strokeWidth={11} strokeColor={`${routeColor}55`} lineCap="round" />
              <Polyline coordinates={activeMapPath} strokeWidth={5} strokeColor={routeColor} lineCap="round" />
            </>
          ) : null}
          {activeLastPoint ? (
            <Marker coordinate={activeLastPoint} title={activeTab === "activity" ? "Dummy Track End" : "Posisi Kamu"} />
          ) : null}
        </MapView>
      ) : (
        <View style={styles.blackStage} />
      )}

      {showBaseMap && !mapReady ? (
        <View style={[styles.mapLoadingPill, { top: insets.top + 64 }]}>
          <Text style={styles.mapLoadingText}>Memuat peta...</Text>
        </View>
      ) : null}

      {!isTrackingFocusMode && !isFullPanel ? (
        <View style={[styles.topBar, { top: insets.top + 12 }]}>
          <View style={styles.brandWrap}>
            <Text style={styles.brand}>AuraTrack</Text>
            <Text style={styles.brandSub}>Outdoor Performance Lab</Text>
          </View>
          <View style={styles.statusDotWrap}>
            <View style={[styles.statusDot, tracking.isTracking ? styles.statusDotActive : styles.statusDotIdle]} />
          </View>
        </View>
      ) : null}

      <View
        style={[
          styles.overlay,
          !isTrackingFocusMode ? { height: panelHeight, maxHeight: panelHeight } : null,
          isTrackingFocusMode
            ? [styles.overlayFocus, { paddingTop: insets.top + 8, paddingBottom: Math.max(14, insets.bottom + 8) }]
            : null
        ]}
      >
        {!isTrackingFocusMode ? (
          <View style={styles.panelToggle} {...panelPanResponder.panHandlers}>
            <Pressable onPress={cyclePanelSnap} hitSlop={10}>
              <View style={styles.panelToggleHandle} />
              <Text style={styles.panelToggleText}>
                {panelSnap === "collapsed"
                  ? "Drag Up to Expand"
                  : panelSnap === "half"
                    ? "Drag Up/Down"
                    : "Drag Down to Collapse"}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {showCollapsedPanel ? (
          <View style={styles.collapsedInfo}>
            <Text style={styles.collapsedInfoText}>
              {activeTab === "tracking" ? "Tracking" : activeTab === "activity" ? "Activity" : "Profile"}
            </Text>
            {activeTab === "tracking" ? (
              <Text style={styles.collapsedInfoSub}>
                {`${Math.max(0, Math.floor(tracking.durationSeconds / 60))}m - ${(tracking.distanceMeters / 1000).toFixed(2)} km - ${avgPace}`}
              </Text>
            ) : null}
          </View>
        ) : null}

        <ScrollView
          contentContainerStyle={
            isTrackingFocusMode ? [styles.overlayScrollFocus, { paddingBottom: insets.bottom + 16 }] : styles.overlayScroll
          }
          showsVerticalScrollIndicator={false}
          scrollEnabled={!isTrackingFocusMode && !showCollapsedPanel}
        >
          {!showCollapsedPanel && activeTab === "tracking" ? (
            <TrackingScreen
              isTracking={tracking.isTracking}
              isFocusingGps={tracking.isFocusingGps}
              gpsAccuracyM={tracking.gpsAccuracyM}
              gpsReady={tracking.gpsReady}
              gpsQualityLabel={tracking.gpsQualityLabel}
              focusMode={isTrackingFocusMode}
              durationSeconds={tracking.durationSeconds}
              distanceMeters={tracking.distanceMeters}
              currentSpeedMps={tracking.currentSpeedMps}
              avgPace={avgPace}
              pointsCount={tracking.path.length}
              locationError={tracking.locationError}
              showMap={tracking.showMap}
              onToggleMap={() => tracking.setShowMap((prev) => !prev)}
              onStart={tracking.startTracking}
              onStop={() => tracking.stopTracking({ saveSession: true })}
              onReset={tracking.resetTracking}
            />
          ) : null}

          {!showCollapsedPanel && activeTab === "activity" ? <ActivityScreen share={share} /> : null}
          {!showCollapsedPanel && activeTab === "profile" ? (
            <ProfileScreen
              authState={authState}
              onAuthChanged={handleAuthChanged}
              showToast={showToast}
            />
          ) : null}
        </ScrollView>
      </View>

      {!isTrackingFocusMode ? (
        <View style={[styles.tabBar, { bottom: tabBarBottom }]}>
          <BottomTab label="Tracking" active={activeTab === "tracking"} onPress={() => setActiveTab("tracking")} />
          <BottomTab label="Activity" active={activeTab === "activity"} onPress={() => setActiveTab("activity")} />
          <BottomTab label="Profile" active={activeTab === "profile"} onPress={() => setActiveTab("profile")} />
        </View>
      ) : null}
      {toast.visible ? (
        <View style={[styles.toastWrap, { top: insets.top + 12 }]}>
          <View style={[styles.toastCard, toast.tone === "error" ? styles.toastError : styles.toastInfo]}>
            <Text style={styles.toastText}>{toast.message}</Text>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  splashSafe: {
    flex: 1,
    backgroundColor: "#020617"
  },
  splashBackdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#020617",
    overflow: "hidden"
  },
  splashGrid: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.06,
    backgroundColor: "#020617"
  },
  splashGlowPrimary: {
    position: "absolute",
    top: "14%",
    width: 280,
    height: 280,
    borderRadius: 999,
    backgroundColor: "rgba(56, 189, 248, 0.14)"
  },
  splashGlowSecondary: {
    position: "absolute",
    bottom: "13%",
    width: 250,
    height: 250,
    borderRadius: 999,
    backgroundColor: "rgba(249, 115, 22, 0.16)"
  },
  splashPulseHalo: {
    position: "absolute",
    width: 178,
    height: 178,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.22)"
  },
  splashContent: {
    alignItems: "center",
    paddingHorizontal: 24
  },
  splashLogoRing: {
    position: "relative",
    width: 124,
    height: 124,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(11, 18, 32, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.28)"
  },
  splashOrbitRing: {
    position: "absolute",
    width: 152,
    height: 152,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center"
  },
  splashOrbitDot: {
    position: "absolute",
    width: 11,
    height: 11,
    borderRadius: 999
  },
  splashOrbitDotPrimary: {
    top: 4,
    backgroundColor: "#38bdf8"
  },
  splashOrbitDotSecondary: {
    bottom: 10,
    right: 20,
    backgroundColor: "#f97316"
  },
  splashLogo: {
    width: 78,
    height: 78
  },
  splashBrand: {
    marginTop: 22,
    color: "#f8fafc",
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 3
  },
  splashTagline: {
    marginTop: 10,
    color: "#94a3b8",
    fontSize: 13,
    textAlign: "center",
    letterSpacing: 0.3
  },
  splashProgressTrack: {
    marginTop: 18,
    width: 132,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(148, 163, 184, 0.16)",
    overflow: "hidden"
  },
  splashProgressFill: {
    width: 132,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#f97316"
  },
  splashLoadingText: {
    marginTop: 12,
    color: "#64748b",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.9,
    textTransform: "uppercase"
  },
  safe: {
    flex: 1,
    backgroundColor: "#020617"
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f172a",
    paddingHorizontal: 20
  },
  authGateWrap: {
    flex: 1,
    backgroundColor: "#020617",
    paddingHorizontal: 16
  },
  toastWrap: {
    position: "absolute",
    left: 16,
    right: 16,
    alignItems: "center",
    zIndex: 99
  },
  toastCard: {
    maxWidth: "100%",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  toastInfo: {
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    borderColor: "rgba(56, 189, 248, 0.55)"
  },
  toastError: {
    backgroundColor: "rgba(69, 10, 10, 0.95)",
    borderColor: "rgba(248, 113, 113, 0.6)"
  },
  toastText: {
    color: "#f8fafc",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center"
  },
  loadingText: {
    marginTop: 10,
    color: "#e2e8f0"
  },
  permissionTitle: {
    color: "#f8fafc",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8
  },
  permissionText: {
    color: "#cbd5e1",
    textAlign: "center"
  },
  map: {
    flex: 1
  },
  blackStage: {
    flex: 1,
    backgroundColor: "#000000"
  },
  topBar: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  mapLoadingPill: {
    position: "absolute",
    alignSelf: "center",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "rgba(2, 6, 23, 0.75)",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.35)"
  },
  mapLoadingText: {
    color: "#e2e8f0",
    fontSize: 11,
    fontWeight: "700"
  },
  brandWrap: {
    backgroundColor: "rgba(2, 6, 23, 0.74)",
    borderColor: "rgba(148, 163, 184, 0.35)",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  brand: {
    color: "#f8fafc",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.3
  },
  brandSub: {
    color: "#94a3b8",
    fontSize: 11,
    marginTop: 2
  },
  statusDotWrap: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.35)",
    backgroundColor: "rgba(2, 6, 23, 0.74)"
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 999
  },
  statusDotIdle: {
    backgroundColor: "#ef4444"
  },
  statusDotActive: {
    backgroundColor: "#22c55e"
  },
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#020617",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderColor: "rgba(148, 163, 184, 0.28)",
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 16
  },
  overlayFocus: {
    top: 0,
    height: "100%",
    maxHeight: undefined,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderWidth: 0,
    backgroundColor: "#000000"
  },
  overlayScroll: {
    paddingBottom: 90
  },
  overlayScrollFocus: {
    flexGrow: 1,
    paddingBottom: 24
  },
  tabBar: {
    position: "absolute",
    left: 14,
    right: 14,
    flexDirection: "row",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(71, 85, 105, 0.45)",
    backgroundColor: "rgba(2, 6, 23, 0.96)",
    paddingVertical: 8,
    paddingHorizontal: 6
  },
  panelToggle: {
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 8
  },
  panelToggleHandle: {
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(148, 163, 184, 0.5)"
  },
  panelToggleText: {
    marginTop: 7,
    color: "#cbd5e1",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.3
  },
  collapsedInfo: {
    alignItems: "center",
    paddingTop: 2
  },
  collapsedInfoText: {
    color: "#f8fafc",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3
  },
  collapsedInfoSub: {
    marginTop: 4,
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "700"
  }
});

