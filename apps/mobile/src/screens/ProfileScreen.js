import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { changePassword, deleteAccount, updateProfile } from "../services/api";

export default function ProfileScreen({ authState, onAuthChanged, showToast = () => {} }) {
  const [editName, setEditName] = useState(authState?.user?.full_name ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setEditName(authState?.user?.full_name ?? "");
  }, [authState?.user?.full_name]);

  async function handleLogout() {
    await onAuthChanged({ token: "", user: null });
    showToast("Sesi login dihapus.");
  }

  async function handleSaveProfile() {
    const name = editName.trim();
    if (name.length < 2) {
      showToast("Nama minimal 2 karakter.", "error");
      return;
    }

    try {
      setLoading(true);
      const result = await updateProfile({ fullName: name });
      await onAuthChanged({ token: authState.token, user: result.user });
      showToast("Profil berhasil diperbarui.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Update profile gagal.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePassword() {
    if (!currentPassword || newPassword.length < 6) {
      showToast("Isi password lama dan password baru minimal 6 karakter.", "error");
      return;
    }

    try {
      setLoading(true);
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      showToast("Password berhasil diubah.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Gagal ubah password.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteAccount() {
    Alert.alert("Hapus Akun", "Akun dan semua aktivitas akan dihapus permanen. Lanjutkan?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);
            await deleteAccount();
            await onAuthChanged({ token: "", user: null });
            showToast("Akun berhasil dihapus.");
          } catch (error) {
            showToast(error instanceof Error ? error.message : "Gagal hapus akun.", "error");
          } finally {
            setLoading(false);
          }
        }
      }
    ]);
  }

  return (
    <>
      <Text style={styles.sectionTitle}>Profile</Text>
      <Text style={styles.sectionSubtitle}>Kelola akun, keamanan, dan preferensi personalmu.</Text>

      <View style={styles.heroCard}>
        <Text style={styles.heroName}>{authState?.user?.full_name || "AuraTrack Runner"}</Text>
        <Text style={styles.heroEmail}>{authState?.user?.email || "-"}</Text>
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeLabel}>Status</Text>
            <Text style={styles.badgeValue}>Synced</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeLabel}>Plan</Text>
            <Text style={styles.badgeValue}>Core</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeLabel}>Storage</Text>
            <Text style={styles.badgeValue}>Cloud</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Informasi Profil</Text>
        <TextInput
          value={editName}
          onChangeText={setEditName}
          placeholder="Nama profil"
          placeholderTextColor="#64748b"
          style={styles.input}
          autoCapitalize="words"
        />
        <Pressable
          style={[styles.button, styles.primaryButton, loading ? styles.buttonDisabled : null]}
          onPress={handleSaveProfile}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? "Please wait..." : "Simpan Profil"}</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Keamanan</Text>
        <TextInput
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder="Password saat ini"
          placeholderTextColor="#64748b"
          style={styles.input}
          secureTextEntry
        />
        <TextInput
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="Password baru (min 6)"
          placeholderTextColor="#64748b"
          style={styles.input}
          secureTextEntry
        />
        <Pressable
          style={[styles.button, styles.secondaryButton, loading ? styles.buttonDisabled : null]}
          onPress={handleChangePassword}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? "Please wait..." : "Simpan Password"}</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Sesi & Data</Text>
        <Pressable style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
          <Text style={styles.buttonText}>Logout</Text>
        </Pressable>
        <Pressable
          style={[styles.button, styles.deleteButton, loading ? styles.buttonDisabled : null]}
          onPress={handleDeleteAccount}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? "Please wait..." : "Hapus Akun"}</Text>
        </Pressable>
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
  heroCard: {
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.3)",
    backgroundColor: "#0b1220",
    padding: 14
  },
  heroName: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "800"
  },
  heroEmail: {
    marginTop: 4,
    color: "#94a3b8",
    fontSize: 12
  },
  badgeRow: {
    marginTop: 10,
    flexDirection: "row",
    gap: 8
  },
  badge: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(71, 85, 105, 0.45)",
    backgroundColor: "#111827",
    paddingVertical: 8,
    paddingHorizontal: 8
  },
  badgeLabel: {
    color: "#94a3b8",
    fontSize: 10,
    fontWeight: "700"
  },
  badgeValue: {
    marginTop: 4,
    color: "#f8fafc",
    fontSize: 12,
    fontWeight: "800"
  },
  card: {
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(71, 85, 105, 0.45)",
    backgroundColor: "#0b1220",
    padding: 12
  },
  cardTitle: {
    color: "#f8fafc",
    fontSize: 14,
    fontWeight: "800"
  },
  input: {
    marginTop: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(71, 85, 105, 0.45)",
    backgroundColor: "#0f172a",
    color: "#f8fafc",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13
  },
  button: {
    marginTop: 10,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center"
  },
  primaryButton: {
    backgroundColor: "#f97316"
  },
  secondaryButton: {
    backgroundColor: "#1e293b"
  },
  logoutButton: {
    backgroundColor: "#991b1b"
  },
  deleteButton: {
    backgroundColor: "#7f1d1d"
  },
  buttonDisabled: {
    opacity: 0.55
  },
  buttonText: {
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: "700"
  }
});
