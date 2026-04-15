import { StyleSheet, Text, View } from "react-native";

export default function ProfileScreen() {
  return (
    <>
      <Text style={styles.sectionTitle}>Profile</Text>
      <Text style={styles.sectionSubtitle}>Ringkasan performa dan target mingguan kamu.</Text>

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

