import React, { useCallback, useMemo, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  AlertCircle,
  CheckCircle,
  BookOpen,
  Layers,
  Lightbulb,
  TrendingUp,
} from "lucide-react-native";
import { useAppLocale, useStore, useThemeColors } from "../../lib/store";
import { ScreenHeader } from "../../components/ScreenHeader";
import { Loading } from "../../components/Loading";
import {
  colors,
  fontWeight,
  isSmallScreen,
  shadows,
  tabBarHeight,
} from "../../lib/constants";
import type { StudyPlanResponse, WorkloadResponse } from "../../lib/types";
import { getStudyPlan, getStudyPlanWorkload } from "../../services/academic";

// ─────────────────────────────────────────────
// Palette type
// ─────────────────────────────────────────────
type PlannerPalette = {
  background: string;
  surface: string;
  surfaceAlt: string;
  borderSubtle: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textPlaceholder: string;
  primary: string;
  success: string;
  warning: string;
  divider: string;
  shadowOpacity: number;
};

// ─────────────────────────────────────────────
// WorkloadHeroCard
// ─────────────────────────────────────────────
function WorkloadHeroCard({
  activeCredits,
  workload,
  loading,
  studyPlan,
  error,
  onRetry,
  palette,
  isRTL,
  theme,
}: {
  activeCredits: number;
  workload: { label: string; desc: string; color: string; bg: string; progress: number };
  loading: boolean;
  studyPlan: StudyPlanResponse | null;
  error: string | null;
  onRetry: () => void;
  palette: PlannerPalette;
  isRTL: boolean;
  theme: string;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rowDir = isRTL ? "row-reverse" : "row";
  const textAlign = isRTL ? ("right" as const) : ("left" as const);

  const pct = Math.min(1, Math.max(0, workload.progress));

  return (
    <Animated.View
      style={[
        S.heroCard,
        {
          backgroundColor: palette.surface,
          borderColor: palette.borderSubtle,
          shadowOpacity: palette.shadowOpacity,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {/* Accent band */}
      <View style={[S.heroAccentBand, { backgroundColor: workload.color + "12" }]} />

      {/* Header row */}
      <View style={[S.heroHeader, { flexDirection: rowDir }]}>
        <View style={[S.heroHeaderLeft, { flexDirection: rowDir, alignItems: "center" }]}>
          <View style={[S.heroIconBox, { backgroundColor: workload.color + "18" }]}>
            <Layers size={15} color={workload.color} strokeWidth={2.5} />
          </View>
          <Text style={[S.heroSectionLabel, { color: workload.color, marginLeft: isRTL ? 0 : 8, marginRight: isRTL ? 8 : 0 }]}>
            CURRENT WORKLOAD
          </Text>
        </View>
        <View style={[S.workloadBadge, { backgroundColor: workload.bg }]}>
          <Text style={[S.workloadBadgeText, { color: workload.color }]}>
            {workload.label}
          </Text>
        </View>
      </View>

      {loading && !studyPlan ? (
        <Loading theme={theme as "light" | "dark"} size="large" />
      ) : error && !studyPlan ? (
        <View style={S.emptyWrap}>
          <AlertCircle size={20} color={palette.textMuted} />
          <Text style={[S.emptyText, { color: palette.textMuted, textAlign, marginTop: 8 }]}>{error}</Text>
          <TouchableOpacity activeOpacity={0.8} onPress={onRetry}>
            <Text style={[S.retryText, { color: palette.primary }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Large credit value */}
          <View style={[S.heroValueRow, { flexDirection: rowDir, alignItems: "baseline" }]}>
            <Text style={[S.heroValue, { color: palette.textPrimary }]}>{activeCredits}</Text>
            <Text style={[S.heroValueUnit, { color: palette.textPlaceholder, marginLeft: isRTL ? 0 : 6, marginRight: isRTL ? 6 : 0 }]}>
              credits
            </Text>
          </View>

          {/* Description */}
          <Text style={[S.heroDesc, { color: palette.textSecondary, textAlign }]}>
            {workload.desc}
          </Text>

          {/* Progress bar */}
          <View style={S.heroBarWrap}>
            <View style={[S.heroBarTrack, { backgroundColor: workload.color + "1A" }]}>
              <View style={[S.heroBarFill, { width: `${pct * 100}%` as any, backgroundColor: workload.color }]} />
              {[0.33, 0.66].map((t) => (
                <View key={t} style={[S.heroBarTick, { left: `${t * 100}%` as any }]} />
              ))}
            </View>
            <Text style={[S.heroBarPct, { color: workload.color }]}>
              {Math.round(pct * 100)}%
            </Text>
          </View>

          {/* Zone labels */}
          <View style={[S.zoneLabelRow, { flexDirection: rowDir }]}>
            <Text style={[S.zoneLabelText, { color: activeCredits > 0 && activeCredits < 12 ? palette.primary : palette.textPlaceholder }]}>
              Light (&lt;12)
            </Text>
            <Text style={[S.zoneLabelText, { color: activeCredits >= 12 && activeCredits <= 18 ? palette.success : palette.textPlaceholder, textAlign: "center" }]}>
              Optimal (12–18)
            </Text>
            <Text style={[S.zoneLabelText, { color: activeCredits > 18 ? palette.warning : palette.textPlaceholder, textAlign: isRTL ? "left" : "right" }]}>
              Heavy (18+)
            </Text>
          </View>
        </>
      )}
    </Animated.View>
  );
}

// ─────────────────────────────────────────────
// EnrolledCoursesCard
// ─────────────────────────────────────────────
type CourseItem = { id: string; code: string; name: string; credits: number };

function CourseChip({
  course,
  palette,
  isRTL,
}: {
  course: CourseItem;
  palette: PlannerPalette;
  isRTL: boolean;
}) {
  const rowDir = isRTL ? "row-reverse" : "row";
  const textAlign = isRTL ? ("right" as const) : ("left" as const);
  return (
    <View style={[S.courseChip, { backgroundColor: palette.surfaceAlt, borderColor: palette.borderSubtle, flexDirection: rowDir }]}>
      <View style={[S.courseChipIcon, { backgroundColor: palette.primary + "14" }]}>
        <BookOpen size={12} color={palette.primary} strokeWidth={2.5} />
      </View>
      <View style={[S.courseChipBody, { marginLeft: isRTL ? 0 : 10, marginRight: isRTL ? 10 : 0, flex: 1 }]}>
        <Text style={[S.courseChipCode, { color: palette.textPrimary, textAlign }]} numberOfLines={1}>
          {course.code}
        </Text>
        <Text style={[S.courseChipName, { color: palette.textMuted, textAlign }]} numberOfLines={1}>
          {course.name}
        </Text>
      </View>
      <View style={[S.courseChipCreditBadge, { backgroundColor: palette.primary + "14" }]}>
        <Text style={[S.courseChipCreditText, { color: palette.primary }]}>
          {course.credits} CR
        </Text>
      </View>
    </View>
  );
}

function EnrolledCoursesCard({
  activeCourses,
  loading,
  studyPlan,
  palette,
  isRTL,
  theme,
  t,
}: {
  activeCourses: CourseItem[];
  loading: boolean;
  studyPlan: StudyPlanResponse | null;
  palette: PlannerPalette;
  isRTL: boolean;
  theme: string;
  t: (key: string) => string;
}) {
  const textAlign = isRTL ? ("right" as const) : ("left" as const);
  const rowDir = isRTL ? "row-reverse" : "row";

  return (
    <View style={[S.sectionCard, { backgroundColor: palette.surface, borderColor: palette.borderSubtle, shadowOpacity: palette.shadowOpacity }]}>
      {/* Section header */}
      <View style={[S.sectionCardHeader, { flexDirection: rowDir }]}>
        <View style={[S.sectionCardIconBox, { backgroundColor: colors.success + "14" }]}>
          <BookOpen size={14} color={colors.success} strokeWidth={2.5} />
        </View>
        <Text style={[S.sectionCardTitle, { color: palette.textPrimary, marginLeft: isRTL ? 0 : 8, marginRight: isRTL ? 8 : 0 }]}>
          {t("currentlyEnrolled")}
        </Text>
        {activeCourses.length > 0 && (
          <View style={[S.sectionBadge, { backgroundColor: colors.success + "14", marginLeft: isRTL ? 0 : "auto", marginRight: isRTL ? "auto" : 0 }]}>
            <Text style={[S.sectionBadgeText, { color: colors.success }]}>{activeCourses.length}</Text>
          </View>
        )}
      </View>

      {loading && !studyPlan ? (
        <Loading theme={theme as "light" | "dark"} />
      ) : activeCourses.length === 0 ? (
        <View style={S.emptyWrap}>
          <AlertCircle size={18} color={palette.textMuted} />
          <Text style={[S.emptyText, { color: palette.textMuted, textAlign, marginTop: 8 }]}>
            {t("noInProgressCourses")}
          </Text>
        </View>
      ) : (
        <View style={S.courseList}>
          {activeCourses.map((course) => (
            <CourseChip key={course.id} course={course} palette={palette} isRTL={isRTL} />
          ))}
        </View>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────
// PlannerInsightsCard
// ─────────────────────────────────────────────
function InsightRow({
  text,
  accent,
  palette,
  isRTL,
}: {
  text: string;
  accent: string;
  palette: PlannerPalette;
  isRTL: boolean;
}) {
  const rowDir = isRTL ? "row-reverse" : "row";
  const textAlign = isRTL ? ("right" as const) : ("left" as const);
  return (
    <View style={[S.insightRow, { flexDirection: rowDir }]}>
      <View style={[S.insightIconBox, { backgroundColor: accent + "16" }]}>
        <CheckCircle size={13} color={accent} strokeWidth={2.5} />
      </View>
      <Text style={[S.insightText, { color: palette.textSecondary, textAlign, marginLeft: isRTL ? 0 : 10, marginRight: isRTL ? 10 : 0 }]}>
        {text}
      </Text>
    </View>
  );
}

function PlannerInsightsCard({
  palette,
  isRTL,
  t,
}: {
  palette: PlannerPalette;
  isRTL: boolean;
  t: (key: string) => string;
}) {
  const rowDir = isRTL ? "row-reverse" : "row";

  return (
    <View style={[S.sectionCard, { backgroundColor: palette.surface, borderColor: palette.borderSubtle, shadowOpacity: palette.shadowOpacity }]}>
      {/* Section header */}
      <View style={[S.sectionCardHeader, { flexDirection: rowDir }]}>
        <View style={[S.sectionCardIconBox, { backgroundColor: "#F59E0B14" }]}>
          <Lightbulb size={14} color="#F59E0B" strokeWidth={2.5} />
        </View>
        <Text style={[S.sectionCardTitle, { color: palette.textPrimary, marginLeft: isRTL ? 0 : 8, marginRight: isRTL ? 8 : 0 }]}>
          {t("academicRecommendation")}
        </Text>
        <View style={[S.sectionBadge, { backgroundColor: "#F59E0B14", marginLeft: isRTL ? 0 : "auto", marginRight: isRTL ? "auto" : 0 }]}>
          <TrendingUp size={11} color="#F59E0B" strokeWidth={2.5} />
        </View>
      </View>

      {/* Divider */}
      <View style={[S.insightDivider, { backgroundColor: palette.borderSubtle }]} />

      {/* Insight rows */}
      <View style={S.insightList}>
        <InsightRow text={t("recBalanceCredits")} accent={palette.success} palette={palette} isRTL={isRTL} />
        <InsightRow text={t("recAvoidHeavyMix")} accent={palette.success} palette={palette} isRTL={isRTL} />
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
// Main Screen — ALL LOGIC UNCHANGED
// ─────────────────────────────────────────────
export default function SemesterPlannerScreen() {
  const theme = useStore((state) => state.theme);
  const currentSemester = useStore(
    (state) => state.backendUser?.current_semester ?? 1,
  );
  const themeColors = useThemeColors();
  const { t, isRTL } = useAppLocale();
  const [studyPlan, setStudyPlan] = useState<StudyPlanResponse | null>(null);
  const [workloadData, setWorkloadData] = useState<WorkloadResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isDark = theme === "dark";

  const palette: PlannerPalette = {
    background: themeColors.background,
    surface: isDark ? "#111827" : "#FFFFFF",
    surfaceAlt: isDark ? "#1F2937" : "#F8FAFC",
    borderSubtle: isDark ? "rgba(148,163,184,0.18)" : "#E2E8F0",
    textPrimary: themeColors.foreground,
    textSecondary: isDark ? "#CBD5E1" : "#334155",
    textMuted: isDark ? "#8FA0B8" : "#94A3B8",
    textPlaceholder: isDark ? "#6B7E99" : "#94A3B8",
    primary: colors.primary,
    success: colors.success,
    warning: colors.warning,
    divider: isDark ? "rgba(148,163,184,0.18)" : "#E2E8F0",
    shadowOpacity: isDark ? 0.08 : 0.03,
  };

  const textAlign = isRTL ? ("right" as const) : ("left" as const);

  // ── Data loading — UNCHANGED ──
  const loadStudyPlan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextStudyPlan, nextWorkload] = await Promise.all([
        getStudyPlan(),
        getStudyPlanWorkload(currentSemester),
      ]);
      setStudyPlan(nextStudyPlan);
      setWorkloadData(nextWorkload);
    } catch {
      setError("Unable to load study plan. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [currentSemester]);

  useFocusEffect(
    useCallback(() => {
      loadStudyPlan();
    }, [loadStudyPlan]),
  );

  // ── Derived values — UNCHANGED ──
  const activeCourses = useMemo(() => {
    return [...(studyPlan?.in_progress ?? [])]
      .sort((a, b) => {
        const aSemester = a.course.semester_recommended ?? 0;
        const bSemester = b.course.semester_recommended ?? 0;
        if (aSemester !== bSemester) return aSemester - bSemester;
        return (a.course.code ?? a.course.name).localeCompare(b.course.code ?? b.course.name);
      })
      .map((entry, index) => ({
        id: entry.course.id ?? entry.course.code ?? `${entry.course.name}-${index}`,
        code: entry.course.code ?? "--",
        name: entry.course.name,
        credits: entry.course.credit_hours ?? 0,
      }));
  }, [studyPlan?.in_progress]);

  const activeCredits = useMemo(() => {
    return (
      workloadData?.total_hours ??
      activeCourses.reduce((sum, course) => sum + course.credits, 0)
    );
  }, [activeCourses, workloadData?.total_hours]);

  const workloadTier = workloadData?.tier.toLowerCase();

  const workload = useMemo(() => {
    // Progress capped at 1.0; Heavy zone starts at 18 credits (max for bar = 24)
    const progress = Math.min(activeCredits / 24, 1);
    if (activeCredits === 0)
      return { label: t("emptyWorkload"), desc: t("noActiveCourses"), color: palette.textMuted, bg: isDark ? "#1F2937" : "#F1F5F9", progress: 0 };
    if (workloadTier === "light" || (!workloadTier && activeCredits < 12))
      return { label: t("lowWorkload"), desc: t("lowWorkloadDesc"), color: palette.primary, bg: isDark ? "rgba(30,117,255,0.16)" : "#E0F2FE", progress };
    if (workloadTier === "optimal" || (!workloadTier && activeCredits <= 18))
      return { label: t("balancedWorkload"), desc: t("balancedWorkloadDesc"), color: palette.success, bg: isDark ? "rgba(16,185,129,0.16)" : "#DCFCE7", progress };
    return { label: t("highWorkload"), desc: t("highWorkloadDesc"), color: palette.warning, bg: isDark ? "rgba(245,158,11,0.16)" : "#FEF3C7", progress };
  }, [activeCredits, isDark, palette.primary, palette.success, palette.textMuted, palette.warning, t, workloadTier]);

  return (
    <SafeAreaView style={[S.root, { backgroundColor: palette.background }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={palette.background}
      />
      <ScreenHeader
        showLogo
        pageTitle={t("navPlanner")}
        subtitle={t("headerSubtitlePlanner")}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={S.scroll}
      >
        {/* Subtitle */}
        <Text style={[S.screenSubtitle, { color: palette.textMuted, textAlign }]}>
          {t("headerSubtitlePlanner")}
        </Text>

        {/* 1 — Workload Hero Card */}
        <WorkloadHeroCard
          activeCredits={activeCredits}
          workload={workload}
          loading={loading}
          studyPlan={studyPlan}
          error={error}
          onRetry={loadStudyPlan}
          palette={palette}
          isRTL={isRTL}
          theme={theme}
        />

        {/* 2 — Currently Enrolled */}
        <EnrolledCoursesCard
          activeCourses={activeCourses}
          loading={loading}
          studyPlan={studyPlan}
          palette={palette}
          isRTL={isRTL}
          theme={theme}
          t={t as (key: string) => string}
        />

        {/* 3 — Planner Insights */}
        <PlannerInsightsCard
          palette={palette}
          isRTL={isRTL}
          t={t as (key: string) => string}
        />
      </ScrollView>
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
    paddingTop: isSmallScreen ? 16 : 20,
    paddingBottom: tabBarHeight.md + (isSmallScreen ? 32 : 40),
    gap: 14,
  },

  // ── Scrollable subtitle ──
  screenSubtitle: {
    fontSize: 12,
    fontWeight: fontWeight.medium,
    lineHeight: 17,
    letterSpacing: 0.1,
    marginBottom: 4,
  },

  // ── Workload hero card ──
  heroCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    paddingHorizontal: isSmallScreen ? 16 : 18,
    paddingTop: 14,
    paddingBottom: 16,
    ...shadows.md,
  },
  heroAccentBand: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    height: 52,
  },
  heroHeader: {
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  heroHeaderLeft: { gap: 0 },
  heroIconBox: {
    width: 28, height: 28,
    borderRadius: 9,
    alignItems: "center", justifyContent: "center",
  },
  heroSectionLabel: {
    fontSize: 10,
    fontWeight: fontWeight.extrabold,
    letterSpacing: 0.8,
  },
  workloadBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  workloadBadgeText: {
    fontSize: 11,
    fontWeight: fontWeight.extrabold,
    letterSpacing: 0.1,
  },
  heroValueRow: { marginBottom: 6 },
  heroValue: {
    fontSize: isSmallScreen ? 48 : 56,
    fontWeight: fontWeight.black,
    letterSpacing: -2,
    lineHeight: isSmallScreen ? 54 : 62,
  },
  heroValueUnit: {
    fontSize: 16,
    fontWeight: fontWeight.semibold,
    alignSelf: "flex-end",
    marginBottom: isSmallScreen ? 8 : 10,
  },
  heroDesc: {
    fontSize: 13,
    fontWeight: fontWeight.medium,
    lineHeight: 18,
    marginBottom: 16,
  },
  heroBarWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  heroBarTrack: {
    flex: 1,
    height: 7,
    borderRadius: 4,
    overflow: "visible",
    position: "relative",
  },
  heroBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  heroBarTick: {
    position: "absolute",
    top: -3,
    width: 1.5,
    height: 13,
    backgroundColor: "rgba(255,255,255,0.55)",
    borderRadius: 1,
  },
  heroBarPct: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    minWidth: 34,
    textAlign: "right",
  },
  zoneLabelRow: {
    justifyContent: "space-between",
  },
  zoneLabelText: {
    fontSize: 9,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0.1,
  },

  // ── Generic section card ──
  sectionCard: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: isSmallScreen ? 14 : 16,
    paddingVertical: isSmallScreen ? 14 : 16,
    ...shadows.sm,
  },
  sectionCardHeader: {
    alignItems: "center",
    marginBottom: 14,
  },
  sectionCardIconBox: {
    width: 28, height: 28,
    borderRadius: 9,
    alignItems: "center", justifyContent: "center",
  },
  sectionCardTitle: {
    fontSize: 13,
    fontWeight: fontWeight.extrabold,
    flex: 1,
  },
  sectionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionBadgeText: {
    fontSize: 11,
    fontWeight: fontWeight.extrabold,
  },

  // ── Course chips ──
  courseList: { gap: 10 },
  courseChip: {
    borderRadius: 13,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  courseChipIcon: {
    width: 28, height: 28,
    borderRadius: 8,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  courseChipBody: {},
  courseChipCode: {
    fontSize: 12,
    fontWeight: fontWeight.extrabold,
    marginBottom: 1,
  },
  courseChipName: {
    fontSize: 11,
    fontWeight: fontWeight.medium,
  },
  courseChipCreditBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
    flexShrink: 0,
  },
  courseChipCreditText: {
    fontSize: 10,
    fontWeight: fontWeight.extrabold,
    letterSpacing: 0.3,
  },

  // ── Insights ──
  insightDivider: {
    height: 1,
    marginBottom: 14,
  },
  insightList: { gap: 10 },
  insightRow: {
    alignItems: "flex-start",
  },
  insightIconBox: {
    width: 26, height: 26,
    borderRadius: 8,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  insightText: {
    fontSize: 13,
    fontWeight: fontWeight.medium,
    lineHeight: 18,
    flex: 1,
  },

  // ── Empty / error state ──
  emptyWrap: {
    alignItems: "center",
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 12,
    fontWeight: fontWeight.medium,
    textAlign: "center",
    paddingHorizontal: 8,
    lineHeight: 18,
  },
  retryText: {
    fontSize: 12,
    fontWeight: fontWeight.bold,
    marginTop: 10,
  },
});
