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
import { useRouter } from "expo-router";
import {
  GraduationCap,
  BookOpen,
  Trophy,
  Calendar,
  LayoutGrid,
  ArrowRight,
} from "lucide-react-native";
import { useStore, useThemeColors, useAppLocale } from "../lib/store";
import { calculateCumulativeGPA } from "../lib/theme";
import { ScreenHeader } from "../components/ScreenHeader";
import {
  borderRadius,
  colors,
  fontWeight,
  isSmallScreen,
  shadows,
  tabBarHeight,
} from "../lib/constants";

function clampPercent(value: number) {
  if (Number.isNaN(value) || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(value, 100));
}

function StatCard({
  icon,
  iconBg,
  iconColor,
  label,
  value,
  suffix,
  barPercent,
  barColor,
  palette,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  suffix?: string;
  barPercent: number;
  barColor: string;
  palette: OverviewPalette;
}) {
  return (
    <View
      style={[
        S.statCard,
        {
          backgroundColor: palette.surface,
          borderColor: palette.borderSubtle,
          shadowOpacity: palette.shadowOpacity,
        },
      ]}
    >
      <View style={S.statCardTopRow}>
        <View style={S.statMainInfo}>
          <Text style={[S.statLabel, { color: palette.textPlaceholder }]}>
            {label}
          </Text>
          <View style={S.statValueRow}>
            <Text style={[S.statValue, { color: iconColor }]}>{value}</Text>
            {suffix ? (
              <Text style={[S.statSuffix, { color: palette.textPlaceholder }]}>
                {suffix}
              </Text>
            ) : null}
          </View>
        </View>
        <View style={[S.statIconBox, { backgroundColor: iconBg }]}>{icon}</View>
      </View>

      <View style={S.progressContainer}>
        <View style={[S.statTrack, { backgroundColor: palette.surfaceAlt }]}>
          <View
            style={[
              S.statFill,
              {
                width: `${clampPercent(barPercent)}%` as `${number}%`,
                backgroundColor: barColor,
              },
            ]}
          />
        </View>
        <Text style={[S.progressPercentText, { color: barColor }]}>
          {Math.round(clampPercent(barPercent))}%
        </Text>
      </View>
    </View>
  );
}

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

