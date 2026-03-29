import { useAuthStore } from "../../store/authStore";

const Field = ({ label, value }) => (
	<div>
		<p className="text-xs uppercase tracking-wider text-textMuted">{label}</p>
		<p className="mt-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-textPrimary">
			{value || "-"}
		</p>
	</div>
);

const ManageRoles = () => {
	const user = useAuthStore((s) => s.user);
	const company = user?.company;

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold text-textPrimary">Company Settings</h1>
				<p className="mt-1 text-textSecondary">
					Read-only company settings are shown here.
				</p>
			</div>

			<section className="grid gap-4 rounded-lg border border-border bg-surface p-5 sm:grid-cols-2">
				<Field label="Company name" value={company?.name || "Not loaded yet"} />
				<Field label="Country" value={company?.country || "Not loaded yet"} />
				<Field label="Currency code" value={company?.currencyCode || "Not loaded yet"} />
				<Field label="Currency symbol" value={"Not loaded yet"} />
				<Field label="Currency full name" value={"Not loaded yet"} />
				<Field label="Signed in as" value={user?.name} />
			</section>

			<p className="text-sm text-textMuted">
				Currency is set at company creation and applies to all expense conversions across the platform.
			</p>
		</div>
	);
};

export default ManageRoles;
