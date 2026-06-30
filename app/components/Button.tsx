import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  GestureResponderEvent,
} from "react-native";
import { Colors } from "../lib/theme";

interface ButtonProps {
  label: string;
  onPress: (event: GestureResponderEvent) => void;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  theme: "light" | "dark";
}

const Button = ({
  label,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  fullWidth = false,
  theme,
}: ButtonProps) => {
  const colors = Colors[theme];

  const variantStyles = {
    primary: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    secondary: {
      backgroundColor: colors.secondary,
      borderColor: colors.secondary,
    },
    outline: {
      backgroundColor: "transparent",
      borderColor: colors.border,
      borderWidth: 1,
    },
    ghost: {
      backgroundColor: "transparent",
      borderColor: "transparent",
    },
    destructive: {
      backgroundColor: colors.destructive,
      borderColor: colors.destructive,
    },
  };

  const sizeStyles = {
    sm: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      minHeight: 32,
    },
    md: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      minHeight: 44,
    },
    lg: {
      paddingVertical: 16,
      paddingHorizontal: 24,
      minHeight: 52,
    },
  };

  const textVariantStyles = {
    primary: colors.primaryForeground,
    secondary: colors.secondaryForeground,
    outline: colors.foreground,
    ghost: colors.foreground,
    destructive: colors.destructiveForeground,
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
      ]}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.text,
          { color: textVariantStyles[variant] },
          size === "sm" && styles.textSm,
          size === "lg" && styles.textLg,
        ]}
      >
        {loading ? "..." : label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  fullWidth: {
    width: "100%",
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 14,
    fontWeight: "600",
  },
  textSm: {
    fontSize: 12,
  },
  textLg: {
    fontSize: 16,
  },
});

export default Button;
