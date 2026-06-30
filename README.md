# SCHOLAR - Mobile App

SCHOLAR is a premium academic success platform that helps students manage their curriculum, track their GPA, and get AI-powered academic guidance. This is the React Native mobile version built with Expo and TypeScript.

## Features

- 📊 **Academic Overview Dashboard** - Real-time GPA, credit completion, and graduation progress tracking
- 📚 **Curriculum Planner** - Responsive grid layout for organizing courses by semester
- 🤖 **AI Academic Advisor** - Chat interface for personalized academic guidance  
- ⚙️ **Settings & Profile** - Manage account, theme, language, and grading system
- 🌓 **Dark/Light Mode** - Premium dark mode (deep navy/slate) with smooth transitions
- 🌐 **Multi-language Support** - Full English & Arabic with RTL/LTR layout mirroring
- 💾 **Persistent State** - All data stored locally with AsyncStorage
- ✨ **Premium SaaS Design** - Inspired by Notion/Linear for clean, modern UX

## Tech Stack

- **Framework**: React Native with Expo
- **Router**: Expo Router (file-based navigation)
- **State Management**: Zustand with AsyncStorage persistence
- **Styling**: NativeWind (Tailwind for React Native)
- **UI Components**: Custom components + Lucide icons
- **Language**: TypeScript
- **Build**: EAS Build for iOS/Android

## Project Structure

```
app/
├── _layout.tsx                 # Global providers & setup
├── (tabs)/                     # Bottom tab navigation
│   ├── _layout.tsx             # Tab configuration
│   ├── index.tsx               # Overview/Dashboard
│   ├── curriculum.tsx          # Curriculum planner
│   ├── advisor.tsx             # AI advisor chat
│   └── settings.tsx            # Settings & profile
├── auth/
│   ├── login.tsx               # Login screen
│   └── register.tsx            # Registration wizard
└── components/                 # Reusable UI components
    ├── Button.tsx
    ├── Card.tsx
    └── Input.tsx

src/
├── lib/
│   ├── store.ts                # Zustand store with AsyncStorage
│   ├── types.ts                # TypeScript type definitions
│   ├── theme.ts                # Color schemes & styling utilities
│   └── i18n.ts                 # Internationalization
└── hooks/                      # Custom React hooks
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/bun
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator or Android Emulator (or physical device)

### Installation

1. **Clone the repository**
   ```bash
   cd V1
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Run on your platform**
   ```bash
   # iOS Simulator
   npm run ios

   # Android Emulator
   npm run android

   # Web (experimental)
   npm run web
   ```

## Development

### Adding a New Course

Users can add courses through the Curriculum tab:
1. Tap the "+" button in the Curriculum screen header
2. Fill in course details (code, name, credits, semester)
3. Course will be added to the global state and persisted locally

### Theme Switching

Users can toggle between light and dark modes in Settings. The app applies the theme globally through NativeWind and uses a custom color palette system.

### Language Support

The app fully supports English and Arabic with:
- RTL layout mirroring for Arabic
- Automatic layout direction switching
- Complete translation dictionary in `src/lib/i18n.ts`

### State Management

All app state is managed by Zustand and persisted to AsyncStorage:
- User profile & authentication
- Course list & GPA data
- Chat history
- Theme & language preferences

## Authentication Flow

1. **Login**: Email-based authentication (simplified for demo)
2. **Registration**: Capture full profile data including major, academic level, and grading system
3. **Persistence**: Authentication state is checked on app launch

## GPA Calculation

GPA is calculated based on the selected grading system:
- **4.0 Scale**: A+ = 4.0, A = 4.0, A- = 3.7, B+ = 3.3, etc.
- **5.0 Scale**: A+ = 5.0, A = 5.0, A- = 4.5, B+ = 4.0, etc.

The cumulative GPA is weighted by course credits.

## Styling with NativeWind

NativeWind brings Tailwind CSS utility classes to React Native:

```tsx
<View className="flex-1 bg-slate-900 p-4">
  <Text className="text-white text-lg font-bold">Hello</Text>
</View>
```

Dark/light mode is handled through the `Colors` object in `src/lib/theme.ts`.

## Building for Production

### iOS
```bash
npm run build:ios
# Or with local preview
npm run preview
```

### Android
```bash
npm run build:android
```

This uses EAS Build configured in `eas.json`.

## API Integration (Future)

Currently, the app uses local state for all data. To integrate with a backend:

1. Add API client (e.g., axios or fetch)
2. Replace Zustand actions with API calls
3. Add React Query for caching and synchronization
4. Update auth flow to use real tokens

## Troubleshooting

### Blank/White Screen
- Clear cache: `expo start --clear`
- Rebuild: `npm install` then start again

### AsyncStorage Not Persisting
- Check device storage permissions
- Clear app data and restart

### Build Failures
- Run `npm install` to ensure all dependencies are installed
- Check Node version (should be 18+)
- Review EAS logs: `eas build --local`

## Contributing

1. Create a feature branch
2. Make changes following the existing code style
3. Test on both iOS and Android
4. Submit PR with description

## License

MIT License - see LICENSE file for details

## Support

For issues and feature requests, please open an issue on GitHub.

## Roadmap

- [ ] Integration with backend API
- [ ] Course prerequisites visualization (graph layout)
- [ ] Semester workload planner
- [ ] GPA simulator with target tracking
- [ ] Achievement system
- [ ] Real AI advisor with ML backend
- [ ] Push notifications for deadlines
- [ ] Offline support with sync
