export type CourseStatus = "planned" | "in_progress" | "completed";

export type Grade =
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

export interface Course {
  id: string;
  code: string;
  name: string;
  credits: number;
  semester: number;
  prerequisites: string[];
  status: CourseStatus;
  grade?: Grade;
  category?: "core" | "elective" | "general";
}

export type GradingSystem = "5.0" | "4.0";

export interface UserProfile {
  fullName: string;
  email: string;
  major: string;
  university?: string;
  academicLevel: number;
  enrollmentYear: number;
  gradingSystem: GradingSystem;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  major: string;
  university?: string | null;
  level: number;
  enrollment_year: number;
  total_credit_hours: number;
  completed_credit_hours: number;
  created_at: string;
  grading_scale?: string | null;
  language?: string | null;
  theme?: string | null;
  target_gpa?: number | null;
  current_semester?: number | null;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type?: string;
  user: UserResponse;
}

export interface UserLoginRequest {
  email: string;
  password: string;
}

/** POST /api/auth/register */
export interface UserRegisterRequest {
  email: string;
  password: string;
  name: string;
  major: string;
  university?: string | null;
  level: number;
  enrollment_year: number;
  /** Required total credit hours for graduation (must be one of the allowed enum values). */
  total_credit_hours: number;
}

export interface RefreshRequest {
  refresh_token: string;
}

/** PATCH /api/auth/me — only mutable profile fields */
export interface UserUpdateRequest {
  name?: string | null;
  major?: string | null;
  level?: number | null;
  university?: string | null;
  total_credit_hours?: number | null;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
  reset_token: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

export interface MessageResponse {
  message: string;
}

// ─── User preferences ────────────────────────────────────────────────────────

export interface UserPreferencesResponse {
  grading_scale?: string | null;
  language?: string | null;
  theme?: string | null;
  target_gpa?: number | null;
  current_semester?: number | null;
}

export interface UserPreferencesUpdate {
  grading_scale?: string | null;
  language?: string | null;
  theme?: string | null;
  target_gpa?: number | null;
  current_semester?: number | null;
}

// ─── Courses ─────────────────────────────────────────────────────────────────

/**
 * Full course object returned by individual course endpoints and embedded in
 * GPAEntry / StudyPlanCourse.  Maps to the backend CourseResponse schema.
 */
export interface CourseResponse {
  id: string;
  code: string;
  name: string;
  credit_hours: number;
  major?: string | null;
  is_elective: boolean;
  semester_recommended?: number | null;
  prerequisites: string[];
}

/**
 * Lighter course representation used in the paginated list endpoint.
 * Does NOT include prerequisites.  Maps to the backend CourseSummaryResponse schema.
 */
export interface CourseSummaryResponse {
  id: string;
  code: string;
  name: string;
  credit_hours: number;
  major?: string | null;
  is_elective: boolean;
  semester_recommended?: number | null;
}

/** GET /api/academic/courses — paginated with limit/offset */
export interface PaginatedCourseResponse {
  items: CourseSummaryResponse[];
  total: number;
  page: number;
  size: number;
}

/** POST /api/academic/courses */
export interface CourseCreateRequest {
  code: string;
  name: string;
  credit_hours: number;
  major?: string | null;
  is_elective?: boolean;
  semester_recommended?: number | null;
  prerequisites?: string[];
  status?: CourseStatus;
  semester_number?: number;
  grade?: Grade;
}

/** PATCH /api/academic/courses/:id */
export interface CourseUpdateRequest {
  name?: string | null;
  credit_hours?: number | null;
  major?: string | null;
  is_elective?: boolean | null;
  semester_recommended?: number | null;
  prerequisites?: string[] | null;
}

// ─── Study Plan ───────────────────────────────────────────────────────────────

export interface StudyPlanCourse {
  course: CourseResponse;
  status: string;
  planned_semester?: string | null;
}

export interface StudyPlanResponse {
  completed?: StudyPlanCourse[];
  in_progress?: StudyPlanCourse[];
  available?: StudyPlanCourse[];
  locked?: StudyPlanCourse[];
}

export interface SemesterActivateRequest {
  semester_number: number;
}

export type SemesterActivateResponse = Record<string, string>;

export interface WorkloadResponse {
  total_hours: number;
  tier: string;
}

// ─── GPA ──────────────────────────────────────────────────────────────────────

export interface GPAEntry {
  id: string;
  grade: string;
  grade_numeric: number;
  credit_hours: number;
  semester: string;
  year: number;
  semester_number: number;
  course: CourseResponse;
}

export interface GPAResponse {
  semester_gpa: number;
  cumulative_gpa: number;
  total_credits_completed: number;
  history: GPAEntry[];
}

/** GET /api/academic/gpa/history — array of arbitrary per-semester objects */
export type GPAHistoryEntry = Record<string, unknown>;

export interface GradeCreateRequest {
  course_id: string;
  grade: string;
  semester: string;
  year: number;
  semester_number: number;
}

export interface GPAUpdateRequest {
  grade?: string | null;
  semester?: string | null;
  year?: number | null;
  semester_number?: number | null;
}

// ─── AI / Chat ────────────────────────────────────────────────────────────────

export interface ChatRequest {
  message: string;
}

export interface ChatMessageResponse {
  id: string;
  user_message: string;
  ai_response: string;
  tokens_used: number;
  created_at: string;
}

export interface ChatHistoryResponse {
  messages: ChatMessageResponse[];
  total: number;
}

export interface ConversationCreateRequest {
  title?: string | null;
}

export interface ConversationListItem {
  id: string;
  title?: string | null;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface ConversationMessageRequest {
  message: string;
}

export interface ConversationMessageResponse {
  conversation_id: string;
  message: ChatMessageResponse;
}

export interface ConversationResponse {
  id: string;
  title?: string | null;
  created_at: string;
  updated_at: string;
  messages?: ChatMessageResponse[];
}

export type AiRateLimitResponse = Record<string, unknown>;

export interface AiAskStreamEvent {
  token: string;
  done: boolean;
}

// ─── Achievements ─────────────────────────────────────────────────────────────

export interface AchievementResponse {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  points: number;
  earned: boolean;
  earned_at?: string | null;
  progress: number;
}

export interface AchievementsSummary {
  total: number;
  unlocked: number;
  recent?: AchievementResponse[];
}

/** GET /api/achievements */
export interface AchievementsListResponse {
  total: number;
  unlocked: number;
  achievements?: AchievementResponse[];
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardResponse {
  user: UserResponse;
  semester_gpa: number;
  cumulative_gpa: number;
  completed_credit_hours: number;
  total_credit_hours: number;
  graduation_percentage: number;
  estimated_graduation_year?: number | null;
  current_courses?: StudyPlanCourse[];
  workload_tier?: string | null;
  workload_credit_hours?: number | null;
  achievements?: AchievementsSummary | null;
}

// ─── App state ───────────────────────────────────────────────────────────────

export type Language = "en" | "ar";
export type Theme = "light" | "dark";

export interface AppState {
  language: Language;
  theme: Theme;
  authed: boolean;
  profile: UserProfile | null;
  courses: Course[];
  onboarded: boolean;
  chatHistory: {
    id: string;
    title: string;
    messages: { role: "user" | "assistant"; content: string }[];
  }[];
}
