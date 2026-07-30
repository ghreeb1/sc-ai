import React, { useCallback, useState, useMemo } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Plus,
  X,
  Trash2,
  BookOpen,
  Layers,
} from "lucide-react-native";
import { useStore, useThemeColors, useAppLocale } from "../../lib/store";
import { ScreenHeader } from "../../components/ScreenHeader";
import {
  createAcademicCourse,
  getAcademicCourses,
  getStudyPlan,
} from "../../services/academic";
import type { CourseResponse, PaginatedCourseResponse, StudyPlanResponse } from "../../lib/types";
import {
  fontSize,
  fontWeight,
  colors,
  spacing,
  borderRadius,
  shadows,
  isSmallScreen,
  tabBarHeight,
} from "../../lib/constants";

type CourseFormStatus = "planned" | "in_progress" | "completed";
type CourseFormGrade =
  | "A+"
  | "A"
  | "A-"
  | "B+"
  | "B"
  | "B-"
  | "C+"
  | "C"
  | "C-"
  | "D+"
  | "D"
  | "F";

const STATUS_OPTIONS: Array<{ label: string; value: CourseFormStatus }> = [
  { label: "Planned", value: "planned" },
  { label: "In Progress", value: "in_progress" },
  { label: "Completed", value: "completed" },
];

const GRADE_OPTIONS: CourseFormGrade[] = [
  "A+",
  "A",
  "A-",
  "B+",
  "B",
  "B-",
  "C+",
  "C",
  "C-",
  "D+",
  "D",
  "F",
];

const initialFormData = {
  code: "",
  name: "",
  credits: "3",
  semesterNumber: "1",
  status: "planned" as CourseFormStatus,
  grade: "A" as CourseFormGrade,
};

type CurriculumCourse = {
  id: string;
  code: string;
  name: string;
  credits: number;
  semester: number;
  prerequisites: string[];
  status: CourseFormStatus;
};

const normalizeLookupValue = (value?: string | null) =>
  value?.trim().toLowerCase() ?? "";

const getCourseLookupKeys = (course: {
  id?: string;
  code?: string;
  name?: string;
}) =>
  [course.id, course.code, course.name]
    .map(normalizeLookupValue)
    .filter(Boolean);

const buildPlanStatusLookup = (plan: StudyPlanResponse) => {
  const statusByCourseKey = new Map<string, CourseFormStatus>();

  const addEntries = (
    entries: StudyPlanResponse[keyof StudyPlanResponse],
    fallbackStatus: CourseFormStatus,
  ) => {
    entries?.forEach((entry) => {
      let status: CourseFormStatus = fallbackStatus;
      const raw = entry.status;
      if (raw === "completed" || raw === "in_progress" || raw === "planned") {
        status = raw;
      } else if (raw === "in-progress") {
        status = "in_progress";
      }
      getCourseLookupKeys(entry.course).forEach((key) => {
        statusByCourseKey.set(key, status);
      });
    });
  };

  addEntries(plan.completed, "completed");
  addEntries(plan.in_progress, "in_progress");
  addEntries(plan.available, "planned");

  return statusByCourseKey;
};

