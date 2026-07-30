module.exports = ({ config }) => ({
  ...config,
  plugins: [
    ...(config.plugins ?? []),
    "expo-secure-store",
  ],
  extra: {
    ...(config.extra ?? {}),
    publicApiUrl: process.env.EXPO_PUBLIC_API_URL ?? null,
    publicApiVersion: process.env.EXPO_PUBLIC_API_VERSION ?? null,
    publicAppEnv: process.env.EXPO_PUBLIC_APP_ENV ?? null,
  },
});