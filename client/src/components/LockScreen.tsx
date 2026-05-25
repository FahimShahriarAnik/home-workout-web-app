import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { Logo } from "./Logo";
import { FcGoogle } from "react-icons/fc";

export function LockScreen() {
  const { signInWithGoogle, loading } = useAuth();

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground">
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="text-primary mb-4">
          <Logo className="w-12 h-12" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight" data-testid="text-app-title">
          Lift Log
        </h1>
        <p className="text-sm text-muted-foreground mb-8">Low-pressure strength tracking</p>

        <Button
          onClick={signInWithGoogle}
          disabled={loading}
          variant="outline"
          className="w-full max-w-xs h-12 text-base bg-card"
          data-testid="button-signin-google"
        >
          <FcGoogle className="w-5 h-5 mr-2" />
          Sign in with Google
        </Button>

        <p className="text-[11px] text-muted-foreground text-center pt-6 max-w-xs">
          Your sessions and sets are private — visible only to you.
        </p>
      </div>
      <footer className="text-center text-[11px] text-muted-foreground pb-6">
        Built for consistency, not pressure.
      </footer>
    </div>
  );
}
