// store/authStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

type Role = "ADMIN" | "MANAGER" | "EMPLOYEE";

type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  company?: {
    id?: string;
    name?: string;
    country?: string;
    currencyCode?: string;
  };
};

type AuthState = {
  user: User | null;
  token: string | null;

  isAuthenticated: boolean;

  login: (data: { user: User; token: string }) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: ({ user, token }) =>
        set({
          user,
          token,
          isAuthenticated: true,
        }),

      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: "auth-storage",
    }
  )
);