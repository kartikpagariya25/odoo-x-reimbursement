import { useEffect, useMemo, useState } from "react";
import { ruleService } from "../../services/rule.service";
import { userService } from "../../services/user.service";

const emptyApprover = () => ({
	id: `approver-${Date.now()}-${Math.random().toString(16).slice(2)}`,
	userId: "",
	isRequired: false,
});

const createDefaultForm = () => ({
	id: null,
	employeeId: "",
	description: "",
	managerId: "",
	isManagerApprover: false,
	isSequence: true,
	minApprovalPercentage: 100,
	approvers: [emptyApprover()],
});

const normalizeRule = (rule) => {
	const firstStep = rule?.steps?.[0] || {};
	const approvers = Array.isArray(firstStep.approvers) ? firstStep.approvers : [];

	return {
		id: rule._id || rule.id,
		employeeId:
			typeof rule.employeeId === "object"
				? rule.employeeId?._id || ""
				: rule.employeeId || "",
		description: rule.description || rule.name || "",
		managerId:
			typeof rule.managerId === "object"
				? rule.managerId?._id || ""
				: rule.managerId || "",
		isManagerApprover: Boolean(rule.isManagerApprover),
		isSequence:
			rule.isSequence !== undefined
				? Boolean(rule.isSequence)
				: firstStep.isParallel !== undefined
					? !firstStep.isParallel
					: true,
		minApprovalPercentage: Number(
			rule.minApprovalPercentage ?? firstStep.threshold ?? 100
		),
		approvers: approvers.length
			? approvers.map((approver, index) => ({
					id: `saved-${index}-${approver.userId?._id || approver.userId || "x"}`,
					userId:
						typeof approver.userId === "object"
							? approver.userId?._id || ""
							: approver.userId || "",
					isRequired: Boolean(approver.isRequired),
				}))
			: [emptyApprover()],
	};
};