const mapCourseForCurriculum = (
  course: CourseResponse,
  statusByCourseKey: Map<string, CourseFormStatus>,
): CurriculumCourse => {
  const status =
    getCourseLookupKeys(course)
      .map((key) => statusByCourseKey.get(key))
      .find(Boolean) ?? "planned";

  return {
    id: course.id,
    code: course.code,
    name: course.name,
    credits: course.credit_hours,
    semester: course.semester_recommended ?? 1,
    prerequisites: course.prerequisites,
    status,
  };
};

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
  const [formData, setFormData] = useState(initialFormData);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [gradeDropdownOpen, setGradeDropdownOpen] = useState(false);
  const [curriculumCourses, setCurriculumCourses] = useState<
    CurriculumCourse[]
  >([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadCurriculumData = useCallback(async () => {
    setCoursesLoading(true);
    setLoadError(null);
    try {
      const [rawCoursesPaginated, rawPlan] = await Promise.all([
        getAcademicCourses(),
        getStudyPlan(),
      ]);

      // Ensure plan has the expected shape
      const plan: StudyPlanResponse =
        rawPlan && typeof rawPlan === "object"
          ? (rawPlan as StudyPlanResponse)
          : { completed: [], in_progress: [], available: [] };

      // Build a status lookup from the plan
      const statusLookup = buildPlanStatusLookup(plan);

      // Extract every course from all plan categories (this is where the real data is)
      const planCourses: CourseResponse[] = [
        ...(plan.completed ?? []),
        ...(plan.in_progress ?? []),
        ...(plan.available ?? []),
        ...(plan.locked ?? []),
      ].map((entry) => entry.course);

      // PaginatedCourseResponse returns CourseSummaryResponse items (no prerequisites).
      // Use them only to surface courses not already covered by the study plan.
      // Since CourseSummaryResponse lacks prerequisites we cannot fully map them,
      // so we only use the IDs to find truly orphan courses that the plan doesn't mention.
      const summaryItems = rawCoursesPaginated?.items ?? [];
      const seenIds = new Set(planCourses.map((c) => c.id));
      // Filter out any summary items already present in the plan
      const orphanIds = summaryItems
        .filter((s) => !seenIds.has(s.id))
        .map((s) => s.id);

      // For now, plan courses are the authoritative source with full data.
      // Orphan courses (in /courses but not in any study plan bucket) are omitted
      // because CourseSummaryResponse lacks the fields needed to render them fully.
      // They will appear once they are assigned to a semester bucket on the backend.
      void orphanIds; // acknowledged — not rendered

      const mergedCourses = planCourses.map((course) =>
        mapCourseForCurriculum(course, statusLookup),
      );
      setCurriculumCourses(mergedCourses);
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Unable to load curriculum. Please try again.",
      );
    } finally {
      setCoursesLoading(false);
    }
  }, []);


  useFocusEffect(
    useCallback(() => {
      loadCurriculumData();
    }, [loadCurriculumData]),
  );

  const coursesBySemester = useMemo(() => {
    const grouped: Record<number, CurriculumCourse[]> = {};
    curriculumCourses.forEach((course) => {
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
  }, [curriculumCourses]);

  const openAddModal = () => {
    setSubmitError(null);
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setSubmitError(null);
    setStatusDropdownOpen(false);
    setGradeDropdownOpen(false);
    setShowAddModal(false);
  };

  const handleAddCourse = async () => {
    if (formData.code && formData.name) {
      setSubmitError(null);

      try {
        const semesterNumber = Math.max(
          1,
          Number.parseInt(formData.semesterNumber, 10) || 1,
        );
        const coursePayload = {
          code: formData.code.toUpperCase(),
          name: formData.name,
          credit_hours: Math.max(0, Number(formData.credits)),
          status: formData.status,
          semester_number: semesterNumber,
          prerequisites: [],
          ...(formData.status === "completed" ? { grade: formData.grade } : {}),
        } as Parameters<typeof createAcademicCourse>[0] & {
          status: CourseFormStatus;
          semester_number: number;
          grade?: CourseFormGrade;
        };

        await createAcademicCourse(coursePayload);
        await Promise.all([store.refreshCourses(), loadCurriculumData()]);
        setFormData(initialFormData);
        setStatusDropdownOpen(false);
        setGradeDropdownOpen(false);
        closeAddModal();
      } catch (error) {
        setSubmitError(
          error instanceof Error
            ? error.message
            : "Unable to add course. Please try again.",
        );
      }
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    try {
      await store.deleteCourse(courseId);
      await loadCurriculumData();
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Unable to delete course. Please try again.",
      );
    }
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
      case "in_progress":
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

  const selectedStatusLabel =
    STATUS_OPTIONS.find((option) => option.value === formData.status)?.label ??
    "Planned";

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: palette.background }]}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={palette.background}
      />

      <ScreenHeader
        showLogo
        pageTitle={t("curriculumPlanTitle")}
        subtitle={t("headerSubtitleCurriculum")}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Title Block */}
        <View style={styles.headerBlock}>
          <Text style={[styles.screenSubtitle, { color: palette.textPlaceholder }]}>
            {t("headerSubtitleCurriculum")}
          </Text>
          <View style={styles.addButtonRow}>
            <TouchableOpacity
              style={[
                styles.addButton,
                { backgroundColor: isDark ? colors.primary : palette.textPrimary },
              ]}
              onPress={openAddModal}
              activeOpacity={0.8}
            >
              <Plus size={14} color="#FFFFFF" strokeWidth={2.8} />
              <Text style={styles.addButtonText}>{t("addCourseBtn")}</Text>
            </TouchableOpacity>
          </View>
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
        {curriculumCourses.length === 0 && loadError ? (
          <View
            style={[
              styles.emptyCard,
              {
                backgroundColor: palette.surface,
                borderColor: palette.borderSubtle,
              },
            ]}
          >
            <Text style={[styles.emptyText, { color: palette.textPrimary }]}>
              Unable to load courses
            </Text>
            <Text
              style={[styles.emptySubtext, { color: palette.textPlaceholder }]}
            >
              {loadError}
            </Text>
            <TouchableOpacity
              style={[
                styles.emptyButton,
                { backgroundColor: palette.textPrimary },
              ]}
              onPress={loadCurriculumData}
            >
              <Text style={[styles.emptyButtonText, { color: palette.background }]}>
                Retry
              </Text>
            </TouchableOpacity>
          </View>
        ) : curriculumCourses.length === 0 ? (
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
              onPress={openAddModal}
            >
              <Text style={[styles.emptyButtonText, { color: palette.background }]}>
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
                        curriculumCourses.find(
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
                            {/* Course name — primary element */}
                            <Text
                              style={[
                                styles.courseName,
                                { color: palette.textPrimary },
                              ]}
                              numberOfLines={2}
                            >
                              {course.name}
                            </Text>

                            {/* Chip row: code assist chip + credit badge */}
                            <View style={styles.badgeRow}>
                              <View
                                style={[
                                  styles.assistChip,
                                  {
                                    backgroundColor: status.bg,
                                    borderColor: status.color + "40",
                                  },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.assistChipText,
                                    { color: status.color },
                                  ]}
                                >
                                  {course.code}
                                </Text>
                              </View>

                              <View
                                style={[
                                  styles.creditChip,
                                  { backgroundColor: palette.surfaceAlt },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.creditChipText,
                                    { color: palette.textMuted },
                                  ]}
                                >
                                  {course.credits}{" "}
                                  {course.credits === 1
                                    ? t("creditSingular")
                                    : t("creditPlural")}
                                </Text>
                              </View>
                            </View>
                          </View>

                          <View style={styles.cardRightActions}>
                            <TouchableOpacity
                              onPress={() => handleDeleteCourse(course.id)}
                              style={styles.deleteButton}
                              hitSlop={{
                                top: 8,
                                bottom: 8,
                                left: 8,
                                right: 8,
                              }}
                              accessibilityRole="button"
                              accessibilityLabel={`Delete ${course.name}`}
                            >
                              <Trash2
                                size={14}
                                color={colors.danger}
                                strokeWidth={2.2}
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
        onRequestClose={closeAddModal}
      >
        {/* KeyboardAvoidingView: behavior="height" is correct inside a Modal on Android.
            "padding" shifts the entire modal up as a block (often too aggressive inside a
            transparent modal). "height" shrinks the available height so the inner ScrollView
            can scroll the focused field into view without displacing the modal backdrop. */}
        <KeyboardAvoidingView
          style={styles.modalKAVWrapper}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
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
                onPress={closeAddModal}
                style={[
                  styles.closeButton,
                  { backgroundColor: palette.subtleFill },
                ]}
              >
                <X size={20} color={palette.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBodyScroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
            <View style={styles.modalBody}>
              {submitError ? (
                <View
                  style={[
                    styles.errorBanner,
                    {
                      backgroundColor: isDark
                        ? "rgba(248,113,113,0.12)"
                        : "rgba(239,68,68,0.08)",
                      borderColor: isDark
                        ? "rgba(248,113,113,0.24)"
                        : "rgba(239,68,68,0.18)",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.errorBannerText,
                      { color: isDark ? "#FCA5A5" : "#B91C1C" },
                    ]}
                  >
                    {submitError}
                  </Text>
                </View>
              ) : null}

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
                  onChangeText={(text) => {
                    setSubmitError(null);
                    setFormData({ ...formData, code: text });
                  }}
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
                  onChangeText={(text) => {
                    setSubmitError(null);
                    setFormData({ ...formData, name: text });
                  }}
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
                    onChangeText={(text) => {
                      setSubmitError(null);
                      setFormData({ ...formData, credits: text });
                    }}
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
                    value={formData.semesterNumber}
                    onChangeText={(text) => {
                      setSubmitError(null);
                      const numericText = text.replace(/[^0-9]/g, "");
                      setFormData({
                        ...formData,
                        semesterNumber:
                          numericText && Number(numericText) < 1
                            ? "1"
                            : numericText,
                      });
                    }}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.modalLabel, { color: palette.textMuted }]}>
                  {t("status")}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.modalInput,
                    styles.dropdownTrigger,
                    {
                      backgroundColor: palette.inputFill,
                      borderColor: palette.inputBorder,
                    },
                  ]}
                  activeOpacity={0.85}
                  onPress={() => {
                    setStatusDropdownOpen((current) => !current);
                    setGradeDropdownOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownTriggerText,
                      { color: palette.textPrimary },
                    ]}
                  >
                    {selectedStatusLabel}
                  </Text>
                </TouchableOpacity>

                {statusDropdownOpen ? (
                  <View
                    style={[
                      styles.dropdownList,
                      {
                        backgroundColor: palette.inputFill,
                        borderColor: palette.inputBorder,
                      },
                    ]}
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.dropdownOption,
                          option.value === formData.status && {
                            backgroundColor: palette.subtleFill,
                          },
                        ]}
                        activeOpacity={0.82}
                        onPress={() => {
                          setSubmitError(null);
                          setFormData({
                            ...formData,
                            status: option.value,
                          });
                          setStatusDropdownOpen(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.dropdownOptionText,
                            { color: palette.textPrimary },
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : null}
              </View>

              {formData.status === "completed" ? (
                <View style={styles.formGroup}>
                  <Text
                    style={[styles.modalLabel, { color: palette.textMuted }]}
                  >
                    {t("grade")}
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.modalInput,
                      styles.dropdownTrigger,
                      {
                        backgroundColor: palette.inputFill,
                        borderColor: palette.inputBorder,
                      },
                    ]}
                    activeOpacity={0.85}
                    onPress={() => {
                      setGradeDropdownOpen((current) => !current);
                      setStatusDropdownOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownTriggerText,
                        { color: palette.textPrimary },
                      ]}
                    >
                      {formData.grade}
                    </Text>
                  </TouchableOpacity>

                  {gradeDropdownOpen ? (
                    <View
                      style={[
                        styles.dropdownList,
                        styles.gradeDropdownList,
                        {
                          backgroundColor: palette.inputFill,
                          borderColor: palette.inputBorder,
                        },
                      ]}
                    >
                      {GRADE_OPTIONS.map((grade) => (
                        <TouchableOpacity
                          key={grade}
                          style={[
                            styles.dropdownOption,
                            styles.gradeDropdownOption,
                            grade === formData.grade && {
                              backgroundColor: palette.subtleFill,
                            },
                          ]}
                          activeOpacity={0.82}
                          onPress={() => {
                            setSubmitError(null);
                            setFormData({ ...formData, grade });
                            setGradeDropdownOpen(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.dropdownOptionText,
                              { color: palette.textPrimary },
                            ]}
                          >
                            {grade}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : null}
                </View>
              ) : null}

              <TouchableOpacity
                style={[
                  styles.modalSubmitButton,
                  {
                    backgroundColor: palette.textPrimary,
                    opacity: store.coursesLoading || coursesLoading ? 0.7 : 1,
                  },
                ]}
                onPress={handleAddCourse}
                activeOpacity={0.9}
                disabled={store.coursesLoading || coursesLoading}
              >
                <Text style={[styles.modalSubmitButtonText, { color: palette.background }]}>
                  {t("confirmAndAdd")}
                </Text>
              </TouchableOpacity>
            </View>
            </ScrollView>
          </View>
          </View>
        </KeyboardAvoidingView>
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
  headerBlock: {
    marginBottom: 14,
  },
  screenSubtitle: {
    fontSize: 12,
    fontWeight: fontWeight.medium,
    lineHeight: 17,
    letterSpacing: 0.1,
    marginBottom: 10,
  },
  addButtonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 0,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0.1,
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
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
    borderLeftWidth: 3,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  lockedCard: {
    opacity: 0.55,
    backgroundColor: "rgba(248, 250, 252, 0.8)",
  },
  cardMainLayout: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardLeftContent: {
    flex: 1,
    paddingRight: 10,
  },
  courseName: {
    fontSize: 14,
    fontWeight: fontWeight.bold,
    lineHeight: 20,
    letterSpacing: -0.1,
    marginBottom: 7,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  // M3 Assist Chip — course code
  assistChip: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  assistChipText: {
    fontSize: 10.5,
    fontWeight: fontWeight.extrabold,
    letterSpacing: 0.4,
  },
  // Credit badge chip
  creditChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  creditChipText: {
    fontSize: 10,
    fontWeight: fontWeight.semibold,
  },
  cardRightActions: {
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  // Circular icon button
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.danger + "10",
    alignItems: "center",
    justifyContent: "center",
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
  modalKAVWrapper: {
    flex: 1,
    justifyContent: "flex-end",
  },
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
    maxHeight: "90%",
  },
  modalBodyScroll: {
    flexGrow: 0,
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
  errorBanner: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorBannerText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    lineHeight: 20,
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
  dropdownTrigger: {
    justifyContent: "center",
  },
  dropdownTriggerText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  dropdownList: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: "hidden",
  },
  dropdownOption: {
    minHeight: 42,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  dropdownOptionText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  gradeDropdownList: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  gradeDropdownOption: {
    width: "25%",
    alignItems: "center",
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
