import AsyncStorage from "@react-native-async-storage/async-storage";
import { create, StateCreator } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import * as academicService from "../services/academic";
import * as authService from "../services/auth";
import type {
  AppState,
  Course,
  CourseCreateRequest,
  CourseResponse,
  CourseSummaryResponse,
  CourseUpdateRequest,
  Language,
  Theme,
  TokenResponse,
  UserResponse,
} from "./types";
import { translate, type TKey } from "./i18n";
import { Colors } from "./theme";

const STORAGE_KEY = "scholar:state:v1";

interface AuthStoreState extends AppState {
  authBootstrapped: boolean;
  backendUser: UserResponse | null;
  coursesLoading: boolean;
  coursesError: string | null;
}

const generateId = () => {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};

const initialState: AuthStoreState = {
  language: "en",
  theme: "light",
  authed: false,
  authBootstrapped: false,
  profile: null,
  backendUser: null,
  courses: [],
  coursesLoading: false,
  coursesError: null,
  onboarded: false,
  chatHistory: [],
};

const mapBackendCourseToCourse = (
  course: CourseResponse | CourseSummaryResponse,
): Course => ({
  id: course.id,
  code: course.code,
  name: course.name,
  credits: course.credit_hours,
  semester: course.semester_recommended ?? 1,
  prerequisites: ("prerequisites" in course ? course.prerequisites : []) ?? [],
  status: "planned",
  category: course.is_elective ? "elective" : "core",
});

const mapCourseToCreateRequest = (
  course: Omit<Course, "id">,
): CourseCreateRequest => ({
  code: course.code,
  name: course.name,
  credit_hours: course.credits,
  is_elective: course.category === "elective",
  semester_recommended: course.semester,
  prerequisites: course.prerequisites,
});

const mapCoursePatchToUpdateRequest = (
  patch: Partial<Course> | CourseUpdateRequest,
): CourseUpdateRequest => {
  const request: CourseUpdateRequest = {};

  if ("name" in patch && patch.name !== undefined) {
    request.name = patch.name;
  }
  if ("credit_hours" in patch && patch.credit_hours !== undefined) {
    request.credit_hours = patch.credit_hours;
  } else if ("credits" in patch && patch.credits !== undefined) {
    request.credit_hours = patch.credits;
  }
  if ("major" in patch && patch.major !== undefined) {
    request.major = patch.major;
  }
  if ("is_elective" in patch && patch.is_elective !== undefined) {
    request.is_elective = patch.is_elective;
  } else if ("category" in patch && patch.category !== undefined) {
    request.is_elective = patch.category === "elective";
  }
  if (
    "semester_recommended" in patch &&
    patch.semester_recommended !== undefined
  ) {
    request.semester_recommended = patch.semester_recommended;
  } else if ("semester" in patch && patch.semester !== undefined) {
    request.semester_recommended = patch.semester;
  }
  if ("prerequisites" in patch && patch.prerequisites !== undefined) {
    request.prerequisites = patch.prerequisites;
  }

  return request;
};

const getCourseErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Unable to update courses.";

interface StoreActions {
  setLanguage: (l: Language) => void;
  setTheme: (t: Theme) => void;
  setAuthSession: (session: TokenResponse) => void;
  bootstrapAuth: () => Promise<void>;
  logout: () => Promise<void>;
  fetchCourses: () => Promise<void>;
  refreshCourses: () => Promise<void>;
  createCourse: (data: CourseCreateRequest) => Promise<Course>;
  addCourse: (c: Omit<Course, "id">) => Promise<Course>;
  bulkAddCourses: (
    items: Array<
      Omit<Course, "id" | "prerequisites"> & { prereqCodes: string[] }
    >,
  ) => Promise<Course[]>;
  updateCourse: (
    id: string,
    patch: Partial<Course> | CourseUpdateRequest,
  ) => Promise<Course>;
  deleteCourse: (id: string) => Promise<void>;
  deleteAllCourses: () => Promise<void>;
  setOnboarded: (v: boolean) => void;
  addChat: (title: string) => string;
  appendMessage: (
    chatId: string,
    role: "user" | "assistant",
    content: string,
  ) => void;
  updateGradingSystem: (sys: "4.0" | "5.0") => void;
  updateUserProfile: (user: UserResponse) => void;
  t: (key: TKey) => string;
}

