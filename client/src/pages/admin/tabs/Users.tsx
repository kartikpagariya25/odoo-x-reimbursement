// pages/admin/tabs/Users.tsx
import { useEffect, useState } from "react";
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../services/adminApi";

interface User {
  _id: string;
  name: string;
  email: string;
  role: "EMPLOYEE" | "MANAGER";
  managerId?: string;
  managerName?: string;
}

interface NewUserForm {
  name: string;
  email: string;
  password: string;
  role: "EMPLOYEE" | "MANAGER";
  managerId: string;
}

const EMPTY_FORM: NewUserForm = {
  name: "", email: "", password: "", role: "EMPLOYEE", managerId: "",
};

const RoleBadge = ({ role }: { role: string }) => {
  const map: Record<string, string> = {
    EMPLOYEE: "bg-orange-50 text-orange-700 border border-orange-200",
    MANAGER:  "bg-teal-50 text-teal-700 border border-teal-200",
    ADMIN:    "bg-purple-50 text-purple-700 border border-purple-200",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[role] ?? ""}`}>
      {role.charAt(0) + role.slice(1).toLowerCase()}
    </span>
  );
};

const Users = () => {
  const [users, setUsers]         = useState<User[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState<NewUserForm>(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // inline edit state
  const [editId, setEditId]     = useState<string | null>(null);
  const [editRole, setEditRole] = useState<"EMPLOYEE" | "MANAGER">("EMPLOYEE");
  const [editMgr, setEditMgr]   = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const managers = users.filter((u) => u.role === "MANAGER");

  const load = async () => {
    setLoading(true);
    const res = await getAllUsers();
    setUsers(res.users ?? res ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // ── Create user ──────────────────────────────────────────────────────────
  const handleCreate = async () => {
    setFormError("");
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setFormError("Name, email and password are required.");
      return;
    }
    if (form.role === "EMPLOYEE" && !form.managerId) {
      setFormError("Please select a manager for this employee.");
      return;
    }
    setSubmitting(true);
    const payload = {
      name:      form.name,
      email:     form.email,
      password:  form.password,
      role:      form.role,
      ...(form.role === "EMPLOYEE" ? { managerId: form.managerId } : {}),
    };
    const res = await createUser(payload);
    setSubmitting(false);
    if (res.error || res.message?.toLowerCase().includes("exist")) {
      setFormError(res.message ?? "Failed to create user.");
      return;
    }
    setShowModal(false);
    setForm(EMPTY_FORM);
    load();
  };

  // ── Inline edit ──────────────────────────────────────────────────────────
  const startEdit = (u: User) => {
    setEditId(u._id);
    setEditRole(u.role);
    setEditMgr(u.managerId ?? "");
  };

  const saveEdit = async (id: string) => {
    setSavingId(id);
    await updateUser(id, {
      role:      editRole,
      managerId: editRole === "EMPLOYEE" ? editMgr : undefined,
    });
    setSavingId(null);
    setEditId(null);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this user? This cannot be undone.")) return;
    await deleteUser(id);
    load();
  };

  // ── Send password (stub — wire to your email endpoint) ───────────────────
  const handleSendPassword = async (u: User) => {
    alert(`Password email sent to ${u.email}`);
    // TODO: call your sendPassword endpoint when ready
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-primary">Users</h1>
        <button
          onClick={() => { setShowModal(true); setForm(EMPTY_FORM); setFormError(""); }}
          className="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:opacity-90 transition"
        >
          + New user
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-textSecondary">Loading...</p>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface border-b border-border">
              <tr>
                {["Name", "Role", "Manager", "Email", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs text-textSecondary font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isEditing = editId === u._id;
                return (
                  <tr key={u._id} className="border-b border-border last:border-0 hover:bg-surface/40">
                    <td className="px-4 py-2.5 text-primary font-medium">{u.name}</td>

                    {/* Role cell */}
                    <td className="px-4 py-2.5">
                      {isEditing ? (
                        <select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value as "EMPLOYEE" | "MANAGER")}
                          className="p-1 rounded-lg bg-background border border-border text-xs focus:ring-2 focus:ring-primary outline-none"
                        >
                          <option value="EMPLOYEE">Employee</option>
                          <option value="MANAGER">Manager</option>
                        </select>
                      ) : (
                        <RoleBadge role={u.role} />
                      )}
                    </td>

                    {/* Manager cell */}
                    <td className="px-4 py-2.5 text-textSecondary">
                      {isEditing && editRole === "EMPLOYEE" ? (
                        <select
                          value={editMgr}
                          onChange={(e) => setEditMgr(e.target.value)}
                          className="p-1 rounded-lg bg-background border border-border text-xs focus:ring-2 focus:ring-primary outline-none"
                        >
                          <option value="">Select manager</option>
                          {managers.map((m) => (
                            <option key={m._id} value={m._id}>{m.name}</option>
                          ))}
                        </select>
                      ) : (
                        u.managerName ?? "—"
                      )}
                    </td>

                    <td className="px-4 py-2.5 text-textSecondary">{u.email}</td>

                    {/* Actions */}
                    <td className="px-4 py-2.5">
                      <div className="flex gap-2 items-center">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => saveEdit(u._id)}
                              disabled={savingId === u._id}
                              className="text-xs px-2.5 py-1 rounded-lg bg-primary text-white hover:opacity-90 transition disabled:opacity-50"
                            >
                              {savingId === u._id ? "Saving..." : "Save"}
                            </button>
                            <button
                              onClick={() => setEditId(null)}
                              className="text-xs px-2.5 py-1 rounded-lg border border-border text-textSecondary hover:bg-surface transition"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(u)}
                              className="text-xs px-2.5 py-1 rounded-lg border border-border text-textSecondary hover:bg-surface transition"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleSendPassword(u)}
                              className="text-xs px-2.5 py-1 rounded-lg border border-border text-textSecondary hover:bg-surface transition whitespace-nowrap"
                            >
                              Send password
                            </button>
                            <button
                              onClick={() => handleDelete(u._id)}
                              className="text-xs px-2.5 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-textSecondary text-sm">
                    No users yet. Click "+ New user" to add one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-textSecondary mt-3">
        Employees without a manager assigned will not be able to submit expenses.
      </p>

      {/* ── Create user modal ──────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-primary">Create new user</h3>
              <button
                onClick={() => { setShowModal(false); setFormError(""); }}
                className="text-textSecondary hover:text-primary text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">

              {/* Name */}
              <div>
                <label className="text-xs text-textSecondary">Full name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full mt-1 p-2 rounded-lg bg-background border border-border text-sm focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              {/* Email */}
              <div>
                <label className="text-xs text-textSecondary">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="john@company.com"
                  className="w-full mt-1 p-2 rounded-lg bg-background border border-border text-sm focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              {/* Password */}
              <div>
                <label className="text-xs text-textSecondary">Initial password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Min 6 characters"
                  className="w-full mt-1 p-2 rounded-lg bg-background border border-border text-sm focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              {/* Role */}
              <div>
                <label className="text-xs text-textSecondary">Role</label>
                <select
                  value={form.role}
                  onChange={(e) =>
                    setForm({ ...form, role: e.target.value as "EMPLOYEE" | "MANAGER", managerId: "" })
                  }
                  className="w-full mt-1 p-2 rounded-lg bg-background border border-border text-sm focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="MANAGER">Manager</option>
                </select>
              </div>

              {/* Manager selector — only for employees */}
              {form.role === "EMPLOYEE" && (
                <div>
                  <label className="text-xs text-textSecondary">
                    Assign manager <span className="text-danger">*</span>
                  </label>
                  {managers.length === 0 ? (
                    <p className="mt-1 text-xs text-danger">
                      No managers exist yet. Create a manager first.
                    </p>
                  ) : (
                    <select
                      value={form.managerId}
                      onChange={(e) => setForm({ ...form, managerId: e.target.value })}
                      className="w-full mt-1 p-2 rounded-lg bg-background border border-border text-sm focus:ring-2 focus:ring-primary outline-none"
                    >
                      <option value="">Select a manager</option>
                      {managers.map((m) => (
                        <option key={m._id} value={m._id}>
                          {m.name} ({m.email})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Error */}
              {formError && (
                <p className="text-xs text-danger text-center">{formError}</p>
              )}
            </div>

            <div className="flex gap-2 mt-5 justify-end">
              <button
                onClick={() => { setShowModal(false); setFormError(""); }}
                className="px-4 py-2 text-sm rounded-lg border border-border text-textSecondary hover:bg-background transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={submitting}
                className="px-4 py-2 text-sm rounded-lg bg-primary text-white hover:opacity-90 transition disabled:opacity-50"
              >
                {submitting ? "Creating..." : "Create user"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;