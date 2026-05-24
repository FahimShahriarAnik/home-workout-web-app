import { createContext, useContext, useState, ReactNode } from "react";

const AuthCtx = createContext<{ unlocked: boolean; unlock: (code: string) => boolean; lock: () => void } | null>(null);

// Prototype passcode — change in production
export const DEMO_PASSCODE = "1337";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const unlock = (code: string) => {
    if (code === DEMO_PASSCODE) {
      setUnlocked(true);
      return true;
    }
    return false;
  };
  const lock = () => setUnlocked(false);
  return <AuthCtx.Provider value={{ unlocked, unlock, lock }}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const v = useContext(AuthCtx);
  if (!v) throw new Error("useAuth outside provider");
  return v;
}