export default function OverviewScreen() {
  const router = useRouter();
  const store = useStore();
  const theme = useStore((state) => state.theme);
  const themeColors = useThemeColors();
  const { t, isRTL } = useAppLocale();
  const isDark = theme === "dark";
  const palette: OverviewPalette = {
    background: themeColors.background,
    surface: isDark ? "#111827" : "#FFFFFF",
    surfaceAlt: isDark ? "#1F2937" : "#F1F5F9",
    borderSubtle: isDark ? "rgba(148,163,184,0.18)" : "rgba(0,0,0,0.04)",
    divider: isDark ? "rgba(148,163,184,0.18)" : "rgba(0,0,0,0.04)",
    textPrimary: themeColors.foreground,
    textSecondary: isDark ? "#CBD5E1" : colors.text.secondary,
    textMuted: themeColors.mutedForeground,
    textPlaceholder: isDark ? "#8FA0B8" : colors.text.placeholder,
    badgeBg: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)",
    shadowOpacity: isDark ? 0.08 : 0.015,
  };

  const stats = useMemo(() => {
    const gradingSystem = store.profile?.gradingSystem || "4.0";
    return calculateCumulativeGPA(store.courses, gradingSystem);
  }, [store.courses, store.profile?.gradingSystem]);

  const profileName = store.profile?.fullName ?? "Academic Student";
  const profileMajor = store.profile?.major ?? "Academic Program";

  const totalGoalCredits = 128;
  const earnedCredits = stats.completedCredits;
  const remainingCredits = Math.max(totalGoalCredits - earnedCredits, 0);

  const maxScale = store.profile?.gradingSystem === "5.0" ? 5.0 : 4.0;
  const gpa = parseFloat(stats.gpa || "0");
  const gpaPercent = clampPercent((gpa / maxScale) * 100);

  const creditPercent = clampPercent((earnedCredits / totalGoalCredits) * 100);

  const currentYear = new Date().getFullYear();
  const creditsPerYear = 30;
  const estimatedGradYear =
    currentYear + Math.max(0, Math.ceil(remainingCredits / creditsPerYear));

  const activeCourses = store.courses.filter((c) => c.status === "in-progress");
  const completedCredits = stats.completedCredits;
  const completedWithGrade = store.courses.filter(
    (c) => c.status === "completed" && !!c.grade,
  );
  const hasFirstGrade = completedWithGrade.length > 0;
  const allAs =
    completedWithGrade.length > 0 &&
    completedWithGrade.every((c) =>
      String(c.grade).toUpperCase().startsWith("A"),
    );

  const achievementItems = useMemo<AchievementItem[]>(
    () =>
      [
        {
          id: "deans_list",
          label: t("achDeansListLabel"),
          title: t("achDeansList"),
          description: t("achDeansListDesc"),
          accent: "#8B5CF6",
          percent: (gpa / 3.6) * 100,
          progressText: `${Number.isFinite(gpa) ? gpa.toFixed(2) : "0.00"} / 3.60`,
          earned: gpa >= 3.6,
        },
        {
          id: "halfway_there",
          label: t("achHalfwayLabel"),
          title: t("achHalfway"),
          description: t("achHalfwayDesc"),
          accent: colors.primary,
          percent: (completedCredits / 60) * 100,
          progressText: `${completedCredits} / 60 ${t("achCredits")}`,
          earned: completedCredits >= 60,
        },
        {
          id: "first_steps",
          label: t("achFirstStepsLabel"),
          title: t("achFirstSteps"),
          description: t("achFirstStepsDesc"),
          accent: colors.success,
          percent: hasFirstGrade ? 100 : 0,
          progressText: `${hasFirstGrade ? 1 : 0} / 1 ${t("achGradeLogged")}`,
          earned: hasFirstGrade,
        },
        {
          id: "flawless_term",
          label: t("achFlawlessLabel"),
          title: t("achFlawless"),
          description: t("achFlawlessDesc"),
          accent: "#F97316",
          percent: allAs ? 100 : 0,
          progressText: `${allAs ? 1 : 0} / 1 ${t("achTermAchieved")}`,
          earned: allAs,
        },
        {
          id: "almost_there",
          label: t("achAlmostLabel"),
          title: t("achAlmost"),
          description: t("achAlmostDesc"),
          accent: "#0F766E",
          percent: (completedCredits / 100) * 100,
          progressText: `${completedCredits} / 100 ${t("achCredits")}`,
          earned: completedCredits >= 100,
        },
        {
          id: "curriculum_builder",
          label: t("achCurriculumLabel"),
          title: t("achCurriculum"),
          description: t("achCurriculumDesc"),
          accent: "#475569",
          percent: (store.courses.length / 5) * 100,
          progressText: `${Math.min(store.courses.length, 5)} / 5 ${t("achCourses")}`,
          earned: store.courses.length >= 5,
        },
      ].map((item) => ({
        ...item,
        percent: clampPercent(item.percent),
      })),
    [allAs, completedCredits, gpa, hasFirstGrade, store.courses.length, t],
  );

  const earnedAchievementCount = achievementItems.filter(
    (item) => item.earned,
  ).length;

  return (
    <SafeAreaView style={[S.root, { backgroundColor: palette.background }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={palette.background}
      />
      <ScreenHeader showLogo />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={S.scroll}
      >
        {/* Command Center Header */}
        <View style={S.headerBlock}>
          <Text style={[S.kicker, { color: palette.textPlaceholder }]}>
            {t("commandCenter")}
          </Text>
          <Text style={[S.title, { color: palette.textPrimary }]}>
            {t("academicOverviewTitle")}
          </Text>
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
        </View>

        {/* Stats Stack */}
        <View style={S.statsStack}>
          <StatCard
            icon={
              <GraduationCap
                size={18}
                color={colors.primary}
                strokeWidth={2.5}
              />
            }
            iconBg={colors.primary + "0F"}
            iconColor={palette.textPrimary}
            label={t("cumulativeGpa")}
            value={Number.isFinite(gpa) ? gpa.toFixed(2) : "0.00"}
            suffix={`/ ${store.profile?.gradingSystem || "4.0"}`}
            barPercent={gpaPercent}
            barColor={colors.primary}
            palette={palette}
          />

          <StatCard
            icon={
              <BookOpen size={18} color={colors.success} strokeWidth={2.5} />
            }
            iconBg={colors.success + "0F"}
            iconColor={colors.success}
            label={t("creditCompletion")}
            value={`${earnedCredits}`}
            suffix={`/ ${totalGoalCredits} ${t("hours").toUpperCase()}`}
            barPercent={creditPercent}
            barColor={colors.success}
            palette={palette}
          />

          <StatCard
            icon={<Trophy size={18} color={"#8B5CF6"} strokeWidth={2.5} />}
            iconBg={"#8B5CF6" + "0F"}
            iconColor={palette.textPrimary}
            label={t("graduation")}
            value={`${estimatedGradYear}`}
            suffix="EST."
            barPercent={creditPercent}
            barColor={"#8B5CF6"}
            palette={palette}
          />
        </View>

        {/* Current Semester Panel */}
        <View style={S.section}>
          <View style={S.sectionTitleRow}>
            <View style={S.sectionDot} />
            <Text style={[S.sectionTitle, { color: palette.textPrimary }]}>
              {t("currentSemesterStatus")}
            </Text>
            <View
              style={[S.sectionLine, { backgroundColor: palette.divider }]}
            />
          </View>

          <View
            style={[
              S.sectionCard,
              {
                backgroundColor: palette.surface,
                borderColor: palette.borderSubtle,
                borderLeftColor: colors.primary,
                shadowOpacity: palette.shadowOpacity,
              },
            ]}
          >
            <View
              style={[
                S.sectionIconBox,
                { backgroundColor: palette.surfaceAlt },
              ]}
            >
              <Calendar size={16} color={colors.primary} strokeWidth={2.5} />
            </View>
            {activeCourses.length === 0 ? (
              <View style={S.sectionTextWrap}>
                <Text
                  style={[S.sectionTextMuted, { color: palette.textMuted }]}
                >
                  {t("noActiveSemCourses")}
                </Text>
                <Text
                  style={[S.sectionSubText, { color: palette.textPlaceholder }]}
                >
                  {t("updateCurriculumSync")}
                </Text>
              </View>
            ) : (
              <View style={S.sectionTextWrap}>
                <Text
                  style={[S.sectionTextStrong, { color: palette.textPrimary }]}
                >
                  {activeCourses.length}{" "}
                  {activeCourses.length === 1
                    ? t("enrolledCourse")
                    : t("enrolledCourses")}
                </Text>
                <Text
                  style={[S.sectionSubText, { color: palette.textPlaceholder }]}
                  numberOfLines={1}
                >
                  {t("currentCourseLabel")}:{" "}
                  {activeCourses[0]?.name || t("inProgressTerm")}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Prerequisite Graph Navigator */}
        <View style={S.section}>
          <View style={S.sectionTitleRow}>
            <View style={[S.sectionDot, { backgroundColor: "#8B5CF6" }]} />
            <Text style={[S.sectionTitle, { color: palette.textPrimary }]}>
              {t("prerequisiteFlowMapping")}
            </Text>
            <View
              style={[S.sectionLine, { backgroundColor: palette.divider }]}
            />
          </View>

          <View
            style={[
              S.graphCard,
              {
                backgroundColor: palette.surface,
                borderColor: palette.borderSubtle,
                borderLeftColor: "#8B5CF6",
                shadowOpacity: palette.shadowOpacity,
              },
            ]}
          >
            <View style={S.graphTop}>
              <View
                style={[S.graphIconBox, { backgroundColor: "#8B5CF6" + "0A" }]}
              >
                <LayoutGrid size={16} color={"#8B5CF6"} strokeWidth={2.5} />
              </View>
              <View style={S.graphTextWrap}>
                <Text
                  style={[S.graphCardTitle, { color: palette.textPrimary }]}
                >
                  {t("visualDependencyGraph")}
                </Text>
                <Text
                  style={[S.sectionSubText, { color: palette.textPlaceholder }]}
                >
                  {store.courses.length === 0
                    ? t("initCurriculumTree")
                    : t("trackCourseRequirements")}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[S.graphLinkRow, { borderTopColor: palette.divider }]}
              activeOpacity={0.8}
              onPress={() => router.push("/(tabs)/curriculum")}
            >
              <Text style={S.graphLink}>{t("exploreMatrixMap")}</Text>
              <ArrowRight size={14} color={colors.primary} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Academic Distinctions */}
        <View style={S.section}>
          <View style={S.sectionTitleRow}>
            <View style={[S.sectionDot, { backgroundColor: colors.primary }]} />
            <Text style={[S.sectionTitle, { color: palette.textPrimary }]}>
              {t("academicDistinctions")}
            </Text>
            <View
              style={[S.sectionLine, { backgroundColor: palette.divider }]}
            />
          </View>

          <View style={S.achievementIntro}>
            <Text
              style={[S.achievementIntroTitle, { color: palette.textPrimary }]}
            >
              {t("honorsAndMilestones")}
            </Text>
            <Text
              style={[
                S.achievementIntroText,
                { color: palette.textPlaceholder },
              ]}
            >
              {earnedAchievementCount === 0
                ? t("noAchievementsYet")
                : `${earnedAchievementCount} ${t("of")} ${achievementItems.length} ${t("earnedDistinctions")}`}
            </Text>
          </View>

          {earnedAchievementCount === 0 ? (
            <View
              style={[
                S.achievementEmptyState,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.borderSubtle,
                  borderLeftColor: colors.primary,
                },
              ]}
            >
              <View style={S.achievementMetaRow}>
                <View
                  style={[
                    S.achievementBullet,
                    { backgroundColor: colors.primary },
                  ]}
                />
                <Text
                  style={[
                    S.achievementLabel,
                    { color: palette.textPlaceholder },
                  ]}
                >
                  {t("readyForFirstMilestone")}
                </Text>
              </View>
              <Text
                style={[
                  S.achievementEmptyTitle,
                  { color: palette.textPrimary },
                ]}
              >
                {t("buildFirstDistinction")}
              </Text>
              <Text
                style={[
                  S.achievementEmptyText,
                  { color: palette.textPlaceholder },
                ]}
              >
                {t("addGradedCourses")}
              </Text>
            </View>
          ) : null}

          <View style={S.achievementList}>
            {achievementItems.map((item) => (
              <AchievementRow key={item.id} item={item} palette={palette} />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scroll: {
    paddingHorizontal: isSmallScreen ? 16 : 20,
    paddingTop: isSmallScreen ? 16 : 20,
    paddingBottom: tabBarHeight.md + (isSmallScreen ? 72 : 80),
  },

  // Optimized Header Block
  headerBlock: {
    marginBottom: 18,
  },
  kicker: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.text.placeholder,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  title: {
    fontSize: isSmallScreen ? 24 : 26,
    fontWeight: fontWeight.extrabold,
    color: colors.text.primary,
    letterSpacing: -0.6,
  },
  profileBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    flexWrap: "wrap",
    gap: 6,
  },
  metaBadge: {
    backgroundColor: "rgba(0,0,0,0.04)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  metaBadgeText: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  bulletDivider: {
    fontSize: 12,
    color: colors.text.placeholder,
  },
  subTitleText: {
    fontSize: 12,
    fontWeight: fontWeight.semibold,
    color: colors.text.muted,
  },

  // High-End Stats Cards
  statsStack: {
    gap: 12,
    marginTop: 4,
  },
  statCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
    padding: 16,
    ...shadows.sm,
    shadowOpacity: 0.015,
  },
  statCardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  statMainInfo: {
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.text.placeholder,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  statValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  statValue: {
    fontSize: 24,
    fontWeight: fontWeight.black,
    letterSpacing: -0.8,
  },
  statSuffix: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: colors.text.placeholder,
    marginLeft: 4,
  },
  statIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 10,
  },
  statTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#F1F5F9",
    overflow: "hidden",
  },
  statFill: {
    height: "100%",
    borderRadius: 2,
  },
  progressPercentText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    minWidth: 26,
    textAlign: "right",
  },

  // Structured Sections with Dynamic Side Anchors
  section: {
    marginTop: 22,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: fontWeight.extrabold,
    color: colors.text.primary,
    letterSpacing: -0.1,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(0,0,0,0.04)",
    marginLeft: 10,
  },
  sectionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
    borderLeftWidth: 3,
    padding: 14,
    ...shadows.sm,
    shadowOpacity: 0.015,
  },
  sectionIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.background.tertiary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  sectionTextWrap: {
    flex: 1,
  },
  sectionTextMuted: {
    fontSize: 12,
    fontWeight: fontWeight.semibold,
    color: colors.text.muted,
  },
  sectionTextStrong: {
    fontSize: 13,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: 1,
  },
  sectionSubText: {
    fontSize: 11,
    fontWeight: fontWeight.medium,
    color: colors.text.placeholder,
  },

  // Enhanced Graph Card
  graphCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
    borderLeftWidth: 3,
    padding: 14,
    ...shadows.sm,
    shadowOpacity: 0.015,
  },
  graphTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  graphIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  graphCardTitle: {
    fontSize: 13,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: 1,
  },
  graphTextWrap: {
    flex: 1,
  },
  graphLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F8FAFC",
  },
  graphLink: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    marginRight: 4,
  },

  achievementIntro: {
    marginBottom: 10,
  },
  achievementIntroTitle: {
    fontSize: 13,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  achievementIntroText: {
    fontSize: 11,
    fontWeight: fontWeight.medium,
    color: colors.text.placeholder,
    lineHeight: 16,
  },
  achievementList: {
    gap: 10,
  },
  achievementCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
    borderLeftWidth: 3,
    padding: 14,
    ...shadows.sm,
    shadowOpacity: 0.015,
  },
  achievementTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  achievementCopy: {
    flex: 1,
  },
  achievementMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 6,
  },
  achievementBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  achievementLabel: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.text.placeholder,
    letterSpacing: 0.8,
  },
  achievementTitle: {
    fontSize: 13,
    fontWeight: fontWeight.extrabold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  achievementDescription: {
    fontSize: 11,
    fontWeight: fontWeight.medium,
    color: colors.text.muted,
    lineHeight: 16,
  },
  achievementStatusWrap: {
    alignItems: "flex-end",
  },
  achievementStatus: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.8,
  },
  achievementStatusText: {
    marginTop: 3,
    fontSize: 10.5,
    fontWeight: fontWeight.semibold,
    color: colors.text.placeholder,
  },
  achievementProgressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
  },
  achievementTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#F1F5F9",
    overflow: "hidden",
  },
  achievementFill: {
    height: "100%",
    borderRadius: 2,
  },
  achievementPercent: {
    minWidth: 28,
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.text.secondary,
    textAlign: "right",
  },
  achievementEmptyState: {
    backgroundColor: "#FFFFFF",
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
    borderLeftWidth: 3,
    padding: 14,
    marginBottom: 10,
  },
  achievementEmptyTitle: {
    fontSize: 13,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  achievementEmptyText: {
    fontSize: 11,
    fontWeight: fontWeight.medium,
    color: colors.text.placeholder,
    lineHeight: 16,
  },
});
