import { StyleSheet, Text, View } from "react-native";

export default function MetricCard({ title, value, tone = "default" }) {
  return (
    <View style={[styles.card, tone === "accent" ? styles.cardAccent : null]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "48.5%",
    backgroundColor: "#0b1220",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(71, 85, 105, 0.45)"
  },
  cardAccent: {
    backgroundColor: "#0f172a",
    borderColor: "rgba(249, 115, 22, 0.45)"
  },
  title: {
    fontSize: 12,
    color: "#94a3b8",
    letterSpacing: 0.4
  },
  value: {
    marginTop: 6,
    fontSize: 19,
    fontWeight: "700",
    color: "#f8fafc"
  }
});

