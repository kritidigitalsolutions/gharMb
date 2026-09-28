import { Navigate, useLocation } from "react-router-dom";
import { isTokenExpired, clearAuthSession } from "../../api/api";

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const token = localStorage.getItem("adminToken");

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (isTokenExpired(token)) {
    clearAuthSession("Your admin session has expired. Please log in again.");
    return <Navigate to="/login?expired=1" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;