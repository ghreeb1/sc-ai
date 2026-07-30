import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  StatusBar,
  Modal,
  Animated,
  Pressable,
  TextInput,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { GraduationCap, Target, Package, BookOpen, TrendingUp, ChevronUp, ChevronDown, Pencil } from "lucide-react-native";
import { useAppLocale, useStore, useThemeColors } from "../../lib/store";
import { Loading } from "../../components/Loading";
import { ScreenHeader } from "../../components/ScreenHeader";
import type { GPAResponse } from "../../lib/types";
import { getAcademicGpa } from "../../services/academic";
import { updateUserPreferences } from "../../services/auth";
import {
  borderRadius,
  colors,
  fontWeight,
  isSmallScreen,
  shadows,
  tabBarHeight,
} from "../../lib/constants";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
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

// ─────────────────────────────────────────────
// GoalPill
// ─────────────────────────────────────────────

function GoalPill({
  label,
  tone,
}: {
  label: string;
  tone: "good" | "warn" | "bad" | "info";
}) {
  const map = {
    good: { bg: colors.success + "20", text: colors.success, border: colors.success + "40" },
    warn: { bg: colors.warning + "20", text: colors.warning, border: colors.warning + "40" },
    bad: { bg: colors.danger + "20", text: colors.danger, border: colors.danger + "40" },
    info: { bg: colors.primary + "20", text: colors.primary, border: colors.primary + "40" },
  } as const;
  const c = map[tone];
  return (
    <View style={[S.pill, { backgroundColor: c.bg, borderColor: c.border }]}>
      <Text style={[S.pillText, { color: c.text }]}>{label}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────
// GpaHeroCard
// ─────────────────────────────────────────────

function GpaHeroCard({
  label, value, scale, progress, progressLabel,
  earnedCredits, creditHoursLabel, pill, accent, palette, isRTL,
}: {
  label: string; value: string; scale: string; progress: number;
  progressLabel: string; earnedCredits: number; creditHoursLabel: string;
  pill: React.ReactNode; accent: string; palette: GpaPalette; isRTL: boolean;
}) {
  const pct = clamp(progress, 0, 1);
  const rowDir = isRTL ? "row-reverse" : "row";

  return (
    <View style={[S.heroCard, { backgroundColor: palette.surface, borderColor: palette.borderSubtle }]}>
      <View style={[S.heroBand, { backgroundColor: accent + "12" }]} />

      <View style={[S.heroHeader, { flexDirection: rowDir }]}>
        <Text style={[S.heroLabel, { color: accent }]}>{label}</Text>
        {pill}
      </View>

      <View style={[S.heroBody, { flexDirection: rowDir }]}>
        {/* Ring gauge */}
        <View style={S.ringWrap}>
          <View style={[S.ringOuter, { borderColor: accent + "22" }]}>
            <View
              style={[
                S.ringInner,
                {
                  borderColor: accent,
                  transform: [{ rotate: `${-90 + pct * 360}deg` }],
                  borderTopColor: pct > 0.75 ? accent : "transparent",
                  borderRightColor: pct > 0.25 ? accent : "transparent",
                  borderBottomColor: pct > 0.5 ? accent : "transparent",
                  borderLeftColor: accent,
                },
              ]}
            />
            <View style={S.ringCenter}>
              <GraduationCap size={20} color={accent} strokeWidth={2.2} />
            </View>
          </View>
        </View>

        {/* Value + progress bar */}
        <View
          style={[
            S.heroRight,
            {
              marginLeft: isRTL ? 0 : 14,
              marginRight: isRTL ? 14 : 0,
              alignItems: isRTL ? "flex-end" : "flex-start",
            },
          ]}
        >
          <View style={[S.heroValueRow, { flexDirection: rowDir, alignItems: "baseline" }]}>
            <Text style={[S.heroValue, { color: palette.textPrimary }]}>{value}</Text>
            <Text
              style={[
                S.heroScaleText,
                { color: palette.textPlaceholder, marginLeft: isRTL ? 0 : 4, marginRight: isRTL ? 4 : 0 },
              ]}
            >
              / {scale}
            </Text>
          </View>

          {/* Segmented progress bar */}
          <View style={[S.segBarRow, { flexDirection: rowDir, marginTop: 8 }]}>
            <View style={S.segTrack}>
              <View style={[S.segFill, { width: `${pct * 100}%` as any, backgroundColor: accent }]} />
              {[0.25, 0.5, 0.75].map((t) => (
                <View key={t} style={[S.segTick, { left: `${t * 100}%` as any }]} />
              ))}
            </View>
            <Text
              style={[
                S.segPct,
                { color: accent, marginLeft: isRTL ? 0 : 8, marginRight: isRTL ? 8 : 0 },
              ]}
            >
              {progressLabel}
            </Text>
          </View>

          {/* Credits footer */}
          <View style={[S.heroFooter, { flexDirection: rowDir, marginTop: 8 }]}>
            <BookOpen size={11} color={palette.textMuted} strokeWidth={2} />
            <Text
              style={[
                S.heroCreditsText,
                { color: palette.textMuted, marginLeft: isRTL ? 0 : 5, marginRight: isRTL ? 5 : 0 },
              ]}
            >
              {earnedCredits} {creditHoursLabel}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
// TargetGpaBottomSheet
// ─────────────────────────────────────────────

type TargetGpaBottomSheetProps = {
  visible: boolean;
  initialValue: number;
  maxScale: number;
  accent: string;
  palette: GpaPalette;
  isDark: boolean;
  isRTL: boolean;
  onSave: (value: number) => void;
  onCancel: () => void;
};

function TargetGpaBottomSheet({
  visible,
  initialValue,
  maxScale,
  accent,
  palette,
  isDark,
  isRTL,
  onSave,
  onCancel,
}: TargetGpaBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(400)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  // Local draft value — never touches the backend while editing
  const [draft, setDraft] = useState(initialValue);
  const [inputText, setInputText] = useState(initialValue.toFixed(2));
  const [inputError, setInputError] = useState(false);

  // Long-press continuous step refs
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const repeatInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset draft whenever sheet opens
  useEffect(() => {
    if (visible) {
      setDraft(initialValue);
      setInputText(initialValue.toFixed(2));
      setInputError(false);
    }
  }, [visible, initialValue]);

  // Animate in / out
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 22,
          stiffness: 200,
          mass: 0.9,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 400,
          duration: 240,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, translateY, backdropOpacity]);

  // Step logic
  const step = useCallback((delta: number) => {
    setDraft((prev) => {
      const next = clamp(Math.round((prev + delta) * 100) / 100, 0, maxScale);
      setInputText(next.toFixed(2));
      setInputError(false);
      return next;
    });
  }, [maxScale]);

  const startLongPress = useCallback((delta: number) => {
    longPressTimer.current = setTimeout(() => {
      repeatInterval.current = setInterval(() => step(delta), 80);
    }, 380);
  }, [step]);

  const stopLongPress = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    if (repeatInterval.current) clearInterval(repeatInterval.current);
  }, []);

  // Cleanup on unmount
  useEffect(() => () => stopLongPress(), [stopLongPress]);

  // Text input handling
  const handleInputChange = useCallback((text: string) => {
    // Allow partial typing: digits and dot only
    const sanitized = text.replace(/[^0-9.]/g, "");
    setInputText(sanitized);
    const parsed = parseFloat(sanitized);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= maxScale) {
      setDraft(clamp(Math.round(parsed * 100) / 100, 0, maxScale));
      setInputError(false);
    } else {
      setInputError(true);
    }
  }, [maxScale]);

  const handleInputBlur = useCallback(() => {
    // On blur, snap to valid value
    const parsed = parseFloat(inputText);
    if (isNaN(parsed) || parsed < 0 || parsed > maxScale) {
      setInputText(draft.toFixed(2));
      setInputError(false);
    } else {
      const clamped = clamp(Math.round(parsed * 100) / 100, 0, maxScale);
      setDraft(clamped);
      setInputText(clamped.toFixed(2));
      setInputError(false);
    }
  }, [inputText, draft, maxScale]);

  const handleSave = useCallback(() => {
    onSave(draft);
  }, [draft, onSave]);

  const sheetBg = palette.surface;
  const handleColor = isDark ? "rgba(148,163,184,0.35)" : "rgba(0,0,0,0.15)";
  const btnRadius = 12;

  // Progress percentage for the mini bar inside the sheet
  const pct = clamp(draft / maxScale, 0, 1);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="height"
        keyboardVerticalOffset={0}
      >
        {/* Backdrop */}
        <TouchableWithoutFeedback onPress={onCancel}>
          <Animated.View
            style={[
              StyleSheet.absoluteFillObject,
              { backgroundColor: "rgba(0,0,0,0.48)", opacity: backdropOpacity },
            ]}
          />
        </TouchableWithoutFeedback>

        {/* Sheet */}
        <Animated.View
          style={[
            S.sheet,
            {
              backgroundColor: sheetBg,
              paddingBottom: insets.bottom + 12,
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Handle bar */}
          <View style={[S.sheetHandle, { backgroundColor: handleColor }]} />

          {/* Sheet title */}
          <Text style={[S.sheetTitle, { color: palette.textPrimary }]}>
            Set Target GPA
          </Text>
          <Text style={[S.sheetSubtitle, { color: palette.textMuted }]}>
            0.00 – {maxScale.toFixed(2)} scale · increments of 0.01
          </Text>

          {/* ── Main stepper row ── */}
          <View style={[S.stepperRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            {/* Minus button */}
            <Pressable
              onPress={() => step(-0.01)}
              onLongPress={() => startLongPress(-0.01)}
              onPressOut={stopLongPress}
              style={({ pressed }) => [
                S.stepBtn,
                {
                  backgroundColor: pressed
                    ? accent + "22"
                    : isDark ? "rgba(148,163,184,0.1)" : "rgba(0,0,0,0.05)",
                  borderColor: accent + "30",
                },
              ]}
              android_ripple={{ color: accent + "30", radius: 28, borderless: false }}
            >
              <ChevronDown size={22} color={accent} strokeWidth={2.5} />
            </Pressable>

            {/* Numeric input */}
            <View style={[S.inputWrap, { borderColor: inputError ? colors.danger : accent + "55", backgroundColor: isDark ? "#0F172A" : "#F1F5F9" }]}>
              <TextInput
                style={[
                  S.gpaInput,
                  {
                    color: inputError ? colors.danger : palette.textPrimary,
                    textAlign: "center",
                  },
                ]}
                value={inputText}
                onChangeText={handleInputChange}
                onBlur={handleInputBlur}
                keyboardType="decimal-pad"
                maxLength={4}
                selectTextOnFocus
                accessibilityLabel="Target GPA input"
              />
              <Text style={[S.inputScale, { color: palette.textPlaceholder }]}>
                / {maxScale.toFixed(1)}
              </Text>
            </View>

            {/* Plus button */}
            <Pressable
              onPress={() => step(+0.01)}
              onLongPress={() => startLongPress(+0.01)}
              onPressOut={stopLongPress}
              style={({ pressed }) => [
                S.stepBtn,
                {
                  backgroundColor: pressed
                    ? accent + "22"
                    : isDark ? "rgba(148,163,184,0.1)" : "rgba(0,0,0,0.05)",
                  borderColor: accent + "30",
                },
              ]}
              android_ripple={{ color: accent + "30", radius: 28, borderless: false }}
            >
              <ChevronUp size={22} color={accent} strokeWidth={2.5} />
            </Pressable>
          </View>

          {/* Mini progress bar */}
          <View style={S.sheetBarWrap}>
            <View style={[S.sheetBarTrack, { backgroundColor: accent + "1A" }]}>
              <Animated.View
                style={[
                  S.sheetBarFill,
                  { width: `${pct * 100}%` as any, backgroundColor: accent },
                ]}
              />
              {[0.25, 0.5, 0.75].map((t) => (
                <View key={t} style={[S.sheetBarTick, { left: `${t * 100}%` as any }]} />
              ))}
            </View>
            <Text style={[S.sheetBarPct, { color: accent }]}>
              {Math.round(pct * 100)}%
            </Text>
          </View>

          {inputError && (
            <Text style={S.inputErrorText}>
              Enter a value between 0.00 and {maxScale.toFixed(2)}
            </Text>
          )}

          {/* ── Action buttons ── */}
          <View style={[S.sheetActions, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => [
                S.sheetBtn,
                S.sheetBtnCancel,
                {
                  borderRadius: btnRadius,
                  backgroundColor: pressed
                    ? isDark ? "rgba(148,163,184,0.15)" : "rgba(0,0,0,0.06)"
                    : isDark ? "rgba(148,163,184,0.08)" : "rgba(0,0,0,0.04)",
                  borderColor: palette.borderSubtle,
                },
              ]}
            >
              <Text style={[S.sheetBtnText, { color: palette.textMuted }]}>
                Cancel
              </Text>
            </Pressable>

            <Pressable
              onPress={handleSave}
              disabled={inputError}
              style={({ pressed }) => [
                S.sheetBtn,
                S.sheetBtnSave,
                {
                  borderRadius: btnRadius,
                  backgroundColor: inputError
                    ? accent + "55"
                    : pressed ? accent + "CC" : accent,
                },
              ]}
            >
              <Text style={[S.sheetBtnText, { color: "#FFFFFF" }]}>
                Save
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// TargetGpaHeroCard  (premium hero, tappable)
// ─────────────────────────────────────────────

function TargetGpaHeroCard({
  label,
  pill,
  value,
  scale,
  progress,
  accent,
  palette,
  isRTL,
  onPress,
  requiredLabel,
  requiredValue,
  requiredTone,
  helperText,
}: {
  label: string;
  pill: React.ReactNode;
  value: string;
  scale: string;
  progress: number;
  accent: string;
  palette: GpaPalette;
  isRTL: boolean;
  onPress: () => void;
  requiredLabel: string;
  requiredValue: string;
  requiredTone: "good" | "warn" | "bad" | "info";
  helperText: string;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pct = clamp(progress, 0, 1);
  const rowDir = isRTL ? "row-reverse" : "row";
  const textAlign = isRTL ? "right" : "left";

  const requiredAccentMap = {
    good: colors.success,
    warn: colors.warning,
    bad: colors.danger,
    info: colors.primary,
  } as const;
  const requiredAccent = requiredAccentMap[requiredTone];

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.975,
      useNativeDriver: true,
      damping: 18,
      stiffness: 280,
      mass: 0.7,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      damping: 18,
      stiffness: 280,
      mass: 0.7,
    }).start();
  }, [scaleAnim]);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      android_ripple={{ color: accent + "18" }}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}. Tap to edit.`}
      accessibilityHint="Opens a picker to set your target GPA"
    >
      <Animated.View
        style={[
          S.targetHeroCard,
          {
            backgroundColor: palette.surface,
            borderColor: palette.borderSubtle,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Tinted background band */}
        <View style={[S.targetHeroBand, { backgroundColor: accent + "0D" }]} />

        {/* ── Top row: icon + title + badge ── */}
        <View style={[S.targetHeroHeader, { flexDirection: rowDir }]}>
          <View style={[S.targetHeroTitleGroup, { flexDirection: rowDir, alignItems: "center" }]}>
            <View style={[S.targetHeroIconBox, { backgroundColor: accent + "18" }]}>
              <Target size={15} color={accent} strokeWidth={2.5} />
            </View>
            <Text
              style={[
                S.targetHeroLabel,
                {
                  color: accent,
                  marginLeft: isRTL ? 0 : 8,
                  marginRight: isRTL ? 8 : 0,
                },
              ]}
            >
              {label}
            </Text>
          </View>
          {pill}
        </View>

        {/* ── Large GPA value ── */}
        <View
          style={[
            S.targetHeroValueRow,
            { flexDirection: rowDir, alignItems: "baseline", justifyContent: "center" },
          ]}
        >
          <Text style={[S.targetHeroValue, { color: palette.textPrimary }]}>{value}</Text>
          <Text style={[S.targetHeroScale, { color: palette.textPlaceholder }]}>
            {isRTL ? `${scale} /` : `/ ${scale}`}
          </Text>
        </View>

        {/* ── Progress bar ── */}
        <View style={[S.targetProgressWrap, { marginTop: 14 }]}>
          <View style={[S.targetProgressTrack, { backgroundColor: accent + "1A" }]}>
            <View
              style={[
                S.targetProgressFill,
                { width: `${pct * 100}%` as any, backgroundColor: accent },
              ]}
            />
            {[0.25, 0.5, 0.75].map((t) => (
              <View key={t} style={[S.targetProgressTick, { left: `${t * 100}%` as any }]} />
            ))}
          </View>
          <Text style={[S.targetProgressPct, { color: accent }]}>
            {Math.round(pct * 100)}%
          </Text>
        </View>

        {/* ── Divider ── */}
        <View style={[S.targetDivider, { backgroundColor: palette.borderSubtle }]} />

        {/* ── Required Average inset row ── */}
        <View style={[S.targetRequiredRow, { flexDirection: rowDir }]}>
          <View style={[S.targetRequiredLeft, { flexDirection: rowDir, alignItems: "center", flex: 1 }]}>
            <View style={[S.targetRequiredIconBox, { backgroundColor: requiredAccent + "16" }]}>
              <TrendingUp size={13} color={requiredAccent} strokeWidth={2.5} />
            </View>
            <View style={{ marginLeft: isRTL ? 0 : 8, marginRight: isRTL ? 8 : 0 }}>
              <Text style={[S.targetRequiredLabel, { color: palette.textMuted, textAlign }]}>
                {requiredLabel}
              </Text>
              <Text style={[S.targetHelperText, { color: palette.textPlaceholder, textAlign }]}>
                {helperText}
              </Text>
            </View>
          </View>

          <View style={[S.targetRequiredValueGroup, { flexDirection: rowDir, alignItems: "baseline" }]}>
            <Text style={[S.targetRequiredValue, { color: requiredAccent }]}>{requiredValue}</Text>
            <Text style={[S.targetRequiredScale, { color: palette.textPlaceholder }]}>
              {isRTL ? `${scale} /` : `/ ${scale}`}
            </Text>
          </View>
        </View>

        {/* ── Edit action footer ── */}
        <View style={[S.targetEditRow, { flexDirection: rowDir, borderTopColor: palette.borderSubtle }]}>
          <Pencil size={12} color={accent + "CC"} strokeWidth={2.2} />
          <Text
            style={[
              S.targetEditLabel,
              {
                color: accent + "CC",
                marginLeft: isRTL ? 0 : 6,
                marginRight: isRTL ? 6 : 0,
              },
            ]}
          >
            Edit Goal
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────

export default function GPASimulatorScreen() {
  const theme = useStore((state) => state.theme);
  const backendUser = useStore((state) => state.backendUser);
  const themeColors = useThemeColors();
  const { t, isRTL } = useAppLocale();

  const [gpaData, setGpaData] = useState<GPAResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Bottom sheet visibility
  const [sheetOpen, setSheetOpen] = useState(false);

  const isDark = theme === "dark";

  const palette: GpaPalette = {
    background: themeColors.background,
    surface: isDark ? "#111827" : "#FFFFFF",
    surfaceAlt: isDark ? "#1F2937" : "#F8FAFC",
    border: themeColors.border,
    borderSubtle: isDark ? "rgba(148,163,184,0.18)" : "rgba(0,0,0,0.06)",
    textPrimary: themeColors.foreground,
    textSecondary: isDark ? "#CBD5E1" : colors.text.secondary,
    textMuted: themeColors.mutedForeground,
    textPlaceholder: isDark ? "#8FA0B8" : colors.text.placeholder,
    shadowOpacity: isDark ? 0.08 : 0.03,
  };

  const rowDirection = isRTL ? "row-reverse" : "row";
  const textAlign = isRTL ? "right" : "left";

  // ── Data loading ──
  const loadGpa = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setGpaData(await getAcademicGpa());
    } catch {
      setError(
        (t as any)("unableToLoadGpa") ||
        "Unable to load GPA data. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadGpa(); }, [loadGpa]));

  // ── Scale ──
  const gradingScale = backendUser?.grading_scale === "5.0" ? "5.0" : "4.0";
  const maxScale = gradingScale === "5.0" ? 5.0 : 4.0;
  const scaleText = gradingScale;

  const rawGpa = gpaData?.cumulative_gpa ?? 0;
  const safeGpa = clamp(Number.isFinite(rawGpa) ? rawGpa : 0, 0, maxScale);

  // targetGpa is the committed value (shown on card + used in calculations).
  // When the sheet opens the user edits a local draft inside the sheet component.
  const [targetGpa, setTargetGpa] = useState<number>(
    clamp(backendUser?.target_gpa ?? 3.6, 0, maxScale),
  );

  useEffect(() => {
    setTargetGpa((current) => clamp(current, 0, maxScale));
  }, [maxScale]);

  // ── Sheet handlers ──
  const handleSheetSave = useCallback(async (newValue: number) => {
    setSheetOpen(false);

    // Update local state immediately so the UI reflects the change
    setTargetGpa(newValue);

    // Single backend call only on Save
    setSaveError(null);
    try {
      await updateUserPreferences({ target_gpa: newValue });
      useStore.setState((state) => ({
        backendUser: state.backendUser
          ? { ...state.backendUser, target_gpa: newValue }
          : state.backendUser,
      }));
    } catch {
      setSaveError(
        (t as any)("unableToSaveTarget") ||
        "Unable to save target GPA. Please try again.",
      );
    }
  }, [t]);

  const handleSheetCancel = useCallback(() => {
    setSheetOpen(false);
    // targetGpa is unchanged — draft is discarded inside the sheet
  }, []);

  // ── Derived values ──
  const totalGoalCredits = backendUser?.total_credit_hours ?? 0;
  const earnedCredits = gpaData?.total_credits_completed ?? 0;
  const remainingCredits = Math.max(totalGoalCredits - earnedCredits, 0);

  const creditHoursLabel: string =
    (t as any)("creditHoursCompleted") !== "creditHoursCompleted"
      ? (t as any)("creditHoursCompleted")
      : "credit hours completed";

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
      return { text: `${maxScale.toFixed(2)}+`, value: maxScale, tone: "bad" as const };
    if (req <= 0)
      return { text: "0.00", value: 0, tone: "good" as const };
    const v = clamp(req, 0, maxScale);
    return {
      text: v.toFixed(2),
      value: v,
      tone: v >= maxScale * 0.85 ? ("warn" as const) : ("info" as const),
    };
  }, [earnedCredits, maxScale, remainingCredits, safeGpa, targetGpa, totalGoalCredits]);

  const gpaTone =
    safeGpa >= maxScale * 0.8 ? ("good" as const) :
      safeGpa >= maxScale * 0.6 ? ("warn" as const) : ("bad" as const);

  const goalTone =
    targetGpa >= maxScale * 0.85 ? ("info" as const) : ("warn" as const);

  const completedWithGrades = gpaData?.history ?? [];

  const gpaPillLabel = gpaTone === "good" ? t("strong") : gpaTone === "warn" ? t("onTrack") : t("needsReview");
  const goalPillLabel = goalTone === "info" ? t("highGoal") : t("steadyGoal");
  const gpaProgress = clamp(safeGpa / maxScale, 0, 1);

  return (
    <SafeAreaView style={[S.root, { backgroundColor: palette.background }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={palette.background}
      />
      <ScreenHeader
        showLogo
        pageTitle={t("navGpa")}
        subtitle={t("headerSubtitleGpa")}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.scroll}>

        {/* Subtitle */}
        <Text style={[S.screenSubtitle, { color: palette.textMuted, textAlign }]}>
          {t("headerSubtitleGpa")}
        </Text>

        {/* ── 1. Cumulative GPA hero ── */}
        <GpaHeroCard
          label={t("cumulativeGpa")}
          value={safeGpa.toFixed(2)}
          scale={scaleText}
          progress={gpaProgress}
          progressLabel={`${Math.round(gpaProgress * 100)}%`}
          earnedCredits={earnedCredits}
          creditHoursLabel={creditHoursLabel}
          pill={<GoalPill label={gpaPillLabel} tone={gpaTone} />}
          accent="#8B5CF6"
          palette={palette}
          isRTL={isRTL}
        />

        {/* ── 2. Target GPA hero card (tappable → bottom sheet) ── */}
        <TargetGpaHeroCard
          label={t("targetGpa")}
          pill={<GoalPill label={goalPillLabel} tone={goalTone} />}
          value={clamp(targetGpa, 0, maxScale).toFixed(2)}
          scale={scaleText}
          progress={clamp(targetGpa / maxScale, 0, 1)}
          accent={colors.primary}
          palette={palette}
          isRTL={isRTL}
          onPress={() => setSheetOpen(true)}
          requiredLabel={t("requiredAvg")}
          requiredValue={required.text}
          requiredTone={required.tone}
          helperText={
            required.tone === "good"
              ? "You've already reached your goal!"
              : required.tone === "bad"
              ? "Target may not be achievable — consider adjusting"
              : `Maintain this average in remaining courses`
          }
        />

        {saveError ? (
          <Text style={[S.saveErrorText, { textAlign }]}>{saveError}</Text>
        ) : null}

        {/* ── 3. Courses section header ── */}
        <View style={[S.sectionRow, { flexDirection: rowDirection }]}>
          <View style={[S.sectionIconBox, { backgroundColor: "#8B5CF6" + "14" }]}>
            <GraduationCap size={14} color="#8B5CF6" strokeWidth={2.5} />
          </View>
          <Text
            style={[
              S.sectionTitle,
              {
                color: palette.textPrimary,
                marginLeft: isRTL ? 0 : 7,
                marginRight: isRTL ? 7 : 0,
              },
            ]}
          >
            {(t as any)("courses") || "Courses"}
          </Text>
        </View>

        {/* ── 4. Courses table ── */}
        <View style={[S.tableCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          {completedWithGrades.length > 0 && (
            <View
              style={[
                S.tableHeader,
                { backgroundColor: palette.surfaceAlt, borderBottomColor: palette.border },
              ]}
            >
              <Text style={[S.th, { flex: 1.1, color: palette.textPlaceholder, textAlign }]}>
                {t("code")}
              </Text>
              <Text style={[S.th, { flex: 2.4, color: palette.textPlaceholder, textAlign }]}>
                {t("name")}
              </Text>
              <Text style={[S.th, { width: 42, textAlign: "right", color: palette.textPlaceholder }]}>
                {t("creditShort")}
              </Text>
              <Text style={[S.th, { width: 56, textAlign: "right", color: palette.textPlaceholder }]}>
                {t("grade")}
              </Text>
            </View>
          )}

          {loading && !gpaData ? (
            <Loading theme={theme} size="large" />
          ) : error && !gpaData ? (
            <View style={S.emptyWrap}>
              <View style={[S.emptyIcon, { backgroundColor: palette.surfaceAlt }]}>
                <Package size={20} color={palette.textPlaceholder} strokeWidth={2} />
              </View>
              <Text style={[S.emptyTitle, { color: palette.textPrimary, textAlign }]}>{error}</Text>
              <Pressable onPress={loadGpa}>
                <Text style={[S.retryText, { color: colors.primary }]}>
                  {(t as any)("retry") || "Retry"}
                </Text>
              </Pressable>
            </View>
          ) : completedWithGrades.length === 0 ? (
            <View style={S.emptyWrap}>
              <View style={[S.emptyIcon, { backgroundColor: palette.surfaceAlt }]}>
                <Package size={20} color={palette.textPlaceholder} strokeWidth={2} />
              </View>
              <Text style={[S.emptyTitle, { color: palette.textPrimary, textAlign }]}>
                {t("noCompletedCourses")}
              </Text>
              <Text style={[S.emptySub, { color: palette.textMuted, textAlign }]}>
                {t("completedCoursesAppear")}
              </Text>
            </View>
          ) : (
            <View style={S.tableBody}>
              {completedWithGrades.slice(0, 8).map((c, index) => (
                <View
                  key={c.id ?? c.course.id ?? `${c.course.name}-${index}`}
                  style={[S.tr, { borderBottomColor: palette.border }]}
                >
                  <Text
                    style={[S.td, { flex: 1.1, color: palette.textPrimary, textAlign }]}
                    numberOfLines={1}
                  >
                    {c.course.code ?? "--"}
                  </Text>
                  <Text
                    style={[S.td, { flex: 2.4, color: palette.textPrimary, textAlign }]}
                    numberOfLines={1}
                  >
                    {c.course.name}
                  </Text>
                  <Text style={[S.td, { width: 42, textAlign: "right", color: palette.textPrimary }]}>
                    {c.credit_hours}
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

      {/* ── Bottom Sheet ── */}
      <TargetGpaBottomSheet
        visible={sheetOpen}
        initialValue={clamp(targetGpa, 0, maxScale)}
        maxScale={maxScale}
        accent={colors.primary}
        palette={palette}
        isDark={isDark}
        isRTL={isRTL}
        onSave={handleSheetSave}
        onCancel={handleSheetCancel}
      />
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────

const S = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    paddingHorizontal: isSmallScreen ? 14 : 18,
    paddingTop: isSmallScreen ? 14 : 18,
    paddingBottom: tabBarHeight.md + (isSmallScreen ? 24 : 32),
    gap: 8,
  },

  // ── Scrollable subtitle ──
  screenSubtitle: {
    fontSize: 12,
    fontWeight: fontWeight.medium,
    lineHeight: 17,
    letterSpacing: 0.1,
    marginBottom: 4,
  },
  heroCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  heroBand: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    height: 48,
  },
  heroHeader: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
  },
  heroLabel: {
    fontSize: 10,
    fontWeight: fontWeight.extrabold,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  heroBody: {
    alignItems: "center",
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  ringWrap: { alignItems: "center", justifyContent: "center" },
  ringOuter: {
    width: 56, height: 56,
    borderRadius: 28, borderWidth: 3,
    alignItems: "center", justifyContent: "center",
  },
  ringInner: {
    position: "absolute",
    width: 56, height: 56,
    borderRadius: 28, borderWidth: 3,
  },
  ringCenter: {
    width: 44, height: 44,
    borderRadius: 22,
    alignItems: "center", justifyContent: "center",
  },
  heroRight: { flex: 1 },
  heroValueRow: { flexDirection: "row" },
  heroValue: { fontSize: 32, fontWeight: fontWeight.black, letterSpacing: -1 },
  heroScaleText: {
    fontSize: 14, fontWeight: fontWeight.semibold,
    alignSelf: "flex-end", marginBottom: 4,
  },
  segBarRow: { alignItems: "center", width: "100%" },
  segTrack: {
    flex: 1, height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(0,0,0,0.07)",
    overflow: "visible",
    position: "relative",
  },
  segFill: { height: "100%", borderRadius: 3 },
  segTick: {
    position: "absolute", top: -2,
    width: 1, height: 9,
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 1,
  },
  segPct: { fontSize: 11, fontWeight: fontWeight.bold, minWidth: 36, textAlign: "right" },
  heroFooter: { alignItems: "center" },
  heroCreditsText: { fontSize: 11, fontWeight: fontWeight.medium },

  // ── Target GPA hero card ──
  targetHeroCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#1E75FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 5,
  },
  targetHeroBand: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    height: 56,
  },
  targetHeroHeader: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
  },
  targetHeroTitleGroup: {
    gap: 0,
  },
  targetHeroIconBox: {
    width: 28, height: 28,
    borderRadius: 9,
    alignItems: "center", justifyContent: "center",
  },
  targetHeroLabel: {
    fontSize: 11,
    fontWeight: fontWeight.extrabold,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  targetHeroValueRow: {
    paddingHorizontal: 16,
    marginTop: 6,
  },
  targetHeroValue: {
    fontSize: isSmallScreen ? 44 : 52,
    fontWeight: fontWeight.black,
    letterSpacing: -2,
    lineHeight: isSmallScreen ? 50 : 58,
  },
  targetHeroScale: {
    fontSize: 16,
    fontWeight: fontWeight.semibold,
    alignSelf: "flex-end",
    marginBottom: isSmallScreen ? 6 : 8,
    marginLeft: 4,
  },
  targetProgressWrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 10,
  },
  targetProgressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: "visible",
    position: "relative",
  },
  targetProgressFill: {
    height: "100%",
    borderRadius: 3,
  },
  targetProgressTick: {
    position: "absolute",
    top: -3,
    width: 1.5,
    height: 12,
    backgroundColor: "rgba(255,255,255,0.55)",
    borderRadius: 1,
  },
  targetProgressPct: {
    fontSize: 12,
    fontWeight: fontWeight.bold,
    minWidth: 36,
    textAlign: "right",
  },
  targetDivider: {
    height: 1,
    marginHorizontal: 16,
    marginTop: 14,
  },
  targetRequiredRow: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 8,
  },
  targetRequiredLeft: {
    gap: 0,
  },
  targetRequiredIconBox: {
    width: 26, height: 26,
    borderRadius: 8,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  targetRequiredLabel: {
    fontSize: 11,
    fontWeight: fontWeight.semibold,
  },
  targetHelperText: {
    fontSize: 10,
    fontWeight: fontWeight.medium,
    marginTop: 1,
    maxWidth: 160,
  },
  targetRequiredValueGroup: {
    alignItems: "baseline",
    flexShrink: 0,
  },
  targetRequiredValue: {
    fontSize: 22,
    fontWeight: fontWeight.black,
    letterSpacing: -0.8,
  },
  targetRequiredScale: {
    fontSize: 11,
    fontWeight: fontWeight.semibold,
    alignSelf: "flex-end",
    marginBottom: 2,
    marginLeft: 3,
  },
  targetEditRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 10,
    borderTopWidth: 1,
    gap: 6,
  },
  targetEditLabel: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.3,
  },

  // ── Bottom sheet ──
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 12,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: fontWeight.extrabold,
    textAlign: "center",
    marginBottom: 4,
  },
  sheetSubtitle: {
    fontSize: 12,
    fontWeight: fontWeight.medium,
    textAlign: "center",
    marginBottom: 24,
  },

  // Stepper
  stepperRow: {
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    marginBottom: 20,
  },
  stepBtn: {
    width: 54,
    height: 54,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "baseline",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 2,
    minWidth: 120,
    justifyContent: "center",
  },
  gpaInput: {
    fontSize: 36,
    fontWeight: fontWeight.black,
    letterSpacing: -1,
    minWidth: 70,
    padding: 0,
  },
  inputScale: {
    fontSize: 14,
    fontWeight: fontWeight.semibold,
    marginLeft: 4,
    marginBottom: 4,
    alignSelf: "flex-end",
  },
  inputErrorText: {
    fontSize: 11,
    color: colors.danger,
    fontWeight: fontWeight.medium,
    textAlign: "center",
    marginTop: -12,
    marginBottom: 8,
  },

  // Mini bar in sheet
  sheetBarWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 10,
  },
  sheetBarTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: "visible",
    position: "relative",
  },
  sheetBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  sheetBarTick: {
    position: "absolute",
    top: -3,
    width: 1,
    height: 12,
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 1,
  },
  sheetBarPct: {
    fontSize: 12,
    fontWeight: fontWeight.bold,
    minWidth: 36,
    textAlign: "right",
  },

  // Action buttons
  sheetActions: {
    gap: 12,
    marginBottom: 4,
  },
  sheetBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetBtnCancel: {
    borderWidth: 1,
  },
  sheetBtnSave: {},
  sheetBtnText: {
    fontSize: 15,
    fontWeight: fontWeight.extrabold,
  },

  // ── Save error (below card) ──
  saveErrorText: {
    fontSize: 11,
    color: colors.danger,
    fontWeight: fontWeight.medium,
    marginTop: -4,
  },

  // ── Pill ──
  pill: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  pillText: {
    fontSize: 10,
    fontWeight: fontWeight.extrabold,
    letterSpacing: 0.2,
  },

  // ── Section header ──
  sectionRow: { alignItems: "center", marginTop: 4 },
  sectionIconBox: {
    width: 26, height: 26,
    borderRadius: 7,
    alignItems: "center", justifyContent: "center",
  },
  sectionTitle: { fontSize: 15, fontWeight: fontWeight.extrabold },

  // ── Courses table ──
  tableCard: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    ...shadows.sm,
  },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  th: { fontSize: 10, fontWeight: fontWeight.bold, letterSpacing: 0.8 },
  tableBody: { paddingHorizontal: 14, paddingVertical: 6 },
  tr: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
    borderBottomWidth: 1,
  },
  td: { fontSize: 12, fontWeight: fontWeight.medium },

  // ── Empty state ──
  emptyWrap: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  emptyIcon: {
    width: 42, height: 42,
    borderRadius: 13,
    alignItems: "center", justifyContent: "center",
    marginBottom: 10,
  },
  emptyTitle: { fontSize: 14, fontWeight: fontWeight.extrabold, marginBottom: 4 },
  emptySub: { fontSize: 12, fontWeight: fontWeight.medium, textAlign: "center" },
  retryText: { fontSize: 12, fontWeight: fontWeight.bold, marginTop: 8 },
});