import { useEffect, useMemo, useState } from "react";
import { userService } from "../../services/user.service";

const ROLE_OPTIONS = [
	{ label: "Employee", value: "EMPLOYEE" },
	{ label: "Manager", value: "MANAGER" },
];

const createDraftRow = () => ({
	_draftId: `draft-${Date.now()}-${Math.random().toString(16).slice(2)}`,
	_isNew: true,
	_saving: false,
	_deleting: false,
	_sending: false,
	_sent: false,
	id: null,
	name: "",
	email: "",
	role: "EMPLOYEE",
	managerId: null,
});

const normalizeUser = (user) => ({
	_isNew: false,
	_saving: false,
	_deleting: false,
	_sending: false,
	_sent: false,
	id: user.id || user._id,
	name: user.name || "",
	email: user.email || "",
	role: user.role || "EMPLOYEE",
	managerId:
		typeof user.managerId === "object"
			? user.managerId?._id || user.managerId?.id || null
			: user.managerId || null,
});

const ManageUsers = () => {
	const [rows, setRows] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	const managers = useMemo(
		() => rows.filter((row) => row.role === "MANAGER" && row.id),
		[rows]
	);

	const loadUsers = async () => {
		try {
			setLoading(true);
			setError("");
			const data = await userService.getAllUsers();
			const normalized = Array.isArray(data) ? data.map(normalizeUser) : [];
			setRows(normalized);
		} catch (err) {
			setError(err?.response?.data?.error || err.message || "Failed to load users");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadUsers();
	}, []);

	const getRowKey = (row) => row.id || row._draftId;

	const patchRow = (rowKey, patch) => {
		setRows((prev) =>
			prev.map((row) => (getRowKey(row) === rowKey ? { ...row, ...patch } : row))
		);
	};

	const handleFieldChange = (rowKey, field, value) => {
		patchRow(rowKey, { [field]: value });
	};

	const handleAddRow = () => {
		setRows((prev) => [createDraftRow(), ...prev]);
	};

	const validateRow = (row) => {
		if (!row.name.trim()) {
			return "User name is required";
		}

		if (!row.email.trim()) {
			return "Email is required";
		}

		if (row.role === "EMPLOYEE" && !row.managerId) {
			return "Manager is required for employee rows";
		}

		return "";
	};

	const handleSave = async (row) => {
		const rowKey = getRowKey(row);
		const validationError = validateRow(row);

		if (validationError) {
			setError(validationError);
			return;
		}

		try {
			setError("");
			patchRow(rowKey, { _saving: true });

			const payload = {
				name: row.name.trim(),
				email: row.email.trim().toLowerCase(),
				role: row.role,
				managerId: row.role === "EMPLOYEE" ? row.managerId : null,
			};

			let savedUser;
			if (row.id) {
				savedUser = await userService.updateUser(row.id, payload);
			} else {
				savedUser = await userService.createUser(payload);
			}

			const next = normalizeUser(savedUser);
			setRows((prev) =>
				prev.map((r) => (getRowKey(r) === rowKey ? { ...next, _sent: r._sent } : r))
			);
		} catch (err) {
			setError(err?.response?.data?.error || err.message || "Failed to save user");
			patchRow(rowKey, { _saving: false });
			return;
		}
	};

	const handleDelete = async (row) => {
		const rowKey = getRowKey(row);

		if (!row.id) {
			setRows((prev) => prev.filter((r) => getRowKey(r) !== rowKey));
			return;
		}

		try {
			patchRow(rowKey, { _deleting: true });
			await userService.deleteUser(row.id);
			setRows((prev) => prev.filter((r) => getRowKey(r) !== rowKey));
		} catch (err) {
			setError(err?.response?.data?.error || err.message || "Failed to delete user");
			patchRow(rowKey, { _deleting: false });
		}
	};

	const handleSendPassword = async (row) => {
		const rowKey = getRowKey(row);
		if (!row.id) {
			setError("Save the row before sending a password");
			return;
		}

		try {
			patchRow(rowKey, { _sending: true, _sent: false });
			await userService.sendPassword(row.id);
			patchRow(rowKey, { _sending: false, _sent: true });
			window.setTimeout(() => {
				patchRow(rowKey, { _sent: false });
			}, 3000);
		} catch (err) {
			setError(
				err?.response?.data?.error || err.message || "Failed to send temporary password"
			);
			patchRow(rowKey, { _sending: false, _sent: false });
		}
	};

	if (loading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<div className="text-center">
					<div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
					<p className="text-textSecondary">Loading users...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-textPrimary">Users</h1>
					<p className="mt-1 text-textSecondary">
						Manage employees and managers for your company.
					</p>
				</div>

				<button
					type="button"
					onClick={handleAddRow}
					className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
				>
					New
				</button>
			</div>

			{error && <div className="rounded-md bg-danger/10 p-3 text-sm text-danger">{error}</div>}

			<div className="overflow-hidden rounded-lg border border-border bg-surface">
				<table className="w-full">
					<thead className="bg-background">
						<tr className="border-b border-border">
							<th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-textSecondary">
								User
							</th>
							<th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-textSecondary">
								Role
							</th>
							<th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-textSecondary">
								Manager
							</th>
							<th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-textSecondary">
								Email
							</th>
							<th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-textSecondary">
								Actions
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-border">
						{rows.map((row) => {
							const rowKey = getRowKey(row);
							const canPickManager = row.role === "EMPLOYEE";

							return (
								<tr key={rowKey} className="align-top hover:bg-background/40">
									<td className="px-4 py-3">
										<input
											type="text"
											value={row.name}
											onChange={(event) =>
												handleFieldChange(rowKey, "name", event.target.value)
											}
											className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-textPrimary placeholder-textMuted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
											placeholder="Full name"
										/>
									</td>
									<td className="px-4 py-3">
										<select
											value={row.role}
											onChange={(event) => {
												const nextRole = event.target.value;
												handleFieldChange(rowKey, "role", nextRole);
												if (nextRole !== "EMPLOYEE") {
													handleFieldChange(rowKey, "managerId", null);
												}
											}}
											className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-textPrimary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
										>
											{ROLE_OPTIONS.map((role) => (
												<option key={role.value} value={role.value}>
													{role.label}
												</option>
											))}
										</select>
									</td>
									<td className="px-4 py-3">
										{canPickManager ? (
											<select
												value={row.managerId || ""}
												onChange={(event) =>
													handleFieldChange(rowKey, "managerId", event.target.value || null)
												}
												className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-textPrimary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
											>
												<option value="">Select manager</option>
												{managers
													.filter((manager) => manager.id !== row.id)
													.map((manager) => (
														<option key={manager.id} value={manager.id}>
															{manager.name}
														</option>
													))}
											</select>
										) : (
											<p className="px-1 py-2 text-sm text-textMuted">-</p>
										)}
									</td>
									<td className="px-4 py-3">
										<input
											type="email"
											value={row.email}
											onChange={(event) =>
												handleFieldChange(rowKey, "email", event.target.value)
											}
											className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-textPrimary placeholder-textMuted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
											placeholder="name@company.com"
										/>
									</td>
									<td className="px-4 py-3">
										<div className="flex justify-end gap-2">
											<button
												type="button"
												onClick={() => handleSendPassword(row)}
												disabled={row._sending || row._saving || !row.id}
												className="rounded-md border border-border px-3 py-2 text-xs font-medium text-textPrimary transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
											>
												{row._sending
													? "Sending..."
													: row._sent
														? "Sent ✓"
														: "Send password"}
											</button>

											<button
												type="button"
												onClick={() => handleSave(row)}
												disabled={row._saving || row._deleting}
												className="rounded-md bg-primary px-3 py-2 text-xs font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
											>
												{row._saving ? "Saving..." : "Save"}
											</button>

											<button
												type="button"
												onClick={() => handleDelete(row)}
												disabled={row._deleting || row._saving}
												className="rounded-md border border-danger/30 px-2.5 py-2 text-xs font-semibold text-danger hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-50"
												aria-label={`Delete ${row.name || "user"}`}
											>
												{row._deleting ? "..." : "✕"}
											</button>
										</div>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>

			<p className="text-sm text-textMuted">
				Employees without a manager assigned will not be able to submit expenses.
			</p>
		</div>
	);
};

export default ManageUsers;
