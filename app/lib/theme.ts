export const Colors = {
  light: {
    background: "#ffffff",
    foreground: "#0f1419",
    card: "#f5f5f5",
    cardForeground: "#0f1419",
    primary: "#1E75FF",
    primaryForeground: "#ffffff",
    secondary: "#8b5cf6",
    secondaryForeground: "#ffffff",
    muted: "#d1d5db",
    mutedForeground: "#6b7280",
    accent: "#10b981",
    accentForeground: "#ffffff",
    destructive: "#ef4444",
    destructiveForeground: "#ffffff",
    border: "#e5e7eb",
    input: "#e5e7eb",
    ring: "#1E75FF",
  },
  dark: {
    background: "#0B111E",
    foreground: "#FFFFFF",
    card: "#111827",
    cardForeground: "#F1F5F9",
    primary: "#1E75FF",
    primaryForeground: "#FFFFFF",
    secondary: "#8B5CF6",
    secondaryForeground: "#FFFFFF",
    muted: "#374151",
    mutedForeground: "#94A3B8",
    accent: "#10B981",
    accentForeground: "#FFFFFF",
    destructive: "#EF4444",
    destructiveForeground: "#FFFFFF",
    border: "#1E293B",
    input: "#1F2937",
    ring: "#1E75FF",
  },
};

export type Theme = "light" | "dark";

export const getThemeColors = (theme: Theme) => {
  return Colors[theme];
};

export const statusColors = {
  completed: { bg: "#d1fae5", text: "#065f46" },
  "in-progress": { bg: "#fef3c7", text: "#92400e" },
  planned: { bg: "#e5e7eb", text: "#374151" },
};

export const gradeToGPA = (grade: string, system: "4.0" | "5.0"): number => {
  const scale4 = {
    "A+": 4.0,
    A: 4.0,
    "A-": 3.7,
    "B+": 3.3,
    B: 3.0,
    "B-": 2.7,
    "C+": 2.3,
    C: 2.0,
    "C-": 1.7,
    "D+": 1.3,
    D: 1.0,
    F: 0.0,
  };
  const scale5 = {
    "A+": 5.0,
    A: 5.0,
    "A-": 4.5,
    "B+": 4.0,
    B: 3.5,
    "B-": 3.0,
    "C+": 2.5,
    C: 2.0,
    "C-": 1.5,
    "D+": 1.0,
    D: 0.5,
    F: 0.0,
  };

  const scales = system === "4.0" ? scale4 : scale5;
  return scales[grade as keyof typeof scales] || 0;
};

export const calculateCumulativeGPA = (
  courses: { status: string; credits: number; grade?: string }[],
  system: "4.0" | "5.0" = "4.0",
) => {
  const completedCourses = courses.filter((c) => c.status === "completed");
  const completedCredits = completedCourses.reduce(
    (sum, c) => sum + c.credits,
    0,
  );
  const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0);

  let totalPoints = 0;
  if (completedCourses.length > 0) {
    completedCourses.forEach((c) => {
      if (c.grade) {
        const gpa = gradeToGPA(c.grade, system);
        totalPoints += gpa * c.credits;
      }
    });
  }

  const gpa =
    completedCredits > 0 ? (totalPoints / completedCredits).toFixed(2) : "0.00";
  return {
    gpa,
    completedCredits,
    totalCredits,
    graduationProgress:
      totalCredits > 0
        ? Math.round((completedCredits / totalCredits) * 100)
        : 0,
    completedCoursesCount: completedCourses.length,
  };
};
