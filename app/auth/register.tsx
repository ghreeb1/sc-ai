import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  TextInput,
  TextInputProps,
  StatusBar,
  ActivityIndicator,
  Modal,
  Pressable,
  Keyboard,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { User, Mail, Lock, Eye, EyeOff, BookOpen, GraduationCap, ChevronDown, Check } from "lucide-react-native";
import { useStore, useAppLocale, useThemeColors } from "../../lib/store";
import { ApiError } from "../../services/api";
import * as authService from "../../services/auth";

interface FieldProps extends TextInputProps {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  error?: string;
  icon?: any;
}

const Field = React.forwardRef<TextInput, FieldProps>(({
  label,
  value,
  onChangeText,
  error,
  icon: Icon,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const { isRTL } = useAppLocale();
  const themeColors = useThemeColors();
  const palette = {
    textPrimary: themeColors.foreground,
    textSecondary: themeColors.mutedForeground,
    border: themeColors.border,
    primary: themeColors.primary,
    surface: themeColors.card,
  };

  return (
    <View style={S.fieldWrap}>
      <Text style={[S.fieldLabel, { textAlign: isRTL ? "right" : "left" }]}>{label}</Text>
      <View style={[
        S.inputRow,
        { borderColor: error ? "#EF4444" : isFocused ? palette.primary : palette.border, backgroundColor: palette.surface, flexDirection: isRTL ? "row-reverse" : "row" },
      ]}>
        {Icon && <Icon size={18} color={error ? "#EF4444" : isFocused ? palette.primary : "#94A3B8"} strokeWidth={1.8} />}
        <TextInput
          ref={ref}
          style={[S.input, { color: palette.textPrimary, textAlign: isRTL ? "right" : "left" }]}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholderTextColor={palette.textSecondary}
          autoCorrect={false}
          {...props}
        />
      </View>
      {error ? <Text style={[S.errText, { textAlign: isRTL ? "right" : "left" }]}>{error}</Text> : null}
    </View>
  );
});

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
    surface: themeColors.card,
  };

  return (
    <View style={S.fieldWrap}>
      <Text style={[S.fieldLabel, { textAlign: isRTL ? "right" : "left" }]}>{label}</Text>
      <TouchableOpacity 
        style={[
          S.selectRow,
          { borderColor: error ? "#EF4444" : palette.border, backgroundColor: palette.surface, flexDirection: isRTL ? "row-reverse" : "row" },
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

  // Allowed total_credit_hours values as defined by the backend enum
  const CREDIT_HOUR_OPTIONS = [120, 124, 126, 128, 130, 132, 134, 136, 138, 140, 142, 144, 146, 150];

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    major: "",
    university: "",
    academicLevel: "1",
    enrollmentYear: null as number | null,
    totalCreditHours: null as number | null,
    gradingSystem: "4.0" as "4.0" | "5.0",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [activeSelect, setActiveSelect] = useState<null | "academicLevel" | "enrollmentYear" | "totalCreditHours">(null);

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const majorRef = useRef<TextInput>(null);
  const uniRef = useRef<TextInput>(null);

  const update = (key: string, value: any) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const handleSignup = async () => {
    const e: Record<string, string> = {};
    if (!formData.fullName.trim()) e.fullName = t("errNameReq");
    else if (formData.fullName.trim().length < 2) e.fullName = "Name must be at least 2 characters";
    if (!formData.email.trim()) e.email = t("errEmailReq");
    else if (!formData.email.includes("@")) e.email = t("errEmailInv");
    if (!formData.password) e.password = t("errPassReq");
    else if (formData.password.length < 8) e.password = "Password must be at least 8 characters";
    if (!formData.major.trim()) e.major = t("errMajorReq");
    if (!formData.enrollmentYear) e.enrollmentYear = t("errYearReq");
    if (!formData.totalCreditHours) e.totalCreditHours = t("errTotalCreditHoursReq");
    setErrors(e);

    if (Object.keys(e).length === 0) {
      setLoading(true);
      try {
        const session = await authService.register({
          email: formData.email.trim(),
          password: formData.password,
          name: formData.fullName.trim(),
          major: formData.major.trim(),
          university: formData.university.trim() || null,
          level: Number(formData.academicLevel),
          enrollment_year: formData.enrollmentYear!,
          total_credit_hours: formData.totalCreditHours!,
        });
        store.setAuthSession(session);
        router.replace("/(tabs)");
      } catch (error) {
        const message = error instanceof ApiError ? error.message : "Unable to create account. Please try again.";
        setErrors({ password: message });
      } finally {
        setLoading(false);
      }
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);
  const academicLevels = ["1", "2", "3", "4"];

  const openSelect = (type: "academicLevel" | "enrollmentYear" | "totalCreditHours") => {
    Keyboard.dismiss();
    setActiveSelect(type);
  };

  return (
    <SafeAreaView style={[S.root, { backgroundColor: palette.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={palette.background} />
      <KeyboardAwareScrollView
        style={S.flex}
        contentContainerStyle={S.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraScrollHeight={30}
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
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
              blurOnSubmit={false}
            />

            <Field
              ref={emailRef}
              label={t("emailAddressLabel")}
              value={formData.email}
              onChangeText={(tStr) => update("email", tStr)}
              error={errors.email}
              placeholder={t("emailPlaceholder")}
              icon={Mail}
              keyboardType="email-address"
              autoCapitalize="none"
              textContentType="emailAddress"
              autoComplete="email"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              blurOnSubmit={false}
            />

            <Field
              ref={passwordRef}
              label={t("passwordLabel")}
              value={formData.password}
              onChangeText={(tStr) => update("password", tStr)}
              error={errors.password}
              placeholder={t("passwordPlaceholder")}
              icon={Lock}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              textContentType="newPassword"
              autoComplete="password-new"
              returnKeyType="next"
              onSubmitEditing={() => majorRef.current?.focus()}
              blurOnSubmit={false}
            />

            <Field
              ref={majorRef}
              label={t("major").toUpperCase()}
              value={formData.major}
              onChangeText={(tStr) => update("major", tStr)}
              error={errors.major}
              placeholder={t("majorPlaceholder")}
              icon={BookOpen}
              returnKeyType="next"
              onSubmitEditing={() => uniRef.current?.focus()}
              blurOnSubmit={false}
            />

            <Field
              ref={uniRef}
              label={t("university").toUpperCase()}
              value={formData.university}
              onChangeText={(tStr) => update("university", tStr)}
              placeholder={t("uniPlaceholder")}
              icon={GraduationCap}
              returnKeyType="done"
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

            {/* Total Credit Hours */}
            <SelectField
              label={t("totalCreditHoursLabel")}
              valueText={formData.totalCreditHours ? `${formData.totalCreditHours} ${t("creditShort")}` : t("totalCreditHoursSelect")}
              onPress={() => openSelect("totalCreditHours")}
              error={errors.totalCreditHours}
            />

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
                    {activeSelect === "academicLevel"
                      ? t("selectAcademicLevel")
                      : activeSelect === "enrollmentYear"
                      ? t("selectEnrollmentYear")
                      : t("totalCreditHoursSelect")}
                  </Text>
                  <TouchableOpacity onPress={() => setActiveSelect(null)} activeOpacity={0.7}>
                    <Text style={S.selectDone}>{t("done")}</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  {(activeSelect === "academicLevel"
                    ? academicLevels.map((v) => ({ value: v, label: `${t("yearLabel")} ${v}` }))
                    : activeSelect === "enrollmentYear"
                    ? years.map((y) => ({ value: y, label: String(y) }))
                    : CREDIT_HOUR_OPTIONS.map((h) => ({ value: h, label: `${h} ${t("creditShort")}` }))
                  ).map((opt) => {
                    const selected =
                      activeSelect === "academicLevel"
                        ? String(opt.value) === String(formData.academicLevel)
                        : activeSelect === "enrollmentYear"
                        ? Number(opt.value) === Number(formData.enrollmentYear)
                        : Number(opt.value) === Number(formData.totalCreditHours);

                    return (
                      <TouchableOpacity
                        key={String(opt.value)}
                        style={[S.selectOption, { borderBottomColor: palette.border, flexDirection: isRTL ? "row-reverse" : "row" }]}
                        activeOpacity={0.75}
                        onPress={() => {
                          if (activeSelect === "academicLevel") {
                            update("academicLevel", String(opt.value));
                          } else if (activeSelect === "enrollmentYear") {
                            update("enrollmentYear", Number(opt.value));
                          } else {
                            update("totalCreditHours", Number(opt.value));
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
        </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 52, paddingBottom: 40 },

  brand: { alignItems: "center", gap: 14, marginBottom: 20 },
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
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1.5,
    borderRadius: 14,
    height: 54,
    paddingHorizontal: 16,
  },
  input: { flex: 1, fontSize: 15, paddingVertical: 0 },
  errText: { fontSize: 11.5, color: "#EF4444", fontWeight: "500", marginTop: 5 },

  rowGrid: { gap: 12 },

  selectRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderRadius: 14,
    height: 54,
    paddingHorizontal: 16,
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
