import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { authService } from "../../services/auth.service";
import { useAuthStore } from "../../store/authStore";
import { getDashboardRoute } from "../../utils/getDashboardRoute";

const Login = () => {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = await authService.login(formData.email, formData.password);

      if (!payload?.user || !payload?.token) {
        throw new Error("Invalid login response from server");
      }

      const userWithCompany = {
        ...payload.user,
        company: payload.company || payload.user.company || undefined,
      };

      login({ user: userWithCompany, token: payload.token });
      navigate(getDashboardRoute(userWithCompany.role), { replace: true });
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-textPrimary">Sign in</h1>
        <p className="mt-1 text-sm text-textSecondary">
          Access your reimbursement dashboard
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (
            <div className="rounded-md bg-danger/10 p-3 text-sm text-danger">{error}</div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-textPrimary">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-textPrimary placeholder-textMuted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="you@company.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-textPrimary">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={formData.password}
              onChange={handleChange}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-textPrimary placeholder-textMuted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;