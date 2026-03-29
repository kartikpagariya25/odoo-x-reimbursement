export const getDashboardRoute = (role?: string) => {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "MANAGER":
      return "/manager";
    case "EMPLOYEE":
      return "/employee";
    default:
      return "/login";
  }
};