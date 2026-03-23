import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Payroll from './pages/Payroll';
import Reports from './pages/Reports';
import Leaves from './pages/Leaves';
import CompanyProfile from './pages/CompanyProfile';
import PendingPayrolls from './pages/PendingPayrolls';
import { useAuth } from './context/AuthContext';
import './index.css';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-wrapper"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          {/* Protected Routes wrapped in Layout */}
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/employees" element={<ProtectedRoute roles={['ADMIN', 'HR']}><Employees /></ProtectedRoute>} />
            <Route path="/payroll" element={<Payroll />} />
            <Route path="/leaves" element={<Leaves />} />
            <Route path="/reports" element={<ProtectedRoute roles={['ADMIN', 'HR']}><Reports /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute roles={['ADMIN']}><CompanyProfile /></ProtectedRoute>} />
            <Route path="/pending-payrolls" element={<ProtectedRoute roles={['ADMIN']}><PendingPayrolls /></ProtectedRoute>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-hover)',
            fontFamily: 'var(--font-main)',
            fontSize: '13.5px',
            borderRadius: '10px',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: 'white' }
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: 'white' }
          }
        }}
      />
    </AuthProvider>
  );
}
