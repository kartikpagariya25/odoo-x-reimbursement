// layouts/components/Topbar.tsx
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";

export const Topbar = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "AD";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="h-12 flex items-center justify-between px-5 border-b border-border bg-surface shrink-0">
      <span className="font-semibold text-primary text-base">
        Fuolo
      </span>

      <div className="flex items-center gap-3">
        <span className="text-xs text-textSecondary">
          {user?.company?.name ?? "Company"} ·{" "}
          {user?.company?.currencyCode ?? ""}
        </span>

        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
          {initials}
        </div>

        <button
          onClick={handleLogout}
          className="text-xs text-danger hover:underline"
        >
          Logout
        </button>
      </div>
    </header>
  );
};