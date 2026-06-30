import React, { useMemo, useRef, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  PanResponder,
  Pressable,
} from "react-native";
import Svg, { Line } from "react-native-svg";
import { GraduationCap, Target, Package } from "lucide-react-native";
import { useAppLocale, useStore, useThemeColors } from "../lib/store";
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

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function CardBackgroundPattern({ color }: { color: string }) {
  return (
    <View style={S.patternAbsolute} pointerEvents="none">
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <Line
          x1="0"
          y1="20"
          x2="100"
          y2="20"
          stroke={color}
          strokeWidth="0.4"
          opacity="0.12"
        />
        <Line
          x1="0"
          y1="50"
          x2="100"
          y2="50"
          stroke={color}
          strokeWidth="0.4"
          opacity="0.08"
        />
        <Line
          x1="0"
          y1="80"
          x2="100"
          y2="80"
          stroke={color}
          strokeWidth="0.4"
          opacity="0.04"
        />
      </Svg>
    </View>
  );
}

type GpaPalette = {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  borderSubtle: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textPlaceholder: string;
  shadowOpacity: number;
};

function GoalPill({
  label,
  tone,
  uppercase,
}: {
  label: string;
  tone: "good" | "warn" | "bad" | "info";
  uppercase: boolean;
}) {
  const map = {
    good: { bg: colors.success + "12", text: colors.success },
    warn: { bg: colors.warning + "12", text: colors.warning },
    bad: { bg: colors.danger + "12", text: colors.danger },
    info: { bg: colors.primary + "12", text: colors.primary },
  } as const;
  const c = map[tone];
  return (
    <View style={[S.pill, { backgroundColor: c.bg }]}>
      <Text style={[S.pillText, { color: c.text }]}>
        {uppercase ? label.toUpperCase() : label}
      </Text>
    </View>
  );
}

function TargetSlider({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const [trackWidth, setTrackWidth] = useState(1);
  const startX = useRef(0);

  const percent = (value - min) / (max - min);
  const knobX = clamp(percent, 0, 1) * trackWidth;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          startX.current = knobX;
        },
        onPanResponderMove: (_evt, gestureState) => {
          const nextX = clamp(startX.current + gestureState.dx, 0, trackWidth);
          const nextV = min + (nextX / trackWidth) * (max - min);
          onChange(Number(nextV.toFixed(2)));
        },
      }),
    [knobX, max, min, onChange, trackWidth],
  );

  return (
    <View style={S.sliderWrap}>
      <Pressable
        style={S.sliderTrack}
        onLayout={(e) => setTrackWidth(Math.max(1, e.nativeEvent.layout.width))}
        onPress={(e) => {
          const x = clamp(e.nativeEvent.locationX, 0, trackWidth);
          const nextV = min + (x / trackWidth) * (max - min);
          onChange(Number(nextV.toFixed(2)));
        }}
      >
        <View style={S.sliderBgTrack} />
        <View
          style={[
            S.sliderFill,
            { width: `${clamp(percent, 0, 1) * 100}%` as any },
          ]}
        />
        <View
          style={[S.sliderKnob, { left: knobX - 8 }]}
          {...panResponder.panHandlers}
        />
      </Pressable>
    </View>
  );
}

