import React, { useState, useEffect, useCallback } from 'react';
import { payrollService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatCurrency(val) {
  if (!val && val !== 0) return '₹0';
  return '₹' + parseFloat(val).toLocaleString('en-IN', { minimumFractionDigits: 2 });
}

export default function PendingPayrolls() {
  const [pendingPayrolls, setPendingPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { isAdmin } = useAuth();

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const res = await payrollService.getPending();
      setPendingPayrolls(res.data || []);
    } catch (err) {
      toast.error('Failed to load pending payrolls');
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
      await payrollService.updateStatus(id, 'APPROVED');
      toast.success('Payroll approved successfully');
      fetchPending();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve payroll');
    }
  };

  const handleReject = async (id) => {
    try {
      await payrollService.updateStatus(id, 'PROCESSED');
      toast.success('Payroll sent back for review');
      fetchPending();
    } catch (err) {
      toast.error('Failed to reject payroll');
    }
  };

  const handleApproveAll = async () => {
    if (!window.confirm(`Approve all ${filteredPayrolls.length} pending payrolls?`)) return;
    try {
      await Promise.all(filteredPayrolls.map(p => payrollService.updateStatus(p.id, 'APPROVED')));
      toast.success(`All ${filteredPayrolls.length} payrolls approved!`);
      fetchPending();
    } catch (err) {
      toast.error('Some approvals failed');
      fetchPending();
    }
  };

  const filteredPayrolls = pendingPayrolls.filter(p =>
    p.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPendingAmount = filteredPayrolls.reduce((sum, p) => sum + parseFloat(p.netSalary || 0), 0);

  return (
    <div className="fade-in">
      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #f59e0b22, #f59e0b44)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px'
            }}>⏳</div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>{pendingPayrolls.length}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Pending Payrolls</div>
            </div>
          </div>
        </div>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f122, #6366f144)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px'
            }}>💰</div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-primary-hover)', fontFamily: 'var(--font-mono)' }}>
                {formatCurrency(totalPendingAmount)}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Total Pending Amount</div>
            </div>
          </div>
        </div>
        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {pendingPayrolls.length > 0 ? (
            <button className="btn btn-primary" style={{ width: '100%', padding: '12px' }} onClick={handleApproveAll}>
              ✓ Approve All ({filteredPayrolls.length})
            </button>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '28px' }}>✅</span>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>All clear!</div>
            </div>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Pending Payroll Approvals</div>
            <div className="card-subtitle">Review and approve payrolls generated by HR</div>
          </div>
          <div className="search-wrapper">
            <svg className="search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              className="form-control search-input"
              placeholder="Search by employee or department..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="loading-wrapper"><div className="spinner" /></div>
        ) : filteredPayrolls.length === 0 ? (
          <div className="empty-state">
            <span style={{ fontSize: '40px' }}>✅</span>
            <div className="empty-title">No pending payrolls</div>
            <div className="empty-text">
              {searchTerm ? 'No payrolls match your search.' : 'All payroll records have been reviewed.'}
            </div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Period</th>
                  <th>Basic Salary</th>
                  <th>Allowances</th>
                  <th>Deductions</th>
                  <th>Net Salary</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayrolls.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.employeeName}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {p.department} · {p.position}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--accent-primary-hover)' }}>
                        {MONTHS[p.payMonth - 1]} {p.payYear}
                      </div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                      {formatCurrency(p.basicSalary)}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--accent-secondary)' }}>
                      +{formatCurrency(p.totalAllowances)}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--accent-danger)' }}>
                      -{formatCurrency(p.totalDeductions)}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--accent-primary-hover)', fontSize: '14px' }}>
                      {formatCurrency(p.netSalary)}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          className="btn btn-success"
                          style={{ padding: '6px 16px', fontSize: '13px' }}
                          onClick={() => handleApprove(p.id)}
                        >
                          ✓ Approve
                        </button>
                        <button
                          className="btn btn-warning"
                          style={{ padding: '6px 16px', fontSize: '13px' }}
                          onClick={() => handleReject(p.id)}
                        >
                          ↩ Return
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
