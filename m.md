Search Agent Inspect UI architecture

I inspected the relevant UI, state, theming, accessibility, and animation code paths comprehensively and listed the findings with source paths below.

Components

- Reusable primitives exist, but only Loading and ScreenHeader are actively reused across tab screens: Loading.tsx:L1-L25 , ScreenHeader.tsx:L23-L167
- Button , Input , and Card are present as shared components, but current screens mostly bypass them and hand-roll UI instead: Button.tsx:L10-L135 , Input.tsx:L11-L96 , Card.tsx:L5-L103
- This leads to partial design-system adoption: shared header/loading, but custom inputs/buttons/cards in auth, curriculum, GPA, planner, and advisor screens
Reusable Patterns

- Tab screens consistently follow the same shell: SafeAreaView + StatusBar + ScreenHeader + themed palette object per screen: index.tsx:L238-L345 , planner.tsx:L19-L47 , gpa.tsx:L261-L281 , curriculum.tsx:L164-L187
- Loading/error rendering is repeated with near-identical conditional branches and retry affordances in Overview, GPA, and Planner: index.tsx:L347-L379 , gpa.tsx:L563-L589 , planner.tsx:L211-L233
- Auth screens share the same branding and form-row pattern, but only Register factors part of it into local subcomponents; Login duplicates the same structure inline: login.tsx:L90-L338 , register.tsx:L32-L155 , register.tsx:L241-L524
Duplicates

- There are two advisor implementations with overlapping chat, streaming, empty-state, and composer logic: app/advisor.tsx:L123-L760 , app/(tabs)/advisor.tsx:L174-L875
- The active FAB routes to the root advisor screen, while the tabs layout also defines a hidden tab advisor route; this is a strong duplicate-route smell: app/_layout.tsx:L195-L215 , app/(tabs)/_layout.tsx:L111-L133 , app/(tabs)/_layout.tsx:L248-L262
- Data-loading code is duplicated in loadX callback plus a second near-identical useEffect loader in multiple screens: index.tsx:L261-L301 , planner.tsx:L49-L97 , gpa.tsx:L285-L324
- Theme palette objects are rebuilt manually per screen instead of deriving from one shared semantic token layer
Theming

- App theme is store-driven and persisted via Zustand; only "light" and "dark" are supported, with no system-theme mode: store.ts:L37-L49 , store.ts:L163-L165 , store.ts:L430-L449
- Core color tokens live in theme.ts:L1-L46 , and screens consume them through useThemeColors
- A second theme source exists in NativeWind config, but its dark/light values do not fully match theme.ts ; this can drift over time: tailwind.config.js:L1-L37 , theme.ts:L1-L39
- NativeWind usage is minimal; most styling is StyleSheet + inline styles, so the project currently maintains two styling systems for limited benefit: global.css:L1-L3 , app/(tabs)/_layout.tsx:L95-L98
Dark Mode

- Dark mode is implemented consistently at the screen level by branching on theme === "dark" and deriving local palettes: login.tsx:L33-L53 , settings.tsx:L280-L298
- Settings provides explicit theme toggles and syncs to backend preferences: settings.tsx:L358-L367 , settings.tsx:L487-L515
- The main weakness is inconsistency risk: many screens add one-off dark colors beyond the shared token file, so dark mode is centralized in behavior but decentralized in actual color choices
Loading / Empty / Error

- Good coverage exists on tab data screens: Overview, GPA, Planner, Curriculum, and Advisor all have explicit loading and/or empty UI: index.tsx:L347-L380 , gpa.tsx:L563-L615 , planner.tsx:L211-L233 , curriculum.tsx:L404-L442 , advisor.tsx:L589-L631
- Auth screens use inline loading indicators on submit buttons, but no separate empty/error layout pattern: login.tsx:L293-L318 , register.tsx:L409-L421
- Curriculum has a notable gap: initial load failures are only logged to console and do not surface an error state to users: curriculum.tsx:L198-L215
- Loading UI is functional but basic; there are no skeletons or shimmer placeholders, only spinners
Accessibility

- Positive: tab bar, settings segmented controls, settings button, and some advisor controls have accessibility labels/roles/states: ScreenHeader.tsx:L88-L101 , app/(tabs)/_layout.tsx:L111-L133 , app/(tabs)/_layout.tsx:L187-L226 , settings.tsx:L237-L267
- Auth screens largely lack accessibility labels, roles, and hints on icon buttons, password toggle, submit CTA, and navigation links: login.tsx:L94-L112 , login.tsx:L261-L333 , register.tsx:L122-L147 , register.tsx:L410-L519
- Inputs rely mostly on adjacent visible text labels instead of explicit accessibility props; workable, but not robust for screen readers
- Some text explicitly disables font scaling in the tab bar, which hurts accessibility for low-vision users: app/(tabs)/_layout.tsx:L200-L210
Animations

