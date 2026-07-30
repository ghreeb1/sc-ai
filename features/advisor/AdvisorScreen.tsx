import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  LayoutAnimation,
  Modal,
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
import type { TextStyle } from "react-native";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  ArrowUp,
  Copy,
  MessageSquare,
  RefreshCcw,
  SquarePen,
  ThumbsDown,
  ThumbsUp,
  Trash2,
} from "lucide-react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useStore, useAppLocale, useThemeColors } from "../../lib/store";
import { colors, isSmallScreen, spacing, borderRadius, fontWeight } from "../../lib/constants";
import {
  createAiConversation,
  deleteAiConversation,
  getAiConversation,
  listAiConversations,
  streamAiConversationMessage,
} from "../../services/ai";
import type { ChatMessageResponse, ConversationListItem, ConversationResponse } from "../../lib/types";

type LocalMessage = {
  role: "user" | "assistant";
  content: string;
};

type ClipboardBridge = {
  navigator?: {
    clipboard?: {
      writeText?: (value: string) => Promise<void>;
    };
  };
};

const mediumFontWeight: TextStyle["fontWeight"] = fontWeight.medium;
const normalFontWeight: TextStyle["fontWeight"] = fontWeight.normal;

function mapConversationMessages(
  conversation: ConversationResponse,
): LocalMessage[] {
  return (conversation.messages ?? []).flatMap((message) => [
    { role: "user" as const, content: message.user_message },
    { role: "assistant" as const, content: message.ai_response },
  ]);
}

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
      <Text style={[styles.actionLabel, { color: active ? color : textColor }]}>
        {label}
      </Text>
    </Pressable>
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
      style={[styles.cursor, { backgroundColor: color, opacity }]}
    />
  );
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
    [isDark, themeColors.primary],
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
    [language],
  );

  const labels = useMemo(
    () => ({
      title: language === "ar" ? "المستشار الذكي" : "AI Advisor",
      subtitle:
        language === "ar" ? "مساعدك الأكاديمي" : "Your academic assistant",
      placeholder:
        language === "ar"
          ? "اطرح سؤالك الدراسي..."
          : "Ask your academic question...",
      greetingName:
        language === "ar"
          ? `مرحباً، ${store.profile?.fullName?.split(" ")[0] || "Student"}`
          : `Hi, ${store.profile?.fullName?.split(" ")[0] || "Student"}`,
      greetingPrompt:
        language === "ar"
          ? "كيف يمكنني مساعدتك اليوم؟"
          : "How can I help you today?",
      newChat: language === "ar" ? "محادثة جديدة" : "New chat",
      copy: language === "ar" ? "نسخ" : "Copy",
      copied: language === "ar" ? "تم النسخ" : "Copied",
      regenerate: language === "ar" ? "إعادة" : "Regenerate",
      like: language === "ar" ? "أعجبني" : "Like",
      dislike: language === "ar" ? "لم يعجبني" : "Dislike",
      back: language === "ar" ? "رجوع" : "Back",
      historyTitle: language === "ar" ? "المحادثات" : "Conversations",
    }),
    [language, store.profile?.fullName],
  );

  const [input, setInput] = useState("");
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messagesByConversation, setMessagesByConversation] = useState<
    Record<string, LocalMessage[]>
  >({});
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<
    Record<string, "up" | "down" | undefined>
  >({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [hasLoadedInitial, setHasLoadedInitial] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const streamAbortRef = useRef<AbortController | null>(null);

  const loadConversations = useCallback(async () => {
    setIsHistoryLoading(true);
    try {
      const list = await listAiConversations();
      setConversations(list);
      return list;
    } catch {
      return [];
    } finally {
      setIsHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (
      Platform.OS === "android" &&
      UIManager.setLayoutAnimationEnabledExperimental
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const currentChat = useMemo(() => {
    return currentChatId
      ? {
        id: currentChatId,
        messages: messagesByConversation[currentChatId] ?? [],
      }
      : null;
  }, [currentChatId, messagesByConversation]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 80);
    return () => clearTimeout(timeout);
  }, [currentChat?.messages, streamError]);

  useEffect(() => {
    return () => {
      streamAbortRef.current?.abort();
    };
  }, []);

  const animateMessages = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  };

  const appendLocalMessage = useCallback(
    (conversationId: string, message: LocalMessage) => {
      setMessagesByConversation((current) => ({
        ...current,
        [conversationId]: [...(current[conversationId] ?? []), message],
      }));
    },
    [],
  );

  const replaceConversationMessages = useCallback(
    (conversationId: string, messages: LocalMessage[]) => {
      setMessagesByConversation((current) => ({
        ...current,
        [conversationId]: messages,
      }));
    },
    [],
  );

  const cancelActiveStream = useCallback(() => {
    streamAbortRef.current?.abort();
    streamAbortRef.current = null;
    setIsStreaming(false);
  }, []);

  const refreshConversation = useCallback(
    async (conversationId: string) => {
      const conversation = await getAiConversation(conversationId);
      replaceConversationMessages(
        conversation.id,
        mapConversationMessages(conversation),
      );
    },
    [replaceConversationMessages],
  );

  const handleSelectConversation = useCallback(
    (id: string) => {
      setCurrentChatId(id);
      refreshConversation(id);
      setIsHistoryVisible(false);
    },
    [refreshConversation],
  );

  const handleDeleteConversation = useCallback(
    async (id: string) => {
      try {
        await deleteAiConversation(id);
        const updatedList = await loadConversations();
        if (currentChatId === id) {
          if (updatedList.length > 0) {
            const next = updatedList[0];
            setCurrentChatId(next.id);
            refreshConversation(next.id);
          } else {
            const newChat = await createAiConversation({});
            setMessagesByConversation((current) => ({
              ...current,
              [newChat.id]: current[newChat.id] ?? [],
            }));
            setCurrentChatId(newChat.id);
            loadConversations();
          }
        }
      } catch { }
    },
    [currentChatId, loadConversations, refreshConversation],
  );

  useEffect(() => {
    if (hasLoadedInitial) return;
    let mounted = true;
    loadConversations().then(async (list) => {
      if (!mounted) return;
      if (!currentChatId) {
        if (list.length > 0) {
          const first = list[0];
          setCurrentChatId(first.id);
          refreshConversation(first.id);
        } else {
          const newChat = await createAiConversation({});
          setMessagesByConversation((current) => ({
            ...current,
            [newChat.id]: current[newChat.id] ?? [],
          }));
          setCurrentChatId(newChat.id);
          loadConversations();
        }
      }
      setHasLoadedInitial(true);
    });
    return () => {
      mounted = false;
    };
  }, [currentChatId, hasLoadedInitial, loadConversations, refreshConversation]);

  const sendMessageToConversation = useCallback(
    async (conversationId: string, message: string) => {
      cancelActiveStream();
      setStreamError(null);
      animateMessages();
      appendLocalMessage(conversationId, { role: "user", content: message });
      appendLocalMessage(conversationId, { role: "assistant", content: "" });

      const controller = new AbortController();
      streamAbortRef.current = controller;
      setIsStreaming(true);

      try {
        await streamAiConversationMessage(
          conversationId,
          { message },
          {
            signal: controller.signal,
            onToken: (token) => {
              setMessagesByConversation((current) => {
                const messages = [...(current[conversationId] ?? [])];
                const last = messages[messages.length - 1];
                if (last?.role === "assistant") {
                  messages[messages.length - 1] = {
                    ...last,
                    content: last.content + token,
                  };
                }
                return { ...current, [conversationId]: messages };
              });
            },
          },
        );

        if (!controller.signal.aborted) {
          await refreshConversation(conversationId);
        }
      } catch {
        if (!controller.signal.aborted) {
          setStreamError("Unable to complete the response. Please try again.");
        }
      } finally {
        if (streamAbortRef.current === controller) {
          streamAbortRef.current = null;
        }
        if (!controller.signal.aborted) {
          setIsStreaming(false);
          loadConversations();
        }
      }
    },
    [appendLocalMessage, cancelActiveStream, refreshConversation],
  );

  const handleNewChat = useCallback(async () => {
    cancelActiveStream();
    setStreamError(null);
    animateMessages();
    const conversation = await createAiConversation({});
    setMessagesByConversation((current) => ({
      ...current,
      [conversation.id]: current[conversation.id] ?? [],
    }));
    setCurrentChatId(conversation.id);
    setIsHistoryVisible(false);
    loadConversations();
  }, [cancelActiveStream, loadConversations]);

  const handleSend = useCallback(
    async (message: string) => {
      const trimmed = message.trim();
      if (!trimmed) return;

      let chatId = currentChatId;
      if (!chatId) {
        const conversation = await createAiConversation({ title: trimmed });
        chatId = conversation.id;
        setCurrentChatId(chatId);
        loadConversations();
      }

      setInput("");
      if (chatId) {
        await sendMessageToConversation(chatId, trimmed);
      }
    },
    [currentChatId, sendMessageToConversation],
  );

  const handleRegenerate = useCallback(() => {
    if (!currentChatId) return;
    const messages = messagesByConversation[currentChatId] ?? [];
    const lastUserMessage = [...messages]
      .reverse()
      .find((message) => message.role === "user");
    if (lastUserMessage) {
      sendMessageToConversation(currentChatId, lastUserMessage.content);
    }
  }, [currentChatId, messagesByConversation, sendMessageToConversation]);

  const handleCopy = useCallback(async (message: string, key: string) => {
    try {
      const clipboard = (globalThis as ClipboardBridge).navigator?.clipboard;
      if (clipboard?.writeText) {
        await clipboard.writeText(message);
      }
    } catch { }

    setCopiedKey(key);
    setTimeout(
      () => setCopiedKey((current) => (current === key ? null : current)),
      1400,
    );
  }, []);

  const handleFeedback = useCallback((key: string, value: "up" | "down") => {
    setFeedback((current) => ({
      ...current,
      [key]: current[key] === value ? undefined : value,
    }));
  }, []);

  const isEmptyState =
    !currentChat || (currentChat.messages.length === 0 && !isStreaming);

  return (
    <SafeAreaView
      edges={["top", "left", "right", "bottom"]}
      style={[styles.root, { backgroundColor: palette.background }]}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={palette.headerBackground}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
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
            <Text style={[styles.headerTitle, { color: palette.text }]}>
              {labels.title}
            </Text>
            <Text style={[styles.headerSubtitle, { color: palette.subtitle }]}>
              {labels.subtitle}
            </Text>
          </View>

          <View style={{ flexDirection: isRTL ? "row-reverse" : "row" }}>
            <TouchableOpacity
              accessibilityLabel={labels.historyTitle}
              onPress={() => setIsHistoryVisible(true)}
              activeOpacity={0.8}
              style={styles.headerIconButton}
            >
              <MessageSquare size={20} color={palette.text} strokeWidth={2.2} />
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityLabel={labels.newChat}
              onPress={handleNewChat}
              activeOpacity={0.8}
              style={styles.headerIconButton}
            >
              <SquarePen size={20} color={palette.text} strokeWidth={2.2} />
            </TouchableOpacity>
          </View>
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
                <Text
                  style={[
                    styles.emptyTitle,
                    {
                      color: palette.text,
                      textAlign: isRTL ? "right" : "left",
                    },
                  ]}
                >
                  {"\u{1F44B}"} {labels.greetingName}
                </Text>
                <Text
                  style={[
                    styles.emptySubtitle,
                    {
                      color: palette.subtitle,
                      textAlign: isRTL ? "right" : "left",
                    },
                  ]}
                >
                  {labels.greetingPrompt}
                </Text>

                <View
                  style={[
                    styles.chipsWrap,
                    { flexDirection: isRTL ? "row-reverse" : "row" },
                  ]}
                >
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
                      <Text style={[styles.chipText, { color: palette.text }]}>
                        {suggestion}
                      </Text>
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
                          {
                            justifyContent: isUser
                              ? isRTL
                                ? "flex-start"
                                : "flex-end"
                              : isRTL
                                ? "flex-end"
                                : "flex-start",
                          },
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
                                color: isUser
                                  ? palette.userText
                                  : palette.assistantText,
                                textAlign: isRTL ? "right" : "left",
                              },
                            ]}
                          >
                            {message.content}
                            {!isUser &&
                              isStreaming &&
                              index === currentChat.messages.length - 1 ? (
                              <StreamingCursor color={palette.primary} />
                            ) : null}
                          </Text>
                        </View>
                      </View>

                      {!isUser ? (
                        <View
                          style={[
                            styles.actionsRow,
                            {
                              justifyContent: isRTL ? "flex-end" : "flex-start",
                              marginLeft: isRTL ? 0 : 6,
                              marginRight: isRTL ? 6 : 0,
                            },
                          ]}
                        >
                          <ActionButton
                            icon={
                              <Copy
                                size={14}
                                color={
                                  copiedKey === key
                                    ? palette.primary
                                    : palette.mutedText
                                }
                                strokeWidth={2}
                              />
                            }
                            label={
                              copiedKey === key ? labels.copied : labels.copy
                            }
                            onPress={() => handleCopy(message.content, key)}
                            active={copiedKey === key}
                            color={palette.primary}
                            textColor={palette.mutedText}
                          />
                          <ActionButton
                            icon={
                              <RefreshCcw
                                size={14}
                                color={palette.mutedText}
                                strokeWidth={2}
                              />
                            }
                            label={labels.regenerate}
                            onPress={handleRegenerate}
                            color={palette.primary}
                            textColor={palette.mutedText}
                          />
                          <ActionButton
                            icon={
                              <ThumbsUp
                                size={14}
                                color={
                                  feedback[key] === "up"
                                    ? palette.primary
                                    : palette.mutedText
                                }
                                strokeWidth={2}
                              />
                            }
                            label={labels.like}
                            onPress={() => handleFeedback(key, "up")}
                            active={feedback[key] === "up"}
                            color={palette.primary}
                            textColor={palette.mutedText}
                          />
                          <ActionButton
                            icon={
                              <ThumbsDown
                                size={14}
                                color={
                                  feedback[key] === "down"
                                    ? palette.primary
                                    : palette.mutedText
                                }
                                strokeWidth={2}
                              />
                            }
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

                {streamError ? (
                  <View style={styles.messageBlock}>
                    <View
                      style={[
                        styles.messageRow,
                        { justifyContent: isRTL ? "flex-end" : "flex-start" },
                      ]}
                    >
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
                        <Text
                          style={[
                            styles.messageText,
                            {
                              color: palette.assistantText,
                              textAlign: isRTL ? "right" : "left",
                            },
                          ]}
                        >
                          {streamError}
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
                textAlignVertical="center"
                returnKeyType="send"
                onSubmitEditing={() => handleSend(input)}
                onFocus={() => {
                  // Scroll to bottom when composer gains focus so the
                  // last message is visible above the keyboard on Android.
                  setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
                }}
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
                  android_ripple={{
                    color: "rgba(255,255,255,0.16)",
                    radius: 22,
                    borderless: false,
                  }}
                  style={[
                    styles.sendButton,
                    { backgroundColor: palette.primary },
                  ]}
                >
                  <ArrowUp size={18} color="#FFFFFF" strokeWidth={2.4} />
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
      <Modal
        visible={isHistoryVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsHistoryVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsHistoryVisible(false)}
        >
          <Pressable
            style={[
              styles.drawerContainer,
              {
                backgroundColor: palette.background,
                right: isRTL ? 0 : undefined,
                left: isRTL ? undefined : 0,
                position: "absolute",
              },
            ]}
            onPress={() => { }}
          >
            <View
              style={[
                styles.drawerHeader,
                { borderBottomColor: palette.surfaceBorder },
              ]}
            >
              <Text style={[styles.headerTitle, { color: palette.text }]}>
                {labels.historyTitle}
              </Text>
            </View>
            {isHistoryLoading && conversations.length === 0 ? (
              <View style={styles.emptyState}>
                <ActivityIndicator size="small" color={palette.primary} />
              </View>
            ) : (
              <FlatList
                data={conversations}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.drawerList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.drawerItem,
                      { borderBottomColor: palette.surfaceBorder },
                      currentChatId === item.id && {
                        backgroundColor: palette.surfaceBorder,
                      },
                    ]}
                    onPress={() => handleSelectConversation(item.id)}
                  >
                    <View style={styles.drawerItemContent}>
                      <Text
                        style={[
                          styles.drawerItemTitle,
                          { color: palette.text, textAlign: isRTL ? "right" : "left" },
                        ]}
                        numberOfLines={1}
                      >
                        {item.title || (language === "ar" ? "محادثة جديدة" : "New Conversation")}
                      </Text>
                      <Text
                        style={[
                          styles.drawerItemDate,
                          { color: palette.subtitle, textAlign: isRTL ? "right" : "left" },
                        ]}
                      >
                        {new Date(item.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.drawerItemDelete}
                      onPress={() => handleDeleteConversation(item.id)}
                    >
                      <Trash2 size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                )}
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>
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
    fontWeight: mediumFontWeight,
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
    fontWeight: mediumFontWeight,
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
    fontWeight: mediumFontWeight,
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
    fontWeight: normalFontWeight,
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
    fontWeight: mediumFontWeight,
  },
  composerWrap: {
    paddingHorizontal: isSmallScreen ? 14 : 18,
    paddingTop: 10,
    paddingBottom: Platform.OS === "android" ? 12 : 2,
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
    fontWeight: normalFontWeight,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  drawerContainer: {
    width: "80%",
    maxWidth: 360,
    height: "100%",
    borderRightWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: StyleSheet.hairlineWidth,
    elevation: 16,
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  drawerHeader: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
  },
  drawerList: {
    paddingVertical: 8,
  },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  drawerItemContent: {
    flex: 1,
    paddingHorizontal: 12,
  },
  drawerItemTitle: {
    fontSize: 15,
    fontWeight: fontWeight.semibold as any,
    marginBottom: 4,
  },
  drawerItemDate: {
    fontSize: 12,
  },
  drawerItemDelete: {
    padding: 8,
  },
});
