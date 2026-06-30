import React, { useMemo } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { AlertCircle, CheckCircle } from "lucide-react-native";
import { useAppLocale, useStore, useThemeColors } from "../lib/store";
import { ScreenHeader } from "../components/ScreenHeader";
import { colors } from "../lib/constants";

export default function SemesterPlannerScreen() {
  const store = useStore();
  const theme = useStore((state) => state.theme);
  const themeColors = useThemeColors();
  const { t, isRTL } = useAppLocale();
  const isDark = theme === "dark";
  const palette = {
    background: themeColors.background,
    surface: isDark ? "#111827" : "#FFFFFF",
    border: themeColors.border,
    borderSubtle: isDark ? "rgba(148,163,184,0.18)" : "#E2E8F0",
    textPrimary: themeColors.foreground,
    textSecondary: isDark ? "#CBD5E1" : "#334155",
    textMuted: isDark ? "#8FA0B8" : "#94A3B8",
    primary: colors.primary,
    success: colors.success,
    warning: colors.warning,
    divider: isDark ? "rgba(148,163,184,0.18)" : "#E2E8F0",
  };
  const textAlign = isRTL ? "right" : "left";
  const rowDirection = isRTL ? "row-reverse" : "row";

  // Find courses currently in-progress
  const activeCourses = useMemo(() => {
    return store.courses.filter((c) => c.status === "in-progress");
  }, [store.courses]);

  const activeCredits = useMemo(() => {
    return activeCourses.reduce((sum, c) => sum + c.credits, 0);
  }, [activeCourses]);

  // Determine workload indicator based on credits count
  const workload = useMemo(() => {
    if (activeCredits === 0)
      return {
        label: t("emptyWorkload"),
        desc: t("noActiveCourses"),
        color: palette.textMuted,
        bg: isDark ? "#1F2937" : "#F1F5F9",
      };
    if (activeCredits < 12)
      return {
        label: t("lowWorkload"),
        desc: t("lowWorkloadDesc"),
        color: palette.primary,
        bg: isDark ? "rgba(30,117,255,0.16)" : "#E0F2FE",
      };
    if (activeCredits <= 18)
      return {
        label: t("balancedWorkload"),
        desc: t("balancedWorkloadDesc"),
        color: palette.success,
        bg: isDark ? "rgba(16,185,129,0.16)" : "#DCFCE7",
      };
    return {
      label: t("highWorkload"),
      desc: t("highWorkloadDesc"),
      color: palette.warning,
      bg: isDark ? "rgba(245,158,11,0.16)" : "#FEF3C7",
    };
  }, [
    activeCredits,
    isDark,
    palette.primary,
    palette.success,
    palette.textMuted,
    palette.warning,
    t,
  ]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: palette.background }]}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={palette.background}
      />
      <ScreenHeader showLogo />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.titleArea}>
          <Text
            style={[styles.tagline, { color: palette.textMuted, textAlign }]}
          >
            {t("semesterTracker").toUpperCase()}
          </Text>
          <Text
            style={[styles.title, { color: palette.textPrimary, textAlign }]}
          >
            {t("plannerTitle")}
          </Text>
        </View>

        {/* Hero Card: Credits Workload Indicator */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: palette.surface,
              borderColor: palette.borderSubtle,
            },
          ]}
        >
          <Text
            style={[styles.cardLabel, { color: palette.textMuted, textAlign }]}
          >
            {t("currentWorkload").toUpperCase()}
          </Text>

          <View
            style={[styles.workloadHeader, { flexDirection: rowDirection }]}
          >
            <Text
              style={[
                styles.creditsNumber,
                { color: palette.textPrimary, textAlign },
              ]}
            >
              {activeCredits}{" "}
              <Text style={styles.creditsUnit}> {t("credits")}</Text>
            </Text>
            <View
              style={[styles.workloadBadge, { backgroundColor: workload.bg }]}
            >
              <Text
                style={[styles.workloadBadgeText, { color: workload.color }]}
              >
                {workload.label}
              </Text>
            </View>
          </View>

          <Text
            style={[
              styles.workloadDesc,
              { color: palette.textSecondary, textAlign },
            ]}
          >
            {workload.desc}
          </Text>

          {/* Graphical Level Bar */}
          <View style={styles.workloadLevelBarContainer}>
            <View
              style={[
                styles.levelSegment,
                {
                  backgroundColor:
                    activeCredits > 0 ? palette.primary : palette.border,
                },
              ]}
            />
            <View
              style={[
                styles.levelSegment,
                {
                  backgroundColor:
                    activeCredits >= 12 ? palette.success : palette.border,
                },
              ]}
            />
            <View
              style={[
                styles.levelSegment,
                {
                  backgroundColor:
                    activeCredits > 18 ? palette.warning : palette.border,
                },
              ]}
            />
          </View>

          <View style={[styles.levelLabels, { flexDirection: rowDirection }]}>
            <Text
              style={[
                styles.levelLabelText,
                { color: palette.textMuted, textAlign },
              ]}
            >
              {t("lightRange")}
            </Text>
            <Text
              style={[
                styles.levelLabelText,
                { color: palette.textMuted, textAlign: "center" },
              ]}
            >
              {t("optimalRange")}
            </Text>
            <Text
              style={[
                styles.levelLabelText,
                {
                  color: palette.textMuted,
                  textAlign: isRTL ? "left" : "right",
                },
              ]}
            >
              {t("heavyRange")}
            </Text>
          </View>
        </View>

        {/* Enrolled Courses list */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: palette.surface,
              borderColor: palette.borderSubtle,
            },
          ]}
        >
          <Text
            style={[styles.cardLabel, { color: palette.textMuted, textAlign }]}
          >
            {t("currentlyEnrolled").toUpperCase()}
          </Text>

          {activeCourses.length === 0 ? (
            <View style={styles.emptyEnrolled}>
              <AlertCircle
                size={20}
                color={palette.textMuted}
                style={{ marginBottom: 6 }}
              />
              <Text
                style={[
                  styles.emptyEnrolledText,
                  { color: palette.textMuted, textAlign },
                ]}
              >
                {t("noInProgressCourses")}
              </Text>
            </View>
          ) : (
            <View style={styles.coursesList}>
              {activeCourses.map((course) => (
                <View
                  key={course.id}
                  style={[
                    styles.courseRow,
                    {
                      borderBottomColor: palette.divider,
                      flexDirection: rowDirection,
                    },
                  ]}
                >
                  <View style={styles.courseLeft}>
                    <Text
                      style={[
                        styles.courseCode,
                        { color: palette.textPrimary, textAlign },
                      ]}
                    >
                      {course.code}
                    </Text>
                    <Text
                      style={[
                        styles.courseName,
                        { color: palette.textSecondary, textAlign },
                      ]}
                      numberOfLines={1}
                    >
                      {course.name}
                    </Text>
                  </View>
                  <Text
                    style={[styles.courseCredits, { color: palette.textMuted }]}
                  >
                    {course.credits} {t("creditShort")}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Workload Recommendations Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: palette.surface,
              borderColor: palette.borderSubtle,
            },
          ]}
        >
          <Text
            style={[styles.cardLabel, { color: palette.textMuted, textAlign }]}
          >
            {t("academicRecommendation").toUpperCase()}
          </Text>

          <View style={[styles.recItem, { flexDirection: rowDirection }]}>
            <CheckCircle
              size={16}
              color={palette.success}
              style={[
                styles.recIcon,
                { marginRight: isRTL ? 0 : 8, marginLeft: isRTL ? 8 : 0 },
              ]}
            />
            <Text
              style={[
                styles.recText,
                { color: palette.textSecondary, textAlign },
              ]}
            >
              {t("recBalanceCredits")}
            </Text>
          </View>

          <View style={[styles.recItem, { flexDirection: rowDirection }]}>
            <CheckCircle
              size={16}
              color={palette.success}
              style={[
                styles.recIcon,
                { marginRight: isRTL ? 0 : 8, marginLeft: isRTL ? 8 : 0 },
              ]}
            />
            <Text
              style={[
                styles.recText,
                { color: palette.textSecondary, textAlign },
              ]}
            >
              {t("recAvoidHeavyMix")}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 122,
  },
  titleArea: {
    marginBottom: 24,
  },
  tagline: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 22,
    marginBottom: 20,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 16,
  },
  workloadHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  creditsNumber: {
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: -1,
  },
  creditsUnit: {
    fontSize: 16,
    fontWeight: "600",
  },
  workloadBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  workloadBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  workloadDesc: {
    fontSize: 13.5,
    lineHeight: 18,
    fontWeight: "500",
    marginBottom: 20,
  },
  workloadLevelBarContainer: {
    flexDirection: "row",
    height: 8,
    borderRadius: 4,
    gap: 6,
    marginBottom: 8,
  },
  levelSegment: {
    flex: 1,
    height: "100%",
    borderRadius: 4,
  },
  levelLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  levelLabelText: {
    fontSize: 10,
    fontWeight: "600",
  },
  emptyEnrolled: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  emptyEnrolledText: {
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: "center",
    paddingHorizontal: 8,
    fontWeight: "500",
  },
  coursesList: {
    gap: 12,
  },
  courseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  courseLeft: {
    flex: 1,
    paddingRight: 12,
  },
  courseCode: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 2,
  },
  courseName: {
    fontSize: 13.5,
    fontWeight: "600",
  },
  courseCredits: {
    fontSize: 13,
    fontWeight: "600",
  },
  recItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  recIcon: {
    marginTop: 2,
    marginRight: 8,
  },
  recText: {
    fontSize: 13.5,
    lineHeight: 18,
    fontWeight: "500",
    flex: 1,
  },
});
