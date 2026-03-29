import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/common/Sidebar";
import { Topbar } from "../components/common/Topbar";

const adminMenu = [
  { label: "Overview", path: "/admin" },
  { label: "All Expenses", path: "/admin/expenses" },
  { label: "Users", path: "/admin/users" },
  { label: "Approval Rules", path: "/admin/rules" },
  { label: "Company Settings", path: "/admin/settings" },
];

const AdminLayout = () => {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar items={adminMenu} />

      <div className="flex-1 flex flex-col">
        <Topbar />

        <main className="p-4 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;