import "../global.css";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Image, StyleSheet } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useStore } from "./lib/store";
import { Colors } from "./lib/theme";

const BRANDED_SPLASH_BACKGROUND = "#F3F4F6";
const BRANDED_SPLASH_MIN_MS = 1200;

SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({
  duration: 250,
  fade: true,
});

const persistedStore = useStore as typeof useStore & {
  persist: {
    hasHydrated: () => boolean;
    onHydrate: (listener: () => void) => () => void;
    onFinishHydration: (listener: () => void) => () => void;
  };
};

function useStoreHydrated() {
  const [hydrated, setHydrated] = useState(
    persistedStore.persist.hasHydrated(),
  );

  useEffect(() => {
    const unsubscribeHydrate = persistedStore.persist.onHydrate(() =>
      setHydrated(false),
    );
    const unsubscribeFinishHydration = persistedStore.persist.onFinishHydration(
      () => setHydrated(true),
    );

    setHydrated(persistedStore.persist.hasHydrated());

    return () => {
      unsubscribeHydrate();
      unsubscribeFinishHydration();
    };
  }, []);

  return hydrated;
}

function BrandedSplash({
  visible,
  onFadeComplete,
}: {
  visible: boolean;
  onFadeComplete: () => void;
}) {
  const [opacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (visible) {
      opacity.setValue(1);
      return;
    }

    Animated.timing(opacity, {
      toValue: 0,
      duration: 320,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        onFadeComplete();
      }
    });
  }, [onFadeComplete, opacity, visible]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFillObject, styles.brandedSplash, { opacity }]}
    >
      <Image
        source={require("../assets/branded-splash.png")}
        style={styles.brandedSplashImage}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

function AuthGuard({
  children,
  hydrated,
}: {
  children: React.ReactNode;
  hydrated: boolean;
}) {
  const authed = useStore((state) => state.authed);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    const inAuthGroup = segments[0] === "auth";

    if (!authed && !inAuthGroup) {
      router.replace("/auth/login");
    } else if (authed && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [authed, hydrated, router, segments]);

  return <>{children}</>;
}

export default function RootLayout() {
  const theme = useStore((state) => state.theme);
  const isStoreHydrated = useStoreHydrated();
  const [minimumSplashTimeElapsed, setMinimumSplashTimeElapsed] =
    useState(false);
  const [showBrandedSplash, setShowBrandedSplash] = useState(true);
  const [mountBrandedSplash, setMountBrandedSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinimumSplashTimeElapsed(true);
    }, BRANDED_SPLASH_MIN_MS);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isStoreHydrated || !minimumSplashTimeElapsed) {
      return;
    }

    SplashScreen.hideAsync().catch(() => {});
    setShowBrandedSplash(false);
  }, [isStoreHydrated, minimumSplashTimeElapsed]);

  const colors = Colors[theme];

  return (
    <GestureHandlerRootView
      style={[styles.root, { backgroundColor: BRANDED_SPLASH_BACKGROUND }]}
    >
      <SafeAreaProvider>
        <AuthGuard hydrated={isStoreHydrated}>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: "fade",
              contentStyle: {
                backgroundColor: colors.background,
              },
            }}
          >
            <Stack.Screen
              name="(tabs)"
              options={{
                headerShown: false,
                animation: "fade",
              }}
            />
            <Stack.Screen
              name="advisor"
              options={{
                headerShown: false,
                animation: "slide_from_right",
                gestureEnabled: true,
              }}
            />
            <Stack.Screen
              name="auth/login"
              options={{
                headerShown: false,
                animation: "fade",
              }}
            />
            <Stack.Screen
              name="auth/register"
              options={{
                headerShown: false,
                animation: "slide_from_right",
              }}
            />
          </Stack>
          {mountBrandedSplash ? (
            <BrandedSplash
              visible={showBrandedSplash}
              onFadeComplete={() => setMountBrandedSplash(false)}
            />
          ) : null}
        </AuthGuard>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  brandedSplash: {
    backgroundColor: BRANDED_SPLASH_BACKGROUND,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  brandedSplashImage: {
    width: "100%",
    height: "100%",
  },
});
