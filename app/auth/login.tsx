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
} from "react-native";
import { useRouter } from "expo-router";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Globe, Sun, Moon } from "lucide-react-native";
import { useStore, useAppLocale, useThemeColors } from "../lib/store";

export default function LoginScreen() {
  const router = useRouter();
  const store = useStore();
  const { theme, setTheme, language, setLanguage } = useStore();
  const { t, isRTL } = useAppLocale();
  const themeColors = useThemeColors();
  const isDark = theme === "dark";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const palette = {
    background: themeColors.background,
    textPrimary: themeColors.foreground,
    textSecondary: themeColors.mutedForeground,
    textMuted: themeColors.mutedForeground,
    border: themeColors.border,
    primary: themeColors.primary,
    surface: themeColors.card,
    iconBg: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)",
  };

  const handleLogin = () => {
    const e: Record<string, string> = {};
    if (!email.trim()) e.email = t("errEmailReq");
    else if (!email.includes("@")) e.email = t("errEmailInv");
    if (!password) e.password = t("errPassReq");
    setErrors(e);

    if (Object.keys(e).length === 0) {
      setLoading(true);
      setTimeout(() => {
        store.login(email.trim());
        router.replace("/(tabs)");
        setLoading(false);
      }, 900);
    }
  };

  return (
    <SafeAreaView style={[S.root, { backgroundColor: palette.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={palette.background} />
      
      {/* ── Top Action Bar ──────────────────────────────────────── */}
      <View style={[S.topBar, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <TouchableOpacity
          onPress={() => setLanguage(language === "en" ? "ar" : "en")}
          style={[S.iconBtn, { backgroundColor: palette.iconBg }]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Globe size={18} color={palette.textPrimary} strokeWidth={2.2} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setTheme(isDark ? "light" : "dark")}
          style={[S.iconBtn, { backgroundColor: palette.iconBg }]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {isDark ? (
            <Sun size={18} color={palette.textPrimary} strokeWidth={2.2} />
          ) : (
            <Moon size={18} color={palette.textPrimary} strokeWidth={2.2} />
          )}
        </TouchableOpacity>
      </View>

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

          {/* ── Welcome copy ──────────────────────────────────── */}
          <Text style={[S.title, { color: palette.textPrimary, textAlign: isRTL ? "right" : "left" }]}>
            {t("welcomeBack")}
          </Text>
          <Text style={[S.subtitle, { color: palette.textSecondary, textAlign: isRTL ? "right" : "left" }]}>
            {t("signInToContinue")}
          </Text>

          {/* ── Form — no card, integrated into the white bg ─── */}
          <View style={S.form}>

            {/* Email */}
            <View style={S.fieldWrap}>
              <Text style={[S.fieldLabel, { textAlign: isRTL ? "right" : "left" }]}>{t("emailAddressLabel")}</Text>
              <View style={[
                S.inputRow,
                { borderBottomColor: palette.border, flexDirection: isRTL ? "row-reverse" : "row" },
                errors.email ? S.inputRowErr : null
              ]}>
                <Mail size={15} color={errors.email ? "#EF4444" : "#94A3B8"} strokeWidth={1.8} />
                <TextInput
                  style={[S.input, { color: palette.textPrimary, textAlign: isRTL ? "right" : "left" }]}
                  placeholder={t("emailPlaceholder")}
                  placeholderTextColor={palette.textSecondary}
                  value={email}
                  onChangeText={(t) => { setEmail(t); if (errors.email) setErrors({ ...errors, email: "" }); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>
              {errors.email ? <Text style={[S.errText, { textAlign: isRTL ? "right" : "left" }]}>{errors.email}</Text> : null}
            </View>

            {/* Password */}
            <View style={S.fieldWrap}>
              <Text style={[S.fieldLabel, { textAlign: isRTL ? "right" : "left" }]}>{t("passwordLabel")}</Text>
              <View style={[
                S.inputRow,
                { borderBottomColor: palette.border, flexDirection: isRTL ? "row-reverse" : "row" },
                errors.password ? S.inputRowErr : null
              ]}>
                <Lock size={15} color={errors.password ? "#EF4444" : "#94A3B8"} strokeWidth={1.8} />
                <TextInput
                  style={[S.input, { color: palette.textPrimary, textAlign: isRTL ? "right" : "left" }]}
                  placeholder={t("passwordPlaceholder")}
                  placeholderTextColor={palette.textSecondary}
                  value={password}
                  onChangeText={(t) => { setPassword(t); if (errors.password) setErrors({ ...errors, password: "" }); }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  {showPassword
                    ? <EyeOff size={15} color="#94A3B8" strokeWidth={1.8} />
                    : <Eye size={15} color="#94A3B8" strokeWidth={1.8} />
                  }
                </TouchableOpacity>
              </View>
              {errors.password ? <Text style={[S.errText, { textAlign: isRTL ? "right" : "left" }]}>{errors.password}</Text> : null}
            </View>

            {/* Forgot */}
            <TouchableOpacity style={[S.forgotRow, { alignSelf: isRTL ? "flex-start" : "flex-end" }]} activeOpacity={0.7}>
              <Text style={S.forgotText}>{t("forgotPassword")}</Text>
            </TouchableOpacity>

            {/* Sign-in button */}
            <TouchableOpacity
              style={[S.btn, { flexDirection: isRTL ? "row-reverse" : "row" }, loading && { opacity: 0.72 }]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#FFFFFF" size="small" />
                : <>
                    <Text style={S.btnText}>{t("signInBtn")}</Text>
                    <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.5} style={isRTL ? { transform: [{ rotate: "180deg" }] } : undefined} />
                  </>
              }
            </TouchableOpacity>
          </View>

          {/* ── Footer ────────────────────────────────────────── */}
          <View style={[S.footer, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <Text style={[S.footerText, { color: palette.textSecondary }]}>{t("noAccount")} </Text>
            <TouchableOpacity onPress={() => router.push("/auth/register")} activeOpacity={0.7}>
              <Text style={S.footerLink}>{t("createAccount")}</Text>
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
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: 40,
  },

  // Top Action Bar
  topBar: {
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 16 : 8,
    paddingBottom: 4,
    gap: 10,
    zIndex: 10,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  // Branding
  brand: { alignItems: "center", gap: 14, marginBottom: 48 },
  logoBox: {
    width: 46, height: 46, borderRadius: 13,
    backgroundColor: "#1E75FF",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#1E75FF", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28, shadowRadius: 8, elevation: 5,
  },
  logoSigma: { fontSize: 22, fontWeight: "900", color: "#FFFFFF" },
  logoName: { fontSize: 19, fontWeight: "800", letterSpacing: 1 },
  logoSub: { fontSize: 9, fontWeight: "700", color: "#94A3B8", letterSpacing: 1.4, marginTop: 2 },

  // Copy
  title: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5, marginBottom: 8 },
  subtitle: { fontSize: 14, fontWeight: "400", lineHeight: 20, marginBottom: 36 },

  // Form
  form: { gap: 0 },
  fieldWrap: { marginBottom: 22 },
  fieldLabel: {
    fontSize: 10.5, fontWeight: "700", color: "#64748B",
    letterSpacing: 1, marginBottom: 10,
  },
  // Underline-style input row (not a box — subtle bottom border only)
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

  forgotRow: { marginBottom: 28, marginTop: -4 },
  forgotText: { fontSize: 13.5, fontWeight: "600", color: "#1E75FF" },

  btn: {
    alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#1E75FF", borderRadius: 14, height: 54,
    shadowColor: "#1E75FF", shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  btnText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },

  footer: { justifyContent: "center", marginTop: 32 },
  footerText: { fontSize: 14, fontWeight: "400" },
  footerLink: { fontSize: 14, color: "#1E75FF", fontWeight: "700" },
});
