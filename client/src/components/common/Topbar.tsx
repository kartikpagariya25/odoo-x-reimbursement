import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useThemeStore } from "../../store/themeStore";

export const Topbar = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const isDark = theme === "dark";

  const initials = useMemo(() => {
    if (!user?.name) {
      return "U";
    }

    const parts = user.name
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }, [user?.name]);

  useEffect(() => {
    const onDocumentClick = (event: MouseEvent) => {
      if (!menuRef.current) {
        return;
      }

      if (!menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onDocumentClick);
    return () => {
      document.removeEventListener("mousedown", onDocumentClick);
    };
  }, []);

  const handleLogout = () => {
    logout();
    localStorage.removeItem("auth-storage");
    navigate("/login", { replace: true });
  };

  return (
    <div className="h-14 px-4 flex items-center justify-between border-b border-border bg-background">
      <p className="text-sm font-semibold text-textPrimary">Fuolo Reimbursements</p>

      <div className="flex items-center gap-3">
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

        <p className="hidden text-sm text-textSecondary sm:block">
          {user?.company?.name || "Company"}
          <span className="mx-2 text-textMuted">|</span>
          {user?.company?.currencyCode || "USD"}
        </p>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface text-xs font-semibold text-textPrimary"
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
          >
            {initials}
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 z-20 mt-2 w-56 rounded-md border border-border bg-surface p-3 shadow-lg">
              <p className="text-sm font-semibold text-textPrimary">{user?.name}</p>
              <div className="mt-1 inline-flex rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-textPrimary">
                {user?.role}
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="mt-3 w-full rounded-md border border-border px-3 py-2 text-left text-sm font-medium text-textPrimary transition-colors hover:bg-background"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};