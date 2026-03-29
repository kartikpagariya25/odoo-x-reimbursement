import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/common/Sidebar";
import { Topbar } from "../components/common/Topbar";

const managerMenu = [
  { label: "Dashboard", path: "/manager" },
  { label: "Approvals", path: "/manager/approvals" },
  { label: "Team Expenses", path: "/manager/expenses" },
];

const ManagerLayout = () => {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar items={managerMenu} />

      <div className="flex-1 flex flex-col">
        <Topbar />
    
        <main className="p-4 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ManagerLayout;