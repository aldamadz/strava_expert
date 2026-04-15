import { Pressable, StyleSheet, Text } from "react-native";

export default function ActionButton({ label, onPress, type = "primary", disabled = false }) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        type === "primary" ? styles.primary : styles.secondary,
        disabled ? styles.disabled : null
      ]}
    >
      <Text style={type === "primary" ? styles.primaryText : styles.secondaryText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center"
  },
  primary: {
    backgroundColor: "#ea580c"
  },
  secondary: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.35)"
  },
  disabled: {
    opacity: 0.45
  },
  primaryText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 16
  },
  secondaryText: {
    color: "#cbd5e1",
    fontWeight: "700",
    fontSize: 16
  }
});

