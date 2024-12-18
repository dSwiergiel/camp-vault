"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <>
      {/* Mobile version */}
      <div className="sm:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>

      {/* Desktop version */}
      <div className={`hidden sm:flex items-center space-x-2 ${className}`}>
        <Sun className="h-4 w-4" />
        <Switch
          checked={theme === "dark"}
          onCheckedChange={(checked) => {
            setTheme(checked ? "dark" : "light");
          }}
          aria-label="Toggle dark mode"
        />
        <Moon className="h-4 w-4" />
      </div>
    </>
  );
}
