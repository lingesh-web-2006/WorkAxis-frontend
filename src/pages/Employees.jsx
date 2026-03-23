import React, { useState, useEffect, useCallback } from 'react';
import { employeeService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const DEPARTMENTS = ['Engineering', 'Marketing', 'Finance','HR','Operations','Sales', 'Design', 'Development'];

function EmployeeModal({ emp, onClose, onSave }) {
  const [form, setForm] = useState(emp ? { ...emp, joiningDate: emp.joiningDate } : {
    name: '', email: '', department: '', position: '',
    joiningDate: '', basicSalary: '', phone: '', address: '', status: 'PENDING'
  });
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.department || !form.position || !form.joiningDate || !form.basicSalary) {
      toast.error('Please fill in all required fields');
      return;
    }
    setLoading(true);
    try {
      if (emp) {
        await employeeService.update(emp.id, form);
        toast.success('Employee updated successfully');
      } else {
        await employeeService.create(form);
        toast.success('Employee added successfully');
      }
      onSave();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to save employee';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">{emp ? 'Edit Employee' : 'Add New Employee'}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {emp ? 'Update employee information' : 'Fill in the details to add a new employee'}
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input name="name" className="form-control" placeholder="John Doe" value={form.name} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input name="email" type="email" className="form-control" placeholder="john@company.com" value={form.email} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Department *</label>
                <select name="department" className="form-control" value={form.department} onChange={handleChange}>
                  <option value="">Select Department</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Position *</label>
                <input name="position" className="form-control" placeholder="Software Engineer" value={form.position} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Joining Date *</label>
                <input name="joiningDate" type="date" className="form-control" value={form.joiningDate} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Basic Salary (₹) *</label>
                <input name="basicSalary" type="number" className="form-control" placeholder="50000" value={form.basicSalary} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input name="phone" className="form-control" placeholder="+91 9876543210" value={form.phone || ''} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select name="status" className="form-control" value={form.status} onChange={handleChange} disabled={!isAdmin()}>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="ACTIVE" hidden>Active</option>
                  <option value="INACTIVE" hidden>Inactive</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Address</label>
              <input name="address" className="form-control" placeholder="123 Main St, City, State" value={form.address || ''} onChange={handleChange} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : (emp ? 'Update Employee' : 'Add Employee')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ emp, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await employeeService.delete(emp.id);
      toast.success('Employee removed');
      onConfirm();
    } catch (err) {
      toast.error('Failed to delete employee');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Remove Employee</div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>⚠️</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
              Are you sure you want to terminate <strong style={{ color: 'var(--text-primary)' }}>{emp.name}</strong>?
              This will mark them as terminated.
            </p>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger" onClick={handleDelete} disabled={loading}>
            {loading ? 'Removing...' : 'Confirm Remove'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editEmp, setEditEmp] = useState(null);
  const [deleteEmp, setDeleteEmp] = useState(null);
  const { isAdmin, isHR } = useAuth();
  const PAGE_SIZE = 10;

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await employeeService.getAll({ page, size: PAGE_SIZE, search: search || undefined });
      setEmployees(res.data.content || []);
      setTotal(res.data.totalElements || 0);
      setTotalPages(res.data.totalPages || 0);
    } catch (err) {
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchTerm);
      setPage(0);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSearch = (e) => setSearchTerm(e.target.value);

  const getStatusBadge = (status) => {
    const map = { 
      APPROVED: 'badge-success', 
      ACTIVE: 'badge-success', 
      PENDING: 'badge-pending', 
      REJECTED: 'badge-terminated',
      TERMINATED: 'badge-terminated',
      INACTIVE: 'badge-inactive'
    };
    return <span className={`badge ${map[status] || 'badge-info'}`}>{status}</span>;
  };

  const handleApprove = async (id) => {
    try {
      await employeeService.approve(id);
      toast.success('Employee approved');
      fetchEmployees();
    } catch (err) {
      toast.error('Failed to approve employee');
    }
  };

  const handleReject = async (id) => {
    try {
      await employeeService.reject(id);
      toast.success('Employee rejected');
      fetchEmployees();
    } catch (err) {
      toast.error('Failed to reject employee');
    }
  };

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Employee Directory</div>
            <div className="card-subtitle">{total} employees total</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="search-wrapper">
              <svg className="search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                className="form-control search-input"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            {isHR() && (
              <button className="btn btn-primary" onClick={() => { setEditEmp(null); setShowModal(true); }}>
                + Add Employee
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="loading-wrapper"><div className="spinner" /></div>
        ) : employees.length === 0 ? (
          <div className="empty-state">
            <span style={{ fontSize: '40px' }}>👤</span>
            <div className="empty-title">No employees found</div>
            <div className="empty-text">{search ? 'Try a different search term' : 'Add your first employee to get started'}</div>
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Position</th>
                    <th>Joining Date</th>
                    <th>Basic Salary</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map(emp => (
                    <tr key={emp.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="avatar avatar-sm">{getInitials(emp.name)}</div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{emp.name}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{emp.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{
                          background: 'var(--accent-primary-muted)',
                          color: 'var(--accent-primary-hover)',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 500
                        }}>{emp.department}</span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{emp.position}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>
                        {emp.joiningDate}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-secondary)' }}>
                        ₹{parseFloat(emp.basicSalary).toLocaleString('en-IN')}
                      </td>
                      <td>{getStatusBadge(emp.status)}</td>
                      <td>
                        <div className="flex gap-2">
                          {isHR() && (
                            <button
                              className="btn btn-secondary btn-sm btn-icon"
                              onClick={() => { setEditEmp(emp); setShowModal(true); }}
                              title="Edit"
                            >✏️</button>
                          )}
                          {isAdmin() && emp.status === 'PENDING' && (
                            <>
                              <button
                                className="btn btn-success btn-sm btn-icon"
                                onClick={() => handleApprove(emp.id)}
                                title="Approve"
                              >✅</button>
                              <button
                                className="btn btn-warning btn-sm btn-icon"
                                onClick={() => handleReject(emp.id)}
                                title="Reject"
                              >❌</button>
                            </>
                          )}
                          {isAdmin() && (
                            <button
                              className="btn btn-danger btn-sm btn-icon"
                              onClick={() => setDeleteEmp(emp)}
                              title="Delete"
                            >🗑️</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <div className="pagination-info">
                  Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
                </div>
                <div className="pagination-controls">
                  <button className="page-btn" disabled={page === 0} onClick={() => setPage(0)}>«</button>
                  <button className="page-btn" disabled={page === 0} onClick={() => setPage(p => p - 1)}>‹</button>
                  {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                    const p = Math.max(0, page - 2) + i;
                    if (p >= totalPages) return null;
                    return (
                      <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>
                        {p + 1}
                      </button>
                    );
                  })}
                  <button className="page-btn" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>›</button>
                  <button className="page-btn" disabled={page >= totalPages - 1} onClick={() => setPage(totalPages - 1)}>»</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showModal && (
        <EmployeeModal
          emp={editEmp}
          onClose={() => { setShowModal(false); setEditEmp(null); }}
          onSave={() => { setShowModal(false); setEditEmp(null); fetchEmployees(); }}
        />
      )}
      {deleteEmp && (
        <DeleteConfirmModal
          emp={deleteEmp}
          onClose={() => setDeleteEmp(null)}
          onConfirm={() => { setDeleteEmp(null); fetchEmployees(); }}
        />
      )}
    </div>
  );
}
