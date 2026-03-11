import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const pageTitles = {
  '/dashboard': { title: 'Dashboard', sub: 'Welcome back, here\'s what\'s happening' },
  '/employees': { title: 'Employee Management', sub: 'Manage your workforce' },
  '/payroll': { title: 'Payroll Management', sub: 'Process and manage payroll' },
  '/leaves': { title: 'Leave Management', sub: 'Request and track time-off' },
  '/reports': { title: 'Reports & Analytics', sub: 'Insights and data visualization' },
};

export default function Topbar() {
  const location = useLocation();
  const { user } = useAuth();
  const pageInfo = pageTitles[location.pathname] || { title: 'PayrollPro', sub: '' };

  const roleBadgeClass = {
    ADMIN: 'badge-admin',
    HR: 'badge-hr',
    EMPLOYEE: 'badge-employee'
  }[user?.role] || 'badge-employee';

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="page-title">{pageInfo.title}</div>
        <div className="page-breadcrumb">{pageInfo.sub}</div>
      </div>
      <div className="topbar-right">
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{today}</span>
        <span className={`topbar-badge ${roleBadgeClass}`}>
          <span>●</span> {user?.role}
        </span>
      </div>
    </header>
  );
}
