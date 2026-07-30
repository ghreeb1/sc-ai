import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { Settings } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStore, useThemeColors } from "../lib/store";
import {
  fontWeight,
  colors,
  spacing,
  borderRadius,
  isSmallScreen,
} from "../lib/constants";

interface ScreenHeaderProps {
  /** Always true for primary tab screens — keeps the Σ logo visible */
  showLogo?: boolean;
  /**
   * Page title shown next to the Σ logo inside the app bar.
   * e.g. "Academic Overview", "Curriculum Plan"
   */
  pageTitle?: string;
  /**
   * Subtitle rendered below the app bar in a separate strip.
   * e.g. "Your academic progress at a glance"
   */
  subtitle?: string;
  /** @deprecated — kept for backward compat; has no effect when showLogo=true */
  title?: string;
}

export function ScreenHeader({
  showLogo = true,
  pageTitle,
  subtitle,
}: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const theme = useStore((state) => state.theme);
  const themeColors = useThemeColors();
  const isDark = theme === "dark";

  const palette = {
    background: themeColors.background,
    surface: isDark ? "#111827" : "#FFFFFF",
    border: themeColors.border,
    textPrimary: themeColors.foreground,
    textMuted: themeColors.mutedForeground,
    textPlaceholder: isDark ? "#8FA0B8" : colors.text.placeholder,
    settingsBg: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
  };

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: palette.surface,
          borderBottomColor: isDark
            ? "rgba(148,163,184,0.12)"
            : "rgba(0,0,0,0.06)",
        },
        Platform.OS === "android" && {
          paddingTop:
            Math.max(insets.top, StatusBar.currentHeight || 0) +
            (isSmallScreen ? spacing.sm : spacing.md),
        },
      ]}
    >
        {/* Left: Σ logo + page title */}
        <View style={styles.leadingGroup}>
          <View style={styles.logoBox}>
            <Text style={styles.logoSymbol}>Σ</Text>
          </View>

          {pageTitle ? (
            <Text
              style={[styles.pageTitle, { color: palette.textPrimary }]}
              numberOfLines={1}
            >
              {pageTitle}
            </Text>
          ) : showLogo ? (
            <Text style={[styles.pageTitle, { color: palette.textPrimary }]}>
              SCHOLAR
            </Text>
          ) : null}
        </View>

        {/* Right: Settings icon button */}
        <TouchableOpacity
          style={[styles.settingsButton, { backgroundColor: palette.settingsBg }]}
          onPress={() => router.push("/(tabs)/settings")}
          activeOpacity={0.7}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Open settings"
        >
          <Settings
            size={isSmallScreen ? 17 : 18}
            color={palette.textPrimary}
            strokeWidth={2}
          />
        </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  // ── App bar ──
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: isSmallScreen ? 16 : 20,
    paddingVertical: isSmallScreen ? spacing.sm : spacing.md,
    // Rounded bottom corners — subtle, not a floating card
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderBottomWidth: 1,
    // Soft elevation
    ...Platform.select({
      ios: {
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },

  // ── Leading: logo + title ──
  leadingGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: isSmallScreen ? 7 : 9,
    flex: 1,
    marginRight: 8,
  },
  logoBox: {
    width: isSmallScreen ? 28 : 30,
    height: isSmallScreen ? 28 : 30,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  logoSymbol: {
    fontSize: isSmallScreen ? 13 : 14,
    fontWeight: fontWeight.black,
    color: "#FFFFFF",
  },
  pageTitle: {
    fontSize: isSmallScreen ? 14 : 15,
    fontWeight: fontWeight.extrabold,
    letterSpacing: -0.2,
    flexShrink: 1,
  },

  // ── Trailing: settings button ──
  settingsButton: {
    width: isSmallScreen ? 32 : 34,
    height: isSmallScreen ? 32 : 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
});
