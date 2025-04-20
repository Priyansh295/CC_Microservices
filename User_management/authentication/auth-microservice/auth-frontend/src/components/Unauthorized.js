// src/components/Unauthorized.js
import React from 'react';
import { Link } from 'react-router-dom';

const Unauthorized = () => {
  return (
    <div className="unauthorized-container">
      <h1>Unauthorized Access</h1>
      <p>You don't have permission to access this page.</p>
      <Link to="/dashboard">Go to Dashboard</Link>
    </div>
  );
};

export default Unauthorized;