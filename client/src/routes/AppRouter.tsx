import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { getDashboardRoute } from "../utils/getDashboardRoute";

import { ProtectedRoute } from "./ProtectedRoute";
import { RoleBasedRoute } from "./RoleBasedRoute";

// Pages
import Login from "../pages/auth/Login";
import Unauthorized from "../pages/Unauthorized.jsx";

// Layouts
import AdminLayout from "../layouts/AdminLayout";
import ManagerLayout from "../layouts/ManagerLayout";
import EmployeeLayout from "../layouts/EmployeeLayout";

// Pages (Nested)
import AdminDashboard from "../pages/admin/AdminDashboard";
import ManagerDashboard from "../pages/manager/ManagerDashboard";
import EmployeeDashboard from "../pages/employee/EmployeeDashboard";

export const AppRouter = () => {
  const user = useAuthStore((s) => s.user);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          user ? (
            <Navigate to={getDashboardRoute(user.role)} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/admin"
        element={
              
              <AdminLayout />
          //     <ProtectedRoute>
          //   <RoleBasedRoute allowedRoles={["ADMIN"]}>
          //   </RoleBasedRoute>
          // </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        {/* future routes */}
        {/* <Route path="users" element={<Users />} /> */}
        {/* <Route path="expenses" element={<Expenses />} /> */}
      </Route>

      {/* ================= MANAGER ================= */}
      <Route
        path="/manager"
        element={
          <ProtectedRoute>
            <RoleBasedRoute allowedRoles={["MANAGER"]}>
              <ManagerLayout />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<ManagerDashboard />} />
      </Route>

      {/* ================= EMPLOYEE ================= */}
      <Route
        path="/employee"
        element={
          <ProtectedRoute>
            <RoleBasedRoute allowedRoles={["EMPLOYEE"]}>
              <EmployeeLayout />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<EmployeeDashboard />} />
      </Route>

      {/* Unauthorized */}
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};