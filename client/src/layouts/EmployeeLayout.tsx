import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/common/Sidebar";
import { Topbar } from "../components/common/Topbar";

const employeeMenu = [
  { label: "Dashboard", path: "/employee" },
  { label: "My Expenses", path: "/employee/expenses" },
  { label: "Submit Expense", path: "/employee/submit" },
];  

const EmployeeLayout = () => {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar items={employeeMenu} />

      <div className="flex-1 flex flex-col">
        <Topbar />

        <main className="p-4 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default EmployeeLayout;