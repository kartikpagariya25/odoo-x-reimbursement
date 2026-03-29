type Role = "ADMIN" | "MANAGER" | "EMPLOYEE";

export const sidebarConfig: Record<Role, any[]> = {
  ADMIN: [
    { label: "Dashboard", path: "/admin" },
    { label: "Users", path: "/admin/users" },
    { label: "Expenses", path: "/admin/expenses" },
    { label: "Settings", path: "/admin/settings" },
  ],

  MANAGER: [
    { label: "Dashboard", path: "/manager" },
    { label: "Approvals", path: "/manager/approvals" },
    { label: "Team Expenses", path: "/manager/expenses" },
  ],

  EMPLOYEE: [
    { label: "Dashboard", path: "/employee" },
    { label: "My Expenses", path: "/employee/expenses" },
    { label: "Submit Expense", path: "/employee/submit" },
  ],
};