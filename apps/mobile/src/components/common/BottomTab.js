import { Pressable, StyleSheet, Text, View } from "react-native";

export default function BottomTab({ label, active, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.button}>
      <Text style={[styles.text, active ? styles.textActive : null]}>{label}</Text>
      {active ? <View style={styles.indicator} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8
  },
  text: {
    color: "#64748b",
    fontWeight: "700",
    fontSize: 13
  },
  textActive: {
    color: "#f8fafc"
  },
  indicator: {
    marginTop: 6,
    width: 22,
    height: 3,
    borderRadius: 999,
    backgroundColor: "#f97316"
  }
});