- Splash and route transitions are thoughtfully animated with fade/slide behavior: app/_layout.tsx:L58-L97 , app/_layout.tsx:L179-L223
- Custom tab bar FAB uses press-scale spring animation: app/(tabs)/_layout.tsx:L40-L92
- Advisor screens use animated streaming cursors and, in the tab version, animated drawer/overlay transitions: app/advisor.tsx:L94-L121 , app/(tabs)/advisor.tsx:L230-L293
- Animation style is cohesive but sparse elsewhere; most cards, lists, modals, and state transitions swap instantly with no motion polish
Highest-Value Issues

- Consolidate the two advisor screens into one implementation: app/advisor.tsx , app/(tabs)/advisor.tsx
- Extract shared async-state wrappers for loading/error/empty to remove repetition across Overview/GPA/Planner
- Standardize on one theme token source and reduce per-screen ad hoc dark-mode colors
- Increase accessibility coverage on auth and modal actions
- Reuse existing Button , Input , and Card primitives or remove them if they are no longer part of the UI direction

##############
Search Agent Find unused code

I did a comprehensive repo pass across routes, components, assets, imports, and config. These are likely cleanup and bundle-risk findings with supporting paths.

High Confidence

- Duplicate advisor implementations : two large advisor screens exist with overlapping chat logic, streaming cursor, conversation mapping, and composer UI in advisor.tsx and advisor.tsx .
- Root advisor appears to be the active entry : the floating action button navigates to /advisor in _layout.tsx , while the tab bar explicitly hides the advisor tab route in _layout.tsx . That makes app/(tabs)/advisor.tsx a strong candidate for dead or redundant code.
- Unused route import/state in root advisor : useRouter is imported and const router = useRouter() is created in advisor.tsx and advisor.tsx , but the search found no later router usage in that file.
- Unused shared UI components : repo search found no imports of Button.tsx , Input.tsx , or Card.tsx . They are likely dead component files.
- Unused hooks : repo search found no imports of useTheme.ts or useMobile.ts . Both look unused.
Assets

- Unused SVG logo asset : scholar-icon.svg is not referenced anywhere in app code/config.
- Legacy splash source image likely unused at runtime : 001.png is only referenced by the generator script in generate-branded-splash.ps1 , not by app runtime/config.
- Unused splash asset : splash.png is not referenced in app code/config; current config uses branded-splash.png in app.json and runtime also requires it in _layout.tsx .
Bundle Risks

- Over-broad asset bundling : assetBundlePatterns: ["**/*"] in app.json bundles everything under the project, which can pull in unused assets and increase binary size.
- Potentially unused dependencies : code search found no app usage of @react-native-picker/picker , ajv , ajv-keywords , date-fns , expo-font , expo-linking , expo-localization , expo-web-browser , i18next , or uuid from package.json . These are good candidates for dependency pruning.
- Localization package may be unnecessary : the app appears to use an in-repo dictionary in i18n.ts , while i18next is still listed in package.json .
Likely Dead State

- Global course loading/error state may be mostly redundant : store-level coursesLoading / coursesError is defined in store.ts and initialized in store.ts , but the visible screen usage is minimal; curriculum also keeps its own local coursesLoading in curriculum.tsx . This suggests some duplicated state management.
Image Optimization

- PNG-first branding pipeline : splash and app branding use PNGs in app.json , and the runtime overlay also renders a PNG in _layout.tsx . Since an SVG version exists in scholar-icon.svg , some branding assets may be heavier than necessary for web/static output.
- Duplicate branded splash delivery : the same image is configured in Expo splash config and rendered again as an in-app overlay in app.json and _layout.tsx . This is intentional UX-wise, but it does duplicate image usage and memory pressure during startup.
Best Cleanup Targets First

- Remove or merge one of the two advisor screens: advisor.tsx vs advisor.tsx .
- Delete or adopt unused shared files: Button.tsx , Input.tsx , Card.tsx , useTheme.ts , useMobile.ts .
- Remove unused assets: scholar-icon.svg , splash.png , and possibly 001.png if you no longer regenerate splash art.
- Tighten bundle config in app.json and prune unused dependencies from package.json .
If you want, I can turn this into a ranked deletion checklist with “safe / verify first / keep” labels.

###############
Search Agent Inspect app architecture

I inspected the codebase comprehensively across app/ and services/ and the main findings are below with direct file references.

Architecture

