// src/components/ProtectedRoute.js
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ requiredRoles = [] }) => {
  const { isAuthenticated, getUserRole, loading } = useAuth();
  
  // Show loading state while auth is being checked
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!isAuthenticated()) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" />;
  }
  
  // If specific roles are required, check if user has permission
  if (requiredRoles.length > 0) {
    const userRole = getUserRole();
    
    if (!requiredRoles.includes(userRole)) {
      // Redirect to unauthorized page if user doesn't have required role
      return <Navigate to="/unauthorized" />;
    }
  }
  
  // If authenticated and authorized, render the child routes
  return <Outlet />;
};

export default ProtectedRoute;