import React, { useMemo, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Modal,
  Pressable,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
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
  Sun,
  Moon,
} from "lucide-react-native";
import { useStore } from "../lib/store";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  borderRadius,
  colors,
  fontWeight,
  isSmallScreen,
  shadows,
  spacing,
} from "../lib/constants";
import { Colors } from "../lib/theme";

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

const SETTINGS_COPY = {
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
  },
} as const;

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
      activeOpacity={row.onPress ? 0.75 : 1}
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

export default function SettingsScreen() {
  const router = useRouter();
  const store = useStore();
  const [showGradingModal, setShowGradingModal] = useState(false);
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

  const themeOptions: SettingOption[] = useMemo(
    () => [
      {
        value: "light",
        label: copy.lightMode,
        icon: (
          <Sun
            size={15}
            color={theme === "light" ? colors.primary : palette.textMuted}
            strokeWidth={2.1}
          />
        ),
        accessibilityLabel: "Set theme to light mode",
      },
      {
        value: "dark",
        label: copy.darkMode,
        icon: (
          <Moon
            size={15}
            color={theme === "dark" ? colors.primary : palette.textMuted}
            strokeWidth={2.1}
          />
        ),
        accessibilityLabel: "Set theme to dark mode",
      },
    ],
    [copy.darkMode, copy.lightMode, palette.textMuted, theme],
  );

  const handleLogout = () => {
    store.logout();
    router.replace("/auth/login");
  };

  const hasCourses = store.courses.length > 0;

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
        <Text style={[S.sectionTitle, { color: palette.textPrimary }]}>
          {copy.profileTitle}
        </Text>

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
            { marginTop: 18, color: palette.textPrimary },
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
            onChange={(nextValue) =>
              store.setLanguage(nextValue as "en" | "ar")
            }
            palette={palette}
          />
          <PreferenceRow
            icon={<Sun size={18} color={palette.textMuted} strokeWidth={2} />}
            label={copy.themeLabel}
            description={copy.themeDescription}
            options={themeOptions}
            value={theme}
            onChange={(nextValue) =>
              store.setTheme(nextValue as "light" | "dark")
            }
            palette={palette}
          />
        </View>

        <Text
          style={[
            S.sectionTitle,
            { marginTop: 18, color: palette.textPrimary },
          ]}
        >
          {copy.curriculumTitle}
        </Text>
        <View
          style={[
            S.managerCard,
            { backgroundColor: palette.surface, borderColor: palette.border },
          ]}
        >
          <View
            style={[S.managerIcon, { backgroundColor: palette.surfaceAlt }]}
          >
            <BookOpen size={20} color={palette.textMuted} strokeWidth={2} />
          </View>
          <Text style={[S.managerTitle, { color: palette.textPrimary }]}>
            {hasCourses
              ? `${store.courses.length} ${copy.coursesSuffix}`
              : copy.noCourses}
          </Text>
          <Text style={[S.managerSub, { color: palette.textMuted }]}>
            {hasCourses ? copy.curriculumPresent : copy.curriculumEmpty}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            S.logoutBtn,
            { borderColor: palette.border, backgroundColor: palette.surface },
          ]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <LogOut size={18} color={colors.danger} strokeWidth={2.2} />
          <Text style={S.logoutText}>{copy.logout}</Text>
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
                onPress={() => {
                  store.updateGradingSystem(sys);
                  setShowGradingModal(false);
                }}
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
  root: { flex: 1, backgroundColor: colors.background.primary },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: isSmallScreen ? spacing.md : spacing.lg,
    paddingVertical: isSmallScreen ? spacing.sm : spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    backgroundColor: colors.background.primary,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: {
    fontSize: 16,
    fontWeight: fontWeight.extrabold,
    color: colors.text.primary,
  },
  topRightSpace: { width: 38, height: 38 },

  scroll: {
    paddingHorizontal: isSmallScreen ? spacing.md : spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },

  sectionKicker: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.text.placeholder,
    letterSpacing: 1.2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginTop: 10,
    marginBottom: 10,
  },
  sectionSubTitle: {
    fontSize: 11.5,
    fontWeight: fontWeight.medium,
    marginTop: -4,
    marginBottom: 10,
  },

  card: {
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.xl,
    overflow: "hidden",
    ...shadows.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(226,232,240,0.65)",
  },
  rowIconBox: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: colors.background.tertiary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  rowText: { flex: 1 },
  rowLabel: {
    fontSize: 10.5,
    fontWeight: fontWeight.medium,
    color: colors.text.placeholder,
    marginBottom: 2,
  },
  rowValue: {
    fontSize: 12.5,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  rowRight: { marginLeft: 10 },

  gradePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: colors.background.primary,
  },
  gradePillText: {
    fontSize: 12,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },

  preferenceList: {
    gap: 12,
  },
  preferenceRow: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    paddingHorizontal: 14,
    paddingVertical: 14,
    ...shadows.sm,
  },
  preferenceHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  preferenceIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  preferenceCopy: {
    flex: 1,
  },
  preferenceLabel: {
    fontSize: 12.5,
    fontWeight: fontWeight.bold,
    marginBottom: 3,
  },
  preferenceDescription: {
    fontSize: 11.5,
    fontWeight: fontWeight.medium,
    lineHeight: 17,
  },
  segmentedControl: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  segmentButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
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

  managerCard: {
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.xl,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: "center",
    ...shadows.sm,
  },
  managerIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: colors.background.tertiary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  managerTitle: {
    fontSize: 13,
    fontWeight: fontWeight.extrabold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  managerSub: {
    fontSize: 11.5,
    fontWeight: fontWeight.medium,
    color: colors.text.muted,
    textAlign: "center",
  },

  logoutBtn: {
    marginTop: 18,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 12,
    backgroundColor: colors.background.card,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    ...shadows.sm,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: fontWeight.bold,
    color: colors.danger,
  },

  sheetOverlay: { flex: 1, backgroundColor: "rgba(15,23,42,0.35)" },
  sheet: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 18,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(226,232,240,0.9)",
    marginBottom: 6,
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: fontWeight.extrabold,
    color: colors.text.primary,
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
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(226,232,240,0.65)",
  },
  sheetOptionText: {
    fontSize: 14,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  sheetCheck: {
    fontSize: 16,
    fontWeight: fontWeight.black,
    color: colors.primary,
  },
});
