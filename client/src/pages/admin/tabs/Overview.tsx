// pages/admin/tabs/Overview.tsx
import { useEffect, useState } from "react";
import { getAllExpenses, overrideExpense } from "../services/adminApi";

type Tab = "overview" | "expenses" | "users" | "rules" | "settings";

interface Expense {
  _id: string;
  employeeName: string;
  amount: number;
  convertedAmount: number;
  currencyCode: string;
  category: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

interface OverrideModal {
  expenseId: string;
  action: "APPROVED" | "REJECTED";
}

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    PENDING:  "bg-yellow-50 text-yellow-700 border border-yellow-200",
    APPROVED: "bg-green-50 text-green-700 border border-green-200",
    REJECTED: "bg-red-50 text-red-700 border border-red-200",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[status] ?? ""}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
};

interface Props {
  onNavigate: (tab: Tab) => void;
}

const Overview = ({ onNavigate }: Props) => {
  const [expenses, setExpenses]       = useState<Expense[]>([]);
  const [loading, setLoading]         = useState(true);
  const [modal, setModal]             = useState<OverrideModal | null>(null);
  const [comment, setComment]         = useState("");
  const [submitting, setSubmitting]   = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await getAllExpenses();
    setExpenses(res.expenses ?? res ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const stats = {
    total:    expenses.reduce((s, e) => s + (e.convertedAmount ?? e.amount), 0),
    pending:  expenses.filter((e) => e.status === "PENDING").length,
    approved: expenses.filter((e) => e.status === "APPROVED").length,
    rejected: expenses.filter((e) => e.status === "REJECTED").length,
  };

  const recent = [...expenses].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 10);

  const handleOverride = async () => {
    if (!modal) return;
    setSubmitting(true);
    await overrideExpense(modal.expenseId, { action: modal.action, comment });
    setModal(null);
    setComment("");
    setSubmitting(false);
    load();
  };

  return (
    <div>
      <h1 className="text-lg font-semibold text-primary mb-4">Overview</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total expenses", value: `₹${stats.total.toLocaleString()}` },
          { label: "Pending",        value: stats.pending  },
          { label: "Approved",       value: stats.approved },
          { label: "Rejected",       value: stats.rejected },
        ].map((s) => (
          <div key={s.label} className="bg-surface border border-border rounded-xl p-4">
            <p className="text-xs text-textSecondary mb-1">{s.label}</p>
            <p className="text-2xl font-semibold text-primary">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Recent table */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-primary">Recent expenses</h2>
        <button
          onClick={() => onNavigate("expenses")}
          className="text-xs text-primary hover:underline"
        >
          View all →
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-textSecondary">Loading...</p>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface border-b border-border">
              <tr>
                {["Employee", "Amount", "Category", "Status", "Action"].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs text-textSecondary font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.map((e) => (
                <tr key={e._id} className="border-b border-border last:border-0 hover:bg-surface/50">
                  <td className="px-4 py-2.5 text-primary">{e.employeeName}</td>
                  <td className="px-4 py-2.5 text-primary">
                    ₹{(e.convertedAmount ?? e.amount).toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-textSecondary">{e.category}</td>
                  <td className="px-4 py-2.5"><StatusBadge status={e.status} /></td>
                  <td className="px-4 py-2.5">
                    {e.status === "PENDING" ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setModal({ expenseId: e._id, action: "APPROVED" })}
                          className="text-xs px-2.5 py-1 rounded-lg bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setModal({ expenseId: e._id, action: "REJECTED" })}
                          className="text-xs px-2.5 py-1 rounded-lg bg-background border border-border text-textSecondary hover:bg-surface transition"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-textSecondary text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-textSecondary text-sm">
                    No expenses yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Override modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-base font-semibold text-primary mb-1">
              {modal.action === "APPROVED" ? "Approve expense" : "Reject expense"}
            </h3>
            <p className="text-sm text-textSecondary mb-4">
              This will override the current approval flow.
            </p>
            <label className="text-xs text-textSecondary">
              Comment {modal.action === "REJECTED" && <span className="text-danger">*</span>}
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="Optional note for this action..."
              className="w-full mt-1 p-2 rounded-lg bg-background border border-border text-sm focus:ring-2 focus:ring-primary outline-none resize-none"
            />
            <div className="flex gap-2 mt-4 justify-end">
              <button
                onClick={() => { setModal(null); setComment(""); }}
                className="px-4 py-2 text-sm rounded-lg border border-border text-textSecondary hover:bg-background transition"
              >
                Cancel
              </button>
              <button
                disabled={submitting || (modal.action === "REJECTED" && !comment.trim())}
                onClick={handleOverride}
                className={`px-4 py-2 text-sm rounded-lg text-white transition disabled:opacity-50
                  ${modal.action === "APPROVED" ? "bg-green-600 hover:bg-green-700" : "bg-danger hover:opacity-90"}`}
              >
                {submitting ? "Saving..." : `Confirm ${modal.action === "APPROVED" ? "approve" : "reject"}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Overview;