import AsyncStorage from "@react-native-async-storage/async-storage";
import { create, StateCreator } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { AppState, Course, Language, Theme, UserProfile } from "./types";
import { translate, type TKey } from "./i18n";
import { Colors } from "./theme";

const STORAGE_KEY = "scholar:state:v1";

const generateId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const initialState: AppState = {
  language: "en",
  theme: "light",
  authed: false,
  profile: null,
  courses: [],
  onboarded: false,
  chatHistory: [],
};

interface StoreActions {
  setLanguage: (l: Language) => void;
  setTheme: (t: Theme) => void;
  login: (email: string) => void;
  signup: (profile: UserProfile) => void;
  logout: () => void;
  addCourse: (c: Omit<Course, "id">) => void;
  bulkAddCourses: (items: Array<Omit<Course, "id" | "prerequisites"> & { prereqCodes: string[] }>) => void;
  updateCourse: (id: string, patch: Partial<Course>) => void;
  deleteCourse: (id: string) => void;
  deleteAllCourses: () => void;
  setOnboarded: (v: boolean) => void;
  addChat: (title: string) => string;
  appendMessage: (chatId: string, role: "user" | "assistant", content: string) => void;
  updateGradingSystem: (sys: "4.0" | "5.0") => void;
  t: (key: TKey) => string;
}

const storeCreator: StateCreator<AppState & StoreActions, [], []> = (set, get) => ({
  ...initialState,
  
  setLanguage: (l: Language) => set((state) => ({ ...state, language: l })),
  setTheme: (t: Theme) => set((state) => ({ ...state, theme: t })),
  
  login: (email: string) => {
    set((state) => ({
      ...state,
      authed: true,
      profile: state.profile ?? {
        fullName: email.split("@")[0] || "Student",
        email,
        major: "Computer Science",
        academicLevel: 2,
        enrollmentYear: new Date().getFullYear() - 1,
        gradingSystem: "4.0",
      },
    }));
  },

  signup: (profile: UserProfile) => {
    set((state) => ({ ...state, authed: true, profile }));
  },

  logout: () => {
    set((state) => ({ ...state, authed: false }));
  },

  addCourse: (c: Omit<Course, "id">) => {
    set((state) => ({
      ...state,
      courses: [...state.courses, { ...c, id: generateId() }],
    }));
  },

  bulkAddCourses: (items: Array<Omit<Course, "id" | "prerequisites"> & { prereqCodes: string[] }>) => {
    set((state) => {
      const newCourses: Course[] = items.map((it) => ({
        ...it,
        id: generateId(),
        prerequisites: [],
      }));
      const codeToId = new Map<string, string>();
      [...state.courses, ...newCourses].forEach((c) => codeToId.set(c.code.toUpperCase(), c.id));
      newCourses.forEach((nc, i) => {
        nc.prerequisites = items[i].prereqCodes
          .map((code) => codeToId.get(code.toUpperCase()))
          .filter((x): x is string => !!x);
      });
      return { ...state, courses: [...state.courses, ...newCourses] };
    });
  },

  updateCourse: (id: string, patch: Partial<Course>) => {
    set((state) => ({
      ...state,
      courses: state.courses.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  },

  deleteCourse: (id: string) => {
    set((state) => ({
      ...state,
      courses: state.courses
        .filter((c) => c.id !== id)
        .map((c) => ({ ...c, prerequisites: c.prerequisites.filter((p) => p !== id) })),
    }));
  },

  deleteAllCourses: () => {
    set((state) => ({ ...state, courses: [] }));
  },

  updateGradingSystem: (sys: "4.0" | "5.0") => {
    set((state) => ({
      ...state,
      profile: state.profile ? { ...state.profile, gradingSystem: sys } : null,
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

  appendMessage: (chatId: string, role: "user" | "assistant", content: string) => {
    set((state) => ({
      ...state,
      chatHistory: state.chatHistory.map((c) =>
        c.id === chatId ? { ...c, messages: [...c.messages, { role, content }] } : c,
      ),
    }));
  },

  t: (key: TKey) => translate(get().language, key),
});

export const useStore = create<AppState & StoreActions>()(
  persist(storeCreator as any, {
    name: STORAGE_KEY,
    storage: createJSONStorage(() => AsyncStorage),
  } as any)
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