const storeCreator: StateCreator<AuthStoreState & StoreActions, [], []> = (
  set,
  get,
) => ({
  ...initialState,

  setLanguage: (l: Language) => set((state) => ({ ...state, language: l })),
  setTheme: (t: Theme) => set((state) => ({ ...state, theme: t })),

  setAuthSession: (session: TokenResponse) => {
    // ── A: Zustand auth state updated ────────────────────────────────────
    const prevAuthed = (useStore.getState as () => AuthStoreState & StoreActions)().authed;
    set((state) => ({
      ...state,
      authed: true,
      authBootstrapped: true,
      backendUser: session.user,
      profile: authService.mapBackendUserToProfile(session.user),
    }));
  },

  bootstrapAuth: async () => {
    try {
      const tokens = await authService.getStoredTokens();
      if (!tokens?.accessToken && !tokens?.refreshToken) {
        set((state) => ({
          ...state,
          authed: false,
          authBootstrapped: true,
          backendUser: null,
          profile: null,
          courses: [],
          coursesLoading: false,
          coursesError: null,
        }));
        return;
      }

      const user = tokens.accessToken
        ? await authService.getCurrentUser()
        : (await authService.refreshSession())?.user;

      if (!user) {
        await authService.clearAuthTokens();
        set((state) => ({
          ...state,
          authed: false,
          authBootstrapped: true,
          backendUser: null,
          profile: null,
          courses: [],
          coursesLoading: false,
          coursesError: null,
        }));
        return;
      }

      set((state) => ({
        ...state,
        authed: true,
        authBootstrapped: true,
        backendUser: user,
        profile: authService.mapBackendUserToProfile(user),
      }));
    } catch {
      await authService.clearAuthTokens();
      set((state) => ({
        ...state,
        authed: false,
        authBootstrapped: true,
        backendUser: null,
        profile: null,
        courses: [],
        coursesLoading: false,
        coursesError: null,
      }));
    }
  },

  logout: async () => {
    // ── E: Every logout call gets a stack trace ───────────────────────────
    try {
      await authService.logout();
    } finally {
      set((state) => ({
        ...state,
        authed: false,
        backendUser: null,
        profile: null,
        courses: [],
        coursesLoading: false,
        coursesError: null,
      }));
    }
  },

  fetchCourses: async () => {
    set((state) => ({ ...state, coursesLoading: true, coursesError: null }));
    try {
      const paginated = await academicService.getAcademicCourses();
      set((state) => ({
        ...state,
        courses: paginated.items.map(mapBackendCourseToCourse),
        coursesLoading: false,
        coursesError: null,
      }));
    } catch (error) {
      set((state) => ({
        ...state,
        coursesLoading: false,
        coursesError: getCourseErrorMessage(error),
      }));
      throw error;
    }
  },

  refreshCourses: async () => {
    await get().fetchCourses();
  },

  createCourse: async (data: CourseCreateRequest) => {
    set((state) => ({ ...state, coursesLoading: true, coursesError: null }));
    try {
      const created = mapBackendCourseToCourse(
        await academicService.createAcademicCourse(data),
      );
      await get().refreshCourses();
      return created;
    } catch (error) {
      set((state) => ({
        ...state,
        coursesLoading: false,
        coursesError: getCourseErrorMessage(error),
      }));
      throw error;
    }
  },

  addCourse: async (c: Omit<Course, "id">) => {
    return get().createCourse(mapCourseToCreateRequest(c));
  },

  bulkAddCourses: async (
    items: Array<
      Omit<Course, "id" | "prerequisites"> & { prereqCodes: string[] }
    >,
  ) => {
    set((state) => ({ ...state, coursesLoading: true, coursesError: null }));
    try {
      const created = await Promise.all(
        items.map((item) =>
          academicService.createAcademicCourse({
            code: item.code,
            name: item.name,
            credit_hours: item.credits,
            is_elective: item.category === "elective",
            semester_recommended: item.semester,
            prerequisites: item.prereqCodes,
          }),
        ),
      );
      const mappedCourses = created.map(mapBackendCourseToCourse);
      await get().refreshCourses();
      return mappedCourses;
    } catch (error) {
      set((state) => ({
        ...state,
        coursesLoading: false,
        coursesError: getCourseErrorMessage(error),
      }));
      throw error;
    }
  },

  updateCourse: async (
    id: string,
    patch: Partial<Course> | CourseUpdateRequest,
  ) => {
    set((state) => ({ ...state, coursesLoading: true, coursesError: null }));
    try {
      const updated = mapBackendCourseToCourse(
        await academicService.updateAcademicCourse(
          id,
          mapCoursePatchToUpdateRequest(patch),
        ),
      );
      await get().refreshCourses();
      return updated;
    } catch (error) {
      set((state) => ({
        ...state,
        coursesLoading: false,
        coursesError: getCourseErrorMessage(error),
      }));
      throw error;
    }
  },

  deleteCourse: async (id: string) => {
    set((state) => ({ ...state, coursesLoading: true, coursesError: null }));
    try {
      await academicService.deleteAcademicCourse(id);
      await get().refreshCourses();
    } catch (error) {
      set((state) => ({
        ...state,
        coursesLoading: false,
        coursesError: getCourseErrorMessage(error),
      }));
      throw error;
    }
  },

  deleteAllCourses: async () => {
    const courseIds = get().courses.map((course) => course.id);
    set((state) => ({ ...state, coursesLoading: true, coursesError: null }));
    try {
      await Promise.all(courseIds.map(academicService.deleteAcademicCourse));
      await get().refreshCourses();
    } catch (error) {
      set((state) => ({
        ...state,
        coursesLoading: false,
        coursesError: getCourseErrorMessage(error),
      }));
      throw error;
    }
  },

  updateGradingSystem: (sys: "4.0" | "5.0") => {
    set((state) => ({
      ...state,
      profile: state.profile ? { ...state.profile, gradingSystem: sys } : null,
    }));
  },

  updateUserProfile: (user: UserResponse) => {
    set((state) => ({
      ...state,
      backendUser: user,
      profile: authService.mapBackendUserToProfile(user),
    }));
  },

  setOnboarded: (v: boolean) => set((state) => ({ ...state, onboarded: v })),

  addChat: (title: string) => {
    const id = generateId();
    set((state) => ({
      ...state,
      chatHistory: [{ id, title, messages: [] }, ...state.chatHistory],
    }));
    return id;
  },

  appendMessage: (
    chatId: string,
    role: "user" | "assistant",
    content: string,
  ) => {
    set((state) => ({
      ...state,
      chatHistory: state.chatHistory.map((c) =>
        c.id === chatId
          ? { ...c, messages: [...c.messages, { role, content }] }
          : c,
      ),
    }));
  },

  t: (key: TKey) => translate(get().language, key),
});

export const useStore = create<AuthStoreState & StoreActions>()(
  persist(
    storeCreator as any,
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state: AuthStoreState & StoreActions) => ({
        language: state.language,
        theme: state.theme,
        onboarded: state.onboarded,
      }),
      merge: (
        persistedState: unknown,
        currentState: AuthStoreState & StoreActions,
      ) => {
        const persisted = (persistedState ?? {}) as Partial<AppState>;
        return {
          ...currentState,
          language: persisted.language ?? currentState.language,
          theme: persisted.theme ?? currentState.theme,
          onboarded: persisted.onboarded ?? currentState.onboarded,
        };
      },
    } as any,
  ),
);

export function useThemeColors() {
  const theme = useStore((state) => state.theme);
  return Colors[theme];
}

export function useAppLocale() {
  const language = useStore((state) => state.language);

  return {
    language,
    isRTL: language === "ar",
    t: (key: TKey) => translate(language, key),
  };
}
