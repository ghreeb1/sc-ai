import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  ScrollView,
  Switch,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Modal,
  Pressable,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import {
  ChevronLeft,
  ChevronDown,
  User,
  Mail,
  BookOpen,
  Award,
  GraduationCap,
  Calculator,
  LogOut,
  Globe,
  Moon,
  Pencil,
  Trash,
} from "lucide-react-native";
import { useStore } from "../../lib/store";
import { getUserPreferences, updateUserPreferences, deleteAccount } from "../../services/auth";
import { useSafeAreaInsets, SafeAreaView } from "react-native-safe-area-context";
import {
  colors,
  fontWeight,
  isSmallScreen,
  spacing,
} from "../../lib/constants";
import { Colors } from "../../lib/theme";

type ProfileRow = {
  id: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  right?: React.ReactNode;
  onPress?: () => void;
};

type SettingsPalette = {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textPlaceholder: string;
  segmentedBg: string;
  segmentedActiveBg: string;
};

type SettingOption = {
  value: string;
  label: string;
  icon?: React.ReactNode;
  accessibilityLabel: string;
};

export const SETTINGS_COPY = {
  en: {
    settingsTitle: "Settings",
    accountKicker: "ACCOUNT",
    profileTitle: "Profile",
    preferencesTitle: "Global Preferences",
    preferencesSubTitle: "Language & appearance",
    curriculumTitle: "Curriculum Manager",
    languageLabel: "Language Selection",
    languageDescription: "Choose the interface language used across the app.",
    themeLabel: "Theme Mode",
    themeDescription:
      "Select the appearance style applied throughout the app shell.",
    english: "English",
    arabic: "العربية",
    lightMode: "Light Mode",
    darkMode: "Dark Mode",
    fullName: "Full Name",
    email: "Email",
    major: "Major / Specialization",
    academicLevel: "Academic Level",
    university: "University (Optional)",
    gradingSystem: "Grading System",
    yearPrefix: "Year",
    outOf: "Out of",
    noCourses: "No courses yet",
    coursesSuffix: "courses",
    curriculumPresent: "Add or edit courses to manage your curriculum",
    curriculumEmpty: "Add courses to manage your curriculum",
    logout: "Log out",
    done: "Done",
    editProfile: "Edit Profile",
    save: "Save",
    cancel: "Cancel",
    enrollmentYearTitle: "Enrollment Year",
    totalCreditHours: "Total Credit Hours",
    completedCreditHours: "Completed Credit Hours",
    fieldRequired: "This field is required",
    invalidLevel: "Level must be a positive integer",
    deleteAccount: "Delete Account",
    deleteAccountConfirm: "Are you sure you want to delete your account? This action cannot be undone.",
    delete: "Delete",
  },
  ar: {
    settingsTitle: "الإعدادات",
    accountKicker: "الحساب",
    profileTitle: "الملف الشخصي",
    preferencesTitle: "التفضيلات العامة",
    preferencesSubTitle: "اللغة والمظهر",
    curriculumTitle: "إدارة الخطة الدراسية",
    languageLabel: "اختيار اللغة",
    languageDescription: "اختر لغة الواجهة المستخدمة في جميع أنحاء التطبيق.",
    themeLabel: "نمط الواجهة",
    themeDescription: "حدد المظهر العام المطبق على واجهة التطبيق.",
    english: "English",
    arabic: "العربية",
    lightMode: "الوضع الفاتح",
    darkMode: "الوضع الداكن",
    fullName: "الاسم الكامل",
    email: "البريد الإلكتروني",
    major: "التخصص",
    academicLevel: "المستوى الأكاديمي",
    university: "الجامعة (اختياري)",
    gradingSystem: "نظام التقدير",
    yearPrefix: "السنة",
    outOf: "من",
    noCourses: "لا توجد مقررات بعد",
    coursesSuffix: "مقررات",
    curriculumPresent: "أضف المقررات أو عدلها لإدارة خطتك الدراسية",
    curriculumEmpty: "أضف مقررات لبدء إدارة خطتك الدراسية",
    logout: "تسجيل الخروج",
    done: "تم",
    editProfile: "تعديل الملف الشخصي",
    save: "حفظ",
    cancel: "إلغاء",
    enrollmentYearTitle: "سنة الالتحاق",
    totalCreditHours: "إجمالي الساعات",
    completedCreditHours: "الساعات المكتسبة",
    fieldRequired: "هذا الحقل مطلوب",
    invalidLevel: "يجب أن يكون المستوى رقمًا صحيحًا موجبًا",
    deleteAccount: "حذف الحساب",
    deleteAccountConfirm: "هل أنت متأكد أنك تريد حذف حسابك؟ لا يمكن التراجع عن هذا الإجراء.",
    delete: "حذف",
  },
} as const;

