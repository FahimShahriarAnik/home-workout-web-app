import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Dumbbell, FileText, Activity, History, Download, Moon, Sun, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Log", icon: Activity },
  { href: "/plan", label: "Plan", icon: Dumbbell },
  { href: "/muscles", label: "Muscles", icon: FileText },
  { href: "/history", label: "History", icon: History },
  { href: "/export", label: "Export", icon: Download },
];

export function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { theme, toggle } = useTheme();
  const { lock } = useAuth();

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-3xl flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2 text-foreground" data-testid="link-home">
            <span className="text-primary"><Logo className="w-8 h-8" /></span>
            <div className="flex flex-col leading-none">
              <span className="text-sm font-semibold tracking-tight">Lift Log</span>
              <span className="text-[11px] text-muted-foreground">Fahim's system</span>
            </div>
          </Link>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme" data-testid="button-theme">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={lock} aria-label="Lock app" data-testid="button-lock">
              <Lock className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-3xl px-4 pt-4 pb-28">{children}</main>

      <nav className="fixed bottom-0 inset-x-0 z-30 border-t border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto max-w-3xl grid grid-cols-5">
          {NAV.map((n) => {
            const active = location === n.href;
            const Icon = n.icon;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-3 text-[11px] transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
                data-testid={`nav-${n.label.toLowerCase()}`}
              >
                <Icon className="w-5 h-5" />
                <span>{n.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
