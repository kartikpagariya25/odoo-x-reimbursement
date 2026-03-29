// config/sidebarConfig.ts

export type Role = "ADMIN" | "MANAGER" | "EMPLOYEE";

type SidebarItem = {
  label: string;
  path: string;
};

type SidebarSection = {
  section?: string;
  items: SidebarItem[];
};

export const sidebarConfig: Record<Role, SidebarSection[]> = {
  ADMIN: [
    {
      section: "Main",
      items: [
        { label: "Overview", path: "/admin" },
        { label: "All Expenses", path: "/admin/expenses" },
      ],
    },
    {
      section: "Manage",
      items: [
        { label: "Users", path: "/admin/users" },
        { label: "Approval Rules", path: "/admin/rules" },
      ],
    },
    {
      section: "Account",
      items: [
        { label: "Company Settings", path: "/admin/settings" },
      ],
    },
  ],

  MANAGER: [
    {
      section: "Main",
      items: [
        { label: "Dashboard", path: "/manager" },
        { label: "Approvals", path: "/manager/approvals" },
        { label: "Team Expenses", path: "/manager/expenses" },
      ],
    },
  ],

  EMPLOYEE: [
    {
      section: "Main",
      items: [
        { label: "Dashboard", path: "/employee" },
        { label: "My Expenses", path: "/employee/expenses" },
        { label: "Submit Expense", path: "/employee/submit" },
      ],
    },
  ],
};