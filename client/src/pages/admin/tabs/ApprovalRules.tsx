// pages/admin/tabs/ApprovalRules.tsx
import { useEffect, useState } from "react";
import {
  getAllRules,
  createRule,
  updateRule,
  deleteRule,
} from "../services/adminApi";
import { getAllUsers } from "../services/adminApi";

interface Approver {
  userId: string;
  userName?: string;
  order: number;
  isRequired: boolean;
}

interface Rule {
  _id: string;
  userId: string;
  userName?: string;
  managerId?: string;
  managerName?: string;
  description: string;
  isManagerApprover: boolean;
  approvers: Approver[];
  isSequential: boolean;
  minApprovalPercentage: number;
}

interface User {
  _id: string;
  name: string;
  role: string;
}

const EMPTY_RULE = {
  userId: "",
  managerId: "",
  description: "",
  isManagerApprover: false,
  approvers: [] as Approver[],
  isSequential: false,
  minApprovalPercentage: 100,
};

const ApprovalRules = () => {
  const [rules, setRules]         = useState<Rule[]>([]);
  const [users, setUsers]         = useState<User[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState<Rule | null>(null);
  const [isNew, setIsNew]         = useState(false);
  const [form, setForm]           = useState({ ...EMPTY_RULE });
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");

  const managers  = users.filter((u) => u.role === "MANAGER");
  const employees = users.filter((u) => u.role === "EMPLOYEE");
  // all users that can be approvers
  const allApproverOptions = users.filter((u) => u.role !== "EMPLOYEE");

  const load = async () => {
    setLoading(true);
    const [rRes, uRes] = await Promise.all([getAllRules(), getAllUsers()]);
    setRules(rRes.rules ?? rRes ?? []);
    setUsers(uRes.users ?? uRes ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setForm({ ...EMPTY_RULE });
    setSelected(null);
    setIsNew(true);
    setError("");
  };

  const openEdit = (r: Rule) => {
    setSelected(r);
    setIsNew(false);
    setForm({
      userId:               r.userId,
      managerId:            r.managerId ?? "",
      description:          r.description,
      isManagerApprover:    r.isManagerApprover,
      approvers:            r.approvers,
      isSequential:         r.isSequential,
      minApprovalPercentage:r.minApprovalPercentage,
    });
    setError("");
  };

  const addApprover = () => {
    const next = form.approvers.length + 1;
    setForm({
      ...form,
      approvers: [...form.approvers, { userId: "", order: next, isRequired: false }],
    });
  };

  const updateApprover = (index: number, patch: Partial<Approver>) => {
    const updated = form.approvers.map((a, i) => i === index ? { ...a, ...patch } : a);
    setForm({ ...form, approvers: updated });
  };

  const removeApprover = (index: number) => {
    const updated = form.approvers
      .filter((_, i) => i !== index)
      .map((a, i) => ({ ...a, order: i + 1 }));
    setForm({ ...form, approvers: updated });
  };

  const handleSave = async () => {
    setError("");
    if (!form.userId) { setError("Select an employee for this rule."); return; }
    if (form.approvers.some((a) => !a.userId)) {
      setError("All approver rows must have a user selected."); return;
    }
    setSaving(true);
    if (isNew) {
      await createRule(form);
    } else if (selected) {
      await updateRule(selected._id, form);
    }
    setSaving(false);
    setIsNew(false);
    setSelected(null);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this approval rule?")) return;
    await deleteRule(id);
    setSelected(null);
    setIsNew(false);
    load();
  };

  const showForm = isNew || selected !== null;

  return (
    <div>
      <h1 className="text-lg font-semibold text-primary mb-4">Approval rules</h1>

      <div className="flex gap-4">
        {/* ── Left: rule list ─────────────────────────────────────────────── */}
        <div className="w-56 shrink-0 flex flex-col gap-1">
          <button
            onClick={openNew}
            className="w-full text-left px-3 py-2 text-sm rounded-lg border border-dashed border-border text-textSecondary hover:bg-surface hover:text-primary transition mb-1"
          >
            + New rule
          </button>

          {loading ? (
            <p className="text-xs text-textSecondary px-2">Loading...</p>
          ) : rules.length === 0 ? (
            <p className="text-xs text-textSecondary px-2">No rules yet.</p>
          ) : (
            rules.map((r) => (
              <button
                key={r._id}
                onClick={() => openEdit(r)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm border transition
                  ${selected?._id === r._id
                    ? "bg-surface border-border text-primary font-medium"
                    : "border-transparent text-textSecondary hover:bg-surface hover:text-primary"}`}
              >
                <p className="font-medium truncate">{r.userName ?? "—"}</p>
                <p className="text-xs text-textSecondary truncate">{r.description || "No description"}</p>
              </button>
            ))
          )}
        </div>

        {/* ── Right: rule form ────────────────────────────────────────────── */}
        {showForm ? (
          <div className="flex-1 border border-border rounded-xl p-5 bg-surface">
            <div className="grid grid-cols-2 gap-4 mb-4">

              {/* Employee */}
              <div>
                <label className="text-xs text-textSecondary">Employee <span className="text-danger">*</span></label>
                <select
                  value={form.userId}
                  onChange={(e) => setForm({ ...form, userId: e.target.value })}
                  className="w-full mt-1 p-2 rounded-lg bg-background border border-border text-sm focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="">Select employee</option>
                  {employees.map((u) => (
                    <option key={u._id} value={u._id}>{u.name}</option>
                  ))}
                </select>
              </div>

              {/* Manager override */}
              <div>
                <label className="text-xs text-textSecondary">Manager (approval)</label>
                <select
                  value={form.managerId}
                  onChange={(e) => setForm({ ...form, managerId: e.target.value })}
                  className="w-full mt-1 p-2 rounded-lg bg-background border border-border text-sm focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="">Default (assigned manager)</option>
                  {managers.map((m) => (
                    <option key={m._id} value={m._id}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="mb-4">
              <label className="text-xs text-textSecondary">Description</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="e.g. Approval rule for travel expenses"
                className="w-full mt-1 p-2 rounded-lg bg-background border border-border text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            {/* Is manager approver */}
            <label className="flex items-start gap-2 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isManagerApprover}
                onChange={(e) => setForm({ ...form, isManagerApprover: e.target.checked })}
                className="mt-0.5 accent-primary"
              />
              <span className="text-sm text-primary">
                Is manager an approver?
                <span className="block text-xs text-textSecondary font-normal mt-0.5">
                  If checked, expense goes to the manager first before any approver in the list below.
                </span>
              </span>
            </label>

            {/* Approvers list */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-primary">Approvers</p>
                <p className="text-xs text-textSecondary">User · Required</p>
              </div>

              {form.approvers.length === 0 && (
                <p className="text-xs text-textSecondary mb-2">No approvers added yet.</p>
              )}

              <div className="space-y-2">
                {form.approvers.map((a, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-background border border-border">
                    <span className="text-xs text-textSecondary w-4 shrink-0">{i + 1}</span>
                    <select
                      value={a.userId}
                      onChange={(e) => updateApprover(i, { userId: e.target.value })}
                      className="flex-1 p-1.5 rounded-lg bg-surface border border-border text-sm focus:ring-2 focus:ring-primary outline-none"
                    >
                      <option value="">Select user</option>
                      {users.map((u) => (
                        <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                      ))}
                    </select>
                    <label className="flex items-center gap-1.5 text-xs text-textSecondary whitespace-nowrap shrink-0">
                      <input
                        type="checkbox"
                        checked={a.isRequired}
                        onChange={(e) => updateApprover(i, { isRequired: e.target.checked })}
                        className="accent-primary"
                      />
                      Required
                    </label>
                    <button
                      onClick={() => removeApprover(i)}
                      className="text-danger text-xs px-1.5 hover:bg-red-50 rounded transition shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={addApprover}
                className="mt-2 text-xs text-primary hover:underline"
              >
                + Add approver
              </button>
            </div>

            {/* Sequence + percentage */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isSequential}
                  onChange={(e) => setForm({ ...form, isSequential: e.target.checked })}
                  className="mt-0.5 accent-primary"
                />
                <span className="text-sm text-primary">
                  Sequential approval
                  <span className="block text-xs text-textSecondary font-normal mt-0.5">
                    Notify approvers one by one in order. If unchecked, all notified at once.
                  </span>
                </span>
              </label>

              <div>
                <label className="text-xs text-textSecondary">
                  Minimum approval %
                  <span className="block font-normal text-textSecondary/70">
                    % of approvers required to pass
                  </span>
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.minApprovalPercentage}
                    onChange={(e) =>
                      setForm({ ...form, minApprovalPercentage: Math.min(100, Math.max(0, Number(e.target.value))) })
                    }
                    className="w-20 p-2 rounded-lg bg-background border border-border text-sm focus:ring-2 focus:ring-primary outline-none"
                  />
                  <span className="text-sm text-textSecondary">%</span>
                </div>
              </div>
            </div>

            {error && <p className="text-xs text-danger mb-3">{error}</p>}

            {/* Form actions */}
            <div className="flex gap-2 justify-between">
              <div>
                {!isNew && selected && (
                  <button
                    onClick={() => handleDelete(selected._id)}
                    className="px-4 py-2 text-sm rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition"
                  >
                    Delete rule
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setSelected(null); setIsNew(false); }}
                  className="px-4 py-2 text-sm rounded-lg border border-border text-textSecondary hover:bg-background transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 text-sm rounded-lg bg-primary text-white hover:opacity-90 transition disabled:opacity-50"
                >
                  {saving ? "Saving..." : isNew ? "Create rule" : "Save changes"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center border border-dashed border-border rounded-xl text-textSecondary text-sm">
            Select a rule to edit or click "+ New rule"
          </div>
        )}
      </div>
    </div>
  );
};

export default ApprovalRules;