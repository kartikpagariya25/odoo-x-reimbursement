import { useAuthStore } from "../../store/authStore";
import { useThemeStore } from "../../store/themeStore";

export const Topbar = () => {
  const user = useAuthStore((s) => s.user);
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const isDark = theme === "dark";

  return (
    <div className="h-14 px-4 flex items-center justify-between border-b border-border bg-background">
      <p className="text-textPrimary font-medium">Welcome, {user?.name}</p>

      <button
        onClick={toggleTheme}
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label={`Theme: ${isDark ? "dark" : "light"}. Click to switch to ${isDark ? "light" : "dark"} mode.`}
        className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-textSecondary transition-colors hover:text-textPrimary"
      >
        <span>Theme</span>
        <span
          className={`relative h-5 w-9 rounded-full transition-colors ${
            isDark ? "bg-primary" : "bg-secondary"
          }`}
        >
          <span
            className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-background transition-transform ${
              isDark ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </span>
        <span className="w-8 text-left">{isDark ? "Dark" : "Light"}</span>
      </button>
    </div>
  );
};