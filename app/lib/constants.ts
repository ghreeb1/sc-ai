import { Dimensions, Platform } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Screen size detection
export const isSmallScreen = SCREEN_WIDTH < 375;
export const isMediumScreen = SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414;
export const isLargeScreen = SCREEN_WIDTH >= 414 && SCREEN_WIDTH < 768;
export const isTablet = SCREEN_WIDTH >= 768;

// Standardized spacing scale
export const spacing = {
  xs: isSmallScreen ? 2 : 4,
  sm: isSmallScreen ? 4 : 6,
  md: isSmallScreen ? 8 : 12,
  lg: isSmallScreen ? 12 : 16,
  xl: isSmallScreen ? 16 : 20,
  "2xl": isSmallScreen ? 20 : 24,
  "3xl": isSmallScreen ? 24 : 32,
};

// Standardized font sizes
export const fontSize = {
  xs: isSmallScreen ? 9 : 10,
  sm: isSmallScreen ? 10 : 11,
  base: isSmallScreen ? 12 : 13,
  md: isSmallScreen ? 13 : 14,
  lg: isSmallScreen ? 14 : 16,
  xl: isSmallScreen ? 16 : 18,
  "2xl": isSmallScreen ? 18 : 20,
  "3xl": isSmallScreen ? 22 : 24,
  "4xl": isSmallScreen ? 26 : 30,
  hero: isSmallScreen ? 32 : 40,
};

// Standardized font weights
export const fontWeight = {
  normal: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
  extrabold: "800" as const,
  black: "900" as const,
};

// Common border radius values
export const borderRadius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  "2xl": 20,
  "3xl": 24,
  full: 9999,
};

// Colors - consistent across the app
export const colors = {
  primary: "#1E75FF",
  primaryDark: "#1a6ae6",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  info: "#3B82F6",
  
  // Text colors
  text: {
    primary: "#0F172A",
    secondary: "#334155",
    muted: "#64748B",
    placeholder: "#94A3B8",
    inverse: "#FFFFFF",
  },
  
  // Background colors
  background: {
    primary: "#FFFFFF",
    secondary: "#F8FAFC",
    tertiary: "#F1F5F9",
    card: "#FFFFFF",
  },
  
  // Border colors
  border: {
    light: "#E2E8F0",
    default: "#CBD5E1",
    dark: "#94A3B8",
  },
};

// Shadows
export const shadows = {
  sm: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
  },
  xl: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  primary: {
    shadowColor: "#1E75FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
};

// Header height constants
export const headerHeight = {
  sm: isSmallScreen ? 50 : 56,
  md: isSmallScreen ? 56 : 64,
  lg: isSmallScreen ? 64 : 72,
};

// Bottom tab bar height
export const tabBarHeight = {
  sm: Platform.OS === "ios" ? 70 : 56,
  md: Platform.OS === "ios" ? 85 : 64,
  lg: Platform.OS === "ios" ? 100 : 80,
};

// Safe area insets (approximate)
export const safeArea = {
  top: Platform.OS === "ios" ? 44 : 24,
  bottom: Platform.OS === "ios" ? 34 : 0,
  horizontal: isSmallScreen ? 16 : 20,
};