function normalizeLanguage(value?: string | null) {
  return value === "ar" ? "ar" : value === "en" ? "en" : null;
}

function normalizeTheme(value?: string | null) {
  return value === "dark" ? "dark" : value === "light" ? "light" : null;
}

function normalizeGradingScale(value?: string | null) {
  return value === "5.0" ? "5.0" : value === "4.0" ? "4.0" : null;
}

function Row({
  row,
  isLast,
  palette,
}: {
  row: ProfileRow;
  isLast: boolean;
  palette: SettingsPalette;
}) {
  return (
    <TouchableOpacity
      activeOpacity={row.onPress ? 0.7 : 1}
      onPress={row.onPress}
      disabled={!row.onPress}
      style={[
        S.row,
        !isLast && S.rowDivider,
        !isLast && { borderBottomColor: palette.border },
      ]}
    >
      <View style={[S.rowIconBox, { backgroundColor: palette.surfaceAlt }]}>
        {row.icon}
      </View>
      <View style={S.rowText}>
        <Text style={[S.rowLabel, { color: palette.textPlaceholder }]}>
          {row.label}
        </Text>
        <Text
          style={[S.rowValue, { color: palette.textPrimary }]}
          numberOfLines={1}
        >
          {row.value}
        </Text>
      </View>
      {row.right ? <View style={S.rowRight}>{row.right}</View> : null}
    </TouchableOpacity>
  );
}

