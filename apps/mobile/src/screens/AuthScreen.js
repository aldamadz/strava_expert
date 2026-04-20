import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions
} from "react-native";
import { loginAuth, registerAuth } from "../services/api";

export default function AuthScreen({ onAuthChanged, showToast = () => {}, topInset = 0 }) {
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const { width } = useWindowDimensions();
  const cardAnim = useRef(new Animated.Value(1)).current;
  const switchAnim = useRef(new Animated.Value(0)).current;
  const switchWidth = Math.max(0, width - 32);
  const switchPillWidth = Math.max(0, (switchWidth - 16) / 2);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(cardAnim, {
        toValue: 0,
        duration: 120,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true
      }),
      Animated.timing(cardAnim, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      })
    ]).start();

    Animated.timing(switchAnim, {
      toValue: mode === "login" ? 0 : 1,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false
    }).start();
  }, [mode, cardAnim, switchAnim]);

  const cardAnimatedStyle = {
    opacity: cardAnim,
    transform: [
      {
        translateY: cardAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [12, 0]
        })
      }
    ]
  };

  const switchPillStyle = {
    width: switchPillWidth,
    transform: [
      {
        translateX: switchAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, switchPillWidth]
        })
      }
    ]
  };

  async function handleLogin() {
    if (!email || !password) {
      showToast("Isi email dan password dulu.", "error");
      return;
    }
    try {
      setLoading(true);
      const result = await loginAuth({ email: email.trim(), password });
      await onAuthChanged({ token: result.token, user: result.user });
      showToast("Login berhasil.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Login gagal.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    if (!email || !password) {
      showToast("Isi email dan password dulu.", "error");
      return;
    }
    if (password.length < 6) {
      showToast("Password minimal 6 karakter.", "error");
      return;
    }
    try {
      setLoading(true);
      const result = await registerAuth({
        email: email.trim(),
        password,
        fullName: fullName.trim()
      });
      await onAuthChanged({ token: result.token, user: result.user });
      showToast("Akun berhasil dibuat.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Register gagal.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardWrap}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? topInset : 0}
    >
      <ScrollView
        contentContainerStyle={[styles.wrap, { paddingTop: Math.max(26, topInset + 14) }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View style={styles.hero}>
          <View style={styles.heroGlow} />
          <Text style={styles.brand}>AURATRACK</Text>
          <Text style={styles.headline}>Train sharp. Track clean.</Text>
          <Text style={styles.subhead}>Mulai sesi lari dengan metrik real-time dan simpan semua aktivitas ke server.</Text>
        </View>

        <View style={styles.modeSwitch}>
          <Animated.View style={[styles.modeSwitchPill, switchPillStyle]} />
          <Pressable style={styles.modeButton} onPress={() => setMode("login")}>
            <Text style={[styles.modeButtonText, mode === "login" ? styles.modeButtonTextActive : null]}>Login</Text>
          </Pressable>
          <Pressable style={styles.modeButton} onPress={() => setMode("register")}>
            <Text style={[styles.modeButtonText, mode === "register" ? styles.modeButtonTextActive : null]}>Register</Text>
          </Pressable>
        </View>

        <Animated.View style={[styles.card, cardAnimatedStyle]}>
          <Text style={styles.cardTitle}>{mode === "login" ? "Welcome Back" : "Create Account"}</Text>
          <Text style={styles.cardSubtitle}>
            {mode === "login"
              ? "Masuk untuk lanjut ke dashboard aktivitas."
              : "Daftar akun baru untuk sinkronisasi lintas device."}
          </Text>

          {mode === "register" ? (
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Nama lengkap (opsional)"
              placeholderTextColor="#64748b"
              style={styles.input}
              autoCapitalize="words"
              returnKeyType="next"
            />
          ) : null}
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor="#64748b"
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            returnKeyType="next"
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder={mode === "register" ? "Password (min 6)" : "Password"}
            placeholderTextColor="#64748b"
            style={styles.input}
            secureTextEntry
            autoComplete={mode === "login" ? "password" : "new-password"}
            returnKeyType="done"
            onSubmitEditing={mode === "login" ? handleLogin : handleRegister}
          />

          <Pressable
            style={[styles.submitButton, loading ? styles.submitButtonDisabled : null]}
            onPress={mode === "login" ? handleLogin : handleRegister}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? "Please wait..." : mode === "login" ? "Masuk ke AuraTrack" : "Buat Akun"}
            </Text>
          </Pressable>

          <Pressable onPress={() => setMode((prev) => (prev === "login" ? "register" : "login"))} style={styles.swapAction}>
            <Text style={styles.swapActionText}>
              {mode === "login" ? "Belum punya akun? Daftar di sini." : "Sudah punya akun? Login di sini."}
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardWrap: {
    flex: 1
  },
  wrap: {
    flexGrow: 1,
    paddingBottom: 28
  },
  hero: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.32)",
    backgroundColor: "#0b1220",
    paddingHorizontal: 18,
    paddingVertical: 18
  },
  heroGlow: {
    position: "absolute",
    right: -22,
    top: -12,
    width: 130,
    height: 130,
    borderRadius: 999,
    backgroundColor: "rgba(249, 115, 22, 0.14)"
  },
  brand: {
    color: "#38bdf8",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2
  },
  headline: {
    marginTop: 10,
    color: "#f8fafc",
    fontSize: 28,
    fontWeight: "900"
  },
  subhead: {
    marginTop: 8,
    color: "#94a3b8",
    fontSize: 13,
    lineHeight: 20
  },
  modeSwitch: {
    marginTop: 14,
    position: "relative",
    overflow: "hidden",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(71, 85, 105, 0.45)",
    backgroundColor: "#0b1220",
    padding: 5,
    flexDirection: "row",
    gap: 6
  },
  modeSwitchPill: {
    position: "absolute",
    left: 5,
    top: 5,
    bottom: 5,
    borderRadius: 8,
    backgroundColor: "#111827"
  },
  modeButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    zIndex: 1
  },
  modeButtonText: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "700"
  },
  modeButtonTextActive: {
    color: "#f8fafc"
  },
  card: {
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(71, 85, 105, 0.45)",
    backgroundColor: "#09111f",
    padding: 16
  },
  cardTitle: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "800"
  },
  cardSubtitle: {
    marginTop: 6,
    color: "#94a3b8",
    fontSize: 12
  },
  input: {
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(71, 85, 105, 0.45)",
    backgroundColor: "#0f172a",
    color: "#f8fafc",
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14
  },
  submitButton: {
    marginTop: 14,
    borderRadius: 11,
    backgroundColor: "#f97316",
    paddingVertical: 12,
    alignItems: "center"
  },
  submitButtonDisabled: {
    opacity: 0.6
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800"
  },
  swapAction: {
    marginTop: 12,
    alignItems: "center"
  },
  swapActionText: {
    color: "#38bdf8",
    fontSize: 12,
    fontWeight: "700"
  }
});
