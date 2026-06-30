export type CourseStatus = "planned" | "in-progress" | "completed";

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
