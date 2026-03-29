// pages/admin/tabs/AllExpenses.tsx
import { useEffect, useState } from "react";
import { getAllExpenses, overrideExpense } from "../services/adminApi";

interface Expense {
  _id: string;
  employeeName: string;
  amount: number;
  currencyCode: string;
  convertedAmount: number;
  category: string;
  description: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  currentStep?: number;
  totalSteps?: number;
  createdAt: string;
  rejectionComment?: string;
}

interface Filters {
  status: string;
  category: string;
  search: string;
  from: string;
  to: string;
}

interface OverrideModal {
  expense: Expense;
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

const CATEGORIES = ["ALL", "Travel", "Food", "Hotel", "Office", "Entertainment", "Other"];
const STATUSES   = ["ALL", "PENDING", "APPROVED", "REJECTED"];

const AllExpenses = () => {
  const [expenses, setExpenses]     = useState<Expense[]>([]);
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState<OverrideModal | null>(null);
  const [comment, setComment]       = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [detail, setDetail]         = useState<Expense | null>(null);

  const [filters, setFilters] = useState<Filters>({
    status: "ALL", category: "ALL", search: "", from: "", to: "",
  });

  const load = async () => {
    setLoading(true);
    const res = await getAllExpenses({
      status:   filters.status   !== "ALL" ? filters.status   : undefined,
      category: filters.category !== "ALL" ? filters.category : undefined,
      from:     filters.from     || undefined,
      to:       filters.to       || undefined,
      search:   filters.search   || undefined,
    });
    setExpenses(res.expenses ?? res ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filters]);

  const handleOverride = async () => {
    if (!modal) return;
    setSubmitting(true);
    await overrideExpense(modal.expense._id, { action: modal.action, comment });
    setModal(null);
    setComment("");
    setSubmitting(false);
    load();
  };

  return (
    <div>
      <h1 className="text-lg font-semibold text-primary mb-4">All expenses</h1>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          placeholder="Search employee or description..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="flex-1 min-w-[200px] p-2 rounded-lg bg-surface border border-border text-sm focus:ring-2 focus:ring-primary outline-none"
        />
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="p-2 rounded-lg bg-surface border border-border text-sm focus:ring-2 focus:ring-primary outline-none"
        >
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select
          value={filters.category}
          onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          className="p-2 rounded-lg bg-surface border border-border text-sm focus:ring-2 focus:ring-primary outline-none"
        >
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <input
          type="date"
          value={filters.from}
          onChange={(e) => setFilters({ ...filters, from: e.target.value })}
          className="p-2 rounded-lg bg-surface border border-border text-sm focus:ring-2 focus:ring-primary outline-none"
        />
        <input
          type="date"
          value={filters.to}
          onChange={(e) => setFilters({ ...filters, to: e.target.value })}
          className="p-2 rounded-lg bg-surface border border-border text-sm focus:ring-2 focus:ring-primary outline-none"
        />
        <button
          onClick={() => setFilters({ status: "ALL", category: "ALL", search: "", from: "", to: "" })}
          className="px-3 py-2 rounded-lg border border-border text-sm text-textSecondary hover:bg-surface transition"
        >
          Clear
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-textSecondary">Loading...</p>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface border-b border-border">
              <tr>
                {["Date", "Employee", "Category", "Description", "Submitted", "Converted", "Status", "Step", "Actions"].map((h) => (
                  <th key={h} className="text-left px-3 py-2.5 text-xs text-textSecondary font-medium whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr
                  key={e._id}
                  className="border-b border-border last:border-0 hover:bg-surface/50 cursor-pointer"
                  onClick={() => setDetail(e)}
                >
                  <td className="px-3 py-2.5 text-textSecondary whitespace-nowrap">
                    {new Date(e.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2.5 text-primary">{e.employeeName}</td>
                  <td className="px-3 py-2.5 text-textSecondary">{e.category}</td>
                  <td className="px-3 py-2.5 text-textSecondary max-w-[140px] truncate">{e.description}</td>
                  <td className="px-3 py-2.5 text-textSecondary whitespace-nowrap">
                    {e.amount.toLocaleString()} {e.currencyCode}
                  </td>
                  <td className="px-3 py-2.5 text-primary whitespace-nowrap">
                    ₹{(e.convertedAmount ?? e.amount).toLocaleString()}
                  </td>
                  <td className="px-3 py-2.5"><StatusBadge status={e.status} /></td>
                  <td className="px-3 py-2.5 text-textSecondary text-xs">
                    {e.status === "PENDING" && e.totalSteps
                      ? `${e.currentStep ?? 1} / ${e.totalSteps}`
                      : "—"}
                  </td>
                  <td className="px-3 py-2.5" onClick={(ev) => ev.stopPropagation()}>
                    {e.status === "PENDING" ? (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setModal({ expense: e, action: "APPROVED" })}
                          className="text-xs px-2 py-1 rounded-lg bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition whitespace-nowrap"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setModal({ expense: e, action: "REJECTED" })}
                          className="text-xs px-2 py-1 rounded-lg border border-border text-textSecondary hover:bg-surface transition whitespace-nowrap"
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
              {expenses.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-textSecondary text-sm">
                    No expenses found
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
            <p className="text-sm text-textSecondary mb-1">
              {modal.expense.employeeName} · ₹{(modal.expense.convertedAmount ?? modal.expense.amount).toLocaleString()}
            </p>
            <p className="text-xs text-textSecondary mb-4">
              This overrides the current approval flow.
            </p>
            <label className="text-xs text-textSecondary">
              Comment {modal.action === "REJECTED" && <span className="text-danger">*</span>}
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="Add a note..."
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
                {submitting ? "Saving..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail slide-over */}
      {detail && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-end z-50">
          <div className="bg-surface border-l border-border w-full sm:w-[420px] h-full overflow-y-auto p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-primary">Expense detail</h3>
              <button onClick={() => setDetail(null)} className="text-textSecondary hover:text-primary text-xl leading-none">×</button>
            </div>
            <dl className="space-y-3 text-sm">
              {[
                ["Employee",    detail.employeeName],
                ["Category",    detail.category],
                ["Date",        new Date(detail.createdAt).toLocaleDateString()],
                ["Description", detail.description],
                ["Submitted",   `${detail.amount.toLocaleString()} ${detail.currencyCode}`],
                ["Converted",   `₹${(detail.convertedAmount ?? detail.amount).toLocaleString()}`],
                ["Status",      detail.status],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-border pb-2">
                  <dt className="text-textSecondary">{k}</dt>
                  <dd className="text-primary font-medium">{v}</dd>
                </div>
              ))}
              {detail.rejectionComment && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
                  Rejection note: {detail.rejectionComment}
                </div>
              )}
            </dl>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllExpenses;