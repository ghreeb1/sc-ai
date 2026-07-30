import "../global.css";
import React, { useEffect, useRef, useState } from "react";
import { Stack, useRouter, useSegments, useRootNavigationState } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StyleSheet } from "react-native";
import { useStore } from "../lib/store";
import { Colors } from "../lib/theme";
import { initializeAuth, setUnauthorizedHandler } from "../services/auth";
import BrandedSplash from "../components/BrandedSplash";

// ─── Branded splash timing ────────────────────────────────────────────────────
// The branded screen is shown for at least this long.  If initialisation
// finishes earlier the splash is held until the timer fires; if it takes
// longer the splash stays until initialisation is done.
const BRANDED_SPLASH_MIN_MS = 900;

// ─── Keep native splash visible until we explicitly hide it ──────────────────
SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ duration: 250, fade: true });

// ─── Zustand hydration helper ────────────────────────────────────────────────
// Cast to access the persist API that zustand attaches at runtime.
const persistedStore = useStore as typeof useStore & {
  persist: {
    hasHydrated: () => boolean;
    onHydrate: (listener: () => void) => () => void;
    onFinishHydration: (listener: () => void) => () => void;
  };
};

function useStoreHydrated(): boolean {
  const [hydrated, setHydrated] = useState(
    persistedStore.persist.hasHydrated(),
  );

  useEffect(() => {
    // Guard: if already hydrated by the time this effect runs we're done.
    if (persistedStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }

    const unsubHydrate = persistedStore.persist.onHydrate(() =>
      setHydrated(false),
    );
    const unsubFinish = persistedStore.persist.onFinishHydration(() =>
      setHydrated(true),
    );

    return () => {
      unsubHydrate();
      unsubFinish();
    };
  }, []);

  return hydrated;
}

// ─── Auth guard ───────────────────────────────────────────────────────────────
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
  const navigationState = useRootNavigationState();

  const inAuthGroup = segments[0] === "auth";

  // ── B: AuthGuard – log every render and every redirect decision ──────────
  const renderCount = React.useRef(0);
  renderCount.current += 1;

  useEffect(() => {
    if (!hydrated || !navigationState?.key) {
      return;
    }

    if (!authed && !inAuthGroup) {
      router.replace("/auth/login");
    } else if (authed && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [authed, hydrated, router, inAuthGroup, navigationState?.key]);

  return <>{children}</>;
}

// ─── Root layout ──────────────────────────────────────────────────────────────
export default function RootLayout() {
  const theme = useStore((state) => state.theme);
  const authBootstrapped = useStore((state) => state.authBootstrapped);
  const bootstrapAuth = useStore((state) => state.bootstrapAuth);
  const logout = useStore((state) => state.logout);
  const isStoreHydrated = useStoreHydrated();

  // Keep a stable ref to the latest logout function so the initializeAuth
  // effect never needs to re-run when logout's identity changes.  Without
  // this, every Zustand state update causes a new logout reference, which
  // re-runs the effect, re-calls initializeAuth(), and re-registers the
  // unauthorized handler with a fresh closure — creating a window where
  // the handler captured by api.ts points at a different closure than the
  // one that was just registered.
  const logoutRef = useRef(logout);
  useEffect(() => {
    logoutRef.current = logout;
  });

  // Whether the minimum branded-splash display time has elapsed.
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  // Controls the branded splash visibility state (drives the fade-out).
  const [showBrandedSplash, setShowBrandedSplash] = useState(true);
  // Controls whether the component is mounted at all (removed after fade-out).
  const [mountBrandedSplash, setMountBrandedSplash] = useState(true);

  // Initialise the auth token interceptors exactly once on mount.
  // Using logoutRef (updated every render) means the handler always calls
  // the latest logout without this effect ever needing to re-run.
  useEffect(() => {
    initializeAuth();
    setUnauthorizedHandler(() => {
      logoutRef.current();
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty – must only run once

  // Start the minimum display timer immediately on mount.
  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), BRANDED_SPLASH_MIN_MS);
    return () => clearTimeout(timer);
  }, []);

  // Bootstrap auth once the store is hydrated.
  useEffect(() => {
    if (isStoreHydrated && !authBootstrapped) {
      bootstrapAuth();
    }
  }, [authBootstrapped, bootstrapAuth, isStoreHydrated]);

  // App is considered ready when the store is hydrated AND auth state is known.
  const appReady = isStoreHydrated && authBootstrapped;
  
  // When both conditions are met: hide native splash and start branded fade-out.
  useEffect(() => {
    if (!appReady || !minTimeElapsed) return;

    // Hide the native Expo splash (it was kept alive by preventAutoHideAsync).
    SplashScreen.hideAsync().catch(() => {});
    // Trigger the branded splash fade-out animation.
    setShowBrandedSplash(false);
  }, [appReady, minTimeElapsed]);

  const colors = Colors[theme];

  return (
    <GestureHandlerRootView
      style={[styles.root, { backgroundColor: colors.background }]}
    >
      <SafeAreaProvider style={{ backgroundColor: colors.background }}>
        <AuthGuard hydrated={appReady}>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: "fade",
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            <Stack.Screen
              name="(tabs)"
              options={{ headerShown: false, animation: "fade" }}
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
              options={{ headerShown: false, animation: "fade" }}
            />
            <Stack.Screen
              name="auth/register"
              options={{
                headerShown: false,
                animation: "slide_from_right",
              }}
            />
          </Stack>

          {/*
           * BrandedSplash sits above the navigator in the React tree so it
           * covers every screen during initialisation.  It unmounts itself
           * (via onFadeComplete → setMountBrandedSplash(false)) after the
           * fade-out animation finishes, freeing memory.
           */}
          {mountBrandedSplash && (
            <BrandedSplash
              visible={showBrandedSplash}
              onFadeComplete={() => setMountBrandedSplash(false)}
            />
          )}
        </AuthGuard>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
