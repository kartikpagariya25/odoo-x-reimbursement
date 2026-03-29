// pages/admin/tabs/CompanySettings.tsx
import { useAuthStore } from "../../../store/authStore";

const CompanySettings = () => {
  const { user } = useAuthStore();
const fields = [
  { label: "Company name", value: user?.company?.name ?? "—" },
  { label: "Country", value: user?.company?.country ?? "—" },
  { label: "Currency code", value: user?.company?.currencyCode ?? "—" },

  // Optional (only if backend provides these later)
  { label: "Currency symbol", value: user?.company?.name ?? "—" },
  { label: "Currency name", value: user?.company?.currencyCode ?? "—" },
];

  return (
    <div>
      <h1 className="text-lg font-semibold text-primary mb-1">Company settings</h1>
      <p className="text-sm text-textSecondary mb-6">
        These values were set at signup and cannot be changed.
      </p>

      <div className="max-w-md border border-border rounded-xl overflow-hidden">
        {fields.map((f, i) => (
          <div
            key={f.label}
            className={`flex items-center justify-between px-5 py-3 text-sm
              ${i !== fields.length - 1 ? "border-b border-border" : ""}`}
          >
            <span className="text-textSecondary">{f.label}</span>
            <span className="font-medium text-primary">{f.value}</span>
          </div>
        ))}
      </div>

      <p className="text-xs text-textSecondary mt-4">
        Currency is applied to all expense conversions across the platform.
        All manager-facing amounts are shown in this currency.
      </p>
    </div>
  );
};

export default CompanySettings;