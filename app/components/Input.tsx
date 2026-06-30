import React from "react";
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
} from "react-native";
import { Colors } from "../lib/theme";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  theme: "light" | "dark";
  icon?: React.ReactNode;
}

const Input = React.forwardRef<TextInput, InputProps>(
  ({ label, error, theme, icon, ...props }, ref) => {
    const colors = Colors[theme];

    return (
      <View style={styles.container}>
        {label && (
          <Text style={[styles.label, { color: colors.foreground }]}>
            {label}
          </Text>
        )}
        <View
          style={[
            styles.inputWrapper,
            {
              backgroundColor: colors.input,
              borderColor: error ? colors.destructive : colors.border,
            },
          ]}
        >
          {icon && <View style={styles.icon}>{icon}</View>}
          <TextInput
            ref={ref}
            style={[
              styles.input,
              {
                color: colors.foreground,
                paddingLeft: icon ? 8 : 12,
              },
            ]}
            placeholderTextColor={colors.muted}
            {...props}
          />
        </View>
        {error && (
          <Text style={[styles.error, { color: colors.destructive }]}>
            {error}
          </Text>
        )}
      </View>
    );
  }
);

Input.displayName = "Input";

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    height: 44,
  },
  error: {
    fontSize: 12,
    marginTop: 6,
    fontWeight: "500",
  },
});

export default Input;
