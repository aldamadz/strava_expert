import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { loginAuth, registerAuth } from "../services/api";

export default function ProfileScreen({ authState, onAuthChanged }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!email || !password) {
      Alert.alert("Input belum lengkap", "Isi email dan password dulu.");
      return;
    }
    try {
      setLoading(true);
      const result = await registerAuth({ email, password, fullName });
      await onAuthChanged({ token: result.token, user: result.user });
      Alert.alert("Berhasil", "Akun berhasil dibuat dan login.");
    } catch {
      Alert.alert("Gagal Register", "Email mungkin sudah terdaftar atau payload tidak valid.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert("Input belum lengkap", "Isi email dan password dulu.");
      return;
    }
    try {
      setLoading(true);
      const result = await loginAuth({ email, password });
      await onAuthChanged({ token: result.token, user: result.user });
      Alert.alert("Berhasil", "Login sukses.");
    } catch {
      Alert.alert("Login Gagal", "Email/password salah atau server belum aktif.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await onAuthChanged({ token: "", user: null });
    Alert.alert("Logout", "Sesi login dihapus dari perangkat.");
  }

  return (
    <>
      <Text style={styles.sectionTitle}>Profile</Text>
      <Text style={styles.sectionSubtitle}>Ringkasan akun, auth, dan sinkronisasi server.</Text>

      <View style={styles.authCard}>
        <Text style={styles.authTitle}>Akun</Text>
        {authState?.token ? (
          <>
            <Text style={styles.authInfo}>Login sebagai: {authState.user?.email ?? "-"}</Text>
            <Pressable style={[styles.authButton, styles.logoutButton]} onPress={handleLogout}>
              <Text style={styles.authButtonText}>Logout</Text>
            </Pressable>
          </>
        ) : (
          <>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Nama lengkap (opsional)"
              placeholderTextColor="#64748b"
              style={styles.input}
              autoCapitalize="words"
            />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor="#64748b"
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password (min 6)"
              placeholderTextColor="#64748b"
              style={styles.input}
              secureTextEntry
            />
            <View style={styles.authButtonsRow}>
              <Pressable
                style={[styles.authButton, styles.secondaryButton, loading ? styles.disabledButton : null]}
                onPress={handleRegister}
                disabled={loading}
              >
                <Text style={styles.authButtonText}>{loading ? "Please wait..." : "Register"}</Text>
              </Pressable>
              <Pressable
                style={[styles.authButton, styles.primaryButton, loading ? styles.disabledButton : null]}
                onPress={handleLogin}
                disabled={loading}
              >
                <Text style={styles.authButtonText}>{loading ? "Please wait..." : "Login"}</Text>
              </Pressable>
            </View>
          </>
        )}
      </View>

      <View style={styles.profileHero}>
        <Text style={styles.profileName}>Aldama Runner</Text>
        <Text style={styles.profileLevel}>Level 7 | Consistency Builder</Text>
        <View style={styles.profileStatsRow}>
          <View style={styles.profileStatBox}>
            <Text style={styles.profileStatLabel}>Weekly KM</Text>
            <Text style={styles.profileStatValue}>42.8</Text>
          </View>
          <View style={styles.profileStatBox}>
            <Text style={styles.profileStatLabel}>Streak</Text>
            <Text style={styles.profileStatValue}>12 Hari</Text>
          </View>
          <View style={styles.profileStatBox}>
            <Text style={styles.profileStatLabel}>Best 10K</Text>
            <Text style={styles.profileStatValue}>49:20</Text>
          </View>
        </View>
      </View>

      <View style={styles.profileCard}>
        <Text style={styles.profileCardTitle}>Goal Mingguan</Text>
        <Text style={styles.profileCardItem}>- Lari 4 sesi</Text>
        <Text style={styles.profileCardItem}>- Total 45 km</Text>
        <Text style={styles.profileCardItem}>- 1 sesi tempo pace sub 5:00</Text>
      </View>

      <View style={styles.profileCard}>
        <Text style={styles.profileCardTitle}>Pengaturan Cepat</Text>
        <Text style={styles.profileCardItem}>- Unit: Kilometer</Text>
        <Text style={styles.profileCardItem}>- Auto-pause: ON</Text>
        <Text style={styles.profileCardItem}>- Privacy: Followers Only</Text>
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
  authCard: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(71, 85, 105, 0.45)",
    backgroundColor: "#0b1220",
    padding: 14
  },
  authTitle: {
    color: "#f8fafc",
    fontSize: 15,
    fontWeight: "800"
  },
  authInfo: {
    marginTop: 8,
    color: "#cbd5e1",
    fontSize: 13
  },
  input: {
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(71, 85, 105, 0.45)",
    backgroundColor: "#0f172a",
    color: "#f8fafc",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13
  },
  authButtonsRow: {
    marginTop: 10,
    flexDirection: "row",
    gap: 8
  },
  authButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center"
  },
  primaryButton: {
    backgroundColor: "#ea580c"
  },
  secondaryButton: {
    backgroundColor: "#1e293b"
  },
  logoutButton: {
    marginTop: 10,
    backgroundColor: "#991b1b"
  },
  disabledButton: {
    opacity: 0.55
  },
  authButtonText: {
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: "700"
  },
  profileHero: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(71, 85, 105, 0.45)",
    backgroundColor: "#0b1220",
    padding: 14
  },
  profileName: {
    color: "#f8fafc",
    fontSize: 20,
    fontWeight: "800"
  },
  profileLevel: {
    marginTop: 4,
    color: "#94a3b8",
    fontSize: 12
  },
  profileStatsRow: {
    marginTop: 12,
    flexDirection: "row",
    gap: 8
  },
  profileStatBox: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.25)",
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    paddingVertical: 8,
    paddingHorizontal: 8
  },
  profileStatLabel: {
    color: "#94a3b8",
    fontSize: 10
  },
  profileStatValue: {
    marginTop: 4,
    color: "#f8fafc",
    fontSize: 12,
    fontWeight: "700"
  },
  profileCard: {
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(71, 85, 105, 0.45)",
    backgroundColor: "#0b1220",
    padding: 12
  },
  profileCardTitle: {
    color: "#f8fafc",
    fontSize: 14,
    fontWeight: "800"
  },
  profileCardItem: {
    marginTop: 6,
    color: "#cbd5e1",
    fontSize: 12
  }
});