const ApprovalRules = () => {
	const [rules, setRules] = useState([]);
	const [users, setUsers] = useState([]);
	const [selectedRuleId, setSelectedRuleId] = useState(null);
	const [form, setForm] = useState(createDefaultForm());
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

	const employees = useMemo(() => users.filter((user) => user.role === "EMPLOYEE"), [users]);
	const managers = useMemo(() => users.filter((user) => user.role === "MANAGER"), [users]);

	const selectedEmployee = useMemo(
		() => users.find((user) => (user._id || user.id) === form.employeeId),
		[users, form.employeeId]
	);

	const selectedRule = useMemo(
		() => rules.find((rule) => (rule._id || rule.id) === selectedRuleId),
		[rules, selectedRuleId]
	);

	const loadData = async () => {
		try {
			setLoading(true);
			setError("");

			const [rulesData, usersData] = await Promise.all([
				ruleService.getAllRules(),
				userService.getAllUsers(),
			]);

			const nextRules = Array.isArray(rulesData) ? rulesData : [];
			const nextUsers = Array.isArray(usersData) ? usersData : [];

			setRules(nextRules);
			setUsers(nextUsers);

			if (nextRules.length > 0) {
				const firstId = nextRules[0]._id || nextRules[0].id;
				setSelectedRuleId(firstId);
				setForm(normalizeRule(nextRules[0]));
			} else {
				setSelectedRuleId(null);
				setForm(createDefaultForm());
			}
		} catch (err) {
			setError(err?.response?.data?.error || err.message || "Failed to load rules");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadData();
	}, []);

	useEffect(() => {
		if (!form.employeeId || form.managerId) {
			return;
		}

		const managerId =
			typeof selectedEmployee?.managerId === "object"
				? selectedEmployee?.managerId?._id || ""
				: selectedEmployee?.managerId || "";

		if (managerId) {
			setForm((prev) => ({ ...prev, managerId }));
		}
	}, [form.employeeId, form.managerId, selectedEmployee]);

	const resetToNewRule = () => {
		setSelectedRuleId(null);
		setForm(createDefaultForm());
		setError("");
	};

	const openRule = (rule) => {
		const id = rule._id || rule.id;
		setSelectedRuleId(id);
		setForm(normalizeRule(rule));
		setError("");
	};

	const updateForm = (patch) => setForm((prev) => ({ ...prev, ...patch }));

	const updateApprover = (approverId, patch) => {
		setForm((prev) => ({
			...prev,
			approvers: prev.approvers.map((approver) =>
				approver.id === approverId ? { ...approver, ...patch } : approver
			),
		}));
	};

	const addApprover = () => {
		setForm((prev) => ({
			...prev,
			approvers: [...prev.approvers, emptyApprover()],
		}));
	};

	const removeApprover = (approverId) => {
		setForm((prev) => {
			const next = prev.approvers.filter((approver) => approver.id !== approverId);
			return {
				...prev,
				approvers: next.length ? next : [emptyApprover()],
			};
		});
	};

	const validateForm = () => {
		if (!form.employeeId) {
			return "Please select a user";
		}

		if (!form.description.trim()) {
			return "Description is required";
		}

		if (form.approvers.some((approver) => !approver.userId)) {
			return "Please select all approver users";
		}

		if (form.minApprovalPercentage < 0 || form.minApprovalPercentage > 100) {
			return "Minimum approval percentage must be between 0 and 100";
		}

		return "";
	};

	const saveRule = async () => {
		const validationError = validateForm();
		if (validationError) {
			setError(validationError);
			return;
		}

		try {
			setSaving(true);
			setError("");

			const employee = users.find((user) => (user._id || user.id) === form.employeeId);
			const payload = {
				name: `${employee?.name || "Employee"} Rule`,
				description: form.description.trim(),
				category: "Other",
				employeeId: form.employeeId,
				managerId: form.managerId || null,
				isManagerApprover: form.isManagerApprover,
				isSequence: form.isSequence,
				minApprovalPercentage: Number(form.minApprovalPercentage),
				steps: [
					{
						stepIndex: 0,
						ruleType: form.isSequence ? "sequential" : "percentage",
						threshold: Number(form.minApprovalPercentage),
						isParallel: !form.isSequence,
						approvers: form.approvers.map((approver, index) => ({
							userId: approver.userId,
							isRequired: Boolean(approver.isRequired),
							order: index + 1,
						})),
					},
				],
			};

			let saved;
			if (form.id) {
				saved = await ruleService.updateRule(form.id, payload);
			} else {
				saved = await ruleService.createRule(payload);
			}

			await loadData();
			setSelectedRuleId(saved._id || saved.id || null);
		} catch (err) {
			setError(err?.response?.data?.error || err.message || "Failed to save rule");
		} finally {
			setSaving(false);
		}
	};

	const deleteRule = async () => {
		if (!form.id) {
			resetToNewRule();
			return;
		}

		try {
			setSaving(true);
			setError("");
			await ruleService.deleteRule(form.id);
			await loadData();
		} catch (err) {
			setError(err?.response?.data?.error || err.message || "Failed to delete rule");
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<div className="text-center">
					<div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
					<p className="text-textSecondary">Loading approval rules...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-textPrimary">Approval Rules</h1>
					<p className="mt-1 text-textSecondary">
						Configure who reviews each employee's expense submissions.
					</p>
				</div>

				<button
					type="button"
					onClick={resetToNewRule}
					className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
				>
					+ New rule
				</button>
			</div>

			{error && <div className="rounded-md bg-danger/10 p-3 text-sm text-danger">{error}</div>}

			<div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
				<aside className="max-h-[70vh] overflow-auto rounded-lg border border-border bg-surface">
					{rules.length === 0 ? (
						<div className="p-4 text-sm text-textSecondary">No rules yet. Create your first rule.</div>
					) : (
						<div className="divide-y divide-border">
							{rules.map((rule) => {
								const id = rule._id || rule.id;
								const isActive = selectedRuleId === id;
								const employeeName =
									typeof rule.employeeId === "object"
										? rule.employeeId?.name || "Employee"
										: "Employee";

								return (
									<button
										key={id}
										type="button"
										onClick={() => openRule(rule)}
										className={`w-full border-l-2 px-4 py-3 text-left transition-colors ${
											isActive
												? "border-primary bg-background text-textPrimary"
												: "border-transparent text-textSecondary hover:bg-background hover:text-textPrimary"
										}`}
									>
										<p className="text-sm font-semibold">{employeeName}</p>
										<p className="mt-1 text-xs text-textMuted">
											{rule.description || rule.name || "Approval rule"}
										</p>
									</button>
								);
							})}
						</div>
					)}
				</aside>

				<section className="rounded-lg border border-border bg-surface p-4 sm:p-5">
					<div className="grid gap-6 lg:grid-cols-2">
						<div className="space-y-4">
							<h2 className="text-base font-semibold text-textPrimary">Rule details</h2>

							<div>
								<label className="block text-sm font-medium text-textPrimary">User</label>
								<select
									value={form.employeeId}
									onChange={(event) => updateForm({ employeeId: event.target.value, managerId: "" })}
									className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-textPrimary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
								>
									<option value="">Select employee</option>
									{employees.map((user) => (
										<option key={user._id || user.id} value={user._id || user.id}>
											{user.name}
										</option>
									))}
								</select>
							</div>

							<div>
								<label className="block text-sm font-medium text-textPrimary">Description</label>
								<input
									type="text"
									value={form.description}
									onChange={(event) => updateForm({ description: event.target.value })}
									className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-textPrimary placeholder-textMuted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
									placeholder="Approval rule for travel expenses above $200"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-textPrimary">Manager</label>
								<select
									value={form.managerId}
									onChange={(event) => updateForm({ managerId: event.target.value })}
									className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-textPrimary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
								>
									<option value="">Select manager</option>
									{managers.map((manager) => (
										<option key={manager._id || manager.id} value={manager._id || manager.id}>
											{manager.name}
										</option>
									))}
								</select>
							</div>
						</div>

						<div className="space-y-4">
							<h2 className="text-base font-semibold text-textPrimary">Approval behavior</h2>

							<label className="flex items-center gap-3 rounded-md border border-border bg-background px-3 py-2">
								<input
									type="checkbox"
									checked={form.isManagerApprover}
									onChange={(event) => updateForm({ isManagerApprover: event.target.checked })}
									className="h-4 w-4 accent-primary"
								/>
								<span className="text-sm text-textPrimary">Is manager an approver?</span>
							</label>

							<div className="rounded-md border border-border bg-background p-3">
								<p className="mb-2 text-sm font-medium text-textPrimary">Approvers list</p>
								<div className="space-y-2">
									{form.approvers.map((approver, index) => (
										<div key={approver.id} className="grid grid-cols-[32px_minmax(0,1fr)_auto_auto] items-center gap-2">
											<p className="text-sm font-semibold text-textMuted">{index + 1}</p>

											<select
												value={approver.userId}
												onChange={(event) =>
													updateApprover(approver.id, { userId: event.target.value })
												}
												className="rounded-md border border-border bg-surface px-2.5 py-2 text-sm text-textPrimary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
											>
												<option value="">Select approver</option>
												{users
													.filter((user) => user.role !== "EMPLOYEE")
													.map((user) => (
														<option key={user._id || user.id} value={user._id || user.id}>
															{user.name}
														</option>
													))}
											</select>

											<label className="flex items-center gap-1 text-xs text-textSecondary">
												<input
													type="checkbox"
													checked={approver.isRequired}
													onChange={(event) =>
														updateApprover(approver.id, { isRequired: event.target.checked })
													}
													className="h-4 w-4 accent-primary"
												/>
												Required
											</label>

											<button
												type="button"
												onClick={() => removeApprover(approver.id)}
												className="rounded border border-danger/30 px-2 py-1 text-xs font-semibold text-danger hover:bg-danger/10"
											>
												Remove
											</button>
										</div>
									))}
								</div>

								<button
									type="button"
									onClick={addApprover}
									className="mt-3 rounded-md border border-border px-3 py-2 text-sm font-medium text-textPrimary hover:bg-surface"
								>
									+ Add approver
								</button>
							</div>

							<label className="flex items-center gap-3 rounded-md border border-border bg-background px-3 py-2">
								<input
									type="checkbox"
									checked={form.isSequence}
									onChange={(event) => updateForm({ isSequence: event.target.checked })}
									className="h-4 w-4 accent-primary"
								/>
								<span className="text-sm text-textPrimary">Approvers sequence</span>
							</label>

							<div>
								<label className="block text-sm font-medium text-textPrimary">
									Minimum approval percentage
								</label>
								<div className="mt-1 flex items-center gap-2">
									<input
										type="number"
										min={0}
										max={100}
										value={form.minApprovalPercentage}
										onChange={(event) =>
											updateForm({ minApprovalPercentage: Number(event.target.value || 0) })
										}
										className="w-28 rounded-md border border-border bg-background px-3 py-2 text-sm text-textPrimary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
									/>
									<span className="text-sm text-textSecondary">%</span>
								</div>
							</div>
						</div>
					</div>

					<div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-border pt-4">
						<button
							type="button"
							onClick={deleteRule}
							disabled={saving}
							className="rounded-md border border-danger/30 px-4 py-2 text-sm font-medium text-danger hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-50"
						>
							Delete
						</button>
						<button
							type="button"
							onClick={saveRule}
							disabled={saving}
							className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{saving ? "Saving..." : "Save rule"}
						</button>
					</div>

					{selectedRule && (
						<p className="mt-3 text-xs text-textMuted">
							Editing rule: {selectedRule.description || selectedRule.name || "Approval rule"}
						</p>
					)}
				</section>
			</div>
		</div>
	);
};

export default ApprovalRules;
