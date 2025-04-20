// src/components/Dashboard.js
import React from 'react';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="dashboard-container">
      <h1>Dashboard</h1>
      <p>Welcome, {currentUser?.email || 'User'}!</p>
      <p>You are logged in as: <strong>{currentUser?.role || 'User'}</strong></p>
      
      <div className="dashboard-actions">
        <button onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
};

export default Dashboard;