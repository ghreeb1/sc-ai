# SCHOLAR Mobile - Implementation Guide

## Overview

This document provides technical details about the React Native mobile implementation of SCHOLAR using Expo and TypeScript.

## Architecture Decisions

### 1. **State Management: Zustand + AsyncStorage**

Instead of using Context API, we chose **Zustand** with AsyncStorage persistence because:
- **Lightweight**: Smaller bundle than Redux
- **Performance**: Selective subscriptions prevent unnecessary re-renders
- **Persistence**: Built-in middleware for AsyncStorage
- **DevTools**: Better debugging experience
- **TypeScript**: Full type safety

```tsx
// Example usage
const store = useStore();
store.addCourse({...});
store.setTheme("dark");
```

### 2. **Navigation: Expo Router**

Expo Router provides:
- **File-based routing** - Similar to Next.js
- **Deep linking** - Automatic deep link support
- **Typed routes** - TypeScript support with `expo-router/types`
- **Tab navigation** - Built-in tab support

Structure:
```
app/(tabs)/
├── index.tsx         → /
├── curriculum.tsx    → /curriculum
├── advisor.tsx       → /advisor
└── settings.tsx      → /settings
```

### 3. **Styling: NativeWind + Utility Classes**

We use **NativeWind** for consistency with Tailwind CSS on web:
- **Responsive design** - Breakpoint-based styling
- **Dark mode** - Automatic theme switching
- **Component library** - Custom components with Tailwind classes
- **Performance** - Compiled to StyleSheet for native rendering

Example:
```tsx
<View className="flex-1 bg-slate-900 dark:bg-slate-950 px-4">
  <Text className="text-white text-lg font-bold">Title</Text>
</View>
```

## Key Components

### Global Layout (`app/_layout.tsx`)
- Initializes Zustand store
- Manages app-wide providers
- Handles theme application
- Manages splash screen

### Tab Navigation (`app/(tabs)/_layout.tsx`)
- Bottom tab bar with 4 main screens
- Custom tab icons using Lucide React Native
- Theme-aware styling

### Core Screens

#### Overview (`app/(tabs)/index.tsx`)
- **Purpose**: Dashboard showing academic progress
- **Features**:
  - Cumulative GPA card
  - Credit completion tracker
  - Graduation progress bar
  - Recent courses list
  - Empty state with CTA
  
#### Curriculum (`app/(tabs)/curriculum.tsx`)
- **Purpose**: Course management
- **Features**:
  - Responsive grid layout (2 columns on mobile)
  - Course cards with status badges
  - Add course modal
  - Delete individual courses
  - Group by semester

#### Advisor (`app/(tabs)/advisor.tsx`)
- **Purpose**: AI chat interface
- **Features**:
  - Message history
  - Suggestion chips
  - Auto-scroll to latest message
  - Keyboard-aware input
  - Loading states

#### Settings (`app/(tabs)/settings.tsx`)
- **Purpose**: Configuration and profile management
- **Features**:
  - Profile card with avatar
  - Dark mode toggle
  - Language selection
  - Grading system picker
  - Delete all courses
  - Logout

### Reusable Components

All components accept `theme` prop for consistency:

```tsx
<Button label="Click" onPress={handleClick} theme={store.theme} />
<Card theme={store.theme}>...</Card>
<Input label="Name" theme={store.theme} />
<StatCard label="GPA" value="3.8" theme={store.theme} />
```

## Data Flow

### State Management Flow

```
App Launch
  ↓
useStore() initializes
  ↓
AsyncStorage restored data
  ↓
Components subscribe to store
  ↓
User interactions → store actions
  ↓
AsyncStorage auto-saves
```

### User Authentication Flow

```
User opens app
  ↓
Check if authed in store
  ↓
No → Navigate to /auth/login
  ↓
Login/Register → store.login() or store.signup()
  ↓
authed = true → Navigate to /(tabs)
  ↓
User data persisted automatically
```

## Styling System

### Color Scheme
Two complete color palettes in `src/lib/theme.ts`:

**Dark Mode (Default)**
- Background: `#0f1419` (Deep Navy)
- Foreground: `#f5f5f5` (Light Gray)
- Primary: `#60a5fa` (Blue)
- Card: `#1a1f2e` (Slightly lighter navy)

**Light Mode**
- Background: `#ffffff` (White)
- Foreground: `#0f1419` (Dark Navy)
- Primary: `#3b82f6` (Blue)
- Card: `#f5f5f5` (Light Gray)

### Status Colors
```tsx
{
  completed: { bg: "#d1fae5", text: "#065f46" }, // Green
  "in-progress": { bg: "#fef3c7", text: "#92400e" }, // Yellow
  planned: { bg: "#e5e7eb", text: "#374151" } // Gray
}
```

## TypeScript Integration

