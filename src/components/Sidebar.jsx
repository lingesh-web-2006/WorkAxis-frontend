import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const navItems = [
  {
    section: 'Overview',
    items: [
      { path: '/dashboard', icon: '⊞', label: 'Dashboard' },
      { path: '/payroll', icon: '📄', label: 'My Payroll', roles: ['EMPLOYEE'] },
    ]
  },
  {
    section: 'Employee Management',
    items: [
      { path: '/employees', icon: '👤', label: 'Employees', roles: ['ADMIN', 'HR'] },
      { path: '/pending-payrolls', icon: '📝', label: 'Payroll Approvals', roles: ['ADMIN'] },
      { path: '/payroll', icon: '💰', label: 'Payroll', roles: ['ADMIN', 'HR'] },
      { path: '/leaves', icon: '🌴', label: 'Leaves', roles: ['ADMIN', 'HR', 'EMPLOYEE'] },
    ]
  },
  {
    section: 'Analytics',
    items: [
      { path: '/reports', icon: '📊', label: 'Reports & Analytics', roles: ['ADMIN', 'HR'] },
      { path: '/settings', icon: '⚙️', label: 'Company Settings', roles: ['ADMIN'] },
    ]
  },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Signed out successfully');
    navigate('/');
  };

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const canAccess = (roles) => {
    if (!roles) return true;
    return roles.includes(user?.role);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">
          <span style={{ fontSize: '20px' }}>💼</span>
        </div>
        <div className="logo-text">
          <span className="logo-title">PayrollPro</span>
          <span className="logo-subtitle">Management System</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((section) => (
          <div key={section.section}>
            <div className="nav-section-label">{section.section}</div>
            {section.items
              .filter(item => canAccess(item.roles))
              .map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                  <span style={{ fontSize: '16px', width: '20px', textAlign: 'center' }}>{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))
            }
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-card" onClick={handleLogout} title="Click to sign out">
          <div className="user-avatar">
            {getInitials(user?.fullName || user?.username)}
          </div>
          <div className="user-info">
            <div className="user-name">{user?.fullName || user?.username}</div>
            <div className="user-role">{user?.role} • Sign out</div>
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>→</span>
        </div>
      </div>
    </aside>
  );
}
