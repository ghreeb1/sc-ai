# Debug Session: expo-api-lan

- Status: OPEN
- Scope: Frontend networking configuration for Expo physical device
- Constraints: Do not modify backend logic
- Goals:
  - Verify `EXPO_PUBLIC_API_URL` uses LAN IP, not localhost
  - Verify the app actually uses the configured API base URL
  - Add temporary logging for `API_BASE_URL` and outgoing request URLs
  - Verify Expo is loading current `.env` values
  - Check for stale cached environment variables on the frontend side

## Hypotheses

1. `EXPO_PUBLIC_API_URL` is set to `localhost` or `127.0.0.1`, which fails on a physical device.
2. The app has a hardcoded fallback or separate constant, so requests do not actually use the env-driven base URL.
3. Expo is not reading the current `.env` file for this run, causing an outdated API URL to be bundled.
4. A stale Metro/Expo cache is preserving old env values even after `.env` changes.
5. Request construction is dropping or overriding the base URL before network calls are sent.

## Planned Evidence

- Inspect `.env` and app config for `EXPO_PUBLIC_API_URL`
- Inspect API client modules and request wrappers
- Add temporary logs for resolved base URL and full outgoing request URLs
- Run diagnostics and provide cache-clearing verification steps if needed

## Evidence Collected

- `d:\V1\.env` did not exist.
- `d:\V1\.env.local` did not exist before this session.
- Frontend request code uses `process.env.EXPO_PUBLIC_API_URL` from `services/api.ts`.
- All request call sites are in `services/api.ts` and `services/ai.ts`; no alternate backend host was found.
- Host machine Wi-Fi LAN IPv4 is `192.168.1.4`.
- Clean Expo startup reported:
  - `env: load .env.local`
  - `env: export EXPO_PUBLIC_API_URL EXPO_PUBLIC_API_VERSION EXPO_PUBLIC_APP_ENV`
- Runtime terminal logs showed:
  - `[network-debug] missing_api_base_url {"rawEnvValue": null}`
- `expo config --type public` now exposes:
  - `extra.publicApiUrl = http://192.168.1.4:8000`

## Changes Applied

1. Added temporary frontend logging for:
   - resolved `API_BASE_URL`
   - missing API base URL state
   - every outgoing request URL
2. Added root `.env.local` with LAN URL:
   - `EXPO_PUBLIC_API_URL=http://192.168.1.4:8000`
3. Added `app.config.js` to surface public env values into Expo `extra`.
4. Updated API base URL resolution to fall back to `Constants.expoConfig.extra.publicApiUrl`.

## Current Assessment

- Hypothesis 1: Confirmed risk and fixed by replacing missing local config with LAN-based config.
- Hypothesis 2: Rejected. The app uses the shared env-derived API base URL path.
- Hypothesis 3: Confirmed after fix. Expo now loads `.env.local`.
- Hypothesis 4: Addressed by verifying startup with `expo start --clear`.
- Hypothesis 5: Confirmed for the original failure mode. The bundle could not read `process.env`, so request construction never received a base URL until Expo `extra` fallback was added.
