import React from "react";
import { Tabs, useRouter } from "expo-router";
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import {
  BookOpen,
  Calculator,
  Calendar,
  LayoutGrid,
  MessageSquare,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStore } from "../../lib/store";
import { Colors } from "../../lib/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const isSmallScreen = SCREEN_WIDTH < 375;

const TAB_CONFIG: Record<string, { label: string; icon: LucideIcon }> = {
  index: { label: "Overview", icon: LayoutGrid },
  curriculum: { label: "Curriculum", icon: BookOpen },
  gpa: { label: "GPA", icon: Calculator },
  planner: { label: "Planner", icon: Calendar },
};

function ScholarTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useStore((state) => state.theme);
  const themeColors = Colors[theme];
  const isDark = theme === "dark";
  const [fabScale] = React.useState(() => new Animated.Value(1));
  const focusedRoute = state.routes[state.index]?.name;
  const isMainScreen =
    focusedRoute === "index" ||
    focusedRoute === "curriculum" ||
    focusedRoute === "gpa" ||
    focusedRoute === "planner";
  if (!isMainScreen) return null;

  const barMarginH = isSmallScreen ? 12 : 14;
  const barMarginBottom = isSmallScreen ? 10 : 12;
  const barHeight =
    Platform.OS === "ios" ? (isSmallScreen ? 64 : 70) : isSmallScreen ? 58 : 62;
  const bottomInset = Math.max(insets.bottom, Platform.OS === "ios" ? 8 : 0);
  const fabSize = isSmallScreen ? 56 : 60;
  const fabRight = isSmallScreen ? 16 : 20;
  // FAB sits above the floating bar surface (bar height + its bottom margin + safe area + gap)
  const fabBottom = barHeight + barMarginBottom + bottomInset + (isSmallScreen ? 14 : 18);

  const activeColor = "#2563EB";
  const inactiveColor = themeColors.mutedForeground;
  const iconSize = isSmallScreen ? 18 : 20;
  const strokeWidth = 2.1;

  const shadowStyle =
    Platform.OS === "ios"
      ? {
          shadowColor: "#0F172A",
          shadowOffset: { width: 0, height: -1 },
          shadowOpacity: isDark ? 0.24 : 0.06,
          shadowRadius: 2,
        }
      : { elevation: 8 };

  const fabShadowStyle =
    Platform.OS === "ios"
      ? {
          shadowColor: "#2563EB",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.24,
          shadowRadius: 18,
        }
      : { elevation: 10 };

  const visibleRoutes = state.routes.filter(
    (route) => route.name !== "settings" && route.name !== "advisor",
  );

  const animateFab = (toValue: number) => {
    Animated.spring(fabScale, {
      toValue,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();
  };

  return (
    <View
      pointerEvents="box-none"
      className="absolute inset-x-0 bottom-0"
      style={{ backgroundColor: themeColors.background }}
    >
      <Animated.View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          right: fabRight,
          bottom: fabBottom,
          transform: [{ scale: fabScale }],
          zIndex: 40,
          elevation: 40,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open AI Assistant"
          onPressIn={() => animateFab(0.94)}
          onPressOut={() => animateFab(1)}
          onPress={() => router.push("/advisor")}
          android_ripple={{
            color: "rgba(255,255,255,0.24)",
            radius: fabSize / 2,
            borderless: false,
          }}
          style={{
            width: fabSize,
            height: fabSize,
            borderRadius: fabSize / 2,
            backgroundColor: "#2563EB",
            alignItems: "center",
            justifyContent: "center",
            ...fabShadowStyle,
          }}
        >
          <MessageSquare size={24} color="#FFFFFF" strokeWidth={2.2} />
        </Pressable>
      </Animated.View>

      <View
        style={{
          height: barHeight + bottomInset,
          paddingBottom: bottomInset,
          backgroundColor: themeColors.background,
          borderTopWidth: 1,
          borderTopColor: themeColors.border,
          ...shadowStyle,
        }}
      >
        <View
          className="flex-1 flex-row items-start"
          style={{
            height: barHeight,
            backgroundColor: themeColors.background,
            paddingHorizontal: isSmallScreen ? 4 : 8,
            paddingTop: isSmallScreen ? 6 : 8,
          }}
        >
          {visibleRoutes.map((route) => {
            const config = TAB_CONFIG[route.name];
            if (!config) return null;

            const currentIndex = state.routes.findIndex(
              (item) => item.key === route.key,
            );
            const isFocused = state.index === currentIndex;
            const color = isFocused ? activeColor : inactiveColor;
            const { options } = descriptors[route.key];
            const Icon = config.icon;

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: "tabLongPress",
                target: route.key,
              });
            };

            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarButtonTestID}
                onPress={onPress}
                onLongPress={onLongPress}
                hitSlop={10}
                className="flex-1 items-center justify-start"
                style={{ paddingTop: 4, minWidth: 0 }}
              >
                <Icon size={iconSize} color={color} strokeWidth={strokeWidth} />
                <Text
                  className={`${isSmallScreen ? "text-[10px] leading-[12px]" : "text-[11px] leading-[13px]"} tracking-[-0.2px]`}
                  style={{
                    color,
                    fontWeight: isFocused ? "700" : "500",
                    marginTop: 4,
                    textAlign: "center",
                  }}
                  numberOfLines={2}
                  allowFontScaling={false}
                >
                  {config.label}
                </Text>
                {isFocused ? (
                  <View
                    style={{
                      marginTop: 4,
                      width: 36,
                      height: 3,
                      borderRadius: 999,
                      backgroundColor: activeColor,
                    }}
                  />
                ) : (
                  <View style={{ marginTop: 4, width: 36, height: 3 }} />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const theme = useStore((state) => state.theme);
  const themeColors = Colors[theme];

  return (
    <Tabs
      tabBar={(props) => <ScholarTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: themeColors.background },
        tabBarStyle: { backgroundColor: themeColors.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Overview", tabBarLabel: "Overview" }}
      />
      <Tabs.Screen
        name="curriculum"
        options={{ title: "Curriculum", tabBarLabel: "Curriculum" }}
      />
      <Tabs.Screen name="advisor" options={{ href: null }} />
      <Tabs.Screen name="gpa" options={{ title: "GPA", tabBarLabel: "GPA" }} />
      <Tabs.Screen
        name="planner"
        options={{ title: "Planner", tabBarLabel: "Planner" }}
      />
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}
