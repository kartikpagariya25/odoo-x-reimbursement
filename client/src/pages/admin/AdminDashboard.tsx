// pages/admin/AdminDashboard.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import Overview from "./tabs/Overview";
import AllExpenses from "./tabs/AllExpenses";
import Users from "./tabs/Users";
import ApprovalRules from "./tabs/ApprovalRules";
import CompanySettings from "./tabs/CompanySettings";


type Tab = "overview" | "expenses" | "users" | "rules" | "settings";

const AdminDashboard = () => {
  const [active, setActive] = useState<Tab>("overview");
  const navigate  = useNavigate();
  const { user, logout } = useAuthStore();

  const initials = user?.name
    ? user.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : "AD";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

      
        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">
          {active === "overview"  && <Overview  onNavigate={setActive} />}
          {active === "expenses"  && <AllExpenses />}
          {active === "users"     && <Users />}
          {active === "rules"     && <ApprovalRules />}
          {active === "settings"  && <CompanySettings />}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;