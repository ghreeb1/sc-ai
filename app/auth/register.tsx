import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  StatusBar,
  ActivityIndicator,
  Modal,
  Pressable,
  Keyboard,
} from "react-native";
import { useRouter } from "expo-router";
import { User, Mail, BookOpen, GraduationCap, ChevronDown, Check } from "lucide-react-native";
import { useStore, useAppLocale, useThemeColors } from "../lib/store";

const Field = ({
  label,
  value,
  onChangeText,
  error,
  icon: Icon,
  ...props
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  error?: string;
  icon?: any;
  [key: string]: any;
}) => {
  const { isRTL } = useAppLocale();
  const themeColors = useThemeColors();
  const palette = {
    textPrimary: themeColors.foreground,
    textSecondary: themeColors.mutedForeground,
    border: themeColors.border,
  };

  return (
    <View style={S.fieldWrap}>
      <Text style={[S.fieldLabel, { textAlign: isRTL ? "right" : "left" }]}>{label}</Text>
      <View style={[
        S.inputRow, 
        { borderBottomColor: palette.border, flexDirection: isRTL ? "row-reverse" : "row" },
        error ? S.inputRowErr : null
      ]}>
        {Icon && <Icon size={15} color={error ? "#EF4444" : "#94A3B8"} strokeWidth={1.8} />}
        <TextInput
          style={[S.input, { color: palette.textPrimary, textAlign: isRTL ? "right" : "left" }]}
          value={value}
          onChangeText={onChangeText}
          placeholderTextColor={palette.textSecondary}
          autoCorrect={false}
          {...props}
        />
      </View>
      {error ? <Text style={[S.errText, { textAlign: isRTL ? "right" : "left" }]}>{error}</Text> : null}
    </View>
  );
};

const SelectField = ({
  label,
  valueText,
  onPress,
  error,
}: {
  label: string;
  valueText: string;
  onPress: () => void;
  error?: string;
}) => {
  const { t, isRTL } = useAppLocale();
  const themeColors = useThemeColors();
  const palette = {
    textPrimary: themeColors.foreground,
    textSecondary: themeColors.mutedForeground,
    border: themeColors.border,
  };

  return (
    <View style={S.fieldWrap}>
      <Text style={[S.fieldLabel, { textAlign: isRTL ? "right" : "left" }]}>{label}</Text>
      <TouchableOpacity 
        style={[
          S.selectRow, 
          { borderBottomColor: palette.border, flexDirection: isRTL ? "row-reverse" : "row" },
          error ? S.inputRowErr : null
        ]} 
        onPress={onPress} 
        activeOpacity={0.75}
      >
        <Text 
          style={[
            S.selectValue, 
            { textAlign: isRTL ? "right" : "left" },
            (!valueText || valueText === t("selectYear")) ? { color: palette.textSecondary } : { color: palette.textPrimary }
          ]} 
          numberOfLines={1}
        >
          {valueText}
        </Text>
        <ChevronDown size={18} color={palette.textPrimary} strokeWidth={2} />
      </TouchableOpacity>
      {error ? <Text style={[S.errText, { textAlign: isRTL ? "right" : "left" }]}>{error}</Text> : null}
    </View>
  );
};

