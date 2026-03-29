// pages/Unauthorized.tsx

const Unauthorized = () => {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-background text-textPrimary">
      <h1 className="text-3xl font-bold text-danger">
        403 - Unauthorized
      </h1>

      <p className="text-textSecondary mt-2">
        You don't have permission to access this page.
      </p>
    </div>
  );
};

export default Unauthorized;