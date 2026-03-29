import { NavLink } from "react-router-dom";

type MenuItem = {
  label: string;
  path: string;
};

export const Sidebar = ({ items }: { items: MenuItem[] }) => {
  return (
    <aside className="w-64 min-h-screen bg-surface border-r border-border px-4 py-5">
      <h2 className="mb-6 text-lg font-semibold tracking-tight text-textPrimary">
        Fuolo
      </h2>

      <nav className="flex flex-col gap-1.5">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `rounded-md border px-3 py-2 text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? "border-border bg-secondary text-primary"
                  : "border-transparent text-textSecondary hover:bg-secondary hover:text-textPrimary"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};