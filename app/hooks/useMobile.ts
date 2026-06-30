import { useEffect, useState } from "react";
import { Dimensions } from "react-native";

const MOBILE_BREAKPOINT = 768;

export function useMobile() {
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", () => {
      const { width } = Dimensions.get("window");
      setIsMobile(width < MOBILE_BREAKPOINT);
    });

    // Check initial size
    const { width } = Dimensions.get("window");
    setIsMobile(width < MOBILE_BREAKPOINT);

    return () => subscription.remove();
  }, []);

  return isMobile;
}
