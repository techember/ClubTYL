import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="admin-card w-full max-w-md p-8 text-center">

        <h1 className="text-6xl font-bold text-primary mb-4">404</h1>

        <p className="text-lg sm:text-xl text-muted-foreground mb-6">
          Oops! The page you’re looking for doesn’t exist.
        </p>

        <a
          href="/"
          className="btn-primary inline-block px-6 py-3 rounded-lg text-white"
        >
          Return to Dashboard
        </a>

        <p className="text-sm text-muted-foreground mt-4">
          Requested URL: <span className="font-medium break-all">{location.pathname}</span>
        </p>
      </div>
    </div>
  );
};

export default NotFound;
