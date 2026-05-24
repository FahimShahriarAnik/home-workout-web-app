import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth, DEMO_PASSCODE } from "@/lib/auth";
import { Logo } from "./Logo";
import { Lock } from "lucide-react";

export function LockScreen() {
  const { unlock } = useAuth();
  const [code, setCode] = useState("");
  const [err, setErr] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!unlock(code)) {
      setErr(true);
      setCode("");
    }
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground">
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="text-primary mb-4"><Logo className="w-12 h-12" /></div>
        <h1 className="text-xl font-semibold tracking-tight" data-testid="text-app-title">Lift Log</h1>
        <p className="text-sm text-muted-foreground mb-8">Low-pressure strength tracking</p>

        <form onSubmit={submit} className="w-full max-w-xs space-y-3">
          <label className="text-xs text-muted-foreground flex items-center gap-2">
            <Lock className="w-3 h-3" /> Enter passcode
          </label>
          <Input
            type="password"
            inputMode="numeric"
            autoFocus
            value={code}
            onChange={(e) => { setCode(e.target.value); setErr(false); }}
            placeholder="••••"
            className="text-center text-lg tracking-[0.5em] h-12"
            data-testid="input-passcode"
          />
          {err && <p className="text-xs text-destructive text-center" data-testid="text-passcode-error">Wrong passcode. Try again.</p>}
          <Button type="submit" className="w-full h-12 text-base" data-testid="button-unlock">Unlock</Button>
          <p className="text-[11px] text-muted-foreground text-center pt-2">
            Prototype demo passcode: <span className="font-mono">{DEMO_PASSCODE}</span>
          </p>
        </form>
      </div>
      <footer className="text-center text-[11px] text-muted-foreground pb-6">
        Built for consistency, not pressure.
      </footer>
    </div>
  );
}
