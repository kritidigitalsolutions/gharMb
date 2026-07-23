import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
    // Make sure spelling matches what you set during login
    const token = localStorage.getItem("adminTocken"); 

    if(!token) {
        return <Navigate to="/login" replace />;
    }
    
    return children;
}

export default ProtectedRoute;