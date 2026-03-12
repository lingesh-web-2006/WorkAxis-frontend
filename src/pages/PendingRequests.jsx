import React, { useState, useEffect, useCallback } from 'react';
import { employeeService, leaveService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function PendingRequests() {
  const [pendingEmployees, setPendingEmployees] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin, isHR } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const [empRes, leaveRes] = await Promise.all([
        employeeService.getPending(),
        leaveService.getPending()
      ]);
      setPendingEmployees(empRes.data || []);
      setPendingLeaves(leaveRes.data || []);
    } catch (err) {
      toast.error('Failed to load pending requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin() || isHR()) {
      fetchPending();
    }
  }, [isAdmin, isHR, fetchPending]);

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

  const handleLeaveAction = async (id, status) => {
    try {
      await leaveService.process(id, { status, adminRemarks: 'Processed from dashboard' });
      toast.success(`Leave request ${status.toLowerCase()}`);
      fetchPending();
    } catch (err) {
      toast.error('Failed to process leave request');
    }
  };

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const filteredEmployees = pendingEmployees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLeaves = pendingLeaves.filter(leave => 
    leave.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    leave.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    leave.leaveType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fade-in">
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <div>
            <div className="card-title">Pending Employee Approvals</div>
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
                      {isAdmin() && (
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
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Pending Leave Requests</div>
            <div className="card-subtitle">{pendingLeaves.length} leave requests waiting for approval</div>
          </div>
        </div>

        {loading ? (
          <div className="loading-wrapper"><div className="spinner" /></div>
        ) : filteredLeaves.length === 0 ? (
          <div className="empty-state">
            <span style={{ fontSize: '40px' }}>🌴</span>
            <div className="empty-title">All caught up!</div>
            <div className="empty-text">
               {searchTerm ? 'No pending leave requests match your search.' : 'There are no pending leave requests at the moment.'}
            </div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee Profile</th>
                  <th>Leave Type</th>
                  <th>Duration</th>
                  <th>Reason</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeaves.map(leave => (
                  <tr key={leave.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar">{getInitials(leave.employeeName)}</div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px' }}>{leave.employeeName}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{leave.department}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--accent-primary-hover)' }}>{leave.leaveType}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}><b>From:</b> {leave.startDate}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}><b>To:</b> {leave.endDate}</div>
                    </td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span title={leave.reason} style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{leave.reason}</span>
                    </td>
                    <td>
                      {isAdmin() && (
                        <div className="flex gap-2">
                          <button
                            className="btn btn-success"
                            style={{ padding: '6px 16px', fontSize: '13px' }}
                            onClick={() => handleLeaveAction(leave.id, 'APPROVED')}
                          >
                            Approve
                          </button>
                          <button
                            className="btn btn-warning"
                            style={{ padding: '6px 16px', fontSize: '13px' }}
                            onClick={() => handleLeaveAction(leave.id, 'REJECTED')}
                          >
                            Reject
                          </button>
                        </div>
                      )}
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
