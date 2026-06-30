import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors } from "../lib/theme";

interface CardProps {
  children: React.ReactNode;
  theme: "light" | "dark";
  style?: any;
}

export const Card = ({ children, theme, style }: CardProps) => {
  const colors = Colors[theme];
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        style,
      ]}
    >
      {children}
    </View>
  );
};

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  theme: "light" | "dark";
}

export const StatCard = ({ label, value, subtext, icon, theme }: StatCardProps) => {
  const colors = Colors[theme];
  return (
    <Card theme={theme} style={styles.statCard}>
      <View style={styles.statContent}>
        {icon && <View style={styles.statIcon}>{icon}</View>}
        <View style={styles.statText}>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
            {label}
          </Text>
          <Text
            style={[styles.statValue, { color: colors.foreground }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {value}
          </Text>
          {subtext && (
            <Text style={[styles.statSubtext, { color: colors.muted }]}>
              {subtext}
            </Text>
          )}
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  statCard: {
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  statContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  statIcon: {
    marginRight: 12,
  },
  statText: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 4,
  },
  statSubtext: {
    fontSize: 12,
  },
});
