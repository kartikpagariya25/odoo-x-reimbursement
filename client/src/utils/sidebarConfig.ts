type Role = "ADMIN" | "MANAGER" | "EMPLOYEE";

export const sidebarConfig: Record<Role, any[]> = {
  ADMIN: [
    { label: "Overview", path: "/admin" },
    { label: "All Expenses", path: "/admin/expenses" },
    { label: "Users", path: "/admin/users" },
    { label: "Approval Rules", path: "/admin/rules" },
    { label: "Company Settings", path: "/admin/settings" },
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