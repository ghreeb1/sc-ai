import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { Colors } from "../lib/theme";

interface LoadingProps {
  theme: "light" | "dark";
  size?: "small" | "large";
}

export const Loading = ({ theme, size = "small" }: LoadingProps) => {
  const colors = Colors[theme];
  return (
    <View style={styles.container}>
      <ActivityIndicator
        size={size}
        color={colors.primary}
        animating={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
});
