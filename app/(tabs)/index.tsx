import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  Animated,
  Easing,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  AppState,
  type AppStateStatus,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  GraduationCap,
  BookOpen,
  Trophy,
  Calendar,
  TrendingUp,
  Star,
} from "lucide-react-native";
import { useStore, useThemeColors, useAppLocale } from "../../lib/store";

import { ScreenHeader } from "../../components/ScreenHeader";
import { Loading } from "../../components/Loading";
import type { AchievementResponse, DashboardResponse } from "../../lib/types";
import { getAcademicDashboard } from "../../services/academic";
import {
  colors,
  fontWeight,
  isSmallScreen,
  tabBarHeight,
} from "../../lib/constants";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function clampPercent(value: number) {
  if (Number.isNaN(value) || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(value, 100));
}

function achievementAccent(category: string) {
  switch (category) {
    case "academic":   return "#8B5CF6";
    case "credits":    return colors.primary;
    case "planning":   return "#475569";
    case "semester":   return "#F97316";
    case "ai":         return "#0F766E";
    default:           return colors.success;
  }
}

function formatAchievementLabel(category: string) {
  return category.replace(/_/g, " ").toUpperCase();
}

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type OverviewPalette = {
  background: string;
  surface: string;
  surfaceAlt: string;
  borderSubtle: string;
  divider: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textPlaceholder: string;
  badgeBg: string;
  shadowOpacity: number;
};

type AchievementItem = {
  id: string;
  label: string;
  title: string;
  description: string;
  accent: string;
  percent: number;
  progressText: string;
  earned: boolean;
};

// ─────────────────────────────────────────────
// GpaHeroCard — primary hero, full-width
// ─────────────────────────────────────────────

