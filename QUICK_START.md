# Quick Start Guide

Get SCHOLAR mobile running in 5 minutes!

## Prerequisites

- Node.js 18+ ([Download](https://nodejs.org/))
- Expo CLI: `npm install -g expo-cli`
- A phone or simulator:
  - **iPhone**: Xcode installed + iOS Simulator
  - **Android**: Android Studio + Android Emulator or physical device

## Installation (3 steps)

### 1. Install Dependencies
```bash
cd V1
npm install
```

### 2. Start Development Server
```bash
npm start
```

You'll see a QR code and options in the terminal.

### 3. Open on Device

**Option A: iPhone Simulator (macOS)**
```bash
npm run ios
```

**Option B: Android Emulator**
```bash
npm run android
```

**Option C: Physical Device**
- Scan QR code with Expo Go app (iOS/Android)
- Or press `w` for web

## First Time Usage

1. **Login**: Use any email (e.g., `student@university.edu`)
2. **Add Courses**: Go to Curriculum tab, tap `+` button
3. **View Dashboard**: Overview tab shows your progress
4. **Settings**: Change theme, language, grading system

## Common Commands

```bash
npm start              # Start dev server
npm run ios            # iOS Simulator (macOS only)
npm run android        # Android Emulator
npm run web            # Web browser (experimental)
npm run lint           # Check code
npm run format         # Format code
npm run build:ios      # Production iOS build
npm run build:android  # Production Android build
```

## Project Structure

```
app/                   # Screens and navigation
├── (tabs)/            # Main app screens
├── auth/              # Login/Register screens
└── components/        # Reusable UI components

src/lib/
├── store.ts           # State management
├── types.ts           # TypeScript types
├── theme.ts           # Colors and styling
└── i18n.ts            # Translations (EN + AR)
```

## Key Features

✅ **Overview Dashboard** - GPA, credits, progress  
✅ **Curriculum Planner** - Manage courses by semester  
✅ **AI Advisor** - Chat interface for guidance  
✅ **Settings** - Profile, theme, language, grading system  
✅ **Dark Mode** - Premium dark theme by default  
✅ **Multi-language** - English & Arabic with RTL support  
✅ **Local Storage** - All data saved automatically  

## Troubleshooting

### Blank/white screen?
```bash
npm start --clear
```

### Module not found?
```bash
rm -rf node_modules
npm install
```

### Can't connect to simulator?
- Try restarting the simulator
- Clear metro cache: `npm start -- --clear`
- Check port 19000 is not blocked

### iOS build failing?
```bash
expo prebuild --clean
npm run ios
```

## Next Steps

- Read [README.md](./README.md) for detailed documentation
- Check [IMPLEMENTATION_NOTES.md](./IMPLEMENTATION_NOTES.md) for technical details
- See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for web→mobile differences

## Need Help?

- Expo Docs: https://docs.expo.dev
- GitHub Issues: [Open an issue]
- Discord: Expo community

---

**Happy coding! 🚀**
