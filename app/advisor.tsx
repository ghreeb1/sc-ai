import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  ArrowUp,
  Copy,
  RefreshCcw,
  SquarePen,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppLocale, useStore, useThemeColors } from "./lib/store";
import { fontWeight, isSmallScreen, spacing } from "./lib/constants";

function ActionButton({
  icon,
  label,
  onPress,
  active = false,
  color,
  textColor,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  active?: boolean;
  color: string;
  textColor: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.actionButton,
        {
          backgroundColor: active ? color + "14" : "transparent",
          borderColor: active ? color + "30" : "transparent",
        },
      ]}
    >
      {icon}
      <Text style={[styles.actionLabel, { color: active ? color : textColor }]}>{label}</Text>
    </Pressable>
  );
}

function StreamingCursor({ color }: { color: string }) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0, duration: 520, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 520, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return <Animated.View style={[styles.cursor, { backgroundColor: color, opacity }]} />;
}

export default function AdvisorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const store = useStore();
  const themeColors = useThemeColors();
  const { language, isRTL } = useAppLocale();
  const isDark = store.theme === "dark";

  const palette = useMemo(
    () => ({
      background: isDark ? "#020617" : "#F8FAFC",
      headerBackground: isDark ? "#020617" : "#FFFFFF",
      surface: isDark ? "#0F172A" : "#FFFFFF",
      surfaceBorder: isDark ? "#1E293B" : "#E5E7EB",
      subtitle: isDark ? "#94A3B8" : "#64748B",
      text: isDark ? "#F8FAFC" : "#0F172A",
      mutedText: isDark ? "#94A3B8" : "#64748B",
      userBubble: isDark ? "#1D4ED8" : "#DBEAFE",
      userText: isDark ? "#EFF6FF" : "#1E3A8A",
      assistantBubble: isDark ? "#0F172A" : "#FFFFFF",
      assistantBorder: isDark ? "#243244" : "#E5E7EB",
      assistantText: isDark ? "#E2E8F0" : "#0F172A",
      composer: isDark ? "#0B1220" : "#FFFFFF",
      composerBorder: isDark ? "#1E293B" : "#E5E7EB",
      placeholder: isDark ? "#94A3B8" : "#64748B",
      primary: themeColors.primary || "#2563EB",
      shadow: isDark ? "#000000" : "#0F172A",
      chipBg: isDark ? "#0F172A" : "#FFFFFF",
      chipBorder: isDark ? "#1E293B" : "#E2E8F0",
    }),
    [isDark, themeColors.primary]
  );

  const responses = useMemo(
    () =>
      language === "ar"
        ? [
            "لبناء فصل دراسي متوازن، ابدأ بالمقررات الأساسية ذات الأولوية ثم وزع المواد الثقيلة مع مواد متوسطة حتى لا يتكدس عليك الضغط في أسبوع واحد. إذا شاركتني الساعات المتاحة والمقررات المتبقية سأقترح لك خطة مناسبة.",
            "لتحسين معدلك، ركز على المقررات الأعلى تأثيراً في الخطة، وضع جدول مذاكرة ثابت، وحدد مادتين يمكن رفع نتيجتهما بسرعة. إذا أخبرتني بمعدلك الحالي وساعاتك فسأحسب لك أفضل سيناريو للفصل القادم.",
            "لفهم المتطلبات السابقة، انظر إلى كل مقرر كجزء من سلسلة. الأفضل أن تبدأ بالمقرر الذي يفتح لك أكثر من خيار لاحقاً حتى لا تتأخر في التخرج.",
            "يمكنني مساعدتك في اختيار المقررات القادمة بناءً على مستواك الحالي، والمقررات المكتملة، وعدد الساعات التي تريد تسجيلها هذا الفصل.",
          ]
        : [
            "To build a balanced semester, start with your highest-priority core courses and mix heavy classes with medium-load ones so your weekly workload stays sustainable. If you share your remaining courses and target credits, I can draft a smart plan.",
            "To improve your GPA, focus on the courses with the biggest grade impact, set a consistent study rhythm, and identify two classes where a one-letter improvement is realistic. If you tell me your current GPA and credits, I can estimate the best path.",
            "Prerequisites work best when you think in chains. I recommend taking the course that unlocks the most downstream options first so future registration stays flexible.",
            "I can recommend courses for next term based on your current level, completed courses, and how many credits you want to carry this semester.",
          ],
    [language]
  );

  const suggestions = useMemo(
    () =>
      language === "ar"
        ? [
            "ابنِ خطتي للفصل",
            "حسّن معدلي",
            "متطلبات التخرج",
            "اقترح مقررات",
            "اشرح المتطلبات السابقة",
          ]
        : [
            "Build my semester plan",
            "Improve my GPA",
            "Graduation requirements",
            "Recommend courses",
            "Explain prerequisites",
          ],
    [language]
  );

  const labels = useMemo(
    () => ({
      title: language === "ar" ? "المستشار الذكي" : "AI Advisor",
      subtitle: language === "ar" ? "مساعدك الأكاديمي" : "Your academic assistant",
      placeholder:
        language === "ar"
          ? "اسأل أي شيء عن رحلتك الأكاديمية..."
          : "Ask anything about your academic journey...",
      greetingName:
        language === "ar"
          ? `مرحباً، ${store.profile?.fullName?.split(" ")[0] || "Student"}`
          : `Hi, ${store.profile?.fullName?.split(" ")[0] || "Student"}`,
      greetingPrompt: language === "ar" ? "كيف يمكنني مساعدتك اليوم؟" : "How can I help you today?",
      newChat: language === "ar" ? "محادثة جديدة" : "New chat",
      copy: language === "ar" ? "نسخ" : "Copy",
      copied: language === "ar" ? "تم النسخ" : "Copied",
      regenerate: language === "ar" ? "إعادة" : "Regenerate",
      like: language === "ar" ? "أعجبني" : "Like",
      dislike: language === "ar" ? "لم يعجبني" : "Dislike",
      back: language === "ar" ? "رجوع" : "Back",
    }),
    [language, store.profile?.fullName]
  );

  const [input, setInput] = useState("");
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamBuffer, setStreamBuffer] = useState("");
  const [feedback, setFeedback] = useState<Record<string, "up" | "down" | undefined>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const streamIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const currentChat = useMemo(() => {
    return currentChatId ? store.chatHistory.find((chat) => chat.id === currentChatId) ?? null : null;
  }, [currentChatId, store.chatHistory]);

  useEffect(() => {
    if (!currentChatId && store.chatHistory.length > 0) {
      setCurrentChatId(store.chatHistory[0].id);
    }
  }, [currentChatId, store.chatHistory]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 80);
    return () => clearTimeout(timeout);
  }, [currentChat?.messages, streamBuffer]);

  useEffect(() => {
    return () => {
      if (streamIntervalRef.current) {
        clearInterval(streamIntervalRef.current);
      }
    };
  }, []);

  const animateMessages = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  };

  const nextResponse = useCallback(() => {
    return responses[Math.floor(Math.random() * responses.length)];
  }, [responses]);

  const startStream = useCallback(
    (chatId: string, fullText: string) => {
      setIsStreaming(true);
      setStreamBuffer("");

      let charIndex = 0;
      streamIntervalRef.current = setInterval(() => {
        const chunkSize = Math.floor(Math.random() * 4) + 2;
        charIndex = Math.min(charIndex + chunkSize, fullText.length);
        setStreamBuffer(fullText.slice(0, charIndex));

        if (charIndex >= fullText.length) {
          clearInterval(streamIntervalRef.current!);
          streamIntervalRef.current = null;
          setIsStreaming(false);
          setStreamBuffer("");
          animateMessages();
          store.appendMessage(chatId, "assistant", fullText);
        }
      }, 30);
    },
    [store]
  );

  const handleNewChat = useCallback(() => {
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = null;
    }
    setIsStreaming(false);
    setStreamBuffer("");
    animateMessages();
    const id = store.addChat(labels.newChat);
    setCurrentChatId(id);
  }, [labels.newChat, store]);

  const handleSend = useCallback(
    (message: string) => {
      const trimmed = message.trim();
      if (!trimmed || isStreaming) return;

      let chatId = currentChatId;
      if (!chatId) {
        chatId = store.addChat(trimmed);
        setCurrentChatId(chatId);
      }

      animateMessages();
      store.appendMessage(chatId, "user", trimmed);
      setInput("");

      const response = nextResponse();
      setTimeout(() => startStream(chatId!, response), 260);
    },
    [currentChatId, isStreaming, nextResponse, startStream, store]
  );

  const handleRegenerate = useCallback(() => {
    if (!currentChatId || isStreaming) return;
    setTimeout(() => startStream(currentChatId, nextResponse()), 140);
  }, [currentChatId, isStreaming, nextResponse, startStream]);

  const handleCopy = useCallback(async (message: string, key: string) => {
    try {
      const clipboard = (globalThis as any)?.navigator?.clipboard;
      if (clipboard?.writeText) {
        await clipboard.writeText(message);
      }
    } catch {}

    setCopiedKey(key);
    setTimeout(() => setCopiedKey((current) => (current === key ? null : current)), 1400);
  }, []);

  const handleFeedback = useCallback((key: string, value: "up" | "down") => {
    setFeedback((current) => ({
      ...current,
      [key]: current[key] === value ? undefined : value,
    }));
  }, []);

  const isEmptyState = !currentChat || (currentChat.messages.length === 0 && !isStreaming);

  return (
    <SafeAreaView edges={["top", "left", "right", "bottom"]} style={[styles.root, { backgroundColor: palette.background }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={palette.headerBackground}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <View
          style={[
            styles.header,
            {
              backgroundColor: palette.headerBackground,
              borderBottomColor: palette.surfaceBorder,
              flexDirection: isRTL ? "row-reverse" : "row",
              paddingTop: Math.max(insets.top, 8),
            },
          ]}
        >
          <TouchableOpacity
            accessibilityLabel={labels.back}
            onPress={() => router.back()}
            activeOpacity={0.8}
            style={styles.headerIconButton}
          >
            <ArrowLeft
              size={22}
              color={palette.text}
              strokeWidth={2.2}
              style={isRTL ? { transform: [{ rotate: "180deg" }] } : undefined}
            />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: palette.text }]}>{labels.title}</Text>
            <Text style={[styles.headerSubtitle, { color: palette.subtitle }]}>{labels.subtitle}</Text>
          </View>

          <TouchableOpacity
            accessibilityLabel={labels.newChat}
            onPress={handleNewChat}
            activeOpacity={0.8}
            style={styles.headerIconButton}
          >
            <SquarePen size={20} color={palette.text} strokeWidth={2.2} />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          <ScrollView
            ref={scrollRef}
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {isEmptyState ? (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyTitle, { color: palette.text, textAlign: isRTL ? "right" : "left" }]}>
                  {"\u{1F44B}"} {labels.greetingName}
                </Text>
                <Text style={[styles.emptySubtitle, { color: palette.subtitle, textAlign: isRTL ? "right" : "left" }]}>
                  {labels.greetingPrompt}
                </Text>

                <View style={[styles.chipsWrap, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                  {suggestions.map((suggestion) => (
                    <TouchableOpacity
                      key={suggestion}
                      activeOpacity={0.86}
                      onPress={() => handleSend(suggestion)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: palette.chipBg,
                          borderColor: palette.chipBorder,
                        },
                      ]}
                    >
                      <Text style={[styles.chipText, { color: palette.text }]}>{suggestion}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : (
              <View style={styles.messages}>
                {currentChat?.messages.map((message, index) => {
                  const isUser = message.role === "user";
                  const key = `${currentChat.id}-${index}`;

                  return (
                    <View key={key} style={styles.messageBlock}>
                      <View
                        style={[
                          styles.messageRow,
                          { justifyContent: isUser ? (isRTL ? "flex-start" : "flex-end") : isRTL ? "flex-end" : "flex-start" },
                        ]}
                      >
                        <View
                          style={[
                            styles.messageBubble,
                            isUser
                              ? { backgroundColor: palette.userBubble }
                              : {
                                  backgroundColor: palette.assistantBubble,
                                  borderColor: palette.assistantBorder,
                                  borderWidth: 1,
                                },
                          ]}
                        >
                          <Text
                            style={[
                              styles.messageText,
                              {
                                color: isUser ? palette.userText : palette.assistantText,
                                textAlign: isRTL ? "right" : "left",
                              },
                            ]}
                          >
                            {message.content}
                          </Text>
                        </View>
                      </View>

                      {!isUser ? (
                        <View
                          style={[
                            styles.actionsRow,
                            { justifyContent: isRTL ? "flex-end" : "flex-start", marginLeft: isRTL ? 0 : 6, marginRight: isRTL ? 6 : 0 },
                          ]}
                        >
                          <ActionButton
                            icon={<Copy size={14} color={copiedKey === key ? palette.primary : palette.mutedText} strokeWidth={2} />}
                            label={copiedKey === key ? labels.copied : labels.copy}
                            onPress={() => handleCopy(message.content, key)}
                            active={copiedKey === key}
                            color={palette.primary}
                            textColor={palette.mutedText}
                          />
                          <ActionButton
                            icon={<RefreshCcw size={14} color={palette.mutedText} strokeWidth={2} />}
                            label={labels.regenerate}
                            onPress={handleRegenerate}
                            color={palette.primary}
                            textColor={palette.mutedText}
                          />
                          <ActionButton
                            icon={<ThumbsUp size={14} color={feedback[key] === "up" ? palette.primary : palette.mutedText} strokeWidth={2} />}
                            label={labels.like}
                            onPress={() => handleFeedback(key, "up")}
                            active={feedback[key] === "up"}
                            color={palette.primary}
                            textColor={palette.mutedText}
                          />
                          <ActionButton
                            icon={<ThumbsDown size={14} color={feedback[key] === "down" ? palette.primary : palette.mutedText} strokeWidth={2} />}
                            label={labels.dislike}
                            onPress={() => handleFeedback(key, "down")}
                            active={feedback[key] === "down"}
                            color={palette.primary}
                            textColor={palette.mutedText}
                          />
                        </View>
                      ) : null}
                    </View>
                  );
                })}

                {(isStreaming || streamBuffer.length > 0) ? (
                  <View style={styles.messageBlock}>
                    <View style={[styles.messageRow, { justifyContent: isRTL ? "flex-end" : "flex-start" }]}>
                      <View
                        style={[
                          styles.messageBubble,
                          {
                            backgroundColor: palette.assistantBubble,
                            borderColor: palette.assistantBorder,
                            borderWidth: 1,
                          },
                        ]}
                      >
                        <Text style={[styles.messageText, { color: palette.assistantText, textAlign: isRTL ? "right" : "left" }]}>
                          {streamBuffer}
                          {isStreaming ? <StreamingCursor color={palette.primary} /> : null}
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : null}
              </View>
            )}
          </ScrollView>

          <View
            style={[
              styles.composerWrap,
              {
                backgroundColor: palette.background,
                paddingBottom: Math.max(insets.bottom, 12),
              },
            ]}
          >
            <View
              style={[
                styles.composer,
                {
                  backgroundColor: palette.composer,
                  borderColor: palette.composerBorder,
                  shadowColor: palette.shadow,
                  flexDirection: isRTL ? "row-reverse" : "row",
                },
              ]}
            >
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder={labels.placeholder}
                placeholderTextColor={palette.placeholder}
                multiline
                maxLength={800}
                editable={!isStreaming}
                textAlignVertical="center"
                returnKeyType="send"
                onSubmitEditing={() => handleSend(input)}
                style={[
                  styles.input,
                  {
                    color: palette.text,
                    textAlign: isRTL ? "right" : "left",
                  },
                ]}
              />

              {input.trim() ? (
                <Pressable
                  onPress={() => handleSend(input)}
                  android_ripple={{ color: "rgba(255,255,255,0.16)", radius: 22, borderless: false }}
                  style={[styles.sendButton, { backgroundColor: palette.primary }]}
                >
                  <ArrowUp size={18} color="#FFFFFF" strokeWidth={2.4} />
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  body: { flex: 1 },
  header: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: isSmallScreen ? 14 : 18,
    paddingBottom: 12,
    alignItems: "center",
  },
  headerIconButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: fontWeight.extrabold,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: fontWeight.medium as any,
  },
  scroll: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: isSmallScreen ? 14 : 18,
    paddingTop: 18,
    paddingBottom: 24,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: fontWeight.extrabold,
    letterSpacing: -0.6,
  },
  emptySubtitle: {
    marginTop: 10,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: fontWeight.medium as any,
  },
  chipsWrap: {
    flexWrap: "wrap",
    gap: 10,
    marginTop: 28,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: fontWeight.medium as any,
  },
  messages: {
    gap: 12,
    paddingBottom: 8,
  },
  messageBlock: {
    marginBottom: 0,
  },
  messageRow: {
    flexDirection: "row",
  },
  messageBubble: {
    maxWidth: "82%",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: fontWeight.normal as any,
  },
  actionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  actionLabel: {
    fontSize: 12,
    lineHeight: 14,
    fontWeight: fontWeight.medium as any,
  },
  composerWrap: {
    paddingHorizontal: isSmallScreen ? 14 : 18,
    paddingTop: 10,
    paddingBottom: 2,
  },
  composer: {
    minHeight: 58,
    borderWidth: 1,
    borderRadius: 28,
    alignItems: "flex-end",
    paddingLeft: 16,
    paddingRight: 10,
    paddingVertical: 8,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 8,
  },
  input: {
    flex: 1,
    minHeight: 24,
    maxHeight: 120,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: fontWeight.normal as any,
    paddingTop: Platform.OS === "android" ? 4 : 2,
    paddingBottom: Platform.OS === "android" ? 4 : 2,
    includeFontPadding: false,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  cursor: {
    width: 8,
    height: 18,
    borderRadius: 3,
    marginLeft: 3,
  },
});
