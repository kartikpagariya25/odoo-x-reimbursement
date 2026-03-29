import { useState, useEffect } from "react";
import { expenseService } from "../../services/expense.service";
import { formatCurrency, formatDate, getStatusBadgeColor } from "../../utils/formatters";

const STATUS_FILTERS = ["ALL", "PENDING", "APPROVED", "REJECTED"];

const ExpenseHistory = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const data = await expenseService.getMyExpenses();
      setExpenses(data);
    } catch (error) {
      console.error("Failed to fetch expenses:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredExpenses =
    statusFilter === "ALL"
      ? expenses
      : expenses.filter((e) => e.status === statusFilter);

  const totalAmount = filteredExpenses.reduce(
    (sum, e) => sum + e.amount,
    0
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-textSecondary">Loading expenses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-textPrimary">Expense History</h1>
          <p className="mt-1 text-textSecondary">
            View and track all your submitted expenses
          </p>
        </div>
      </div>

      {/* Filters and Stats */}
      <div className="flex flex-col justify-between gap-4 rounded-lg border border-border bg-surface p-4 sm:flex-row sm:items-center">
        <div className="flex gap-2">
          {STATUS_FILTERS.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === status
                  ? "bg-primary text-white"
                  : "text-textSecondary hover:bg-background hover:text-textPrimary"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        <div className="text-sm text-textSecondary">
          Showing {filteredExpenses.length} expense(s) | Total:{" "}
          <span className="font-semibold text-textPrimary">
            {formatCurrency(totalAmount)}
          </span>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        {filteredExpenses.length > 0 ? (
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
              {filteredExpenses.map((expense) => (
                <tr
                  key={expense.id}
                  className="hover:bg-background/50 transition-colors"
                >
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
            <span className="mb-3 text-4xl">📋</span>
            <p className="text-textSecondary">
              No expenses found{statusFilter !== "ALL" ? ` for "${statusFilter}"` : ""}
            </p>
            {statusFilter !== "ALL" && (
              <button
                onClick={() => setStatusFilter("ALL")}
                className="mt-3 text-sm font-medium text-primary hover:underline"
              >
                Clear filter
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseHistory;
