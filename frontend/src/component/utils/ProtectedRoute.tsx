import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

const useAuth = () => {
  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');
  
  if (!token || !userString) {
    return { isAuthenticated: false, role: null };
  }

  try {
    const user = JSON.parse(userString);
    return { isAuthenticated: true, role: user.role };
  } catch (error) {
    console.error("Failed to parse user data from localStorage", error);
    return { isAuthenticated: false, role: null };
  }
};

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Always redirect to the absolute login path
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated and at the root, redirect based on role
  if (location.pathname === '/') {
    if (role === 'admin') return <Navigate to="/admin" replace />;
    if (role === 'project_manager') return <Navigate to="/pm-dashboard" replace />;
    return <Navigate to="/employee" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;