import React, { useEffect, useRef } from "react";
import { Animated, Easing, Image, StyleSheet, View } from "react-native";

// Background colour is sampled from the branded image (pure white)
const BACKGROUND_COLOR = "#FFFFFF";

// Fade-in duration when the splash first appears
const FADE_IN_DURATION_MS = 250;
// Fade-out duration when app is ready
const FADE_OUT_DURATION_MS = 320;

interface BrandedSplashProps {
  /** When true the splash is visible; toggling to false triggers fade-out */
  visible: boolean;
  /** Called once the fade-out animation has fully completed */
  onFadeComplete: () => void;
}

/**
 * BrandedSplash
 *
 * Renders the full branded splash screen (logo + SCHOLAR + Smart Academic
 * Advisor + illustration) on top of all other content.  The component
 * fades IN immediately on mount and fades OUT when `visible` becomes false.
 *
 * Layout strategy:
 *   resizeMode="contain" keeps the entire design visible on every screen
 *   size/aspect ratio.  The white background matches the image so there
 *   are no letterbox bars.
 */
export default function BrandedSplash({
  visible,
  onFadeComplete,
}: BrandedSplashProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  // Track whether we've already started the fade-out so it isn't re-triggered.
  const fadingOut = useRef(false);

  // Fade IN on mount
  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: FADE_IN_DURATION_MS,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fade OUT when visible flips to false
  useEffect(() => {
    if (visible || fadingOut.current) return;

    fadingOut.current = true;

    Animated.timing(opacity, {
      toValue: 0,
      duration: FADE_OUT_DURATION_MS,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        onFadeComplete();
      }
    });
  }, [onFadeComplete, opacity, visible]);

  return (
    <Animated.View
      // Intercept no touches — the underlying navigator is already mounted
      // and we don't want the splash to block interactions after it fades.
      pointerEvents="none"
      style={[styles.container, { opacity }]}
    >
      {/*
       * A plain View fills the screen with the background colour first so
       * there is zero flash while the PNG decodes on lower-end devices.
       */}
      <View style={styles.background} />

      <Image
        source={require("../assets/Custom Splash Screen.png")}
        style={styles.image}
        resizeMode="contain"
        // Decode eagerly so the image is ready as soon as the JS thread is
        fadeDuration={0} // Android: disable the built-in cross-fade
        accessible={false}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    elevation: 999, // Android stacking
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BACKGROUND_COLOR,
  },
  image: {
    flex: 1,
    width: "100%",
    // height is driven by flex: 1, width fills the container, and
    // resizeMode="contain" scales the image to fit without cropping.
  },
});
