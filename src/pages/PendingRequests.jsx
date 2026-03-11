import React, { useState, useEffect, useCallback } from 'react';
import { employeeService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function PendingRequests() {
  const [pendingEmployees, setPendingEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const res = await employeeService.getPending();
      setPendingEmployees(res.data || []);
    } catch (err) {
      toast.error('Failed to load pending requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin()) {
      fetchPending();
    }
  }, [isAdmin, fetchPending]);

  const handleApprove = async (id) => {
    try {
      await employeeService.approve(id);
      toast.success('Employee approved successfully');
      fetchPending();
    } catch (err) {
      toast.error('Failed to approve employee');
    }
  };

  const handleReject = async (id) => {
    try {
      await employeeService.reject(id);
      toast.success('Employee rejected successfully');
      fetchPending();
    } catch (err) {
      toast.error('Failed to reject employee');
    }
  };

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const filteredEmployees = pendingEmployees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fade-in">
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Pending Approvals</div>
            <div className="card-subtitle">{pendingEmployees.length} requests waiting for your review</div>
          </div>
          <div className="search-wrapper">
            <svg className="search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              className="form-control search-input"
              placeholder="Search requests..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="loading-wrapper"><div className="spinner" /></div>
        ) : filteredEmployees.length === 0 ? (
          <div className="empty-state">
            <span style={{ fontSize: '40px' }}>✅</span>
            <div className="empty-title">All clear!</div>
            <div className="empty-text">
               {searchTerm ? 'No pending requests match your search.' : 'There are no pending employee requests at the moment.'}
            </div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee Profile</th>
                  <th>Department & Role</th>
                  <th>Contact Info</th>
                  <th>Compensation</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map(emp => (
                  <tr key={emp.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar">{getInitials(emp.name)}</div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px' }}>{emp.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Joined: {emp.joiningDate}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--accent-primary-hover)' }}>{emp.department}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{emp.position}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{emp.email}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{emp.phone || 'N/A'}</div>
                    </td>
                    <td>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-secondary)' }}>
                        ₹{parseFloat(emp.basicSalary).toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Basic Salary
                      </div>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          className="btn btn-success"
                          style={{ padding: '6px 16px', fontSize: '13px' }}
                          onClick={() => handleApprove(emp.id)}
                        >
                          Approve
                        </button>
                        <button
                          className="btn btn-warning"
                          style={{ padding: '6px 16px', fontSize: '13px' }}
                          onClick={() => handleReject(emp.id)}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
