import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  TextInput,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Mail,
  Lock,
  ArrowRight,
  Globe,
  Sun,
  Moon,
  Eye,
  EyeOff,
  ChevronLeft,
} from "lucide-react-native";
import { useStore, useAppLocale, useThemeColors } from "../../lib/store";
import { ApiError } from "../../services/api";
import * as authService from "../../services/auth";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { theme, setTheme, language, setLanguage } = useStore();
  const { t, isRTL } = useAppLocale();
  const themeColors = useThemeColors();
  const isDark = theme === "dark";

  const palette = {
    background: themeColors.background,
    textPrimary: themeColors.foreground,
    textSecondary: themeColors.mutedForeground,
    border: themeColors.border,
    primary: themeColors.primary,
    surface: themeColors.card,
    iconBg: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)",
  };

  const [step, setStep] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState("");
  const [emailFocused, setEmailFocused] = useState(false);
  
  const [resetToken, setResetToken] = useState("");
  
  const [newPassword, setNewPassword] = useState("");
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleRequestReset = async () => {
    const e: Record<string, string> = {};
    if (!email.trim()) e.email = t("errEmailReq") || "Email is required";
    else if (!email.includes("@")) e.email = t("errEmailInv") || "Invalid email format";
    setErrors(e);

    if (Object.keys(e).length === 0) {
      setLoading(true);
      try {
        const response = await authService.forgotPassword({ email: email.trim() });
        if (response.reset_token) {
          setResetToken(response.reset_token);
          setStep("reset");
        } else {
          Alert.alert("Reset Link Sent", "If the email exists, a reset link will be provided.");
        }
      } catch (error) {
        const message = error instanceof ApiError ? error.message : "Unable to process request.";
        setErrors({ email: message });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleResetPassword = async () => {
    const e: Record<string, string> = {};
    if (!newPassword) e.password = t("errPassReq") || "Password is required";
    else if (newPassword.length < 8) e.password = "Password must be at least 8 characters";
    setErrors(e);

    if (Object.keys(e).length === 0) {
      setLoading(true);
      try {
        await authService.resetPassword({
          token: resetToken,
          new_password: newPassword,
        });
        Alert.alert("Success", "Your password has been updated.", [
          { text: "OK", onPress: () => router.replace("/auth/login") }
        ]);
      } catch (error) {
        const message = error instanceof ApiError ? error.message : "Unable to reset password.";
        setErrors({ password: message });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <SafeAreaView style={[S.root, { backgroundColor: palette.background }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={palette.background}
      />

      <View style={[S.topBar, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[S.iconBtn, { backgroundColor: palette.iconBg, marginRight: "auto" }]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft size={20} color={palette.textPrimary} strokeWidth={2.2} />
        </TouchableOpacity>

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

      <KeyboardAwareScrollView
        style={S.flex}
        contentContainerStyle={S.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraScrollHeight={20}
      >
            <View style={[S.brand, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <View style={S.logoBox}>
                <Text style={S.logoSigma}>Σ</Text>
              </View>
              <View style={{ alignItems: isRTL ? "flex-end" : "flex-start" }}>
                <Text style={[S.logoName, { color: palette.textPrimary }]}>
                  {t("appName")}
                </Text>
                <Text style={S.logoSub}>{t("tagline").toUpperCase()}</Text>
              </View>
            </View>

            <Text
              style={[
                S.title,
                { color: palette.textPrimary, textAlign: isRTL ? "right" : "left" },
              ]}
            >
              {step === "request" ? t("forgotPassword") || "Forgot Password" : "Reset Password"}
            </Text>
            <Text
              style={[
                S.subtitle,
                { color: palette.textSecondary, textAlign: isRTL ? "right" : "left" },
              ]}
            >
              {step === "request"
                ? "Enter your email to receive a password reset link."
                : "Please enter your new password."}
            </Text>

            <View style={S.form}>
              {step === "request" ? (
                <>
                  {/* Email */}
                  <View style={S.fieldWrap}>
                    <Text style={[S.fieldLabel, { textAlign: isRTL ? "right" : "left" }]}>
                      {t("emailAddressLabel")}
                    </Text>
                    <View style={[
                      S.inputRow,
                      { borderColor: errors.email ? "#EF4444" : emailFocused ? palette.primary : palette.border, backgroundColor: palette.surface, flexDirection: isRTL ? "row-reverse" : "row" },
                    ]}>
                      <Mail size={18} color={errors.email ? "#EF4444" : emailFocused ? palette.primary : "#94A3B8"} strokeWidth={1.8} />
                      <TextInput
                        style={[S.input, { color: palette.textPrimary, textAlign: isRTL ? "right" : "left" }]}
                        placeholder={t("emailPlaceholder")}
                        placeholderTextColor={palette.textSecondary}
                        value={email}
                        onChangeText={(v) => { setEmail(v); if (errors.email) setErrors({ ...errors, email: "" }); }}
                        onFocus={() => setEmailFocused(true)}
                        onBlur={() => setEmailFocused(false)}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="done"
                        onSubmitEditing={handleRequestReset}
                      />
                    </View>
                    {errors.email ? <Text style={[S.errText, { textAlign: isRTL ? "right" : "left" }]}>{errors.email}</Text> : null}
                  </View>

                  <TouchableOpacity
                    style={[S.btn, { flexDirection: isRTL ? "row-reverse" : "row", marginTop: 8 }, loading && { opacity: 0.72 }]}
                    onPress={handleRequestReset}
                    disabled={loading}
                    activeOpacity={0.85}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Text style={S.btnText}>Send Reset Link</Text>
                        <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.5} style={isRTL ? { transform: [{ rotate: "180deg" }] } : undefined} />
                      </>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {/* New Password */}
                  <View style={S.fieldWrap}>
                    <Text style={[S.fieldLabel, { textAlign: isRTL ? "right" : "left" }]}>
                      NEW PASSWORD
                    </Text>
                    <View style={[
                      S.inputRow,
                      { borderColor: errors.password ? "#EF4444" : passwordFocused ? palette.primary : palette.border, backgroundColor: palette.surface, flexDirection: isRTL ? "row-reverse" : "row" },
                    ]}>
                      <Lock size={18} color={errors.password ? "#EF4444" : passwordFocused ? palette.primary : "#94A3B8"} strokeWidth={1.8} />
                      <TextInput
                        style={[S.input, { color: palette.textPrimary, textAlign: isRTL ? "right" : "left" }]}
                        placeholder="••••••••"
                        placeholderTextColor={palette.textSecondary}
                        value={newPassword}
                        onChangeText={(v) => { setNewPassword(v); if (errors.password) setErrors({ ...errors, password: "" }); }}
                        onFocus={() => setPasswordFocused(true)}
                        onBlur={() => setPasswordFocused(false)}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="done"
                        onSubmitEditing={handleResetPassword}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        {showPassword
                          ? <EyeOff size={18} color="#94A3B8" strokeWidth={1.8} />
                          : <Eye size={18} color="#94A3B8" strokeWidth={1.8} />
                        }
                      </TouchableOpacity>
                    </View>
                    {errors.password ? <Text style={[S.errText, { textAlign: isRTL ? "right" : "left" }]}>{errors.password}</Text> : null}
                  </View>

                  <TouchableOpacity
                    style={[S.btn, { flexDirection: isRTL ? "row-reverse" : "row", marginTop: 8 }, loading && { opacity: 0.72 }]}
                    onPress={handleResetPassword}
                    disabled={loading}
                    activeOpacity={0.85}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Text style={S.btnText}>Reset Password</Text>
                        <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.5} style={isRTL ? { transform: [{ rotate: "180deg" }] } : undefined} />
                      </>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </View>
        </KeyboardAwareScrollView>
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
  brand: { alignItems: "center", gap: 14, marginBottom: 20 },
  logoBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#1E75FF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1E75FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 5,
  },
  logoSigma: { fontSize: 20, fontWeight: "900", color: "#FFFFFF" },
  logoName: { fontSize: 18, fontWeight: "800", letterSpacing: 1 },
  logoSub: {
    fontSize: 9,
    fontWeight: "700",
    color: "#94A3B8",
    letterSpacing: 1.4,
    marginTop: 2,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 20,
    marginBottom: 20,
  },
  form: { gap: 0 },
  fieldWrap: { marginBottom: 22 },
  fieldLabel: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 1,
    marginBottom: 10,
  },
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
  errText: {
    fontSize: 11.5,
    color: "#EF4444",
    fontWeight: "500",
    marginTop: 5,
  },
  btn: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#1E75FF",
    borderRadius: 14,
    height: 56,
    shadowColor: "#1E75FF",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  btnText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
});
