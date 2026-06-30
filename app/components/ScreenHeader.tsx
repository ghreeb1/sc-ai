import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar } from "react-native";
import { useRouter } from "expo-router";
import { Settings } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStore, useThemeColors } from "../lib/store";
import { 
  fontSize, 
  fontWeight, 
  colors, 
  spacing, 
  borderRadius,
  isSmallScreen 
} from "../lib/constants";

interface ScreenHeaderProps {
  showLogo?: boolean;
  title?: string;
  subtitle?: string;
}

export function ScreenHeader({ 
  showLogo = true,
  title,
  subtitle,
}: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const theme = useStore((state) => state.theme);
  const themeColors = useThemeColors();
  const isDark = theme === "dark";
  const palette = {
    background: themeColors.background,
    border: themeColors.border,
    textPrimary: themeColors.foreground,
    textMuted: themeColors.mutedForeground,
  };

  if (!showLogo && !title) return null;

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: palette.background,
          borderBottomColor: palette.border,
          shadowColor: isDark ? "#000000" : colors.text.primary,
        },
        Platform.OS === "android" && {
          paddingTop: Math.max(insets.top, StatusBar.currentHeight || 0) + (isSmallScreen ? spacing.sm : spacing.md),
        },
      ]}
    >
      {showLogo ? (
        <View style={styles.logoRow}>
          <View style={styles.logoBox}>
            <Text style={styles.logoSymbol}>Σ</Text>
          </View>
          <Text style={[styles.logoText, { color: palette.textPrimary }]}>SCHOLAR</Text>
        </View>
      ) : (
        <View style={styles.titleContainer}>
          {subtitle && (
            <Text style={[styles.subtitle, { color: palette.textMuted }]}>{subtitle}</Text>
          )}
          {title && (
            <Text style={[styles.title, { color: palette.textPrimary }]}>{title}</Text>
          )}
        </View>
      )}
      
      <TouchableOpacity
        style={styles.settingsButton}
        onPress={() => router.push("/(tabs)/settings")}
        activeOpacity={0.7}
        hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        accessibilityRole="button"
        accessibilityLabel="Open settings"
      >
        <Settings size={isSmallScreen ? 20 : 22} color={palette.textPrimary} strokeWidth={2} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: isSmallScreen ? spacing.md : spacing.lg,
    paddingVertical: isSmallScreen ? spacing.sm : spacing.md,
    borderBottomWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: colors.text.primary,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: isSmallScreen ? 6 : 8,
  },
  logoBox: {
    width: isSmallScreen ? 28 : 32,
    height: isSmallScreen ? 28 : 32,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  logoSymbol: {
    fontSize: isSmallScreen ? 13 : 15,
    fontWeight: fontWeight.black,
    color: colors.text.inverse,
  },
  logoText: {
    fontSize: isSmallScreen ? 15 : 17,
    fontWeight: fontWeight.extrabold,
    letterSpacing: 0.5,
  },
  titleContainer: {
    flex: 1,
  },
  subtitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  settingsButton: {
    padding: isSmallScreen ? 4 : 6,
    borderRadius: borderRadius.md,
  },
});