### Type Safety
All components are fully typed:

```tsx
interface ButtonProps {
  label: string;
  onPress: (event: GestureResponderEvent) => void;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  theme: "light" | "dark";
}
```

### AppState Types
```tsx
interface AppState {
  language: Language; // "en" | "ar"
  theme: Theme; // "light" | "dark"
  authed: boolean;
  profile: UserProfile | null;
  courses: Course[];
  onboarded: boolean;
  chatHistory: ChatMessage[];
}
```

## Internationalization (i18n)

### Language Support
- **English (en)** - Default
- **Arabic (ar)** - Full RTL support

### Translation System
```tsx
// In store
const translation = store.t("appName"); // Returns localized string

// All translations in src/lib/i18n.ts
export const dict = {
  en: { ... },
  ar: { ... }
}
```

### Layout Mirroring
```tsx
// Expo automatically handles RTL for Arabic
// Just set language in settings and layout mirrors
store.setLanguage("ar"); // UI flips to RTL
```

## Responsive Design

### Screen Sizes
- Mobile: < 768px (primary target)
- Tablet: 768px - 1024px (supported)
- Large: > 1024px (web)

### Grid Layouts
Example 2-column grid for curriculum:
```tsx
<View style={styles.courseGrid}>
  {courses.map(course => (
    <Card key={course.id} style={{ width: "48%" }} />
  ))}
</View>
```

## Performance Optimizations

### 1. **Selective Store Subscriptions**
```tsx
// Only re-renders when selected state changes
const courses = useStore(state => state.courses);
```

### 2. **Memoization**
```tsx
const stats = useMemo(() => {
  // Expensive calculations
}, [courses, profile]);
```

### 3. **Keyboard Avoiding**
```tsx
<KeyboardAvoidingView
  behavior={Platform.OS === "ios" ? "padding" : "height"}
  keyboardVerticalOffset={80}
>
```

### 4. **FlatList for Long Lists**
Use FlatList instead of map() for large course lists in future updates.

## Key Differences from Web Version

| Feature | Web (React/Vite) | Mobile (React Native) |
|---------|-----------------|----------------------|
| Router | TanStack Router | Expo Router |
| Styling | Tailwind CSS | NativeWind |
| UI Library | Shadcn/Radix | Custom + Lucide RN |
| State | Context API | Zustand |
| Persistence | localStorage | AsyncStorage |
| Charts | Recharts | (Future: react-native-svg-charts) |
| Forms | React Hook Form | Native TextInput |
| Icons | Lucide React | Lucide React Native |

## API Integration (Future)

When connecting to a backend:

1. **Create API client**
```tsx
// lib/api.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: 'https://api.scholar.app',
});
```

2. **Replace store actions**
```tsx
addCourse: async (course) => {
  const response = await apiClient.post('/courses', course);
  // Update local state with response
}
```

3. **Add React Query**
```tsx
const { data, isLoading } = useQuery(
  ['courses'],
  () => apiClient.get('/courses')
);
```

## Building & Deployment

### Development
```bash
npm start          # Start Expo dev server
npm run ios        # iOS Simulator
npm run android    # Android Emulator
npm run web        # Web (experimental)
```

### Production Build
```bash
npm run build:ios       # Create iOS archive
npm run build:android   # Create Android APK/AAB
eas submit              # Submit to stores
```

### Configuration
- **app.json** - App metadata and Expo config
- **eas.json** - EAS Build configuration
- **package.json** - Dependencies and scripts

## Troubleshooting

### State Not Persisting
- Check AsyncStorage permissions
- Verify `persist` middleware is enabled
- Check device storage isn't full

### Theme Not Applying
- Clear Expo cache: `expo start --clear`
- Ensure `store.theme` is being read by all components
- Check Colors object in theme.ts

### Navigation Issues
- Verify file structure matches route names
- Check [brackets] syntax for groups
- Review Expo Router docs for dynamic routes

### Build Failures
- Delete `node_modules` and reinstall
- Clear Expo cache and rebuild
- Check EAS build logs for details

## Best Practices

1. **Always use `theme` prop** - Don't hardcode colors
2. **Memoize expensive calculations** - useMemo for large datasets
3. **Use Platform.select()** - For platform-specific code
4. **Test on real devices** - Simulator behavior may differ
5. **Keep component tree shallow** - Too many nested views = performance issues
6. **Use TypeScript strict mode** - Catch bugs early
7. **Implement error boundaries** - For crash protection

## Resources

- [Expo Documentation](https://docs.expo.dev)
- [Expo Router Guide](https://docs.expo.dev/routing/introduction)
- [NativeWind Docs](https://www.nativewind.dev)
- [Zustand Guide](https://github.com/pmndrs/zustand)
- [React Native Docs](https://reactnative.dev)