function GpaHeroCard({
  gpa,
  gradingSystem,
  gpaPercent,
  palette,
  isRTL,
}: {
  gpa: number;
  gradingSystem: string;
  gpaPercent: number;
  palette: OverviewPalette;
  isRTL: boolean;
}) {
  const pct = clampPercent(gpaPercent) / 100;
  const rowDir = isRTL ? "row-reverse" : "row";
  const accent = "#8B5CF6";

  const tone =
    pct >= 0.8 ? "Strong" : pct >= 0.6 ? "On Track" : "Needs Review";
  const toneColor =
    pct >= 0.8 ? colors.success : pct >= 0.6 ? colors.warning : colors.danger;
  const toneBg =
    pct >= 0.8
      ? colors.success + "20"
      : pct >= 0.6
      ? colors.warning + "20"
      : colors.danger + "20";

  return (
    <View
      style={[
        S.heroCard,
        { backgroundColor: palette.surface, borderColor: palette.borderSubtle },
      ]}
    >
      {/* Tinted accent band */}
      <View style={[S.heroBand, { backgroundColor: accent + "0E" }]} />

      {/* Header row: label + pill */}
      <View style={[S.heroHeader, { flexDirection: rowDir }]}>
        <View style={[S.heroTitleGroup, { flexDirection: rowDir, alignItems: "center" }]}>
          <View style={[S.heroIconBox, { backgroundColor: accent + "18" }]}>
            <GraduationCap size={14} color={accent} strokeWidth={2.5} />
          </View>
          <Text
            style={[
              S.heroLabel,
              {
                color: accent,
                marginLeft: isRTL ? 0 : 8,
                marginRight: isRTL ? 8 : 0,
              },
            ]}
          >
            CUMULATIVE GPA
          </Text>
        </View>
        <View style={[S.pill, { backgroundColor: toneBg }]}>
          <Text style={[S.pillText, { color: toneColor }]}>{tone}</Text>
        </View>
      </View>

      {/* Large GPA value */}
      <View
        style={[
          S.heroValueRow,
          { flexDirection: rowDir, alignItems: "baseline", paddingHorizontal: 16 },
        ]}
      >
        <Text style={[S.heroValue, { color: palette.textPrimary }]}>
          {Number.isFinite(gpa) ? gpa.toFixed(2) : "0.00"}
        </Text>
        <Text style={[S.heroScale, { color: palette.textPlaceholder }]}>
          {isRTL ? `${gradingSystem} /` : `/ ${gradingSystem}`}
        </Text>
      </View>

      {/* Segmented progress bar */}
      <View style={[S.heroBarWrap, { paddingHorizontal: 16, marginTop: 10 }]}>
        <View style={[S.heroBarTrack, { backgroundColor: accent + "1A" }]}>
          <View
            style={[
              S.heroBarFill,
              {
                width: `${clampPercent(gpaPercent)}%` as `${number}%`,
                backgroundColor: accent,
              },
            ]}
          />
          {([0.25, 0.5, 0.75] as const).map((t) => (
            <View
              key={t}
              style={[S.heroBarTick, { left: `${t * 100}%` as `${number}%` }]}
            />
          ))}
        </View>
        <Text style={[S.heroBarPct, { color: accent }]}>
          {Math.round(clampPercent(gpaPercent))}%
        </Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
// MiniStatCard — used in the 2×2 grid
// ─────────────────────────────────────────────

function MiniStatCard({
  icon,
  accent,
  label,
  value,
  suffix,
  barPercent,
  palette,
}: {
  icon: React.ReactNode;
  accent: string;
  label: string;
  value: string;
  suffix?: string;
  barPercent: number;
  palette: OverviewPalette;
}) {
  return (
    <View
      style={[
        S.miniCard,
        {
          backgroundColor: palette.surface,
          borderColor: palette.borderSubtle,
          shadowOpacity: palette.shadowOpacity,
        },
      ]}
    >
      {/* Icon + label row */}
      <View style={S.miniCardTop}>
        <View style={[S.miniCardIconBox, { backgroundColor: accent + "18" }]}>
          {icon}
        </View>
        <Text
          style={[S.miniCardLabel, { color: accent }]}
          numberOfLines={2}
        >
          {label}
        </Text>
      </View>

      {/* Value */}
      <View style={S.miniCardValueRow}>
        <Text style={[S.miniCardValue, { color: palette.textPrimary }]}>
          {value}
        </Text>
        {suffix ? (
          <Text style={[S.miniCardSuffix, { color: palette.textMuted }]}>
            {suffix}
          </Text>
        ) : null}
      </View>

      {/* Progress bar */}
      <View style={S.miniCardBarRow}>
        <View
          style={[S.miniCardTrack, { backgroundColor: accent + "14" }]}
        >
          <View
            style={[
              S.miniCardFill,
              {
                width: `${clampPercent(barPercent)}%` as `${number}%`,
                backgroundColor: accent,
              },
            ]}
          />
        </View>
        <Text style={[S.miniCardPct, { color: accent }]}>
          {Math.round(clampPercent(barPercent))}%
        </Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
// SemesterStatusCard
// ─────────────────────────────────────────────

function SemesterStatusCard({
  activeCourses,
  palette,
  t,
}: {
  activeCourses: { course: { name: string } }[];
  palette: OverviewPalette;
  t: (key: string) => string;
}) {
  const hasActive = activeCourses.length > 0;
  const accent = colors.primary;

  return (
    <View
      style={[
        S.sectionCard,
        {
          backgroundColor: palette.surface,
          borderColor: palette.borderSubtle,
          borderLeftColor: accent,
          shadowOpacity: palette.shadowOpacity,
        },
      ]}
    >
      {/* Section header */}
      <View style={S.sectionCardHeader}>
        <View
          style={[S.sectionCardIconBox, { backgroundColor: accent + "14" }]}
        >
          <Calendar size={14} color={accent} strokeWidth={2.5} />
        </View>
        <Text style={[S.sectionCardTitle, { color: palette.textPrimary }]}>
          {t("currentSemesterStatus")}
        </Text>
        {hasActive && (
          <View
            style={[
              S.sectionBadge,
              { backgroundColor: accent + "14", marginLeft: "auto" },
            ]}
          >
            <Text style={[S.sectionBadgeText, { color: accent }]}>
              {activeCourses.length}
            </Text>
          </View>
        )}
      </View>

      {/* Divider */}
      <View style={[S.sectionDivider, { backgroundColor: palette.borderSubtle }]} />

      {/* Body */}
      {!hasActive ? (
        <View style={S.sectionEmptyWrap}>
          <Text style={[S.sectionEmptyText, { color: palette.textMuted }]}>
            {t("noActiveSemCourses")}
          </Text>
          <Text style={[S.sectionEmptySub, { color: palette.textPlaceholder }]}>
            {t("updateCurriculumSync")}
          </Text>
        </View>
      ) : (
        <View style={S.semesterBody}>
          <View style={S.semesterMainRow}>
            <Text style={[S.semesterCount, { color: palette.textPrimary }]}>
              {activeCourses.length}
            </Text>
            <Text style={[S.semesterCountLabel, { color: palette.textMuted }]}>
              {activeCourses.length === 1
                ? t("enrolledCourse")
                : t("enrolledCourses")}
            </Text>
          </View>
          <Text
            style={[S.semesterCourseName, { color: palette.textPlaceholder }]}
            numberOfLines={1}
          >
            {t("currentCourseLabel")}:{" "}
            {activeCourses[0]?.course.name || t("inProgressTerm")}
          </Text>
        </View>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────
// AchievementRow
// ─────────────────────────────────────────────

function AchievementRow({
  item,
  palette,
}: {
  item: AchievementItem;
  palette: OverviewPalette;
}) {
  const { t } = useAppLocale();
  return (
    <View
      style={[
        S.achievementCard,
        {
          backgroundColor: palette.surface,
          borderColor: palette.borderSubtle,
          borderLeftColor: item.accent,
          shadowOpacity: palette.shadowOpacity,
        },
      ]}
    >
      <View style={S.achievementTopRow}>
        <View style={S.achievementCopy}>
          <View style={S.achievementMetaRow}>
            <View
              style={[S.achievementBullet, { backgroundColor: item.accent }]}
            />
            <Text
              style={[S.achievementLabel, { color: palette.textPlaceholder }]}
            >
              {item.label}
            </Text>
          </View>
          <Text style={[S.achievementTitle, { color: palette.textPrimary }]}>
            {item.title}
          </Text>
          <Text
            style={[S.achievementDescription, { color: palette.textMuted }]}
          >
            {item.description}
          </Text>
        </View>
        <View style={S.achievementStatusWrap}>
          <Text
            style={[
              S.achievementStatus,
              { color: item.earned ? item.accent : palette.textPlaceholder },
            ]}
          >
            {item.earned ? t("achEarned") : t("achInProgress")}
          </Text>
          <Text
            style={[
              S.achievementStatusText,
              { color: palette.textPlaceholder },
            ]}
          >
            {item.progressText}
          </Text>
        </View>
      </View>
      <View style={S.achievementProgressRow}>
        <View
          style={[S.achievementTrack, { backgroundColor: palette.surfaceAlt }]}
        >
          <View
            style={[
              S.achievementFill,
              {
                width: `${clampPercent(item.percent)}%` as `${number}%`,
                backgroundColor: item.accent,
              },
            ]}
          />
        </View>
        <Text style={[S.achievementPercent, { color: palette.textSecondary }]}>
          {Math.round(clampPercent(item.percent))}%
        </Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
// DistinctionsEmptyState
// ─────────────────────────────────────────────

function DistinctionsEmptyState({ palette, t }: { palette: OverviewPalette; t: (k: string) => string }) {
  return (
    <View
      style={[
        S.emptyStateCard,
        {
          backgroundColor: palette.surface,
          borderColor: palette.borderSubtle,
        },
      ]}
    >
      {/* Icon area */}
      <View style={[S.emptyStateIconWrap, { backgroundColor: colors.primary + "10" }]}>
        <Star size={22} color={colors.primary} strokeWidth={2} />
      </View>

      {/* Badge label */}
      <View style={S.emptyStateBadgeRow}>
        <View style={[S.emptyStateBullet, { backgroundColor: colors.primary }]} />
        <Text style={[S.emptyStateBadgeText, { color: palette.textPlaceholder }]}>
          {t("readyForFirstMilestone")}
        </Text>
      </View>

      <Text style={[S.emptyStateTitle, { color: palette.textPrimary }]}>
        {t("buildFirstDistinction")}
      </Text>
      <Text style={[S.emptyStateBody, { color: palette.textPlaceholder }]}>
        {t("addGradedCourses")}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────

export default function OverviewScreen() {
  const router = useRouter();
  const theme = useStore((state) => state.theme);
  const themeColors = useThemeColors();
  const { t, isRTL } = useAppLocale();
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isDark = theme === "dark";

  const isAuthenticated = useStore((state) => state.authed);
  const authBootstrapped = useStore((state) => state.authBootstrapped);

  const palette: OverviewPalette = {
    background: themeColors.background,
    surface: isDark ? "#111827" : "#FFFFFF",
    surfaceAlt: isDark ? "#1F2937" : "#F1F5F9",
    borderSubtle: isDark ? "rgba(148,163,184,0.18)" : "rgba(0,0,0,0.05)",
    divider: isDark ? "rgba(148,163,184,0.18)" : "rgba(0,0,0,0.05)",
    textPrimary: themeColors.foreground,
    textSecondary: isDark ? "#CBD5E1" : colors.text.secondary,
    textMuted: themeColors.mutedForeground,
    textPlaceholder: isDark ? "#8FA0B8" : colors.text.placeholder,
    badgeBg: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)",
    shadowOpacity: isDark ? 0.08 : 0.03,
  };

  const loadDashboard = useCallback(async (silent = false) => {
    if (!isAuthenticated || !authBootstrapped) {
      return;
    }

    // ── C: Dashboard request start ────────────────────────────────────────
    if (!silent) setLoading(true);
    setError(null);
    try {
      // getAcademicDashboard calls GET /api/academic/dashboard with auth:true
      // api.ts will log the token, Authorization header, and HTTP status
      const nextDashboard = await getAcademicDashboard();
      setDashboard(nextDashboard);
    } catch (err) {
      // ── C: Dashboard failure ──────────────────────────────────────────
      setError("Unable to load dashboard. Please try again.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [isAuthenticated, authBootstrapped]);

  useFocusEffect(
    useCallback(() => {
      loadDashboard(false);
    }, [loadDashboard]),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        loadDashboard(true);
      }
    });
    return () => {
      subscription.remove();
    };
  }, [loadDashboard]);

  // ── Derived values (unchanged logic) ──
  const profileName = dashboard?.user.name ?? "Academic Student";
  const profileMajor = dashboard?.user.major ?? "Academic Program";

  const gradingSystem = dashboard?.user.grading_scale === "5.0" ? "5.0" : "4.0";
  const maxScale = gradingSystem === "5.0" ? 5.0 : 4.0;
  const gpa = dashboard?.cumulative_gpa ?? 0;
  const gpaPercent = clampPercent((gpa / maxScale) * 100);

  const earnedCredits = dashboard?.completed_credit_hours ?? 0;
  const totalGoalCredits = dashboard?.total_credit_hours ?? 0;
  const creditPercent = clampPercent(dashboard?.graduation_percentage ?? 0);
  const estimatedGradYear = dashboard?.estimated_graduation_year ?? null;
  const activeCourses = dashboard?.current_courses ?? [];

  const achievementItems = useMemo<AchievementItem[]>(
    () =>
      (dashboard?.achievements?.recent ?? []).map(
        (achievement: AchievementResponse) => ({
          id: achievement.id,
          label: formatAchievementLabel(achievement.category),
          title: achievement.title,
          description: achievement.description,
          accent: achievementAccent(achievement.category),
          percent: clampPercent(achievement.progress),
          progressText: `${Math.round(clampPercent(achievement.progress))}%`,
          earned: achievement.earned,
        }),
      ),
    [dashboard?.achievements?.recent],
  );

  const earnedAchievementCount = dashboard?.achievements?.unlocked ?? 0;
  const totalAchievementCount =
    dashboard?.achievements?.total ?? achievementItems.length;

  // Suppress unused-variable lint for router (kept for future navigation)
  void router;

  // ── Entrance animation ──
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    if (!loading && (dashboard || error)) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(12);
    }
  }, [loading, dashboard, error, fadeAnim, slideAnim]);

  return (
    <SafeAreaView style={[S.root, { backgroundColor: palette.background }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={palette.background}
      />
      <ScreenHeader
        showLogo
        pageTitle={t("academicOverviewTitle")}
        subtitle={t("headerSubtitleOverview")}
      />

      {loading && !dashboard ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={S.scroll}
        >
          <Loading theme={theme} size="large" />
        </ScrollView>
      ) : error && !dashboard ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={S.scroll}
        >
          <View
            style={[
              S.errorCard,
              {
                backgroundColor: palette.surface,
                borderColor: palette.borderSubtle,
              },
            ]}
          >
            <Text style={[S.sectionEmptyText, { color: palette.textMuted }]}>
              {error}
            </Text>
            <TouchableOpacity activeOpacity={0.8} onPress={() => loadDashboard(false)}>
              <Text style={[S.retryText, { color: colors.primary }]}>
                Retry
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <Animated.View
          style={{
            flex: 1,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={S.scroll}
        >
          {/* ── Subtitle ── */}
          <Text style={[S.screenSubtitle, { color: palette.textPlaceholder }]}>
            {t("headerSubtitleOverview")}
          </Text>

          {/* ── Profile badge ── */}
          <View style={S.profileBadgeRow}>
            <View style={[S.metaBadge, { backgroundColor: palette.badgeBg }]}>
              <Text style={[S.metaBadgeText, { color: palette.textPrimary }]}>
                {profileName}
              </Text>
            </View>
            <Text style={[S.bulletDivider, { color: palette.textPlaceholder }]}>
              •
            </Text>
            <Text style={[S.subTitleText, { color: palette.textMuted }]}>
              {profileMajor}
            </Text>
          </View>

          {/* ── 1. GPA Hero Card ── */}
          <GpaHeroCard
            gpa={gpa}
            gradingSystem={gradingSystem}
            gpaPercent={gpaPercent}
            palette={palette}
            isRTL={isRTL}
          />

          {/* ── 2. Stats 2×2 Grid ── */}
          <View style={S.statsGrid}>
            {/* Credit Completion */}
            <MiniStatCard
              icon={
                <BookOpen size={15} color={colors.success} strokeWidth={2.5} />
              }
              accent={colors.success}
              label={t("creditCompletion")}
              value={`${earnedCredits}`}
              suffix={`/ ${totalGoalCredits}`}
              barPercent={creditPercent}
              palette={palette}
            />

            {/* Graduation Progress */}
            <MiniStatCard
              icon={
                <Trophy size={15} color={"#F97316"} strokeWidth={2.5} />
              }
              accent={"#F97316"}
              label={t("graduation")}
              value={estimatedGradYear ? `${estimatedGradYear}` : "–"}
              suffix={estimatedGradYear ? "EST." : undefined}
              barPercent={creditPercent}
              palette={palette}
            />

            {/* Semester GPA */}
            <MiniStatCard
              icon={
                <TrendingUp size={15} color={colors.primary} strokeWidth={2.5} />
              }
              accent={colors.primary}
              label="SEMESTER GPA"
              value={
                Number.isFinite(dashboard?.semester_gpa ?? 0)
                  ? (dashboard?.semester_gpa ?? 0).toFixed(2)
                  : "–"
              }
              suffix={`/ ${gradingSystem}`}
              barPercent={clampPercent(
                ((dashboard?.semester_gpa ?? 0) / maxScale) * 100,
              )}
              palette={palette}
            />

            {/* Achievements */}
            <MiniStatCard
              icon={
                <Star size={15} color={"#8B5CF6"} strokeWidth={2.5} />
              }
              accent={"#8B5CF6"}
              label="ACHIEVEMENTS"
              value={`${earnedAchievementCount}`}
              suffix={
                totalAchievementCount > 0
                  ? `/ ${totalAchievementCount}`
                  : undefined
              }
              barPercent={
                totalAchievementCount > 0
                  ? clampPercent(
                      (earnedAchievementCount / totalAchievementCount) * 100,
                    )
                  : 0
              }
              palette={palette}
            />
          </View>

          {/* ── 3. Current Semester Status ── */}
          <View style={S.sectionBlock}>
            <View style={S.sectionTitleRow}>
              <View
                style={[
                  S.sectionDot,
                  { backgroundColor: colors.primary },
                ]}
              />
              <Text
                style={[S.sectionTitle, { color: palette.textPrimary }]}
              >
                {t("currentSemesterStatus")}
              </Text>
              <View
                style={[
                  S.sectionLine,
                  { backgroundColor: palette.divider },
                ]}
              />
            </View>
            <SemesterStatusCard
              activeCourses={activeCourses}
              palette={palette}
              t={t as (key: string) => string}
            />
          </View>

          {/* ── 4. Academic Distinctions ── */}
          <View style={S.sectionBlock}>
            <View style={S.sectionTitleRow}>
              <View
                style={[
                  S.sectionDot,
                  { backgroundColor: "#8B5CF6" },
                ]}
              />
              <Text
                style={[S.sectionTitle, { color: palette.textPrimary }]}
              >
                {t("academicDistinctions")}
              </Text>
              <View
                style={[
                  S.sectionLine,
                  { backgroundColor: palette.divider },
                ]}
              />
              {earnedAchievementCount > 0 && (
                <View
                  style={[
                    S.distinctionsBadge,
                    { backgroundColor: "#8B5CF6" + "18" },
                  ]}
                >
                  <Text
                    style={[S.distinctionsBadgeText, { color: "#8B5CF6" }]}
                  >
                    {earnedAchievementCount}/{totalAchievementCount}
                  </Text>
                </View>
              )}
            </View>

            {/* Intro text */}
            <View style={S.distinctionsIntro}>
              <Text
                style={[
                  S.distinctionsIntroTitle,
                  { color: palette.textPrimary },
                ]}
              >
                {t("honorsAndMilestones")}
              </Text>
              <Text
                style={[
                  S.distinctionsIntroSub,
                  { color: palette.textPlaceholder },
                ]}
              >
                {earnedAchievementCount === 0
                  ? t("noAchievementsYet")
                  : `${earnedAchievementCount} ${t("of")} ${totalAchievementCount} ${t("earnedDistinctions")}`}
              </Text>
            </View>

            {/* Empty state or list */}
            {earnedAchievementCount === 0 ? (
              <DistinctionsEmptyState palette={palette} t={t as (k: string) => string} />
            ) : null}

            {achievementItems.length > 0 && (
              <View style={S.achievementList}>
                {achievementItems.map((item) => (
                  <AchievementRow key={item.id} item={item} palette={palette} />
                ))}
              </View>
            )}
          </View>
        </ScrollView>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────

const S = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    paddingHorizontal: isSmallScreen ? 16 : 20,
    paddingTop: isSmallScreen ? 14 : 18,
    paddingBottom: tabBarHeight.md + (isSmallScreen ? 48 : 56),
    gap: 16,
  },

  // ── Scrollable subtitle ──
  screenSubtitle: {
    fontSize: 12,
    fontWeight: fontWeight.medium,
    lineHeight: 17,
    letterSpacing: 0.1,
    marginBottom: 4,
  },
  profileBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    marginBottom: 4,
    flexWrap: "wrap",
    gap: 6,
  },
  metaBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 7,
  },
  metaBadgeText: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
  },
  bulletDivider: { fontSize: 11, opacity: 0.5 },
  subTitleText: {
    fontSize: 12,
    fontWeight: fontWeight.medium,
  },

  // ── GPA Hero Card ──
  heroCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    paddingBottom: 16,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  heroBand: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 42,
  },
  heroHeader: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 13,
    paddingBottom: 2,
  },
  heroTitleGroup: { gap: 0 },
  heroIconBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  heroLabel: {
    fontSize: 10,
    fontWeight: fontWeight.extrabold,
    letterSpacing: 1.0,
    textTransform: "uppercase",
  },
  // Status pill — more generous padding, softer radius
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  pillText: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.2,
  },
  heroValueRow: { marginTop: 4, marginBottom: 0 },
  heroValue: {
    fontSize: isSmallScreen ? 38 : 44,
    fontWeight: fontWeight.black,
    letterSpacing: -1.5,
    lineHeight: isSmallScreen ? 44 : 50,
  },
  heroScale: {
    fontSize: 15,
    fontWeight: fontWeight.semibold,
    alignSelf: "flex-end",
    marginBottom: isSmallScreen ? 4 : 6,
    marginLeft: 4,
  },
  heroBarWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  heroBarTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: "visible",
    position: "relative",
  },
  heroBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  heroBarTick: {
    position: "absolute",
    top: -3,
    width: 1,
    height: 11,
    backgroundColor: "rgba(255,255,255,0.5)",
    borderRadius: 1,
  },
  heroBarPct: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    minWidth: 32,
    textAlign: "right",
  },

  // ── 2×2 Stats Grid ──
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  miniCard: {
    flex: 1,
    minWidth: "45%",
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    paddingHorizontal: 13,
    paddingTop: 13,
    paddingBottom: 13,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  miniCardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 8,
  },
  miniCardIconBox: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    // Keep icon vertically centred with the first label line
    marginTop: 0,
    flexShrink: 0,
  },
  miniCardLabel: {
    fontSize: 9,
    fontWeight: fontWeight.extrabold,
    letterSpacing: 0.7,
    flex: 1,
    // Allow wrapping — never truncate
    lineHeight: 12,
    marginTop: 2,
  },
  miniCardValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 8,
    flexWrap: "wrap",
    gap: 3,
  },
  miniCardValue: {
    fontSize: isSmallScreen ? 21 : 23,
    fontWeight: fontWeight.black,
    letterSpacing: -0.6,
  },
  miniCardSuffix: {
    fontSize: 10,
    fontWeight: fontWeight.semibold,
    alignSelf: "flex-end",
    marginBottom: 1,
    opacity: 0.5,
  },
  miniCardBarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  miniCardTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  miniCardFill: {
    height: "100%",
    borderRadius: 3,
  },
  miniCardPct: {
    fontSize: 9,
    fontWeight: fontWeight.bold,
    minWidth: 26,
    textAlign: "right",
    opacity: 0.8,
  },

  // ── Section header row ──
  sectionBlock: { gap: 12 },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  sectionDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: fontWeight.extrabold,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  sectionLine: {
    flex: 1,
    height: 1,
    opacity: 0.7,
  },
  distinctionsBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    marginLeft: 6,
  },
  distinctionsBadgeText: {
    fontSize: 10,
    fontWeight: fontWeight.extrabold,
    letterSpacing: 0.2,
  },

  // ── Semester Status Card ──
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderLeftWidth: 3,
    overflow: "hidden",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  sectionCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 13,
    paddingBottom: 10,
    gap: 9,
  },
  sectionCardIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionCardTitle: {
    fontSize: 12,
    fontWeight: fontWeight.bold,
    flex: 1,
    letterSpacing: 0.1,
  },
  sectionBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 20,
  },
  sectionBadgeText: {
    fontSize: 11,
    fontWeight: fontWeight.extrabold,
  },
  sectionDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 14,
    marginBottom: 10,
  },
  sectionEmptyWrap: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 3,
  },
  sectionEmptyText: {
    fontSize: 12,
    fontWeight: fontWeight.semibold,
    lineHeight: 17,
  },
  sectionEmptySub: {
    fontSize: 11,
    fontWeight: fontWeight.medium,
    lineHeight: 16,
    opacity: 0.8,
  },
  semesterBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  semesterMainRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    marginBottom: 3,
  },
  semesterCount: {
    fontSize: isSmallScreen ? 24 : 28,
    fontWeight: fontWeight.black,
    letterSpacing: -0.8,
  },
  semesterCountLabel: {
    fontSize: 12,
    fontWeight: fontWeight.semibold,
  },
  semesterCourseName: {
    fontSize: 11,
    fontWeight: fontWeight.medium,
    lineHeight: 16,
    opacity: 0.7,
  },

  // ── Error card ──
  errorCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  retryText: {
    fontSize: 12,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },

  // ── Distinctions ──
  distinctionsIntro: { gap: 3 },
  distinctionsIntroTitle: {
    fontSize: 13,
    fontWeight: fontWeight.bold,
  },
  distinctionsIntroSub: {
    fontSize: 11,
    fontWeight: fontWeight.medium,
    lineHeight: 16,
    opacity: 0.85,
  },

  // ── Empty State Card ──
  emptyStateCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 8,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  emptyStateIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  emptyStateBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  emptyStateBullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  emptyStateBadgeText: {
    fontSize: 9,
    fontWeight: fontWeight.extrabold,
    letterSpacing: 0.8,
  },
  emptyStateTitle: {
    fontSize: 14,
    fontWeight: fontWeight.extrabold,
    textAlign: "center",
    letterSpacing: -0.3,
    marginTop: 2,
  },
  emptyStateBody: {
    fontSize: 12,
    fontWeight: fontWeight.medium,
    lineHeight: 18,
    textAlign: "center",
    opacity: 0.75,
  },

  // ── Achievement list ──
  achievementList: { gap: 9 },
  achievementCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderLeftWidth: 3,
    padding: 14,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  achievementTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  achievementCopy: { flex: 1 },
  achievementMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 5,
  },
  achievementBullet: { width: 5, height: 5, borderRadius: 2.5 },
  achievementLabel: {
    fontSize: 9,
    fontWeight: fontWeight.extrabold,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  achievementTitle: {
    fontSize: 13,
    fontWeight: fontWeight.extrabold,
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  achievementDescription: {
    fontSize: 11,
    fontWeight: fontWeight.medium,
    lineHeight: 16,
    opacity: 0.75,
  },
  achievementStatusWrap: { alignItems: "flex-end" },
  achievementStatus: {
    fontSize: 9,
    fontWeight: fontWeight.extrabold,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  achievementStatusText: {
    marginTop: 3,
    fontSize: 10,
    fontWeight: fontWeight.semibold,
    opacity: 0.7,
  },
  achievementProgressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 11,
  },
  achievementTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  achievementFill: { height: "100%", borderRadius: 3 },
  achievementPercent: {
    minWidth: 28,
    fontSize: 9.5,
    fontWeight: fontWeight.bold,
    textAlign: "right",
    opacity: 0.8,
  },
});

