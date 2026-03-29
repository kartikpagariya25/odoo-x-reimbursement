import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { expenseService } from "../../services/expense.service";

const CATEGORIES = [
  "Travel",
  "Food & Dining",
  "Office Supplies",
  "Software & Subscriptions",
  "Equipment",
  "Training & Education",
  "Entertainment",
  "Other",
];

const SubmitExpense = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: CATEGORIES[0],
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [receipt, setReceipt] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setReceipt(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const submitData = new FormData();
      submitData.append("description", formData.description);
      submitData.append("amount", formData.amount);
      submitData.append("category", formData.category);
      submitData.append("date", formData.date);
      submitData.append("notes", formData.notes);
      if (receipt) {
        submitData.append("receipt", receipt);
      }

      await expenseService.createExpense(submitData);
      navigate("/employee/expenses");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit expense");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-textPrimary">Submit New Expense</h1>
        <p className="mt-1 text-textSecondary">
          Fill in the details below to submit a new expense claim
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-border bg-surface p-6">
        {error && (
          <div className="rounded-md bg-danger/10 p-4 text-sm text-danger">
            {error}
          </div>
        )}

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-textPrimary">
            Description <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            id="description"
            name="description"
            required
            value={formData.description}
            onChange={handleChange}
            placeholder="e.g., Client lunch meeting"
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-textPrimary placeholder-textMuted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Amount and Category */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-textPrimary">
              Amount <span className="text-danger">*</span>
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              required
              min="0"
              step="0.01"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0.00"
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-textPrimary placeholder-textMuted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-textPrimary">
              Category <span className="text-danger">*</span>
            </label>
            <select
              id="category"
              name="category"
              required
              value={formData.category}
              onChange={handleChange}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-textPrimary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date */}
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-textPrimary">
            Expense Date <span className="text-danger">*</span>
          </label>
          <input
            type="date"
            id="date"
            name="date"
            required
            value={formData.date}
            onChange={handleChange}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-textPrimary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-textPrimary">
            Additional Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            value={formData.notes}
            onChange={handleChange}
            placeholder="Any additional information..."
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-textPrimary placeholder-textMuted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Receipt Upload */}
        <div>
          <label className="block text-sm font-medium text-textPrimary">
            Receipt (Optional)
          </label>
          <div className="mt-2 flex items-center gap-4">
            <label className="flex cursor-pointer items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-textSecondary hover:border-primary hover:text-primary">
              <span>Choose File</span>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            {receipt && (
              <span className="text-sm text-textSecondary">{receipt.name}</span>
            )}
          </div>
          {previewUrl && receipt?.type?.startsWith("image/") && (
            <div className="mt-3">
              <img
                src={previewUrl}
                alt="Receipt preview"
                className="h-48 w-full rounded-md border border-border object-cover"
              />
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate("/employee")}
            className="flex-1 rounded-md border border-border bg-background px-4 py-2.5 text-sm font-medium text-textSecondary hover:bg-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Expense"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SubmitExpense;