function ScoreCard({
  iconBg,
  icon,
  label,
  value,
  scale,
  accent,
  pill,
  children,
  palette,
  isRTL,
}: {
  iconBg: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  scale: string;
  accent: string;
  pill: React.ReactNode;
  children?: React.ReactNode;
  palette: GpaPalette;
  isRTL: boolean;
}) {
  return (
    <View
      style={[
        S.card,
        {
          backgroundColor: palette.surface,
          borderColor: palette.borderSubtle,
          borderTopColor: accent,
          shadowOpacity: palette.shadowOpacity,
        },
      ]}
    >
      <CardBackgroundPattern color={accent} />

      <View style={S.cardContent}>
        <View
          style={[
            S.cardHeaderRow,
            { flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
        >
          <View style={[S.iconBox, { backgroundColor: iconBg }]}>{icon}</View>
          {pill}
        </View>
        <Text
          style={[
            S.cardLabel,
            {
              color: palette.textPlaceholder,
              textAlign: isRTL ? "right" : "left",
            },
          ]}
        >
          {label}
        </Text>
        <View
          style={[
            S.valueRow,
            {
              flexDirection: isRTL ? "row-reverse" : "row",
              justifyContent: isRTL ? "flex-end" : "flex-start",
            },
          ]}
        >
          <Text style={[S.valueText, { color: palette.textPrimary }]}>
            {value}
          </Text>
          <Text
            style={[
              S.scaleText,
              {
                color: palette.textPlaceholder,
                marginLeft: isRTL ? 0 : 4,
                marginRight: isRTL ? 4 : 0,
              },
            ]}
          >
            / {scale}
          </Text>
        </View>
        {children}
      </View>
    </View>
  );
}

export default function GPASimulatorScreen() {
  const store = useStore();
  const theme = useStore((state) => state.theme);
  const themeColors = useThemeColors();
  const { t, isRTL } = useAppLocale();
  const isDark = theme === "dark";
  const palette: GpaPalette = {
    background: themeColors.background,
    surface: isDark ? "#111827" : "#FFFFFF",
    surfaceAlt: isDark ? "#1F2937" : "#F8FAFC",
    border: themeColors.border,
    borderSubtle: isDark ? "rgba(148,163,184,0.18)" : "rgba(0,0,0,0.05)",
    textPrimary: themeColors.foreground,
    textSecondary: isDark ? "#CBD5E1" : colors.text.secondary,
    textMuted: themeColors.mutedForeground,
    textPlaceholder: isDark ? "#8FA0B8" : colors.text.placeholder,
    shadowOpacity: isDark ? 0.08 : 0.03,
  };
  const textAlign = isRTL ? "right" : "left";
  const rowDirection = isRTL ? "row-reverse" : "row";

  const stats = useMemo(() => {
    const gradingSystem = store.profile?.gradingSystem || "4.0";
    return calculateCumulativeGPA(store.courses, gradingSystem);
  }, [store.courses, store.profile?.gradingSystem]);

  const maxScale = store.profile?.gradingSystem === "5.0" ? 5.0 : 4.0;
  const scaleText = store.profile?.gradingSystem || "4.0";

  const gpa = Number.parseFloat(stats.gpa || "0");
  const safeGpa = Number.isFinite(gpa) ? gpa : 0;

  const [targetGpa, setTargetGpa] = useState<number>(clamp(3.6, 0, maxScale));

  const totalGoalCredits = 128;
  const earnedCredits = stats.completedCredits;
  const remainingCredits = Math.max(totalGoalCredits - earnedCredits, 0);

  const required = useMemo(() => {
    if (remainingCredits <= 0)
      return { text: "0.00", value: 0, tone: "good" as const };
    const target = clamp(targetGpa, 0, maxScale);
    if (earnedCredits <= 0)
      return { text: target.toFixed(2), value: target, tone: "info" as const };
    const req =
      (target * totalGoalCredits - safeGpa * earnedCredits) / remainingCredits;
    if (!Number.isFinite(req))
      return { text: "0.00", value: 0, tone: "info" as const };
    if (req > maxScale)
      return {
        text: `${maxScale.toFixed(2)}+`,
        value: maxScale,
        tone: "bad" as const,
      };
    if (req <= 0) return { text: "0.00", value: 0, tone: "good" as const };
    const v = clamp(req, 0, maxScale);
    return {
      text: v.toFixed(2),
      value: v,
      tone: v >= maxScale * 0.85 ? ("warn" as const) : ("info" as const),
    };
  }, [earnedCredits, maxScale, remainingCredits, safeGpa, targetGpa]);

  const gpaTone =
    safeGpa >= maxScale * 0.8
      ? ("good" as const)
      : safeGpa >= maxScale * 0.6
        ? ("warn" as const)
        : ("bad" as const);

  const goalTone =
    targetGpa >= maxScale * 0.85 ? ("info" as const) : ("warn" as const);

  const completedWithGrades = store.courses.filter(
    (c) => c.status === "completed" && !!c.grade,
  );
  const gpaPillLabel =
    gpaTone === "good"
      ? t("strong")
      : gpaTone === "warn"
        ? t("onTrack")
        : t("needsReview");
  const goalPillLabel = goalTone === "info" ? t("highGoal") : t("steadyGoal");

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
        <View style={[S.gridRow, { flexDirection: rowDirection }]}>
          <ScoreCard
            iconBg={"#8B5CF6" + "10"}
            icon={
              <GraduationCap size={18} color={"#8B5CF6"} strokeWidth={2.5} />
            }
            label={t("cumulativeGpa")}
            value={safeGpa.toFixed(2)}
            scale={scaleText}
            accent={"#8B5CF6"}
            pill={
              <GoalPill
                label={gpaPillLabel}
                tone={gpaTone}
                uppercase={!isRTL}
              />
            }
            palette={palette}
            isRTL={isRTL}
          />

          <ScoreCard
            iconBg={colors.primary + "10"}
            icon={<Target size={18} color={colors.primary} strokeWidth={2.5} />}
            label={t("targetGpa")}
            value={clamp(targetGpa, 0, maxScale).toFixed(2)}
            scale={scaleText}
            accent={colors.primary}
            pill={
              <GoalPill
                label={goalPillLabel}
                tone={goalTone}
                uppercase={!isRTL}
              />
            }
            palette={palette}
            isRTL={isRTL}
          >
            <TargetSlider
              value={clamp(targetGpa, 0, maxScale)}
              min={0}
              max={maxScale}
              onChange={setTargetGpa}
            />
          </ScoreCard>
        </View>

        <View
          style={[
            S.wideAnalyticsCard,
            {
              flexDirection: rowDirection,
              backgroundColor: palette.surface,
              borderColor: palette.borderSubtle,
              shadowOpacity: palette.shadowOpacity,
            },
          ]}
        >
          <View
            style={[
              S.iconBox,
              { backgroundColor: colors.success + "10", marginBottom: 0 },
            ]}
          >
            <GraduationCap size={20} color={colors.success} strokeWidth={2.5} />
          </View>
          <View
            style={[
              S.wideCardMain,
              { marginLeft: isRTL ? 0 : 14, marginRight: isRTL ? 14 : 0 },
            ]}
          >
            <Text
              style={[
                S.analyticsLabel,
                { color: palette.textPlaceholder, textAlign },
              ]}
            >
              {t("requiredAvg")}
            </Text>
            <View
              style={[
                S.analyticsValueRow,
                {
                  flexDirection: rowDirection,
                  justifyContent: isRTL ? "flex-end" : "flex-start",
                },
              ]}
            >
              <Text style={S.analyticsValue}>{required.text}</Text>
              <Text
                style={[
                  S.analyticsScale,
                  {
                    color: palette.textPlaceholder,
                    marginLeft: isRTL ? 0 : 4,
                    marginRight: isRTL ? 4 : 0,
                  },
                ]}
              >
                / {scaleText}
              </Text>
            </View>
          </View>
        </View>

        <View
          style={[
            S.tableCard,
            { backgroundColor: palette.surface, borderColor: palette.border },
          ]}
        >
          <View
            style={[
              S.tableHeader,
              {
                backgroundColor: palette.surfaceAlt,
                borderBottomColor: palette.border,
              },
            ]}
          >
            <Text
              style={[
                S.th,
                { flex: 1.1, color: palette.textPlaceholder, textAlign },
              ]}
            >
              {t("code")}
            </Text>
            <Text
              style={[
                S.th,
                { flex: 2.4, color: palette.textPlaceholder, textAlign },
              ]}
            >
              {t("name")}
            </Text>
            <Text
              style={[
                S.th,
                {
                  width: 42,
                  textAlign: "right",
                  color: palette.textPlaceholder,
                },
              ]}
            >
              {t("creditShort")}
            </Text>
            <Text
              style={[
                S.th,
                {
                  width: 56,
                  textAlign: "right",
                  color: palette.textPlaceholder,
                },
              ]}
            >
              {t("grade")}
            </Text>
          </View>

          {completedWithGrades.length === 0 ? (
            <View style={S.emptyWrap}>
              <View
                style={[S.emptyIcon, { backgroundColor: palette.surfaceAlt }]}
              >
                <Package
                  size={20}
                  color={palette.textPlaceholder}
                  strokeWidth={2}
                />
              </View>
              <Text
                style={[
                  S.emptyTitle,
                  { color: palette.textPrimary, textAlign },
                ]}
              >
                {t("noCompletedCourses")}
              </Text>
              <Text
                style={[S.emptySub, { color: palette.textMuted, textAlign }]}
              >
                {t("completedCoursesAppear")}
              </Text>
            </View>
          ) : (
            <View style={S.tableBody}>
              {completedWithGrades.slice(0, 8).map((c) => (
                <View
                  key={c.id}
                  style={[S.tr, { borderBottomColor: palette.border }]}
                >
                  <Text
                    style={[
                      S.td,
                      { flex: 1.1, color: palette.textPrimary, textAlign },
                    ]}
                    numberOfLines={1}
                  >
                    {c.code}
                  </Text>
                  <Text
                    style={[
                      S.td,
                      { flex: 2.4, color: palette.textPrimary, textAlign },
                    ]}
                    numberOfLines={1}
                  >
                    {c.name}
                  </Text>
                  <Text
                    style={[
                      S.td,
                      {
                        width: 42,
                        textAlign: "right",
                        color: palette.textPrimary,
                      },
                    ]}
                  >
                    {c.credits}
                  </Text>
                  <Text
                    style={[
                      S.td,
                      {
                        width: 56,
                        textAlign: "right",
                        fontWeight: fontWeight.bold as any,
                        color: palette.textPrimary,
                      },
                    ]}
                  >
                    {c.grade}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background.primary },
  scroll: {
    paddingHorizontal: isSmallScreen ? 16 : 20,
    paddingTop: isSmallScreen ? 16 : 20,
    paddingBottom: tabBarHeight.md + (isSmallScreen ? 78 : 86),
  },

  gridRow: { flexDirection: "row", gap: 12 },

  card: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
    position: "relative",
    borderTopWidth: 3,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 3,
  },
  cardContent: {
    padding: 14,
    zIndex: 2,
  },
  patternAbsolute: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
    opacity: 0.6,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  valueRow: { flexDirection: "row", alignItems: "baseline" },
  valueText: {
    fontSize: 24,
    fontWeight: fontWeight.black,
    letterSpacing: -0.5,
  },
  scaleText: { fontSize: 11, fontWeight: fontWeight.semibold, marginLeft: 4 },

  pill: {
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  pillText: {
    fontSize: 8.5,
    fontWeight: fontWeight.extrabold,
    letterSpacing: 0.4,
  },

  sliderWrap: { marginTop: 12 },
  sliderTrack: {
    height: 14,
    justifyContent: "center",
    position: "relative",
  },
  sliderBgTrack: {
    position: "absolute",
    width: "100%",
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(0,0,0,0.06)",
  },
  sliderFill: {
    position: "absolute",
    left: 0,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  sliderKnob: {
    position: "absolute",
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 3,
    borderColor: colors.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },

  wideAnalyticsCard: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  wideCardMain: {
    flex: 1,
    marginLeft: 14,
  },
  analyticsLabel: {
    fontSize: 9,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  analyticsValueRow: { flexDirection: "row", alignItems: "baseline" },
  analyticsValue: {
    fontSize: 20,
    fontWeight: fontWeight.black,
    color: colors.success,
    letterSpacing: -0.5,
  },
  analyticsScale: {
    fontSize: 11,
    fontWeight: fontWeight.semibold,
    marginLeft: 4,
  },

  tableCard: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    ...shadows.sm,
  },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    backgroundColor: colors.background.primary,
  },
  th: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.9,
  },
  tableBody: { paddingHorizontal: 14, paddingVertical: 8 },
  tr: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(226,232,240,0.65)",
  },
  td: {
    fontSize: 12,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
  },

  emptyWrap: {
    alignItems: "center",
    paddingVertical: 36,
    paddingHorizontal: 16,
  },
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.background.tertiary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: fontWeight.extrabold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    fontWeight: fontWeight.medium,
    color: colors.text.muted,
    textAlign: "center",
  },
});