export default function RegisterScreen() {
  const router = useRouter();
  const store = useStore();
  const { theme } = useStore();
  const { t, isRTL } = useAppLocale();
  const themeColors = useThemeColors();
  const isDark = theme === "dark";

  const palette = {
    background: themeColors.background,
    textPrimary: themeColors.foreground,
    textSecondary: themeColors.mutedForeground,
    border: themeColors.border,
    surface: themeColors.card,
  };

  const [formData, setFormData] = useState({
    fullName: "",
    email: "student@university.edu",
    major: "Computer Science",
    university: "",
    academicLevel: "1",
    enrollmentYear: null as number | null,
    gradingSystem: "4.0" as "4.0" | "5.0",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [activeSelect, setActiveSelect] = useState<null | "academicLevel" | "enrollmentYear">(null);

  const update = (key: string, value: any) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const handleSignup = () => {
    const e: Record<string, string> = {};
    if (!formData.fullName.trim()) e.fullName = t("errNameReq");
    if (!formData.email.trim()) e.email = t("errEmailReq");
    else if (!formData.email.includes("@")) e.email = t("errEmailInv");
    if (!formData.major.trim()) e.major = t("errMajorReq");
    if (!formData.enrollmentYear) e.enrollmentYear = t("errYearReq");
    setErrors(e);

    if (Object.keys(e).length === 0) {
      setLoading(true);
      setTimeout(() => {
        store.signup({
          fullName: formData.fullName,
          email: formData.email,
          major: formData.major,
          academicLevel: Number(formData.academicLevel),
          enrollmentYear: formData.enrollmentYear!,
          gradingSystem: formData.gradingSystem,
        });
        router.replace("/(tabs)");
        setLoading(false);
      }, 900);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);
  const academicLevels = ["1", "2", "3", "4", "5"];

  const openSelect = (type: "academicLevel" | "enrollmentYear") => {
    Keyboard.dismiss();
    setActiveSelect(type);
  };

  return (
    <SafeAreaView style={[S.root, { backgroundColor: palette.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={palette.background} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={S.flex}
      >
        <ScrollView
          style={S.flex}
          contentContainerStyle={S.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Branding ──────────────────────────────────────── */}
          <View style={[S.brand, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <View style={S.logoBox}>
              <Text style={S.logoSigma}>Σ</Text>
            </View>
            <View style={{ alignItems: isRTL ? "flex-end" : "flex-start" }}>
              <Text style={[S.logoName, { color: palette.textPrimary }]}>{t("appName")}</Text>
              <Text style={S.logoSub}>{t("tagline").toUpperCase()}</Text>
            </View>
          </View>

          <Text style={[S.title, { color: palette.textPrimary, textAlign: isRTL ? "right" : "left" }]}>
            {t("signup")}
          </Text>

          {/* ── Form ─────────────────────────────────────────── */}
          <View style={S.form}>
            <Field
              label={t("fullName").toUpperCase()}
              value={formData.fullName}
              onChangeText={(tStr) => update("fullName", tStr)}
              error={errors.fullName}
              placeholder={t("fullNamePlaceholder")}
              icon={User}
              textContentType="name"
              autoComplete="name"
            />

            <Field
              label={t("emailAddressLabel")}
              value={formData.email}
              onChangeText={(tStr) => update("email", tStr)}
              error={errors.email}
              placeholder={t("emailPlaceholder")}
              keyboardType="email-address"
              autoCapitalize="none"
              icon={Mail}
              textContentType="emailAddress"
              autoComplete="email"
            />

            <Field
              label={t("major").toUpperCase()}
              value={formData.major}
              onChangeText={(tStr) => update("major", tStr)}
              error={errors.major}
              placeholder={t("majorPlaceholder")}
              icon={BookOpen}
            />

            <Field
              label={t("university").toUpperCase()}
              value={formData.university}
              onChangeText={(tStr) => update("university", tStr)}
              placeholder={t("uniPlaceholder")}
              icon={GraduationCap}
            />

            {/* Academic Level & Enrollment Year — row */}
            <View style={[S.rowGrid, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <View style={{ flex: 1 }}>
                <SelectField
                  label={t("academicLevel").toUpperCase()}
                  valueText={`${t("yearLabel")} ${formData.academicLevel}`}
                  onPress={() => openSelect("academicLevel")}
                />
              </View>

              <View style={{ flex: 1 }}>
                <SelectField
                  label={t("enrollmentYear").toUpperCase()}
                  valueText={formData.enrollmentYear ? String(formData.enrollmentYear) : t("selectYear")}
                  onPress={() => openSelect("enrollmentYear")}
                  error={errors.enrollmentYear}
                />
              </View>
            </View>

            {/* Grading System */}
            <View style={S.fieldWrap}>
              <Text style={[S.fieldLabel, { textAlign: isRTL ? "right" : "left" }]}>{t("gradingSystem").toUpperCase()}</Text>
              <View style={[S.gradingRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                {(["4.0", "5.0"] as const).map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[
                      S.gradBtn,
                      { backgroundColor: palette.surface, borderColor: palette.border },
                      formData.gradingSystem === g && S.gradBtnActive,
                    ]}
                    onPress={() => update("gradingSystem", g)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        S.gradBtnText,
                        formData.gradingSystem === g && S.gradBtnTextActive,
                      ]}
                    >
                      {t("outOf")} {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Create account button */}
            <TouchableOpacity
              style={[S.btn, loading && { opacity: 0.72 }]}
              onPress={handleSignup}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#FFFFFF" size="small" />
                : <Text style={S.btnText}>{t("createAccount")}</Text>
              }
            </TouchableOpacity>

            <Modal
              visible={activeSelect !== null}
              transparent
              animationType="fade"
              onRequestClose={() => setActiveSelect(null)}
            >
              <Pressable style={S.selectOverlay} onPress={() => setActiveSelect(null)} />
              <View style={[S.selectSheet, { backgroundColor: palette.background }]}>
                <View style={[S.selectHeader, { borderBottomColor: palette.border, flexDirection: isRTL ? "row-reverse" : "row" }]}>
                  <Text style={[S.selectTitle, { color: palette.textPrimary }]}>
                    {activeSelect === "academicLevel" ? t("selectAcademicLevel") : t("selectEnrollmentYear")}
                  </Text>
                  <TouchableOpacity onPress={() => setActiveSelect(null)} activeOpacity={0.7}>
                    <Text style={S.selectDone}>{t("done")}</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  {(activeSelect === "academicLevel"
                    ? academicLevels.map((v) => ({ value: v, label: `${t("yearLabel")} ${v}` }))
                    : years.map((y) => ({ value: y, label: String(y) }))
                  ).map((opt) => {
                    const selected =
                      activeSelect === "academicLevel"
                        ? String(opt.value) === String(formData.academicLevel)
                        : Number(opt.value) === Number(formData.enrollmentYear);

                    return (
                      <TouchableOpacity
                        key={String(opt.value)}
                        style={[S.selectOption, { borderBottomColor: palette.border, flexDirection: isRTL ? "row-reverse" : "row" }]}
                        activeOpacity={0.75}
                        onPress={() => {
                          if (activeSelect === "academicLevel") {
                            update("academicLevel", String(opt.value));
                          } else {
                            update("enrollmentYear", Number(opt.value));
                          }
                          setActiveSelect(null);
                        }}
                      >
                        <Text style={[S.selectOptionText, { color: palette.textPrimary }]}>{opt.label}</Text>
                        {selected ? <Check size={18} color="#1E75FF" strokeWidth={2.5} /> : null}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </Modal>
          </View>

          {/* Footer */}
          <View style={[S.footer, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <Text style={[S.footerText, { color: palette.textSecondary }]}>{t("haveAccount")} </Text>
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
              <Text style={S.footerLink}>{t("login")}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 52, paddingBottom: 40 },

  brand: { alignItems: "center", gap: 14, marginBottom: 36 },
  logoBox: {
    width: 46, height: 46, borderRadius: 13, backgroundColor: "#1E75FF",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#1E75FF", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28, shadowRadius: 8, elevation: 5,
  },
  logoSigma: { fontSize: 22, fontWeight: "900", color: "#FFFFFF" },
  logoName: { fontSize: 19, fontWeight: "800", letterSpacing: 1 },
  logoSub: { fontSize: 9, fontWeight: "700", color: "#94A3B8", letterSpacing: 1.4, marginTop: 2 },

  title: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5, marginBottom: 28 },

  form: { gap: 0 },
  fieldWrap: { marginBottom: 20 },
  fieldLabel: { fontSize: 10.5, fontWeight: "700", color: "#64748B", letterSpacing: 1, marginBottom: 10 },
  // Underline-only input — clean, no box
  inputRow: {
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1.5,
    paddingBottom: 10,
    paddingHorizontal: 2,
  },
  inputRowErr: { borderBottomColor: "#EF4444" },
  input: { flex: 1, fontSize: 15, paddingVertical: 0 },
  errText: { fontSize: 11.5, color: "#EF4444", fontWeight: "500", marginTop: 5 },

  rowGrid: { gap: 20 },

  selectRow: {
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1.5,
    paddingBottom: 10,
    paddingHorizontal: 2,
    minHeight: 44,
  },
  selectValue: { fontSize: 15, fontWeight: "500", paddingVertical: 0, flex: 1 },

  selectOverlay: { flex: 1, backgroundColor: "rgba(15,23,42,0.35)" },
  selectSheet: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 18,
    maxHeight: "55%",
    marginTop: "auto",
  },
  selectHeader: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 10,
    borderBottomWidth: 1,
    marginBottom: 6,
  },
  selectTitle: { fontSize: 15, fontWeight: "800", letterSpacing: -0.2 },
  selectDone: { fontSize: 14, fontWeight: "700", color: "#1E75FF" },
  selectOption: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  selectOptionText: { fontSize: 15, fontWeight: "600" },

  gradingRow: { gap: 12 },
  gradBtn: {
    flex: 1, height: 48,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  gradBtnActive: { borderColor: "#1E75FF", backgroundColor: "#EFF6FF" },
  gradBtnText: { fontSize: 14, fontWeight: "600", color: "#64748B" },
  gradBtnTextActive: { color: "#1E75FF", fontWeight: "700" },

  btn: {
    backgroundColor: "#1E75FF", borderRadius: 14, height: 54,
    alignItems: "center", justifyContent: "center", marginTop: 8,
    shadowColor: "#1E75FF", shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  btnText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },

  footer: { justifyContent: "center", marginTop: 32 },
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14, color: "#1E75FF", fontWeight: "700" },
});
