// src/App.js
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Unauthorized from './components/Unauthorized';
import AdminPanel from './components/AdminPanel';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
            </Route>
            
            {/* Role-based Protected Routes */}
            <Route element={<ProtectedRoute requiredRoles={['admin']} />}>
              <Route path="/admin" element={<AdminPanel />} />
            </Route>
            
            {/* Default Route */}
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;