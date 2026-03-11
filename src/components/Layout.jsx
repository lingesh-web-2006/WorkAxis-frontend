import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Layout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-wrapper" style={{ minHeight: '100vh' }}>
        <div className="spinner" />
        <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading PayrollPro...</span>
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
