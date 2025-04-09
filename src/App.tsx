import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './containers/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';

// Mock Dashboard component for demo purposes
const Dashboard = () => (
  <div>
    <h1>Dashboard</h1>
    <p>You are logged in!</p>
    <button onClick={() => {
      localStorage.removeItem('authToken');
      sessionStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }}>
      Logout
    </button>
  </div>
);

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Protected routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
};

export default App;