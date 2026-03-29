import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { expenseService } from "../../services/expense.service";
import { formatCurrency, formatDate, getStatusBadgeColor } from "../../utils/formatters";

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [expensesData] = await Promise.all([
        expenseService.getMyExpenses(),
      ]);

      // Calculate stats
      const total = expensesData.reduce((sum, exp) => sum + exp.amount, 0);
      const pending = expensesData.filter((e) => e.status === "PENDING").reduce((sum, e) => sum + e.amount, 0);
      const approved = expensesData.filter((e) => e.status === "APPROVED").reduce((sum, e) => sum + e.amount, 0);
      const rejected = expensesData.filter((e) => e.status === "REJECTED").reduce((sum, e) => sum + e.amount, 0);

      setStats({ total, pending, approved, rejected });
      setRecentExpenses(expensesData.slice(0, 5));
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      label: "Submit New Expense",
      description: "Create expense with OCR receipt upload",
      icon: "➕",
      onClick: () => navigate("/employee/submit"),
      primary: true,
    },
    {
      label: "Expense History",
      description: "View all submitted expenses",
      icon: "📋",
      onClick: () => navigate("/employee/expenses"),
      primary: false,
    },
  ];

  const StatCard = ({ title, amount, subtitle, color }) => (
    <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
      <p className="text-sm font-medium text-textSecondary">{title}</p>
      <p className={`mt-2 text-2xl font-bold ${color}`}>
        {formatCurrency(amount)}
      </p>
      {subtitle && (
        <p className="mt-1 text-xs text-textMuted">{subtitle}</p>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-textSecondary">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-textPrimary">
          Welcome back, {user?.name}!
        </h1>
        <p className="mt-1 text-textSecondary">
          Here's an overview of your expense reimbursements
        </p>
      </div>

      {/* Quick Actions */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-textPrimary">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className={`group flex flex-col items-start gap-3 rounded-lg border p-5 text-left transition-all duration-200 ${
                action.primary
                  ? "border-primary bg-primary/5 hover:bg-primary/10"
                  : "border-border bg-surface hover:border-primary/50 hover:bg-primary/5"
              }`}
            >
              <span className="text-2xl">{action.icon}</span>
              <div>
                <p className={`font-semibold ${action.primary ? "text-primary" : "text-textPrimary"}`}>
                  {action.label}
                </p>
                <p className="mt-1 text-sm text-textSecondary">
                  {action.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Stats Overview */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-textPrimary">Expense Summary</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Submitted"
            amount={stats.total}
            subtitle="All time expenses"
            color="text-textPrimary"
          />
          <StatCard
            title="Pending Approval"
            amount={stats.pending}
            subtitle="Awaiting review"
            color="text-warning"
          />
          <StatCard
            title="Approved"
            amount={stats.approved}
            subtitle="Ready for reimbursement"
            color="text-success"
          />
          <StatCard
            title="Rejected"
            amount={stats.rejected}
            subtitle="Needs attention"
            color="text-danger"
          />
        </div>
      </section>

      {/* Recent Expenses */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-textPrimary">Recent Expenses</h2>
          <button
            onClick={() => navigate("/employee/expenses")}
            className="text-sm font-medium text-primary hover:underline"
          >
            View All →
          </button>
        </div>
        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          {recentExpenses.length > 0 ? (
            <table className="w-full">
              <thead className="bg-background">
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-textSecondary">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-textSecondary">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-textSecondary">
                    Category
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-textSecondary">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-textSecondary">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-background/50">
                    <td className="px-4 py-3 text-sm text-textSecondary">
                      {formatDate(expense.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-textPrimary">
                      {expense.description}
                    </td>
                    <td className="px-4 py-3 text-sm text-textSecondary">
                      {expense.category}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-textPrimary">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeColor(
                          expense.status
                        )}`}
                      >
                        {expense.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <span className="mb-3 text-4xl">📊</span>
              <p className="text-textSecondary">No expenses yet</p>
              <button
                onClick={() => navigate("/employee/submit")}
                className="mt-3 text-sm font-medium text-primary hover:underline"
              >
                Submit your first expense →
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default EmployeeDashboard;