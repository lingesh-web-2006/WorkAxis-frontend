import React, { useState, useEffect, useCallback } from 'react';
import { leaveService, employeeService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const LEAVE_TYPES = ['PERSONAL', 'SICK', 'UNPAID', 'MATERNITY', 'PATERNITY'];

function LeaveRequestModal({ onClose, onSave }) {
  const { user, isHR, isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({
    employeeId: user.id,
    startDate: '',
    endDate: '',
    leaveType: 'PERSONAL',
    reason: ''
  });

  useEffect(() => {
    if (isHR() || isAdmin()) {
      employeeService.getAll({ size: 1000 }).then(res => {
        setEmployees(res.data.content || []);
      }).catch(() => toast.error('Failed to load employee list'));
    }
  }, [isHR, isAdmin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.startDate || !form.endDate || !form.reason || !form.employeeId) {
        toast.error('Please fill all fields');
        return;
    }
    setLoading(true);
    try {
      await leaveService.request(form);
      toast.success('Leave request added successfully');
      onSave();
    } catch (err) {
      toast.error('Failed to add leave request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Add Leave Request</div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {(isHR() || isAdmin()) && (
              <div className="form-group">
                <label className="form-label">Employee</label>
                <select 
                  className="form-control" 
                  value={form.employeeId} 
                  onChange={e => setForm({...form, employeeId: e.target.value})}
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.position})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Leave Type</label>
              <select className="form-control" value={form.leaveType} onChange={e => setForm({...form, leaveType: e.target.value})}>
                {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Start Date</label>
                <input type="date" className="form-control" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">End Date</label>
                <input type="date" className="form-control" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Reason</label>
              <textarea className="form-control" rows="3" placeholder="Explain the reason..." value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Processing...' : 'Add Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LeaveActionModal({ leave, onClose }) {
    const [remarks, setRemarks] = useState(leave.adminRemarks || '');

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal modal-md" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-title">Leave Request Details</div>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>
                <div className="modal-body">
                    <div className="flex justify-between items-start" style={{ marginBottom: '16px' }}>
                        <div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Employee</div>
                            <div style={{ fontWeight: 600, fontSize: '16px' }}>{leave.employeeName}</div>
                            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{leave.department}</div>
                        </div>
                        <div className="text-right">
                             <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Type</div>
                             <div style={{ fontWeight: 600, color: 'var(--primary)' }}>{leave.leaveType}</div>
                        </div>
                    </div>
                    
                    <div className="form-grid" style={{ marginBottom: '16px', background: 'var(--bg-input)', padding: '12px', borderRadius: '8px' }}>
                        <div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Start Date</div>
                            <div style={{ fontWeight: 500 }}>{leave.startDate}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>End Date</div>
                            <div style={{ fontWeight: 500 }}>{leave.endDate}</div>
                        </div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Reason for leave</div>
                        <div style={{ fontSize: '13px', padding: '10px 0', lineHeight: 1.5 }}>{leave.reason}</div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Admin Remarks</label>
                        <textarea 
                            className="form-control" 
                            rows="2" 
                            placeholder="Add memo/reason for approval/rejection..." 
                            value={remarks} 
                            onChange={e => setRemarks(e.target.value)}
                            disabled={leave.status !== 'PENDING'}
                        />
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
}

export default function Leaves() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRequest, setShowRequest] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const { user, isHR, isAdmin, isEmployee } = useAuth();

  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (isAdmin() || isHR()) {
        res = await leaveService.getAll();
      } else {
        res = await leaveService.getByEmployee(user.id);
      }
      setLeaves(res.data || []);
    } catch (err) {
      toast.error('Failed to load leaves');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, isHR, user.id]);

  useEffect(() => { fetchLeaves(); }, [fetchLeaves]);

  const getStatusBadge = (status) => {
    const map = { PENDING: 'badge-pending', APPROVED: 'badge-success', REJECTED: 'badge-terminated', CANCELLED: 'badge-inactive' };
    return <span className={`badge ${map[status]}`}>{status}</span>;
  };

  return (
    <div className="fade-in">
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Leave Applications</div>
            <div className="card-subtitle">
                {isAdmin() ? 'View and manage all employee leaves' : 'Track your time-off requests'}
            </div>
          </div>
          {(isHR() || isAdmin() || isEmployee()) && (
            <button className="btn btn-primary" onClick={() => setShowRequest(true)}>
              + Request Leave
            </button>
          )}
        </div>

        {loading ? (
          <div className="loading-wrapper"><div className="spinner" /></div>
        ) : leaves.length === 0 ? (
          <div className="empty-state">
            <span style={{ fontSize: '40px' }}>🌴</span>
            <div className="empty-title">No applications found</div>
            <div className="empty-text">No one is currently away!</div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  {(!isAdmin() && !isHR()) ? null : <th>Employee</th>}
                  <th>Type</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Reason</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map(l => (
                  <tr key={l.id}>
                    {(isAdmin() || isHR()) && (
                        <td>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{l.employeeName}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{l.department}</div>
                        </td>
                    )}
                    <td>
                        <span style={{ fontSize: '12px', fontWeight: 600 }}>{l.leaveType}</span>
                    </td>
                    <td>
                      <div style={{ fontSize: '13px', fontWeight: 500 }}>{l.startDate}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>to {l.endDate}</div>
                    </td>
                    <td>{getStatusBadge(l.status)}</td>
                    <td style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '12px' }}>
                        {l.reason}
                    </td>
                    <td className="text-right">
                        <div className="flex gap-2 justify-end">
                             <button 
                                className="btn btn-secondary btn-sm" 
                                onClick={() => setSelectedLeave(l)}
                             >
                                Details
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

      {showRequest && <LeaveRequestModal onClose={() => setShowRequest(false)} onSave={() => { setShowRequest(false); fetchLeaves(); }} />}
      {selectedLeave && <LeaveActionModal leave={selectedLeave} onClose={() => setSelectedLeave(null)} />}
    </div>
  );
}