- Global app state uses a persisted Zustand store for UI/session state, while most server data is fetched ad hoc per screen rather than normalized centrally in the store; see store.ts:L21-L459 .
- Auth tokens live separately in SecureStore and are injected into requests through configured token handlers; see auth.ts:L19-L107 and api.ts:L11-L162 .
- Course data is partially centralized in the store, but screens still fetch courses and plans directly, creating mixed ownership; see store.ts:L250-L381 and curriculum.tsx:L198-L295 .
State

- Zustand store shape is strongly modeled and includes auth, profile, courses, language, theme, onboarding, and chat history; see types.ts:L1-L219 and store.ts:L23-L155 .
- Persistence is intentionally narrow: only language , theme , and onboarded are stored in AsyncStorage, while auth/session data is rebuilt from SecureStore on boot; see store.ts:L419-L444 .
- Auth bootstrap is handled in the root layout after store hydration, then route protection redirects between auth and tabs; see _layout.tsx:L34-L56 and _layout.tsx:L99-L228 .
- Course CRUD actions in the store map backend payloads into frontend models and normalize status naming differences such as in-progress to in_progress ; see store.ts:L51-L120 .
API Layer

- apiRequest is the main HTTP wrapper: it resolves base URL, sets JSON headers, attaches bearer tokens, retries once on 401, parses JSON/text, and throws structured ApiError ; see api.ts:L3-L162 .
- Domain services are cleanly split into auth, academic, and AI modules; see auth.ts , academic.ts , and ai.ts .
- AI streaming bypasses apiRequest and reimplements authenticated fetch plus 401 refresh logic for SSE, which is reasonable technically but duplicates token-refresh behavior; see ai.ts:L57-L222 .
- Several screens fetch directly from services instead of consuming store-backed selectors/actions, especially overview, planner, GPA, settings, and curriculum; see index.tsx:L261-L301 , planner.tsx:L49-L97 , gpa.tsx:L285-L324 , settings.tsx:L310-L384 , and curriculum.tsx:L198-L295 .
Navigation

- The app uses Expo Router with a root stack and a tab group; auth gating happens in the root layout with router.replace ; see _layout.tsx:L99-L228 .
- Tabs use a custom tab bar and hide internal routes like advisor and settings from the visible tab list; see (tabs)/_layout.tsx:L27-L264 .
- There are two advisor screens: a root-level advisor.tsx and a tab-level (tabs)/advisor.tsx . The tab bar pushes /advisor , while the tabs layout also defines an advisor screen with href: null ; see (tabs)/_layout.tsx:L111-L117 and (tabs)/_layout.tsx:L248-L263 . This duplication is a maintenance risk.
TypeScript

- Strong typing is used well for API contracts and app models, especially in types.ts:L1-L219 .
- Backend-to-frontend mapping is explicit and helpful, especially user and course normalization; see auth.ts:L27-L41 and store.ts:L51-L120 .
- Type safety is weakened in a few places: Zustand persist setup uses as any ; see store.ts:L419-L443 .
- Form typing is also loosened in places, such as update(key: string, value: any) in registration; see register.tsx:L173-L190 .
- Some local unions duplicate shared domain types instead of reusing them, such as curriculum form status/grade; see curriculum.tsx:L40-L74 .
Performance Risks

- Whole-store subscriptions are used in several screens and hooks, so any store change can rerender the full screen unnecessarily; see settings.tsx:L275-L332 , login.tsx:L30-L36 , register.tsx:L159-L163 , advisor.tsx:L123-L202 , and useTheme.ts:L1-L9 .
- Store updates frequently spread the entire state object ( { ...state, ... } ), which amplifies the cost of those whole-store subscribers; see store.ts:L157-L417 .
- Course mutations always refetch the full course list after create/update/delete, causing extra round trips and full-list rerenders; see store.ts:L274-L381 .
- Overview, planner, and GPA each duplicate initial fetch logic in both a callback and an effect, which increases maintenance and invites inconsistent loading behavior; see index.tsx:L261-L301 , planner.tsx:L49-L97 , and gpa.tsx:L285-L324 .
- AI chat screens rerender on every streamed token because each token mutates screen-local message state; this can get expensive for long answers; see advisor.tsx:L291-L339 and (tabs)/advisor.tsx:L400-L463 .
- The tab advisor also rebuilds history items from both remote conversation metadata and local message buffers on every relevant change; see (tabs)/advisor.tsx:L481-L493 .
Priority Findings

- Highest risk: mixed data ownership between Zustand and direct service calls, especially courses/preferences.
- Highest rerender risk: useStore() whole-store subscriptions in screen components and hooks.
- Highest navigation smell: duplicated advisor route implementations.
- Highest network inefficiency: mutation flows that always refetch entire resources.
- Best part of the architecture: the base API wrapper and typed service split are clean and easy to extend.
If you want, I can turn this into a ranked remediation plan next.

