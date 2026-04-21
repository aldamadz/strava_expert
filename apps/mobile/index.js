import { registerRootComponent } from "expo";
import { Component } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import App from "./src/App";

class RootErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : "Unknown startup error"
    };
  }

  componentDidCatch() {
    // Prevent silent close in production; fallback UI is enough here.
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorWrap}>
          <Text style={styles.errorTitle}>AuraTrack gagal dibuka</Text>
          <Text style={styles.errorBody}>{this.state.message || "Terjadi error saat startup."}</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

function Root() {
  return (
    <SafeAreaProvider>
      <RootErrorBoundary>
        <App />
      </RootErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  errorWrap: {
    flex: 1,
    backgroundColor: "#020617",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24
  },
  errorTitle: {
    color: "#f8fafc",
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center"
  },
  errorBody: {
    marginTop: 10,
    color: "#94a3b8",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20
  }
});

registerRootComponent(Root);
