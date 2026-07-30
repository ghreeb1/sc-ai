import type {
  AchievementsListResponse,
  CourseCreateRequest,
  CourseResponse,
  CourseUpdateRequest,
  DashboardResponse,
  GPAEntry,
  GPAHistoryEntry,
  GPAResponse,
  GPAUpdateRequest,
  GradeCreateRequest,
  PaginatedCourseResponse,
  SemesterActivateRequest,
  SemesterActivateResponse,
  StudyPlanCourse,
  StudyPlanResponse,
  WorkloadResponse,
} from "../lib/types";
import { apiRequest } from "./api";

export async function getAcademicDashboard() {
  return apiRequest<DashboardResponse>("/api/academic/dashboard", {
    method: "GET",
    auth: true,
  });
}

/**
 * GET /api/academic/courses
 * Uses limit/offset pagination as specified by the backend.
 */
export async function getAcademicCourses(limit = 50, offset = 0) {
  return apiRequest<PaginatedCourseResponse>(
    `/api/academic/courses?limit=${limit}&offset=${offset}`,
    {
      method: "GET",
      auth: true,
    },
  );
}

/** GET /api/achievements */
export async function getAchievements() {
  return apiRequest<AchievementsListResponse>("/api/achievements", {
    method: "GET",
    auth: true,
  });
}

export async function createAcademicCourse(data: CourseCreateRequest) {
  return apiRequest<CourseResponse>("/api/academic/courses", {
    method: "POST",
    auth: true,
    body: JSON.stringify(data),
  });
}

export async function updateAcademicCourse(
  courseId: string,
  data: CourseUpdateRequest,
) {
  return apiRequest<CourseResponse>(`/api/academic/courses/${courseId}`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify(data),
  });
}

export async function deleteAcademicCourse(courseId: string) {
  await apiRequest<void>(`/api/academic/courses/${courseId}`, {
    method: "DELETE",
    auth: true,
  });
}

export async function getStudyPlan() {
  return apiRequest<StudyPlanResponse>("/api/academic/plan", {
    method: "GET",
    auth: true,
  });
}

export async function getAvailableStudyPlanCourses() {
  return apiRequest<StudyPlanCourse[]>("/api/academic/plan/available", {
    method: "GET",
    auth: true,
  });
}

export async function getCompletedStudyPlanCourses() {
  return apiRequest<StudyPlanCourse[]>("/api/academic/plan/completed", {
    method: "GET",
    auth: true,
  });
}

export async function activateStudyPlanSemester(
  data: SemesterActivateRequest,
) {
  return apiRequest<SemesterActivateResponse>("/api/academic/plan/activate", {
    method: "POST",
    auth: true,
    body: JSON.stringify(data),
  });
}

export async function getStudyPlanWorkload(semesterNumber: number) {
  return apiRequest<WorkloadResponse>(
    `/api/academic/plan/workload/${semesterNumber}`,
    {
      method: "GET",
      auth: true,
    },
  );
}

export async function getAcademicGpa() {
  return apiRequest<GPAResponse>("/api/academic/gpa", {
    method: "GET",
    auth: true,
  });
}

export async function getAcademicGpaHistory() {
  return apiRequest<GPAHistoryEntry[]>("/api/academic/gpa/history", {
    method: "GET",
    auth: true,
  });
}

export async function addAcademicGrade(data: GradeCreateRequest) {
  return apiRequest<Record<string, string>>("/api/academic/gpa/add", {
    method: "POST",
    auth: true,
    body: JSON.stringify(data),
  });
}

export async function updateAcademicGrade(
  gradeId: string,
  data: GPAUpdateRequest,
) {
  return apiRequest<GPAEntry>(`/api/academic/gpa/${gradeId}`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify(data),
  });
}

export async function deleteAcademicGrade(gradeId: string) {
  await apiRequest<void>(`/api/academic/gpa/${gradeId}`, {
    method: "DELETE",
    auth: true,
  });
}