############
Search Agent Map project structure

I completed a comprehensive scan of the Expo React Native workspace and its current on-disk structure.

Overview

- Project root is d:\V1 , with an Expo Router app under app , shared API modules under services , and assets under assets .
- Expo Router is the entrypoint via package.json:L4 , so route structure is file-system driven from the app/ directory.
- The app uses TypeScript, Zustand persistence, Expo Secure Store, NativeWind, and custom service modules for auth, academic APIs, and AI chat.
Key Folders

- app — all routes plus app-scoped UI, hooks, theme, store, and types.
- app/(tabs) — tabbed main app area: overview, curriculum, GPA, planner, hidden settings/advisor tab entries.
- app/auth — unauthenticated screens for login and register.
- app/components — shared UI pieces like header, button, input, loading.
- app/hooks — app hooks such as theme/mobile helpers.
- app/lib — store, constants, i18n, theme, types.
- services — API access layer for auth, academic, AI, and request utilities.
- assets — icons, splash images, favicon, SVG branding.
- scripts — helper script for branded splash generation.
Route And Layout Files

- Root layout: app/_layout.tsx
- Tabs layout: app/(tabs)/_layout.tsx
- Main tab routes:
  - app/(tabs)/index.tsx
  - app/(tabs)/curriculum.tsx
  - app/(tabs)/gpa.tsx
  - app/(tabs)/planner.tsx
  - app/(tabs)/advisor.tsx
  - app/(tabs)/settings.tsx
- Standalone route outside tabs:
  - app/advisor.tsx
- Auth routes:
  - app/auth/login.tsx
  - app/auth/register.tsx
Routing Behavior

- Root stack in app/_layout.tsx:L173-L227 registers (tabs) , advisor , auth/login , and auth/register .
- Auth gating happens in AuthGuard , redirecting unauthenticated users to /auth/login and authenticated users to /(tabs) .
- Tabs are defined in app/(tabs)/_layout.tsx:L239-L264 .
- advisor and settings exist in the tab navigator but are hidden from the visible tab bar via href: null in app/(tabs)/_layout.tsx:L256-L263 .
- The custom FAB in app/(tabs)/_layout.tsx:L111-L133 pushes to /advisor , which is the standalone screen, not the tab-scoped /(tabs)/advisor .
Config Files

- App metadata and Expo plugins: app.json
- Runtime env injection: app.config.js
- Package/dependencies/scripts: package.json
- TypeScript config: tsconfig.json
- Babel config: babel.config.js
- Metro + NativeWind config: metro.config.js
- Tailwind/NativeWind theme scanning: tailwind.config.js
- Lint config: eslint.config.js
- Type env declarations: expo-env.d.ts , nativewind-env.d.ts
- Build config: eas.json
Architecture Observations

- Navigation shell is centralized in app/_layout.tsx , combining splash handling, hydration, auth bootstrap, providers, and stack navigation.
- State is centralized in a persisted Zustand store at app/lib/store.ts , with AsyncStorage persistence for language/theme/onboarding and in-memory auth/course/chat state.
- Secure auth tokens are stored separately in services/auth.ts:L43-L73 using Expo Secure Store.
- Network access is layered: low-level request handling in services/api.ts , domain APIs in services/academic.ts , services/auth.ts , and services/ai.ts .
- AI chat uses streaming SSE-style responses in services/ai.ts:L161-L222 , consumed by the standalone advisor screen in app/advisor.tsx .
- Localization is dictionary-based and app-local in app/lib/i18n.ts , currently supporting English and Arabic.
- Theming is custom and store-driven in app/lib/theme.ts , while NativeWind is also enabled for utility classes, so styling is hybrid rather than purely utility-first.
- Shared screen chrome is provided by ScreenHeader , which also routes to settings.
Notable Details

- Global CSS is imported from app/_layout.tsx:L1 , enabling NativeWind styles app-wide.
- A branded splash overlay is implemented in app/_layout.tsx:L58-L97 and coordinated with Expo Splash Screen in app/_layout.tsx:L20-L24 .
- Expo typed routes are enabled in app.json:L52-L54 .
- Tailwind scans both app/**/* and src/**/* in tailwind.config.js:L3-L4 , but there is currently no src/ folder in the repo.
- TypeScript defines an alias only for @/app/* in tsconfig.json:L24-L26 , but much of the code still uses relative imports.
If you want, I can next turn this into a cleaner tree view or a route map diagram.