function PreferenceRow({
  icon,
  label,
  description,
  options,
  value,
  onChange,
  palette,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  options: SettingOption[];
  value: string;
  onChange: (nextValue: string) => void;
  palette: SettingsPalette;
}) {
  return (
    <View
      style={[
        S.preferenceRow,
        { backgroundColor: palette.surface, borderColor: palette.border },
      ]}
    >
      <View style={S.preferenceHeader}>
        <View
          style={[S.preferenceIconBox, { backgroundColor: palette.surfaceAlt }]}
        >
          {icon}
        </View>
        <View style={S.preferenceCopy}>
          <Text style={[S.preferenceLabel, { color: palette.textPrimary }]}>
            {label}
          </Text>
          <Text style={[S.preferenceDescription, { color: palette.textMuted }]}>
            {description}
          </Text>
        </View>
      </View>

      <View
        style={[
          S.segmentedControl,
          { backgroundColor: palette.segmentedBg, borderColor: palette.border },
        ]}
      >
        {options.map((option) => {
          const selected = option.value === value;

          return (
            <TouchableOpacity
              key={option.value}
              style={[
                S.segmentButton,
                {
                  backgroundColor: selected
                    ? palette.segmentedActiveBg
                    : "transparent",
                  borderColor: selected ? colors.primary : "transparent",
                },
              ]}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={option.accessibilityLabel}
              onPress={() => onChange(option.value)}
            >
              <View style={S.segmentButtonInner}>
                {option.icon}
                <Text
                  style={[
                    S.segmentButtonText,
                    {
                      color: selected ? colors.primary : palette.textSecondary,
                    },
                  ]}
                >
                  {option.label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── ThemeToggleRow — Material 3 Switch ───────────────────────────────────────

function ThemeToggleRow({
  icon,
  label,
  description,
  isDark,
  onChange,
  palette,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  isDark: boolean;
  onChange: (nextValue: string) => void;
  palette: SettingsPalette;
}) {
  // Subtle scale animation on toggle
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleToggle = (value: boolean) => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.96,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 14,
        stiffness: 260,
      }),
    ]).start();
    onChange(value ? "dark" : "light");
  };

  return (
    <Animated.View
      style={[
        S.preferenceRow,
        {
          backgroundColor: palette.surface,
          borderColor: palette.border,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <View style={[S.preferenceHeader, { marginBottom: 0 }]}>
        <View
          style={[S.preferenceIconBox, { backgroundColor: palette.surfaceAlt }]}
        >
          {icon}
        </View>
        <View style={S.preferenceCopy}>
          <Text style={[S.preferenceLabel, { color: palette.textPrimary }]}>
            {label}
          </Text>
          <Text style={[S.preferenceDescription, { color: palette.textMuted }]}>
            {description}
          </Text>
        </View>
        {/* Right side: label + Switch */}
        <View style={S.themeSwitchGroup}>
          <Moon
            size={14}
            color={isDark ? colors.primary : palette.textPlaceholder}
            strokeWidth={2.2}
          />
          <Switch
            value={isDark}
            onValueChange={handleToggle}
            trackColor={{
              false: palette.segmentedBg,
              true: colors.primary + "55",
            }}
            thumbColor={isDark ? colors.primary : palette.textPlaceholder}
            ios_backgroundColor={palette.segmentedBg}
            accessibilityRole="switch"
            accessibilityLabel="Toggle dark mode"
            accessibilityState={{ checked: isDark }}
          />
        </View>
      </View>
    </Animated.View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const store = useStore();
  const [showGradingModal, setShowGradingModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const insets = useSafeAreaInsets();
  const theme = store.theme;
  const language = store.language;
  const copy = SETTINGS_COPY[language];
  const themeColors = Colors[theme];
  const isDark = theme === "dark";
  const palette: SettingsPalette = {
    background: themeColors.background,
    surface: isDark ? "#111827" : colors.background.card,
    surfaceAlt: isDark ? "#1F2937" : colors.background.tertiary,
    border: isDark ? themeColors.border : colors.border.light,
    textPrimary: themeColors.foreground,
    textSecondary: isDark ? "#CBD5E1" : colors.text.secondary,
    textMuted: isDark ? "#A8B3C7" : colors.text.muted,
    textPlaceholder: isDark ? "#8FA0B8" : colors.text.placeholder,
    segmentedBg: isDark ? "#0F172A" : colors.background.secondary,
    segmentedActiveBg: isDark
      ? "rgba(30,117,255,0.16)"
      : "rgba(30,117,255,0.08)",
  };

  const profile = store.profile;
  const fullName = profile?.fullName || "-";
  const email = profile?.email || "-";
  const major = profile?.major || "-";
  const academicLevel = profile?.academicLevel
    ? `${copy.yearPrefix} ${profile.academicLevel}`
    : "-";
  const university = profile?.university?.trim() ? profile.university : "—";
  const gradingSystem = profile?.gradingSystem || "4.0";

  const applyPreferences = useCallback(
    (preferences: Awaited<ReturnType<typeof getUserPreferences>>) => {
      const nextLanguage = normalizeLanguage(preferences.language);
      const nextTheme = normalizeTheme(preferences.theme);
      const nextGradingScale = normalizeGradingScale(
        preferences.grading_scale,
      );

      if (nextLanguage && nextLanguage !== store.language) {
        store.setLanguage(nextLanguage);
      }
      if (nextTheme && nextTheme !== store.theme) {
        store.setTheme(nextTheme);
      }
      if (
        nextGradingScale &&
        nextGradingScale !== store.profile?.gradingSystem
      ) {
        store.updateGradingSystem(nextGradingScale);
      }
    },
    [store],
  );

  const refreshPreferences = useCallback(async () => {
    try {
      applyPreferences(await getUserPreferences());
    } catch {}
  }, [applyPreferences]);

  useFocusEffect(
    useCallback(() => {
      refreshPreferences();
    }, [refreshPreferences]),
  );

  const handleLanguageChange = useCallback(
    async (nextValue: string) => {
      const nextLanguage = normalizeLanguage(nextValue);
      if (!nextLanguage || nextLanguage === store.language) return;

      try {
        applyPreferences(await updateUserPreferences({ language: nextLanguage }));
      } catch {}
    },
    [applyPreferences, store.language],
  );

  const handleThemeChange = useCallback(
    async (nextValue: string) => {
      const nextTheme = normalizeTheme(nextValue);
      if (!nextTheme || nextTheme === store.theme) return;

      try {
        applyPreferences(await updateUserPreferences({ theme: nextTheme }));
      } catch {}
    },
    [applyPreferences, store.theme],
  );

  const handleGradingSystemChange = useCallback(
    async (nextValue: "4.0" | "5.0") => {
      if (nextValue === gradingSystem) {
        setShowGradingModal(false);
        return;
      }

      try {
        applyPreferences(
          await updateUserPreferences({ grading_scale: nextValue }),
        );
        setShowGradingModal(false);
      } catch {}
    },
    [applyPreferences, gradingSystem],
  );

  const openEditProfile = () => {
    router.push("/edit-profile");
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      copy.deleteAccount,
      copy.deleteAccountConfirm,
      [
        { text: copy.cancel, style: "cancel" },
        { 
          text: copy.delete, 
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
               await deleteAccount();
               router.replace("/auth/login");
            } catch (error) {
               Alert.alert("Error", "Could not delete account.");
            } finally {
               setIsDeleting(false);
            }
          }
        }
      ]
    );
  };

  const profileRows: ProfileRow[] = useMemo(() => {
    return [
      {
        id: "name",
        icon: <User size={18} color={palette.textMuted} strokeWidth={2} />,
        label: copy.fullName,
        value: fullName,
      },
      {
        id: "email",
        icon: <Mail size={18} color={palette.textMuted} strokeWidth={2} />,
        label: copy.email,
        value: email,
      },
      {
        id: "major",
        icon: <BookOpen size={18} color={palette.textMuted} strokeWidth={2} />,
        label: copy.major,
        value: major,
      },
      {
        id: "level",
        icon: <Award size={18} color={palette.textMuted} strokeWidth={2} />,
        label: copy.academicLevel,
        value: academicLevel,
      },
      {
        id: "university",
        icon: (
          <GraduationCap size={18} color={palette.textMuted} strokeWidth={2} />
        ),
        label: copy.university,
        value: university,
      },
      {
        id: "grading",
        icon: (
          <Calculator size={18} color={palette.textMuted} strokeWidth={2} />
        ),
        label: copy.gradingSystem,
        value: "",
        right: (
          <View
            style={[
              S.gradePill,
              {
                borderColor: palette.border,
                backgroundColor: palette.background,
              },
            ]}
          >
            <Text style={[S.gradePillText, { color: palette.textPrimary }]}>
              {copy.outOf} {gradingSystem}
            </Text>
            <ChevronDown
              size={16}
              color={palette.textMuted}
              strokeWidth={2.2}
            />
          </View>
        ),
        onPress: () => setShowGradingModal(true),
      },
    ];
  }, [
    academicLevel,
    copy.academicLevel,
    copy.email,
    copy.fullName,
    copy.gradingSystem,
    copy.major,
    copy.outOf,
    copy.university,
    email,
    fullName,
    gradingSystem,
    major,
    palette.background,
    palette.border,
    palette.textMuted,
    palette.textPrimary,
    university,
  ]);

  const languageOptions: SettingOption[] = useMemo(
    () => [
      {
        value: "en",
        label: copy.english,
        accessibilityLabel: "Set language to English",
      },
      {
        value: "ar",
        label: copy.arabic,
        accessibilityLabel: "Set language to Arabic",
      },
    ],
    [copy.arabic, copy.english],
  );

  const handleLogout = async () => {
    try {
      await store.logout();
    } finally {
      router.replace("/auth/login");
    }
  };

  return (
    <SafeAreaView style={[S.root, { backgroundColor: palette.background }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={palette.background}
      />

      <View
        style={[
          S.topBar,
          {
            borderBottomColor: palette.border,
            backgroundColor: palette.background,
          },
          Platform.OS === "android" && {
            paddingTop:
              (StatusBar.currentHeight || 0) +
              (isSmallScreen ? spacing.sm : spacing.md),
          },
        ]}
      >
        <TouchableOpacity
          style={[S.backBtn, { backgroundColor: palette.surfaceAlt }]}
          onPress={() => router.back()}
          activeOpacity={0.75}
        >
          <ChevronLeft
            size={22}
            color={palette.textPrimary}
            strokeWidth={2.4}
          />
        </TouchableOpacity>
        <Text style={[S.topTitle, { color: palette.textPrimary }]}>
          {copy.settingsTitle}
        </Text>
        <View style={S.topRightSpace} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          S.scroll,
          { paddingBottom: Math.max(insets.bottom, 18) + spacing.lg },
        ]}
      >
        <Text style={[S.sectionKicker, { color: palette.textPlaceholder }]}>
          {copy.accountKicker}
        </Text>
        <View style={S.profileHeader}>
          <Text style={[S.sectionTitle, { color: palette.textPrimary }]}>
            {copy.profileTitle}
          </Text>
          <Pressable
            onPress={openEditProfile}
            accessibilityRole="button"
            accessibilityLabel={copy.editProfile}
            style={({ pressed }) => [
              S.editProfileBtn,
              {
                borderColor: colors.primary,
                backgroundColor: pressed
                  ? colors.primary + "12"
                  : "transparent",
              },
            ]}
          >
            <Pencil size={12} color={colors.primary} strokeWidth={2.5} />
            <Text style={[S.editProfileBtnText, { color: colors.primary }]}>
              {copy.editProfile}
            </Text>
          </Pressable>
        </View>

        <View
          style={[
            S.card,
            { backgroundColor: palette.surface, borderColor: palette.border },
          ]}
        >
          {profileRows.map((row, i) => (
            <Row
              key={row.id}
              row={row}
              isLast={i === profileRows.length - 1}
              palette={palette}
            />
          ))}
        </View>

        <Text
          style={[
            S.sectionTitle,
            { marginTop: 24, color: palette.textPrimary },
          ]}
        >
          {copy.preferencesTitle}
        </Text>
        <Text style={[S.sectionSubTitle, { color: palette.textMuted }]}>
          {copy.preferencesSubTitle}
        </Text>

        <View style={S.preferenceList}>
          <PreferenceRow
            icon={<Globe size={18} color={palette.textMuted} strokeWidth={2} />}
            label={copy.languageLabel}
            description={copy.languageDescription}
            options={languageOptions}
            value={language}
            onChange={handleLanguageChange}
            palette={palette}
          />
          <ThemeToggleRow
            icon={<Moon size={18} color={palette.textMuted} strokeWidth={2} />}
            label={copy.themeLabel}
            description={copy.themeDescription}
            isDark={isDark}
            onChange={handleThemeChange}
            palette={palette}
          />
        </View>



        <TouchableOpacity
          style={[
            S.logoutBtn,
            { borderColor: palette.border, backgroundColor: palette.surface },
          ]}
          onPress={handleLogout}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel={copy.logout}
        >
          <LogOut size={17} color={colors.danger} strokeWidth={2.2} />
          <Text style={S.logoutText}>{copy.logout}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            S.deleteBtn,
            {
              borderColor: colors.danger + "40",
              backgroundColor: isDark
                ? colors.danger + "12"
                : colors.danger + "08",
            },
          ]}
          onPress={handleDeleteAccount}
          activeOpacity={0.75}
          disabled={isDeleting}
          accessibilityRole="button"
          accessibilityLabel={copy.deleteAccount}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color={colors.danger} />
          ) : (
            <>
              <Trash size={17} color={colors.danger} strokeWidth={2.2} />
              <Text style={S.logoutText}>{copy.deleteAccount}</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={showGradingModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGradingModal(false)}
      >
        <Pressable
          style={S.sheetOverlay}
          onPress={() => setShowGradingModal(false)}
        />
        <View style={[S.sheet, { backgroundColor: palette.background }]}>
          <View style={[S.sheetHeader, { borderBottomColor: palette.border }]}>
            <Text style={[S.sheetTitle, { color: palette.textPrimary }]}>
              {copy.gradingSystem}
            </Text>
            <TouchableOpacity
              onPress={() => setShowGradingModal(false)}
              activeOpacity={0.7}
            >
              <Text style={S.sheetDone}>{copy.done}</Text>
            </TouchableOpacity>
          </View>

          {(["4.0", "5.0"] as const).map((sys) => {
            const selected = gradingSystem === sys;
            return (
              <TouchableOpacity
                key={sys}
                activeOpacity={0.75}
                onPress={() => handleGradingSystemChange(sys)}
                style={[S.sheetOption, { borderBottomColor: palette.border }]}
              >
                <Text
                  style={[
                    S.sheetOptionText,
                    { color: selected ? colors.primary : palette.textPrimary },
                  ]}
                >
                  {copy.outOf} {sys}
                </Text>
                {selected ? <Text style={S.sheetCheck}>✓</Text> : null}
              </TouchableOpacity>
            );
          })}
        </View>
      </Modal>


    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  root: { flex: 1 },

  // ── Top bar ──
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: isSmallScreen ? 16 : 20,
    paddingVertical: isSmallScreen ? 10 : 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.light,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: {
    fontSize: 16,
    fontWeight: fontWeight.extrabold,
    letterSpacing: -0.3,
  },
  topRightSpace: { width: 36, height: 36 },

  // ── Scroll ──
  scroll: {
    paddingHorizontal: isSmallScreen ? 16 : 20,
    paddingTop: 20,
  },

  // ── Section labels ──
  sectionKicker: {
    fontSize: 10,
    fontWeight: fontWeight.extrabold,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: fontWeight.extrabold,
    letterSpacing: -0.3,
  },
  sectionSubTitle: {
    fontSize: 11.5,
    fontWeight: fontWeight.medium,
    marginTop: 2,
    marginBottom: 12,
    lineHeight: 16,
  },

  // ── Edit Profile outlined button ──
  editProfileBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  editProfileBtnText: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.1,
  },

  // ── Profile card ──
  card: {
    borderWidth: 1,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 0,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    flexShrink: 0,
  },
  rowText: { flex: 1 },
  rowLabel: {
    fontSize: 10,
    fontWeight: fontWeight.extrabold,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  rowValue: {
    fontSize: 13,
    fontWeight: fontWeight.semibold,
  },
  rowRight: { marginLeft: 10 },

  // ── Grading pill ──
  gradePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  gradePillText: {
    fontSize: 12,
    fontWeight: fontWeight.semibold,
  },

  // ── Preference cards ──
  preferenceList: {
    gap: 10,
  },
  preferenceRow: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  preferenceHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  preferenceIconBox: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    flexShrink: 0,
  },
  preferenceCopy: {
    flex: 1,
  },
  preferenceLabel: {
    fontSize: 13,
    fontWeight: fontWeight.bold,
    marginBottom: 3,
    letterSpacing: -0.1,
  },
  preferenceDescription: {
    fontSize: 11.5,
    fontWeight: fontWeight.medium,
    lineHeight: 17,
  },

  // ── Language segmented control ──
  segmentedControl: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  segmentButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  segmentButtonText: {
    fontSize: 12,
    fontWeight: fontWeight.semibold,
    textAlign: "center",
  },

  // ── Theme switch row ──
  themeSwitchGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: 8,
    flexShrink: 0,
  },

  // ── Action buttons ──
  logoutBtn: {
    marginTop: 20,
    borderWidth: 1,
    borderRadius: 14,
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  deleteBtn: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 14,
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: fontWeight.bold,
    color: colors.danger,
  },

  // ── Grading bottom sheet ──
  sheetOverlay: { flex: 1, backgroundColor: "rgba(15,23,42,0.4)" },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 4,
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: fontWeight.extrabold,
    letterSpacing: -0.2,
  },
  sheetDone: {
    fontSize: 14,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  sheetOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sheetOptionText: {
    fontSize: 14,
    fontWeight: fontWeight.semibold,
  },
  sheetCheck: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: fontWeight.bold as any,
  },
});
