import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useHeaderHeight } from "@react-navigation/elements";
import { ArrowUp, ChevronRight, Menu, SquarePen } from "lucide-react-native";
import { useStore, useThemeColors, useAppLocale } from "../lib/store";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { fontWeight, isSmallScreen, spacing } from "../lib/constants";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const DRAWER_WIDTH = Math.min(360, Math.floor(SCREEN_WIDTH * 0.84));

function truncate(text: string, maxLen: number) {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 1).trimEnd() + "…";
}

function ChatHistoryItem({
  title,
  preview,
  active,
  onPress,
  isRTL,
  themeColors,
}: {
  title: string;
  preview: string;
  active: boolean;
  onPress: () => void;
  isRTL: boolean;
  themeColors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <TouchableOpacity
      style={[
        {
          borderRadius: 16,
          paddingHorizontal: 12,
          paddingVertical: 12,
          marginBottom: 8,
          backgroundColor: active
            ? themeColors.primary + "0D"
            : themeColors.card,
          borderWidth: 1,
          borderColor: active ? themeColors.primary + "55" : themeColors.border,
        },
      ]}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <Text
        style={{
          fontSize: 13,
          fontWeight: fontWeight.bold,
          color: themeColors.foreground,
          textAlign: isRTL ? "right" : "left",
        }}
        numberOfLines={1}
      >
        {title}
      </Text>
      <Text
        style={{
          marginTop: 4,
          fontSize: 11.5,
          fontWeight: fontWeight.medium,
          color: themeColors.mutedForeground,
          textAlign: isRTL ? "right" : "left",
        }}
        numberOfLines={1}
      >
        {preview}
      </Text>
    </TouchableOpacity>
  );
}

function StreamingCursor({ color }: { color: string }) {
  const [opacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 520,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 520,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={{
        width: 8,
        height: 16,
        backgroundColor: color,
        marginLeft: 3,
        borderRadius: 3,
        opacity,
      }}
    />
  );
}

