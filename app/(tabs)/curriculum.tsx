import React, { useState, useMemo } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  TextInput,
  StatusBar,
} from "react-native";
import {
  Plus,
  X,
  Trash2,
  BookOpen,
  Layers,
  Bookmark,
} from "lucide-react-native";
import { useStore, useThemeColors, useAppLocale } from "../lib/store";
import { ScreenHeader } from "../components/ScreenHeader";
import {
  fontSize,
  fontWeight,
  colors,
  spacing,
  borderRadius,
  shadows,
  isSmallScreen,
  tabBarHeight,
} from "../lib/constants";

export default function CurriculumScreen() {
  const store = useStore();
  const theme = useStore((state) => state.theme);
  const themeColors = useThemeColors();
  const { t } = useAppLocale();
  const isDark = theme === "dark";
  const palette = {
    background: themeColors.background,
    surface: isDark ? "#111827" : "#FFFFFF",
    surfaceAlt: isDark ? "#1F2937" : "#F8FAFC",
    surfaceSoft: isDark ? "#0F172A" : colors.background.tertiary,
    border: themeColors.border,
    borderSubtle: isDark ? "rgba(148,163,184,0.18)" : "rgba(0,0,0,0.04)",
    divider: isDark ? "rgba(148,163,184,0.18)" : "rgba(0,0,0,0.06)",
    textPrimary: themeColors.foreground,
    textSecondary: isDark ? "#CBD5E1" : colors.text.secondary,
    textMuted: themeColors.mutedForeground,
    textPlaceholder: isDark ? "#8FA0B8" : colors.text.placeholder,
    overlay: isDark ? "rgba(2,6,23,0.72)" : "rgba(0,0,0,0.35)",
    subtleFill: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
    lockedFill: isDark ? "rgba(15,23,42,0.92)" : "rgba(248,250,252,0.8)",
    inputFill: isDark ? "#0F172A" : "#F8FAFC",
    inputBorder: isDark ? "rgba(148,163,184,0.22)" : "rgba(0,0,0,0.06)",
  };
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    credits: "3",
    semester: "1",
  });

  const coursesBySemester = useMemo(() => {
    const grouped: Record<number, typeof store.courses> = {};
    store.courses.forEach((course) => {
      if (!grouped[course.semester]) {
        grouped[course.semester] = [];
      }
      grouped[course.semester].push(course);
    });
    return Object.entries(grouped)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([semester, courses]) => ({
        semester: Number(semester),
        courses,
      }));
  }, [store.courses]);

  const handleAddCourse = () => {
    if (formData.code && formData.name) {
      store.addCourse({
        code: formData.code.toUpperCase(),
        name: formData.name,
        credits: Number(formData.credits),
        semester: Number(formData.semester),
        status: "planned",
        prerequisites: [],
      });
      setFormData({ code: "", name: "", credits: "3", semester: "1" });
      setShowAddModal(false);
    }
  };

  const handleDeleteCourse = (courseId: string) => {
    store.deleteCourse(courseId);
  };

  const getStatusDetails = (status: string, prereqsMet: boolean) => {
    if (!prereqsMet) {
      return {
        color: palette.textPlaceholder,
        bg: isDark ? "rgba(148,163,184,0.16)" : "rgba(148, 163, 184, 0.08)",
        label: t("legendLocked"),
      };
    }
    switch (status) {
      case "completed":
        return {
          color: colors.success,
          bg: colors.success + "0d",
          label: t("legendCompleted"),
        };
      case "in-progress":
        return {
          color: colors.primary,
          bg: colors.primary + "0d",
          label: t("legendInProgress"),
        };
      case "planned":
        return {
          color: colors.warning,
          bg: colors.warning + "0d",
          label: t("legendPlanned"),
        };
      default:
        return {
          color: palette.textPlaceholder,
          bg: isDark ? "rgba(148,163,184,0.16)" : "rgba(148, 163, 184, 0.08)",
          label: t("legendLocked"),
        };
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: palette.background }]}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={palette.background}
      />

      <ScreenHeader showLogo />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Title Block */}
        <View style={styles.titleRow}>
          <View>
            <Text style={[styles.tagline, { color: palette.textPlaceholder }]}>
              {t("academicRoadmap")}
            </Text>
            <Text style={[styles.title, { color: palette.textPrimary }]}>
              {t("curriculumPlanTitle")}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: palette.textPrimary }]}
            onPress={() => setShowAddModal(true)}
            activeOpacity={0.85}
          >
            <Plus size={15} color="#FFFFFF" strokeWidth={3} />
            <Text style={styles.addButtonText}>{t("addCourseBtn")}</Text>
          </TouchableOpacity>
        </View>

        {/* System Legend */}
        <View
          style={[
            styles.legendContainer,
            {
              backgroundColor: palette.surface,
              borderColor: palette.borderSubtle,
            },
          ]}
        >
          {[
            { label: t("legendCompleted"), color: colors.success },
            { label: t("legendInProgress"), color: colors.primary },
            { label: t("legendPlanned"), color: colors.warning },
            { label: t("legendLocked"), color: palette.textPlaceholder },
          ].map((item) => (
            <View key={item.label} style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: item.color }]} />
              <Text
                style={[styles.legendText, { color: palette.textSecondary }]}
              >
                {item.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Empty State / Courses Tree */}
        {store.courses.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              {
                backgroundColor: palette.surface,
                borderColor: palette.borderSubtle,
              },
            ]}
          >
            <View
              style={[
                styles.emptyIconBox,
                { backgroundColor: palette.subtleFill },
              ]}
            >
              <BookOpen size={24} color={palette.textPlaceholder} />
            </View>
            <Text style={[styles.emptyText, { color: palette.textPrimary }]}>
              {t("noCoursesYet")}
            </Text>
            <Text
              style={[styles.emptySubtext, { color: palette.textPlaceholder }]}
            >
              {t("beginArchitecting")}
            </Text>
            <TouchableOpacity
              style={[
                styles.emptyButton,
                { backgroundColor: palette.textPrimary },
              ]}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={styles.emptyButtonText}>
                {t("createFirstEntry")}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.courseListContainer}>
            {coursesBySemester.map((sem) => (
              <View key={sem.semester} style={styles.semesterSection}>
                <View style={styles.semesterHeaderRow}>
                  <Layers
                    size={16}
                    color={palette.textPrimary}
                    style={styles.semHeaderIcon}
                  />
                  <Text
                    style={[
                      styles.semesterTitle,
                      { color: palette.textPrimary },
                    ]}
                  >
                    {t("semesterLabel")} {sem.semester}
                  </Text>
                  <View
                    style={[
                      styles.semesterLine,
                      { backgroundColor: palette.divider },
                    ]}
                  />
                </View>

                <View style={styles.courseGrid}>
                  {sem.courses.map((course) => {
                    const hasPrereqs =
                      course.prerequisites && course.prerequisites.length > 0;
                    const prereqsMet = hasPrereqs
                      ? course.prerequisites.every((prereqId) =>
                          store.courses.find(
                            (c) =>
                              c.id === prereqId && c.status === "completed",
                          ),
                        )
                      : true;

                    const status = getStatusDetails(course.status, prereqsMet);

                    return (
                      <View
                        key={course.id}
                        style={[
                          styles.courseCard,
                          {
                            backgroundColor: palette.surface,
                            borderColor: palette.borderSubtle,
                            borderLeftColor: status.color,
                          },
                          !prereqsMet && [
                            styles.lockedCard,
                            { backgroundColor: palette.lockedFill },
                          ],
                        ]}
                      >
                        <View style={styles.cardMainLayout}>
                          <View style={styles.cardLeftContent}>
                            <View style={styles.badgeRow}>
                              <View
                                style={[
                                  styles.codeBadge,
                                  {
                                    backgroundColor: status.bg,
                                    borderColor: status.color + "30",
                                  },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.courseCode,
                                    { color: status.color },
                                  ]}
                                >
                                  {course.code}
                                </Text>
                              </View>
                              <Text
                                style={[
                                  styles.courseCredits,
                                  { color: palette.textPlaceholder },
                                ]}
                              >
                                {course.credits}{" "}
                                {course.credits === 1
                                  ? t("creditSingular")
                                  : t("creditPlural")}
                              </Text>
                            </View>

                            <Text
                              style={[
                                styles.courseName,
                                { color: palette.textPrimary },
                              ]}
                              numberOfLines={2}
                            >
                              {course.name}
                            </Text>

                            {course.grade && (
                              <View style={styles.gradeBadge}>
                                <Bookmark size={11} color={colors.primary} />
                                <Text style={styles.courseGrade}>
                                  {t("gradeLabel")}: {course.grade}
                                </Text>
                              </View>
                            )}
                          </View>

                          <View style={styles.cardRightActions}>
                            <TouchableOpacity
                              onPress={() => handleDeleteCourse(course.id)}
                              style={[
                                styles.deleteButton,
                                { backgroundColor: palette.subtleFill },
                              ]}
                              hitSlop={{
                                top: 10,
                                bottom: 10,
                                left: 10,
                                right: 10,
                              }}
                            >
                              <Trash2
                                size={15}
                                color={palette.textPlaceholder}
                              />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modernized Add Course Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View
          style={[styles.modalOverlay, { backgroundColor: palette.overlay }]}
        >
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: palette.surface,
                borderColor: palette.borderSubtle,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <View>
                <Text
                  style={[styles.modalTitle, { color: palette.textPrimary }]}
                >
                  {t("addNewCourse")}
                </Text>
                <Text
                  style={[
                    styles.modalSubtitle,
                    { color: palette.textPlaceholder },
                  ]}
                >
                  {t("incorporateCourse")}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowAddModal(false)}
                style={[
                  styles.closeButton,
                  { backgroundColor: palette.subtleFill },
                ]}
              >
                <X size={20} color={palette.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={[styles.modalLabel, { color: palette.textMuted }]}>
                  {t("courseCodeLabel")}
                </Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor: palette.inputFill,
                      borderColor: palette.inputBorder,
                      color: palette.textPrimary,
                    },
                  ]}
                  placeholder={t("courseCodePlaceholder")}
                  placeholderTextColor={palette.textPlaceholder}
                  value={formData.code}
                  onChangeText={(text) =>
                    setFormData({ ...formData, code: text })
                  }
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.modalLabel, { color: palette.textMuted }]}>
                  {t("courseNameLabel")}
                </Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor: palette.inputFill,
                      borderColor: palette.inputBorder,
                      color: palette.textPrimary,
                    },
                  ]}
                  placeholder={t("courseNamePlaceholder")}
                  placeholderTextColor={palette.textPlaceholder}
                  value={formData.name}
                  onChangeText={(text) =>
                    setFormData({ ...formData, name: text })
                  }
                />
              </View>

              <View style={styles.rowGrid}>
                <View style={styles.gridColumn}>
                  <Text
                    style={[styles.modalLabel, { color: palette.textMuted }]}
                  >
                    {t("creditHoursLabel")}
                  </Text>
                  <TextInput
                    style={[
                      styles.modalInput,
                      {
                        backgroundColor: palette.inputFill,
                        borderColor: palette.inputBorder,
                        color: palette.textPrimary,
                      },
                    ]}
                    placeholder="3"
                    placeholderTextColor={palette.textPlaceholder}
                    value={formData.credits}
                    onChangeText={(text) =>
                      setFormData({ ...formData, credits: text })
                    }
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.gridColumn}>
                  <Text
                    style={[styles.modalLabel, { color: palette.textMuted }]}
                  >
                    {t("targetSemesterLabel")}
                  </Text>
                  <TextInput
                    style={[
                      styles.modalInput,
                      {
                        backgroundColor: palette.inputFill,
                        borderColor: palette.inputBorder,
                        color: palette.textPrimary,
                      },
                    ]}
                    placeholder="1"
                    placeholderTextColor={palette.textPlaceholder}
                    value={formData.semester}
                    onChangeText={(text) =>
                      setFormData({ ...formData, semester: text })
                    }
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.modalSubmitButton,
                  { backgroundColor: palette.textPrimary },
                ]}
                onPress={handleAddCourse}
                activeOpacity={0.9}
              >
                <Text style={styles.modalSubmitButtonText}>
                  {t("confirmAndAdd")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: isSmallScreen ? spacing.md : spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: tabBarHeight.md + spacing.xl + (isSmallScreen ? 64 : 72),
  },

  // Title Row Optimization
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  tagline: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.text.placeholder,
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  title: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.extrabold,
    color: colors.text.primary,
    letterSpacing: -0.6,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.text.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    ...shadows.sm,
  },
  addButtonText: {
    color: colors.text.inverse,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    marginLeft: 5,
  },

  // Professional Minimal Legend
  legendContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 14,
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
    marginBottom: spacing.lg,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    fontWeight: fontWeight.semibold,
    color: colors.text.secondary,
  },

  // Beautiful Clean Card Structural Design
  courseListContainer: {
    gap: spacing.xl,
  },
  semesterSection: {
    gap: spacing.sm,
  },
  semesterHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  semHeaderIcon: {
    marginRight: 6,
  },
  semesterTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.extrabold,
    color: colors.text.primary,
    letterSpacing: -0.2,
  },
  semesterLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(0,0,0,0.06)",
    marginLeft: 12,
  },
  courseGrid: {
    gap: 10,
  },
  courseCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 2,
  },
  lockedCard: {
    opacity: 0.55,
    backgroundColor: "rgba(248, 250, 252, 0.8)",
  },
  cardMainLayout: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardLeftContent: {
    flex: 1,
    paddingRight: 8,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  codeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  courseCode: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.3,
  },
  courseCredits: {
    fontSize: 11,
    fontWeight: fontWeight.semibold,
    color: colors.text.placeholder,
  },
  courseName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    lineHeight: 20,
  },
  gradeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
    backgroundColor: colors.primary + "0a",
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  courseGrade: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  cardRightActions: {
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.02)",
  },

  // Empty State Structure
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: spacing["3xl"],
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
    ...shadows.sm,
  },
  emptyIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.02)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.placeholder,
    textAlign: "center",
    marginTop: 4,
    marginBottom: spacing.lg,
  },
  emptyButton: {
    backgroundColor: colors.text.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: colors.text.inverse,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },

  // Clean Professional Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: isSmallScreen ? spacing.md : spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing["2xl"],
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.extrabold,
    color: colors.text.primary,
  },
  modalSubtitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.text.placeholder,
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
    backgroundColor: "rgba(0,0,0,0.03)",
    borderRadius: 8,
  },
  modalBody: {
    gap: spacing.md,
  },
  formGroup: {
    gap: 6,
  },
  modalLabel: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.text.muted,
    letterSpacing: 0.6,
  },
  modalInput: {
    backgroundColor: "#F8FAFC",
    borderColor: "rgba(0,0,0,0.06)",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    height: 46,
    color: colors.text.primary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  rowGrid: {
    flexDirection: "row",
    gap: spacing.md,
  },
  gridColumn: {
    flex: 1,
    gap: 6,
  },
  modalSubmitButton: {
    backgroundColor: colors.text.primary,
    borderRadius: 10,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
  },
  modalSubmitButtonText: {
    color: colors.text.inverse,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
});
