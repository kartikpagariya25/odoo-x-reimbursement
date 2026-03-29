import { useEffect } from "react";
import { AppRouter } from "./routes/AppRouter";
import { useThemeStore } from "./store/themeStore";

function App() {
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <div className="bg-background text-textPrimary min-h-screen">
      <AppRouter />
    </div>
  );
}

export default App;