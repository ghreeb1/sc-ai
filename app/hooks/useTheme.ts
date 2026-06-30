import { useStore } from "../lib/store";

export function useTheme() {
  const store = useStore();
  
  return {
    theme: store.theme,
    setTheme: store.setTheme,
  };
}
