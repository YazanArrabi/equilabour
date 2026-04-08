import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function RegisterPage() {
  const { user } = useAuth();
  if (user !== null) return <Navigate to="/jobs" replace />;
  return <div>Register Page</div>;
}
