import React, { useState, useRef } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  TextInput,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
  Modal,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { ChevronDown, ChevronLeft, Check } from "lucide-react-native";
import { useStore } from "../lib/store";
import { updateCurrentUser } from "../services/auth";
import { useSafeAreaInsets, SafeAreaView } from "react-native-safe-area-context";
import { borderRadius, colors, fontWeight, isSmallScreen, spacing } from "../lib/constants";
import { Colors } from "../lib/theme";
import { SETTINGS_COPY } from "./(tabs)/settings";

// Allowed total_credit_hours values — must match the backend enum exactly
const CREDIT_HOUR_OPTIONS = [120, 124, 126, 128, 130, 132, 134, 136, 138, 140, 142, 144, 146, 150];

export default function EditProfileScreen() {
  const router = useRouter();
  const store = useStore();
  const insets = useSafeAreaInsets();

  const theme = store.theme;
  const language = store.language;
  const copy = SETTINGS_COPY[language];
  const themeColors = Colors[theme];
  const isDark = theme === "dark";

  const palette = {
    background: themeColors.background,
    surface: isDark ? "#111827" : colors.background.card,
    surfaceAlt: isDark ? "#1F2937" : colors.background.tertiary,
    border: isDark ? themeColors.border : colors.border.light,
    textPrimary: themeColors.foreground,
    textSecondary: isDark ? "#CBD5E1" : colors.text.secondary,
    textMuted: isDark ? "#A8B3C7" : colors.text.muted,
    primary: themeColors.primary,
  };

  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showCreditHoursPicker, setShowCreditHoursPicker] = useState(false);

  const [editForm, setEditForm] = useState({
    name: store.backendUser?.name ?? "",
    university: store.backendUser?.university ?? "",
    major: store.backendUser?.major ?? "",
    level: store.backendUser?.level ? String(store.backendUser.level) : "",
    total_credit_hours: (store.backendUser?.total_credit_hours ?? null) as number | null,
  });

  const [formErrors, setFormErrors] = useState({
    name: "",
    university: "",
    major: "",
    level: "",
    total_credit_hours: "",
  });

  const uniRef = useRef<TextInput>(null);
  const majorRef = useRef<TextInput>(null);
  const levelRef = useRef<TextInput>(null);

  const isRtl = store.language === "ar";
  const textAlign = (isRtl ? "right" : "left") as "right" | "left";

  const validateProfileForm = () => {
    let valid = true;
    const errors = { name: "", university: "", major: "", level: "", total_credit_hours: "" };

    if (!editForm.name.trim()) {
      errors.name = copy.fieldRequired;
      valid = false;
    }
    // university is optional — no required validation
    if (!editForm.major.trim()) {
      errors.major = copy.fieldRequired;
      valid = false;
    }
    const levelNum = parseInt(editForm.level, 10);
    if (isNaN(levelNum) || levelNum < 1 || levelNum > 4 || !/^\d+$/.test(editForm.level.trim())) {
      errors.level = copy.invalidLevel;
      valid = false;
    }
    if (!editForm.total_credit_hours) {
      errors.total_credit_hours = copy.fieldRequired;
      valid = false;
    }

    setFormErrors(errors);
    return valid;
  };

  const handleSaveProfile = async () => {
    if (!validateProfileForm()) return;
    setIsSubmittingProfile(true);
    setProfileError(null);
    try {
      const updatedUser = await updateCurrentUser({
        name: editForm.name.trim(),
        university: editForm.university.trim() || null,
        major: editForm.major.trim(),
        level: parseInt(editForm.level, 10),
        total_credit_hours: editForm.total_credit_hours ?? undefined,
      });
      store.updateUserProfile(updatedUser);
      router.back();
    } catch (err: any) {
      setProfileError(err.message || "Failed to update profile.");
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  const inputStyle = (field: string, hasError: boolean) => [
    S.input,
    {
      color: palette.textPrimary,
      borderColor: hasError ? "#EF4444" : focusedField === field ? palette.primary : palette.border,
      backgroundColor: palette.surface,
      textAlign,
    },
  ];

  return (
    <SafeAreaView style={[S.root, { backgroundColor: palette.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={palette.background} />

      <View
        style={[
          S.topBar,
          { borderBottomColor: palette.border, backgroundColor: palette.background },
          Platform.OS === "android" && {
            paddingTop: (StatusBar.currentHeight || 0) + (isSmallScreen ? spacing.sm : spacing.md),
          },
        ]}
      >
        <TouchableOpacity
          style={[S.backBtn, { backgroundColor: palette.surfaceAlt }]}
          onPress={() => router.back()}
          activeOpacity={0.75}
        >
          <ChevronLeft size={22} color={palette.textPrimary} strokeWidth={2.4} />
        </TouchableOpacity>
        <Text style={[S.topTitle, { color: palette.textPrimary }]}>{copy.editProfile}</Text>
        <View style={S.topRightSpace} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "padding"} style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[S.scroll, { paddingBottom: Math.max(insets.bottom, 18) + spacing.xl + 80 }]}
          keyboardShouldPersistTaps="handled"
        >
          {profileError ? (
            <Text style={[S.errorText, { color: colors.danger, marginBottom: spacing.md, textAlign }]}>
              {profileError}
            </Text>
          ) : null}

          {/* Full Name */}
          <View style={S.formGroup}>
            <Text style={[S.inputLabel, { color: palette.textSecondary, textAlign }]}>{copy.fullName}</Text>
            <TextInput
              style={inputStyle("name", !!formErrors.name)}
              value={editForm.name}
              onChangeText={(v) => {
                setEditForm((f) => ({ ...f, name: v }));
                setFormErrors((e) => ({ ...e, name: "" }));
              }}
              onFocus={() => setFocusedField("name")}
              onBlur={() => setFocusedField(null)}
              placeholder={copy.fullName}
              placeholderTextColor={palette.textMuted}
              returnKeyType="next"
              onSubmitEditing={() => uniRef.current?.focus()}
              blurOnSubmit={false}
            />
            {formErrors.name ? (
              <Text style={[S.errorText, { color: colors.danger, textAlign }]}>{formErrors.name}</Text>
            ) : null}
          </View>

          {/* University (optional) */}
          <View style={S.formGroup}>
            <Text style={[S.inputLabel, { color: palette.textSecondary, textAlign }]}>{copy.university}</Text>
            <TextInput
              ref={uniRef}
              style={inputStyle("university", !!formErrors.university)}
              value={editForm.university}
              onChangeText={(v) => {
                setEditForm((f) => ({ ...f, university: v }));
                setFormErrors((e) => ({ ...e, university: "" }));
              }}
              onFocus={() => setFocusedField("university")}
              onBlur={() => setFocusedField(null)}
              placeholder={copy.university}
              placeholderTextColor={palette.textMuted}
              returnKeyType="next"
              onSubmitEditing={() => majorRef.current?.focus()}
              blurOnSubmit={false}
            />
            {/* university is optional — no error shown */}
          </View>

          {/* Major */}
          <View style={S.formGroup}>
            <Text style={[S.inputLabel, { color: palette.textSecondary, textAlign }]}>{copy.major}</Text>
            <TextInput
              ref={majorRef}
              style={inputStyle("major", !!formErrors.major)}
              value={editForm.major}
              onChangeText={(v) => {
                setEditForm((f) => ({ ...f, major: v }));
                setFormErrors((e) => ({ ...e, major: "" }));
              }}
              onFocus={() => setFocusedField("major")}
              onBlur={() => setFocusedField(null)}
              placeholder={copy.major}
              placeholderTextColor={palette.textMuted}
              returnKeyType="next"
              onSubmitEditing={() => levelRef.current?.focus()}
              blurOnSubmit={false}
            />
            {formErrors.major ? (
              <Text style={[S.errorText, { color: colors.danger, textAlign }]}>{formErrors.major}</Text>
            ) : null}
          </View>

          {/* Academic Level */}
          <View style={S.formGroup}>
            <Text style={[S.inputLabel, { color: palette.textSecondary, textAlign }]}>{copy.academicLevel}</Text>
            <TextInput
              ref={levelRef}
              style={inputStyle("level", !!formErrors.level)}
              value={editForm.level}
              onChangeText={(v) => {
                setEditForm((f) => ({ ...f, level: v }));
                setFormErrors((e) => ({ ...e, level: "" }));
              }}
              onFocus={() => setFocusedField("level")}
              onBlur={() => setFocusedField(null)}
              placeholder={copy.academicLevel}
              placeholderTextColor={palette.textMuted}
              keyboardType="numeric"
              returnKeyType="done"
              onSubmitEditing={handleSaveProfile}
            />
            {formErrors.level ? (
              <Text style={[S.errorText, { color: colors.danger, textAlign }]}>{formErrors.level}</Text>
            ) : null}
          </View>

          {/* Total Credit Hours picker */}
          <View style={S.formGroup}>
            <Text style={[S.inputLabel, { color: palette.textSecondary, textAlign }]}>
              {copy.totalCreditHours}
            </Text>
            <TouchableOpacity
              style={[
                S.pickerRow,
                {
                  borderColor: formErrors.total_credit_hours
                    ? "#EF4444"
                    : palette.border,
                  backgroundColor: palette.surface,
                },
              ]}
              activeOpacity={0.75}
              onPress={() => setShowCreditHoursPicker(true)}
            >
              <Text
                style={[
                  S.pickerText,
                  {
                    color: editForm.total_credit_hours ? palette.textPrimary : palette.textMuted,
                    textAlign,
                    flex: 1,
                  },
                ]}
              >
                {editForm.total_credit_hours
                  ? `${editForm.total_credit_hours} hrs`
                  : copy.totalCreditHours}
              </Text>
              <ChevronDown size={18} color={palette.textMuted} strokeWidth={2} />
            </TouchableOpacity>
            {formErrors.total_credit_hours ? (
              <Text style={[S.errorText, { color: colors.danger, textAlign }]}>
                {formErrors.total_credit_hours}
              </Text>
            ) : null}
          </View>

          <View style={S.divider} />

          {/* Read-only info */}
          <View
            style={[S.readonlySection, { backgroundColor: palette.surface, borderColor: palette.border }]}
          >
            {[
              { label: copy.email, value: store.backendUser?.email },
              { label: copy.enrollmentYearTitle, value: store.backendUser?.enrollment_year },
              { label: copy.completedCreditHours, value: store.backendUser?.completed_credit_hours ?? "0" },
            ].map((row, i, arr) => (
              <View
                key={row.label}
                style={[
                  S.infoRow,
                  i < arr.length - 1 && {
                    borderBottomColor: palette.border,
                    borderBottomWidth: StyleSheet.hairlineWidth,
                  },
                ]}
              >
                <Text style={[S.infoLabel, { color: palette.textMuted }]}>{row.label}</Text>
                <Text style={[S.infoValue, { color: palette.textPrimary }]}>{row.value || "-"}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Sticky Save Button */}
        <View
          style={[
            S.bottomAction,
            {
              paddingBottom: Math.max(insets.bottom, spacing.md),
              backgroundColor: palette.background,
              borderTopColor: palette.border,
            },
          ]}
        >
          <TouchableOpacity
            onPress={handleSaveProfile}
            disabled={isSubmittingProfile}
            style={[S.saveBtn, { backgroundColor: "#1E75FF", opacity: isSubmittingProfile ? 0.85 : 1 }]}
            activeOpacity={0.85}
          >
            {isSubmittingProfile ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={S.saveBtnText}>{copy.save}</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Total Credit Hours bottom sheet */}
      <Modal
        visible={showCreditHoursPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreditHoursPicker(false)}
      >
        <Pressable
          style={S.sheetOverlay}
          onPress={() => setShowCreditHoursPicker(false)}
        />
        <View style={[S.sheet, { backgroundColor: palette.background }]}>
          <View style={[S.sheetHeader, { borderBottomColor: palette.border }]}>
            <Text style={[S.sheetTitle, { color: palette.textPrimary }]}>
              {copy.totalCreditHours}
            </Text>
            <TouchableOpacity onPress={() => setShowCreditHoursPicker(false)} activeOpacity={0.7}>
              <Text style={[S.sheetDone, { color: palette.primary }]}>{copy.done}</Text>
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {CREDIT_HOUR_OPTIONS.map((hrs) => {
              const selected = editForm.total_credit_hours === hrs;
              return (
                <TouchableOpacity
                  key={hrs}
                  activeOpacity={0.75}
                  onPress={() => {
                    setEditForm((f) => ({ ...f, total_credit_hours: hrs }));
                    setFormErrors((e) => ({ ...e, total_credit_hours: "" }));
                    setShowCreditHoursPicker(false);
                  }}
                  style={[S.sheetOption, { borderBottomColor: palette.border }]}
                >
                  <Text
                    style={[
                      S.sheetOptionText,
                      { color: selected ? palette.primary : palette.textPrimary },
                    ]}
                  >
                    {hrs} hrs
                  </Text>
                  {selected ? <Check size={18} color={palette.primary} strokeWidth={2.5} /> : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: isSmallScreen ? spacing.md : spacing.lg,
    paddingVertical: isSmallScreen ? spacing.sm : spacing.md,
    borderBottomWidth: 1,
  },
  backBtn: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  topTitle: { fontSize: 16, fontWeight: fontWeight.extrabold as any },
  topRightSpace: { width: 38, height: 38 },
  scroll: {
    paddingHorizontal: isSmallScreen ? spacing.md : spacing.lg,
    paddingTop: spacing.xl,
  },
  formGroup: { marginBottom: spacing.lg },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 54,
    fontSize: 15,
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 54,
  },
  pickerText: { fontSize: 15 },
  errorText: { fontSize: 12, marginTop: 6, fontWeight: fontWeight.medium as any },
  divider: { height: 20 },
  readonlySection: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.xl,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  infoLabel: { fontSize: 13, fontWeight: fontWeight.medium as any },
  infoValue: { fontSize: 14, fontWeight: fontWeight.bold as any },
  bottomAction: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  saveBtn: {
    height: 56,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1E75FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  saveBtnText: { color: "#FFF", fontSize: 16, fontWeight: fontWeight.bold as any },
  sheetOverlay: { flex: 1, backgroundColor: "rgba(15,23,42,0.35)" },
  sheet: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 18,
    maxHeight: "55%",
    marginTop: "auto",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 10,
    borderBottomWidth: 1,
    marginBottom: 6,
  },
  sheetTitle: { fontSize: 15, fontWeight: fontWeight.extrabold as any, letterSpacing: -0.2 },
  sheetDone: { fontSize: 14, fontWeight: fontWeight.bold as any },
  sheetOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  sheetOptionText: { fontSize: 14, fontWeight: fontWeight.semibold as any },
});
