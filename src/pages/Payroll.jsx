import React, { useState, useEffect, useCallback, useRef } from 'react';
import { payrollService, employeeService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function formatCurrency(val) {
  if (!val && val !== 0) return '₹0';
  return '₹' + parseFloat(val).toLocaleString('en-IN', { minimumFractionDigits: 2 });
}

function GenerateModal({ onClose, onSave }) {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({
    employeeId: '', payMonth: new Date().getMonth() + 1, payYear: new Date().getFullYear(),
    basicSalary: '', bonus: '', otherAllowances: '', otherDeductions: '', remarks: ''
  });
  const [loading, setLoading] = useState(false);
  const [calcPreview, setCalcPreview] = useState(null);

  useEffect(() => {
    employeeService.getActive().then(r => setEmployees(r.data));
  }, []);

  const handleChange = (e) => {
    const updated = { ...form, [e.target.name]: e.target.value };
    setForm(updated);
    if (updated.basicSalary) calculatePreview(updated);
  };

  const handleEmployeeChange = (e) => {
    const emp = employees.find(em => em.id === parseInt(e.target.value));
    const updated = { ...form, employeeId: e.target.value, basicSalary: emp?.basicSalary || '' };
    setForm(updated);
    if (updated.basicSalary) calculatePreview(updated);
  };

  const calculatePreview = (f) => {
    const basic = parseFloat(f.basicSalary) || 0;
    const hra = basic * 0.40;
    const bonus = parseFloat(f.bonus) || 0;
    const otherAllow = parseFloat(f.otherAllowances) || 0;
    const totalAllowances = hra + bonus + otherAllow;
    const pf = basic * 0.12;
    let tax;
    const monthlyLimit1 = 500000 / 12;
    const monthlyLimit2 = 1000000 / 12;
    if (basic <= monthlyLimit1) tax = basic * 0.05;
    else if (basic <= monthlyLimit2) tax = basic * 0.20;
    else tax = basic * 0.30;
    const otherDed = parseFloat(f.otherDeductions) || 0;
    const totalDeductions = pf + tax + otherDed;
    const netSalary = basic + totalAllowances - totalDeductions;
    setCalcPreview({ basic, hra, bonus, otherAllow, totalAllowances, pf, tax, otherDed, totalDeductions, netSalary });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.employeeId || !form.payMonth || !form.payYear || !form.basicSalary) {
      toast.error('Please fill all required fields');
      return;
    }
    setLoading(true);
    try {
      await payrollService.generate(form);
      toast.success('Payroll generated successfully');
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate payroll');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Generate Payroll</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Calculate and process employee salary</div>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Employee *</label>
                <select name="employeeId" className="form-control" value={form.employeeId} onChange={handleEmployeeChange}>
                  <option value="">Select Employee</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name} — {e.department}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Basic Salary (₹) *</label>
                <input name="basicSalary" type="number" className="form-control" placeholder="Auto-filled from employee" value={form.basicSalary} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Month *</label>
                <select name="payMonth" className="form-control" value={form.payMonth} onChange={handleChange}>
                  {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Year *</label>
                <input name="payYear" type="number" className="form-control" value={form.payYear} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Bonus (₹)</label>
                <input name="bonus" type="number" className="form-control" placeholder="0" value={form.bonus} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Other Allowances (₹)</label>
                <input name="otherAllowances" type="number" className="form-control" placeholder="0" value={form.otherAllowances} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Other Deductions (₹)</label>
                <input name="otherDeductions" type="number" className="form-control" placeholder="0" value={form.otherDeductions} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Remarks</label>
                <input name="remarks" className="form-control" placeholder="Optional notes" value={form.remarks} onChange={handleChange} />
              </div>
            </div>

            {/* Calculation Preview */}
            {calcPreview && (
              <div style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                marginTop: '8px'
              }}>
                <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Salary Preview
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>Earnings</div>
                    {[
                      ['Basic Salary', calcPreview.basic],
                      ['HRA (40%)', calcPreview.hra],
                      ['Bonus', calcPreview.bonus],
                      ['Other Allowances', calcPreview.otherAllow],
                    ].map(([label, val]) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '3px 0', color: 'var(--text-secondary)' }}>
                        <span>{label}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-secondary)' }}>{formatCurrency(val)}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>Deductions</div>
                    {[
                      ['PF (12%)', calcPreview.pf],
                      ['Tax', calcPreview.tax],
                      ['Other', calcPreview.otherDed],
                    ].map(([label, val]) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '3px 0', color: 'var(--text-secondary)' }}>
                        <span>{label}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-danger)' }}>{formatCurrency(val)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '12px 0 0',
                  marginTop: '12px',
                  borderTop: '1px dashed var(--border-hover)',
                  fontSize: '15px', fontWeight: 800
                }}>
                  <span style={{ color: 'var(--text-primary)' }}>Net Salary</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-primary-hover)' }}>
                    {formatCurrency(calcPreview.netSalary)}
                  </span>
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Processing...' : 'Generate Payroll'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SalarySlip({ payroll, onClose }) {
  const slipRef = useRef();

  const handlePrint = () => window.print();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-md" onClick={e => e.stopPropagation()} ref={slipRef}>
        <div className="modal-header">
          <div className="modal-title">Salary Slip</div>
          <div className="flex gap-2">
            <button className="btn btn-secondary btn-sm" onClick={handlePrint}>🖨️ Print</button>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>
        </div>
        <div className="modal-body" style={{ padding: 0 }}>
          <div className="salary-slip">
            <div className="slip-header">
              <div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>💼 PayrollPro</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '2px' }}>Employee Salary Statement</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-primary-hover)' }}>
                  {MONTHS[payroll.payMonth - 1]} {payroll.payYear}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Slip #{payroll.id}</div>
              </div>
            </div>

            <div className="slip-section">
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Employee Information</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {[
                  ['Name', payroll.employeeName],
                  ['Email', payroll.employeeEmail],
                  ['Department', payroll.department],
                  ['Position', payroll.position],
                ].map(([label, value]) => (
                  <div key={label}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</div>
                    <div style={{ fontSize: '13.5px', color: 'var(--text-primary)', fontWeight: 500 }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="slip-section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Earnings</div>
                <table className="slip-table">
                  <tbody>
                    {[
                      ['Basic Salary', payroll.basicSalary],
                      ['HRA', payroll.hra],
                      ['Bonus', payroll.bonus],
                      ['Other Allowances', payroll.otherAllowances],
                    ].map(([label, val]) => (
                      <tr key={label}>
                        <td style={{ color: 'var(--text-secondary)' }}>{label}</td>
                        <td style={{ color: 'var(--accent-secondary)' }}>{formatCurrency(val)}</td>
                      </tr>
                    ))}
                    <tr className="slip-total-row">
                      <td>Total Earnings</td>
                      <td>{formatCurrency(parseFloat(payroll.basicSalary) + parseFloat(payroll.totalAllowances))}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-danger)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Deductions</div>
                <table className="slip-table">
                  <tbody>
                    {[
                      ['Provident Fund', payroll.pfDeduction],
                      ['Tax', payroll.taxDeduction],
                      ['Other Deductions', payroll.otherDeductions],
                    ].map(([label, val]) => (
                      <tr key={label}>
                        <td style={{ color: 'var(--text-secondary)' }}>{label}</td>
                        <td style={{ color: 'var(--accent-danger)' }}>{formatCurrency(val)}</td>
                      </tr>
                    ))}
                    <tr className="slip-total-row">
                      <td>Total Deductions</td>
                      <td>{formatCurrency(payroll.totalDeductions)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="slip-section" style={{ background: 'var(--accent-primary-muted)', borderTop: '2px solid var(--accent-primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>NET SALARY</span>
                <span style={{ fontSize: '24px', fontWeight: 900, color: 'var(--accent-primary-hover)', fontFamily: 'var(--font-mono)' }}>
                  {formatCurrency(payroll.netSalary)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Payroll() {
  const [payrolls, setPayrolls] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [search, setSearch] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showGenerate, setShowGenerate] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState(null);
  const { isHR, isAdmin, isEmployee, user } = useAuth();
  const PAGE_SIZE = 10;

  const fetchPayrolls = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (isEmployee()) {
        res = await payrollService.getByEmployee(user.id);
        const data = res.data || [];
        setPayrolls(data);
        setTotal(data.length);
        setTotalPages(1);
      } else {
        res = await payrollService.getMonthly({ month, year, search: search || undefined, page, size: PAGE_SIZE });
        setPayrolls(res.data.content || []);
        setTotal(res.data.totalElements || 0);
        setTotalPages(res.data.totalPages || 0);
      }
    } catch (err) {
      toast.error('Failed to load payroll data');
    } finally {
      setLoading(false);
    }
  }, [month, year, search, page, isEmployee, user.id]);

  useEffect(() => { fetchPayrolls(); }, [fetchPayrolls]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchTerm);
      setPage(0);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleStatusUpdate = async (id, status) => {
    try {
      await payrollService.updateStatus(id, status);
      toast.success(`Status updated to ${status}`);
      fetchPayrolls();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleExport = async () => {
    try {
      const res = await payrollService.exportMonthly({ month, year });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payroll_${month}_${year}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Excel report exported');
    } catch (err) {
      toast.error('Failed to export report');
    }
  };

  const handleDownload = async (id) => {
    try {
      const res = await payrollService.exportPayslip(id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payslip_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Payslip downloaded');
    } catch (err) {
      toast.error('Failed to download payslip');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this payroll record?')) return;
    try {
      await payrollService.delete(id);
      toast.success('Payroll deleted');
      fetchPayrolls();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const getStatusBadge = (status) => {
    const map = { PENDING: 'badge-pending', PROCESSED: 'badge-processed', APPROVED: 'badge-processed', PAID: 'badge-paid' };
    return <span className={`badge ${map[status]}`}>{status}</span>;
  };

  const totalNetSalary = payrolls.reduce((sum, p) => sum + parseFloat(p.netSalary || 0), 0);

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">{isEmployee() ? 'My Payroll History' : 'Payroll Management'}</div>
            {!isEmployee() && (
              <div className="card-subtitle">
                {total} records · Total: <strong style={{ color: 'var(--accent-secondary)' }}>
                  ₹{totalNetSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </strong>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3" style={{ flexWrap: 'wrap' }}>
            {!isEmployee() && (
              <>
                <select className="form-control" style={{ width: 'auto' }} value={month} onChange={e => setMonth(parseInt(e.target.value))}>
                  {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
                <select className="form-control" style={{ width: '90px' }} value={year} onChange={e => setYear(parseInt(e.target.value))}>
                  {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <div className="search-wrapper">
                  <svg className="search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input className="form-control search-input" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <button className="btn btn-secondary" onClick={handleExport} title="Export to Excel">📂 Export</button>
              </>
            )}
            {isHR() && (
              <button className="btn btn-primary" onClick={() => setShowGenerate(true)}>
                + Generate Payroll
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="loading-wrapper"><div className="spinner" /></div>
        ) : payrolls.length === 0 ? (
          <div className="empty-state">
            <span style={{ fontSize: '40px' }}>💰</span>
            <div className="empty-title">No payroll records</div>
            <div className="empty-text">No payroll generated for {MONTHS[month - 1]} {year}</div>
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Basic Salary</th>
                    <th>Allowances</th>
                    <th>Deductions</th>
                    <th>Net Salary</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payrolls.map(p => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.employeeName}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.position}</div>
                      </td>
                      <td>
                        <span style={{ background: 'var(--accent-primary-muted)', color: 'var(--accent-primary-hover)', padding: '3px 8px', borderRadius: '6px', fontSize: '12px' }}>
                          {p.department}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>{formatCurrency(p.basicSalary)}</td>
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
                        <div className="flex gap-2 items-center">
                          {getStatusBadge(p.status)}
                          {isAdmin() && p.status === 'PENDING' && (
                            <button className="btn btn-primary btn-sm" onClick={() => handleStatusUpdate(p.id, 'APPROVED')} title="Approve Payroll">✓ Approve</button>
                          )}
                          {isAdmin() && p.status !== 'PAID' && (
                            <select
                              value={p.status}
                              onChange={e => handleStatusUpdate(p.id, e.target.value)}
                              className="form-control"
                              style={{ width: 'auto', padding: '2px 5px', fontSize: '11px', height: 'auto' }}
                            >
                              <option value="PENDING">PENDING</option>
                              <option value="PROCESSED">PROCESSED</option>
                              <option value="APPROVED">APPROVED</option>
                              <option value="PAID">PAID</option>
                            </select>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setSelectedSlip(p)} title="View Slip">📄</button>
                          <button className="btn btn-secondary btn-sm btn-icon" onClick={() => handleDownload(p.id)} title="Download PDF Payslip">📥</button>
                          {isAdmin() && (
                            <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(p.id)} title="Delete">🗑️</button>
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
                <div className="pagination-info">Showing {page * PAGE_SIZE + 1}–{Math.min((page+1)*PAGE_SIZE, total)} of {total}</div>
                <div className="pagination-controls">
                  <button className="page-btn" disabled={page === 0} onClick={() => setPage(0)}>«</button>
                  <button className="page-btn" disabled={page === 0} onClick={() => setPage(p => p-1)}>‹</button>
                  {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                    const pg = Math.max(0, page-2)+i;
                    if (pg >= totalPages) return null;
                    return <button key={pg} className={`page-btn ${pg===page?'active':''}`} onClick={() => setPage(pg)}>{pg+1}</button>;
                  })}
                  <button className="page-btn" disabled={page >= totalPages-1} onClick={() => setPage(p => p+1)}>›</button>
                  <button className="page-btn" disabled={page >= totalPages-1} onClick={() => setPage(totalPages-1)}>»</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showGenerate && (
        <GenerateModal onClose={() => setShowGenerate(false)} onSave={() => { setShowGenerate(false); fetchPayrolls(); }} />
      )}
      {selectedSlip && (
        <SalarySlip payroll={selectedSlip} onClose={() => setSelectedSlip(null)} />
      )}
    </div>
  );
}