export default function AdvisorScreen() {
  const store = useStore();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const themeColors = useThemeColors();
  const { language, isRTL, t } = useAppLocale();
  const isDark = store.theme === "dark";

  // Dynamically derived palette — recalculates on every theme/language change
  const palette = useMemo(
    () => ({
      bg: themeColors.background,
      surface: isDark ? "#111827" : "#F4F4F5",
      border: themeColors.border,
      textPrimary: themeColors.foreground,
      textMuted: themeColors.mutedForeground,
      placeholder: isDark ? "#94A3B8" : "#6B7280",
      primary: themeColors.primary,
      inputBg: isDark ? "#0F172A" : "#FFFFFF",
      headerBg: themeColors.background,
      bubbleUserBg: isDark ? "#1F2937" : "#F3F4F6",
      bubbleAiBg: isDark ? "#111827" : "#FFFFFF",
      bubbleAiBorder: isDark ? "#243244" : "#E5E7EB",
      bubbleAiText: isDark ? "#E2E8F0" : themeColors.foreground,
      bubbleUserText: isDark ? "#F1F5F9" : themeColors.foreground,
      composerShadow: isDark ? "#000000" : "#0F172A",
      overlayBg: isDark ? "rgba(2,6,23,0.72)" : "rgba(15,23,42,0.18)",
    }),
    [themeColors, isDark],
  );

  // Dynamic suggestion strings from localization
  const SUGGESTIONS = useMemo(
    () => [
      t("advisorSuggest1"),
      t("advisorSuggest2"),
      t("advisorSuggest3"),
      t("advisorSuggest4"),
    ],
    [language],
  ); // eslint-disable-line react-hooks/exhaustive-deps

  // Dynamic AI responses — injected based on active language
  const AI_RESPONSES_EN = [
    "To raise your GPA next semester, prioritize high-credit courses, set a weekly study block schedule, and identify one or two classes where improving by a single letter grade has a big impact. If you share your current credits and GPA, I can estimate what GPA you need next term.",
    "To decide what you can register for now, start with your next prerequisite chain and pick courses that unlock multiple downstream requirements. If you tell me your completed courses and your major, I can recommend a best next-semester set.",
    "A balanced workload usually mixes 1–2 heavy courses with 2–3 medium/light ones. Aim for a steady weekly time budget and avoid stacking too many labs/projects in the same term. Share your target credit hours and course list and I'll propose a balanced plan.",
    "To check if you're on track, compare earned credits versus a graduation target and verify that prerequisite chains won't block you. If you share your current credits and remaining core requirements, I'll map a timeline.",
  ];

  const AI_RESPONSES_AR = [
    "لرفع معدلك الفصل القادم، ركز على المقررات ذات الساعات العالية، وخصص جدول مذاكرة أسبوعياً، وحدّد مادة أو مادتين يمكن فيهما تحسين درجتك بشكل كبير. شاركني معدلك وساعاتك الحالية وسأحسب لك المعدل المطلوب.",
    "لتحديد المقررات التي يمكنك التسجيل بها، ابدأ بسلسلة المتطلبات التالية واختر المقررات التي تفتح متطلبات متعددة لاحقاً. أخبرني بمقرراتك المكتملة وتخصصك وسأقترح أفضل مجموعة للفصل القادم.",
    "العبء الدراسي المتوازن عادةً يجمع بين مادة أو مادتين ثقيلتين مع مادتين أو ثلاث متوسطة. حدد ميزانيتك الأسبوعية من الوقت وتجنب تكديس المختبرات والمشاريع في نفس الفصل.",
    "للتحقق من مسارك نحو التخرج، قارن الساعات المكتملة بالهدف المطلوب وتأكد أن سلاسل المتطلبات لن تعيقك. شاركني ساعاتك الحالية والمتطلبات المتبقية وسأرسم لك خطة زمنية.",
  ];

  const AI_RESPONSES = language === "ar" ? AI_RESPONSES_AR : AI_RESPONSES_EN;

  const [input, setInput] = useState("");
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamBuffer, setStreamBuffer] = useState("");

  const scrollRef = useRef<ScrollView>(null);
  const streamIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [drawerX] = useState(() => new Animated.Value(-DRAWER_WIDTH));
  const [overlayOpacity] = useState(() => new Animated.Value(0));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const currentChat = useMemo(() => {
    return currentChatId
      ? store.chatHistory.find((c) => c.id === currentChatId)
      : null;
  }, [currentChatId, store.chatHistory]);

  useEffect(() => {
    if (store.chatHistory.length > 0 && !currentChatId) {
      setCurrentChatId(store.chatHistory[0].id);
    }
  }, [currentChatId, store.chatHistory]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 80);
    return () => clearTimeout(timeout);
  }, [currentChat?.messages, streamBuffer]);

  const openDrawer = useCallback(() => {
    setDrawerOpen(true);
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(drawerX, {
        toValue: 0,
        duration: 240,
        useNativeDriver: true,
      }),
    ]).start();
  }, [drawerX, overlayOpacity]);

  const closeDrawer = useCallback(() => {
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(drawerX, {
        toValue: -DRAWER_WIDTH,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) setDrawerOpen(false);
    });
  }, [drawerX, overlayOpacity]);

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
          store.appendMessage(chatId, "assistant", fullText);
        }
      }, 34);
    },
    [store],
  );

  useEffect(() => {
    return () => {
      if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => {
        Keyboard.dismiss();
        setDrawerOpen(false);
      };
    }, []),
  );

  const handleNewChat = useCallback(() => {
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = null;
    }
    setIsStreaming(false);
    setStreamBuffer("");
    const id = store.addChat(t("advisorNewChat"));
    setCurrentChatId(id);
  }, [store, t]);

  const handleSend = useCallback(
    (message: string) => {
      const trimmed = message.trim();
      if (!trimmed || isStreaming) return;

      let activeChatId = currentChatId;
      if (!activeChatId) {
        activeChatId = store.addChat(trimmed);
        setCurrentChatId(activeChatId);
      }

      store.appendMessage(activeChatId, "user", trimmed);
      setInput("");

      const response =
        AI_RESPONSES[Math.floor(Math.random() * AI_RESPONSES.length)];
      setTimeout(() => startStream(activeChatId!, response), 450);
    },
    [currentChatId, isStreaming, startStream, store, AI_RESPONSES],
  );

  const isEmptyConversation =
    !currentChat || (currentChat.messages.length === 0 && !isStreaming);
  const androidTopInset =
    Platform.OS === "android"
      ? Math.max(insets.top, StatusBar.currentHeight || 0)
      : 0;
  const dayLabel = language === "ar" ? "اليوم" : "Today";

  const historyItems = useMemo(() => {
    return store.chatHistory.map((c) => {
      const last = c.messages[c.messages.length - 1]?.content || "";
      const preview = last ? truncate(last, 44) : t("advisorTapToContinue");
      const title = c.title?.trim()
        ? truncate(c.title, 28)
        : t("advisorNewChat");
      return { id: c.id, title, preview };
    });
  }, [store.chatHistory, language]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[S.root, { backgroundColor: palette.bg }]}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={palette.bg}
      />

      <KeyboardAvoidingView
        style={S.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? headerHeight : 0}
      >
        <View
          style={[
            S.header,
            {
              backgroundColor: palette.headerBg,
              borderBottomColor: palette.border,
              flexDirection: isRTL ? "row-reverse" : "row",
            },
            Platform.OS === "android" && {
              paddingTop:
                androidTopInset + (isSmallScreen ? spacing.sm : spacing.md),
            },
          ]}
        >
          <TouchableOpacity
            style={S.iconBtn}
            activeOpacity={0.8}
            onPress={openDrawer}
            accessibilityLabel={t("history")}
          >
            <Menu size={22} color={palette.textPrimary} strokeWidth={2.2} />
          </TouchableOpacity>

          <View
            style={[
              S.headerTitleWrap,
              { flexDirection: isRTL ? "row-reverse" : "row" },
            ]}
          >
            <Text style={[S.headerTitle, { color: palette.textPrimary }]}>
              {t("advisorHeaderTitle")}
            </Text>
            <ChevronRight
              size={16}
              color={palette.textMuted}
              strokeWidth={2.4}
              style={isRTL ? S.headerChevronRtl : undefined}
            />
          </View>

          <TouchableOpacity
            style={S.iconBtn}
            activeOpacity={0.85}
            onPress={handleNewChat}
            accessibilityLabel={t("newChat")}
          >
            <SquarePen
              size={20}
              color={palette.textPrimary}
              strokeWidth={2.2}
            />
          </TouchableOpacity>
        </View>

        <View style={S.mainContent}>
          <ScrollView
            ref={scrollRef}
            style={S.messagesScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={S.content}
            keyboardShouldPersistTaps="handled"
          >
            <View
              style={[
                S.dayDividerRow,
                { flexDirection: isRTL ? "row-reverse" : "row" },
              ]}
            >
              <View
                style={[S.dayDividerLine, { backgroundColor: palette.border }]}
              />
              <Text style={[S.dayDividerText, { color: palette.textMuted }]}>
                {dayLabel}
              </Text>
              <View
                style={[S.dayDividerLine, { backgroundColor: palette.border }]}
              />
            </View>

            {isEmptyConversation ? (
              <View style={S.emptyWrap}>
                <Text
                  style={[
                    S.emptyTitle,
                    {
                      color: palette.textPrimary,
                      textAlign: isRTL ? "right" : "center",
                    },
                  ]}
                >
                  {t("advisorEmptyTitle")}
                </Text>

                <View style={S.suggestions}>
                  {SUGGESTIONS.map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[
                        S.suggestionCard,
                        {
                          backgroundColor: palette.surface,
                        },
                      ]}
                      activeOpacity={0.85}
                      onPress={() => handleSend(s)}
                      disabled={isStreaming}
                    >
                      <Text
                        style={[
                          S.suggestionText,
                          {
                            color: palette.textPrimary,
                            textAlign: isRTL ? "right" : "center",
                          },
                        ]}
                        numberOfLines={3}
                      >
                        {s}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : (
              <View style={S.messages}>
                {currentChat?.messages.map((msg, idx) => {
                  const isUser = msg.role === "user";
                  return (
                    <View
                      key={idx}
                      style={[
                        S.msgRow,
                        isUser
                          ? {
                              justifyContent: isRTL ? "flex-start" : "flex-end",
                            }
                          : {
                              justifyContent: isRTL ? "flex-end" : "flex-start",
                            },
                      ]}
                    >
                      <View
                        style={[
                          S.bubble,
                          isUser
                            ? {
                                backgroundColor: palette.bubbleUserBg,
                                borderTopRightRadius: isRTL ? 22 : 12,
                                borderTopLeftRadius: isRTL ? 12 : 22,
                              }
                            : {
                                backgroundColor: palette.bubbleAiBg,
                                borderColor: palette.bubbleAiBorder,
                                borderWidth: 1,
                                borderTopLeftRadius: isRTL ? 22 : 12,
                                borderTopRightRadius: isRTL ? 12 : 22,
                              },
                        ]}
                      >
                        <Text
                          style={[
                            S.bubbleText,
                            {
                              color: isUser
                                ? palette.bubbleUserText
                                : palette.bubbleAiText,
                              textAlign: isRTL ? "right" : "left",
                            },
                          ]}
                        >
                          {msg.content}
                        </Text>
                      </View>
                    </View>
                  );
                })}

                {(isStreaming || streamBuffer.length > 0) && (
                  <View
                    style={[
                      S.msgRow,
                      { justifyContent: isRTL ? "flex-end" : "flex-start" },
                    ]}
                  >
                    <View
                      style={[
                        S.bubble,
                        {
                          backgroundColor: palette.bubbleAiBg,
                          borderColor: palette.bubbleAiBorder,
                          borderWidth: 1,
                          borderTopLeftRadius: isRTL ? 22 : 12,
                          borderTopRightRadius: isRTL ? 12 : 22,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          S.bubbleText,
                          {
                            color: palette.bubbleAiText,
                            textAlign: isRTL ? "right" : "left",
                          },
                        ]}
                      >
                        {streamBuffer}
                        {isStreaming ? (
                          <StreamingCursor color={palette.primary} />
                        ) : null}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          <View
            style={[
              S.inputBar,
              {
                paddingBottom:
                  Math.max(insets.bottom, 12) + (Platform.OS === "ios" ? 8 : 0),
                backgroundColor: palette.bg,
              },
            ]}
          >
            <View
              style={[
                S.inputWrap,
                {
                  borderColor: isStreaming
                    ? palette.primary + "55"
                    : palette.border,
                  backgroundColor: palette.inputBg,
                  flexDirection: isRTL ? "row-reverse" : "row",
                  shadowColor: palette.composerShadow,
                },
              ]}
            >
              <TextInput
                style={[
                  S.input,
                  {
                    color: palette.textPrimary,
                    textAlign: isRTL ? "right" : "left",
                  },
                ]}
                placeholder={t("advisorPlaceholder")}
                placeholderTextColor={palette.placeholder}
                value={input}
                onChangeText={setInput}
                multiline
                maxLength={600}
                editable={!isStreaming}
                returnKeyType="send"
                onSubmitEditing={() => handleSend(input)}
              />
              <TouchableOpacity
                style={[
                  S.sendBtn,
                  {
                    backgroundColor:
                      input.trim() && !isStreaming ? "#111111" : "#D4D4D8",
                    marginLeft: isRTL ? 0 : 10,
                    marginRight: isRTL ? 10 : 0,
                  },
                ]}
                onPress={() => handleSend(input)}
                disabled={!input.trim() || isStreaming}
                activeOpacity={0.85}
              >
                <ArrowUp size={16} color="#FFFFFF" strokeWidth={2.6} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      {drawerOpen ? (
        <Animated.View
          style={[
            S.overlay,
            { opacity: overlayOpacity, backgroundColor: palette.overlayBg },
          ]}
        >
          <Pressable style={S.overlayPress} onPress={closeDrawer} />
        </Animated.View>
      ) : null}

      <Animated.View
        style={[
          S.drawer,
          {
            backgroundColor: palette.bg,
            borderRightColor: palette.border,
          },
          Platform.OS === "android" && { paddingTop: androidTopInset + 18 },
          { transform: [{ translateX: drawerX }] },
        ]}
        pointerEvents={drawerOpen ? "auto" : "none"}
      >
        <View style={[S.drawerHeader, { borderBottomColor: palette.border }]}>
          <Text
            style={[
              S.drawerTitle,
              {
                color: palette.textPrimary,
                textAlign: isRTL ? "right" : "left",
              },
            ]}
          >
            {t("advisorConvHistory")}
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={S.drawerList}
        >
          {historyItems.length === 0 ? (
            <View style={S.drawerEmpty}>
              <Text
                style={[
                  S.drawerEmptyTitle,
                  {
                    color: palette.textPrimary,
                    textAlign: isRTL ? "right" : "left",
                  },
                ]}
              >
                {t("advisorNoChats")}
              </Text>
              <Text
                style={[
                  S.drawerEmptySub,
                  {
                    color: palette.textMuted,
                    textAlign: isRTL ? "right" : "left",
                  },
                ]}
              >
                {t("advisorNoChatsDesc")}
              </Text>
            </View>
          ) : (
            historyItems.map((c) => (
              <ChatHistoryItem
                key={c.id}
                title={c.title}
                preview={c.preview}
                active={c.id === currentChatId}
                onPress={() => {
                  setCurrentChatId(c.id);
                  closeDrawer();
                }}
                isRTL={isRTL}
                themeColors={themeColors}
              />
            ))
          )}
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  mainContent: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: isSmallScreen ? spacing.md : spacing.lg,
    paddingVertical: isSmallScreen ? spacing.md : spacing.lg,
  },
  iconBtn: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: fontWeight.extrabold,
    letterSpacing: -0.2,
  },
  headerChevronRtl: { transform: [{ rotate: "180deg" }] },

  messagesScroll: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: isSmallScreen ? spacing.md : spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: 24,
  },

  dayDividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 6,
    marginBottom: 22,
  },
  dayDividerLine: { flex: 1, height: StyleSheet.hairlineWidth },
  dayDividerText: { fontSize: 13, fontWeight: fontWeight.medium },

  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 12,
    paddingBottom: 44,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: fontWeight.semibold,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 280,
    marginBottom: 16,
  },

  suggestions: {
    width: "100%",
    gap: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
  },
  suggestionCard: {
    maxWidth: "86%",
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: fontWeight.medium,
    lineHeight: 20,
  },

  messages: { gap: 18 },
  msgRow: { flexDirection: "row" },
  bubble: {
    maxWidth: "84%",
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  bubbleText: { fontSize: 15, lineHeight: 26, fontWeight: fontWeight.normal },

  inputBar: {
    paddingHorizontal: isSmallScreen ? spacing.md : spacing.lg,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 28 : 14,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: 28,
    borderWidth: 1,
    paddingLeft: 18,
    paddingRight: 10,
    paddingVertical: 13,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 6,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: fontWeight.normal,
    lineHeight: 22,
    maxHeight: 120,
    paddingTop: Platform.OS === "android" ? 4 : 2,
    paddingBottom: Platform.OS === "android" ? 4 : 2,
    minHeight: 30,
    textAlignVertical: "center",
    includeFontPadding: false,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayPress: { flex: 1 },

  drawer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: DRAWER_WIDTH,
    borderRightWidth: 1,
    paddingTop: Platform.OS === "ios" ? 54 : 18,
  },
  drawerHeader: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  drawerTitle: { fontSize: 14, fontWeight: fontWeight.extrabold },
  drawerList: { paddingHorizontal: 10, paddingVertical: 10 },
  drawerEmpty: { paddingVertical: 18, paddingHorizontal: 12 },
  drawerEmptyTitle: {
    fontSize: 13,
    fontWeight: fontWeight.extrabold,
    marginBottom: 6,
  },
  drawerEmptySub: { fontSize: 12, fontWeight: fontWeight.medium },
});
