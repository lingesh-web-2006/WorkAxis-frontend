/* eslint-disable no-use-before-define */
import React, { useState, useEffect, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { payrollService, employeeService, announcementService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatCurrency(val) {
  if (!val && val !== 0) return '₹0';
  if (val >= 100000) return `₹${(val/100000).toFixed(1)}L`;
  if (val >= 1000) return `₹${(val/1000).toFixed(0)}K`;
  return `₹${val.toFixed(0)}`;
}

function StatCard({ icon, label, value, color, change }) {
  return (
    <div className={`stat-card ${color}`}>
      <div className={`stat-icon ${color}`}>
        <span style={{ fontSize: '18px' }}>{icon}</span>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {change !== undefined && (
        <div className={`stat-change ${change >= 0 ? 'up' : 'down'}`}>
          {change >= 0 ? '↑' : '↓'} {Math.abs(change)}% vs last month
        </div>
      )}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-hover)',
        borderRadius: '8px',
        padding: '10px 14px',
        fontSize: '13px'
      }}>
        <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color, fontWeight: 600 }}>
            {p.name}: {typeof p.value === 'number' && p.value > 999
              ? formatCurrency(p.value)
              : p.value}
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { user, isEmployee, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [deptData, setDeptData] = useState([]);
  const [pendingEmployees, setPendingEmployees] = useState([]);
  const [employeePayrolls, setEmployeePayrolls] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (isEmployee()) {
        const [payrollRes, annRes] = await Promise.all([
          payrollService.getByEmployee(user.id),
          announcementService.getLatest()
        ]);
        setEmployeePayrolls(payrollRes.data || []);
        setAnnouncements(annRes.data || []);
      } else {
        const [statsRes, distRes, pendingRes, annRes] = await Promise.all([
          payrollService.getDashboardStats({
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear()
          }),
          employeeService.getDistribution(),
          isAdmin() ? employeeService.getPending() : Promise.resolve({ data: [] }),
          announcementService.getLatest()
        ]);
        setStats(statsRes.data);
        setDeptData(distRes.data || []);
        setPendingEmployees(pendingRes.data || []);
        setAnnouncements(annRes.data || []);
      }
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [isEmployee, user.id, isAdmin]);

  const fetchAnnouncements = async () => {
    try {
      const res = await announcementService.getLatest();
      setAnnouncements(res.data || []);
    } catch (err) {
      console.error('Failed to reload announcements');
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <div className="loading-wrapper"><div className="spinner" /></div>;
  }

  if (isEmployee()) {
    return <EmployeeDashboard user={user} payrolls={employeePayrolls} announcements={announcements} />;
  }

  return (
    <AdminDashboard 
      stats={stats} 
      deptData={deptData} 
      pendingEmployees={pendingEmployees} 
      announcements={announcements} 
      onRefresh={fetchData} 
      onRefreshNews={fetchAnnouncements} 
    />
  );
}

function AnnouncementModal({ onClose, onSave }) {
  const [form, setForm] = useState({ title: '', content: '', type: 'GENERAL' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.content) return toast.error('Please fill all fields');
    setLoading(true);
    try {
      await announcementService.create(form);
      toast.success('Announcement posted');
      onSave();
    } catch (err) {
      toast.error('Failed to post announcement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Create Announcement</div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Title</label>
              <input className="form-control" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g., Annual Holiday List" />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-control" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                <option value="GENERAL">General</option>
                <option value="POLICY">Policy Update</option>
                <option value="EVENT">Corporate Event</option>
                <option value="URGENT">Urgent Notice</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Content</label>
              <textarea className="form-control" rows="4" value={form.content} onChange={e => setForm({...form, content: e.target.value})} placeholder="Write your announcement here..." />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Posting...' : 'Post Announcement'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AnnouncementFeed({ announcements, isAdmin, onRefresh }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="card h-full">
      <div className="card-header">
        <div className="card-title">Company Pulse</div>
        {isAdmin && <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>+ Post</button>}
      </div>
      <div className="card-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {announcements.length > 0 ? (
          <div className="announcement-list">
            {announcements.map(ann => (
              <div key={ann.id} className={`announcement-item ${ann.type?.toLowerCase()}`}>
                <div className="ann-meta">
                  <span className={`ann-type ${ann.type?.toLowerCase()}`}>{ann.type}</span>
                  <span className="ann-date">{new Date(ann.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="ann-title">{ann.title}</div>
                <div className="ann-content">{ann.content}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span style={{ fontSize: '32px' }}>📢</span>
            <div className="empty-text">No announcements yet</div>
          </div>
        )}
      </div>
      {showModal && <AnnouncementModal onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); onRefresh(); }} />}
    </div>
  );
}

function AdminDashboard({ stats, deptData, pendingEmployees, announcements, onRefresh, onRefreshNews }) {
  const { isAdmin } = useAuth();
  
  const handleApprove = async (id) => {
    try {
      await employeeService.approve(id);
      toast.success('Employee approved');
      onRefresh();
    } catch (err) {
      toast.error('Approval failed');
    }
  };

  const handleReject = async (id) => {
    try {
      await employeeService.reject(id);
      toast.success('Employee rejected');
      onRefresh();
    } catch (err) {
      toast.error('Rejection failed');
    }
  };

  const trend = (stats?.monthlyTrend || []).map(m => ({
    month: MONTHS[m.month - 1],
    amount: parseFloat(m.totalAmount || 0)
  }));

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#a855f7', '#ef4444'];

  return (
    <div className="fade-in">
      <div className="stats-grid">
        <StatCard icon="👥" label="Total Employees" value={stats?.totalEmployees ?? 0} color="indigo" />
        <StatCard icon="✅" label="Active Employees" value={stats?.activeEmployees ?? 0} color="green" />
        <StatCard icon="💰" label="Payroll This Month" value={formatCurrency(stats?.totalPayrollThisMonth)} color="amber" />
        <StatCard icon="📋" label="Payrolls Processed" value={stats?.payrollsProcessedThisMonth ?? 0} color="blue" />
        <StatCard icon="📈" label="Annual Payroll" value={formatCurrency(stats?.totalPayrollThisYear)} color="purple" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Monthly Payroll Trend</div>
              <div className="card-subtitle">{new Date().getFullYear()} payroll expenditure by month</div>
            </div>
          </div>
          <div className="card-body" style={{ padding: '16px 24px 24px' }}>
            {trend.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={trend}>
                  <defs>
                    <linearGradient id="gradAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                  <YAxis tickFormatter={v => formatCurrency(v)} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="amount" name="Payroll" stroke="#6366f1" strokeWidth={2} fill="url(#gradAmount)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">
                <span className="empty-icon">📊</span>
                <span className="empty-title">No payroll data yet</span>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">By Department</div>
              <div className="card-subtitle">Employee distribution</div>
            </div>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px' }}>
            {deptData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={deptData} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                      dataKey="value" nameKey="name" paddingAngle={3}>
                      {deptData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                  {deptData.map((d, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                      {d.name}: {d.value}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="empty-state"><span className="empty-icon">👥</span></div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <div className="card">
          <div className="card-header"><div className="card-title">Monthly Comparison</div></div>
          <div className="card-body" style={{ padding: '16px 24px 24px' }}>
            {trend.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={trend} barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <YAxis tickFormatter={v => formatCurrency(v)} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  < Bar dataKey="amount" name="Payroll" fill="#6366f1" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state"><span className="empty-title">No data</span></div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><div className="card-title">System Overview</div></div>
          <div className="card-body">
            {[
              { label: 'Current Month', value: new Date().toLocaleString('en', { month: 'long', year: 'numeric' }), color: 'var(--accent-primary)' },
              { label: 'Total Employees', value: stats?.totalEmployees || 0, color: 'var(--accent-secondary)' },
              { label: 'Active Employees', value: stats?.activeEmployees || 0, color: 'var(--accent-secondary)' },
              { label: 'Processed Payrolls', value: stats?.payrollsProcessedThisMonth || 0, color: 'var(--accent-warning)' },
              { label: 'Monthly Expense', value: formatCurrency(stats?.totalPayrollThisMonth), color: 'var(--accent-warning)' },
              { label: 'Annual Expense', value: formatCurrency(stats?.totalPayrollThisYear), color: 'var(--accent-purple)' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < 5 ? '1px solid var(--border-color)' : 'none' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{item.label}</span>
                <span style={{ fontSize: '13.5px', fontWeight: 700, color: item.color, fontFamily: 'var(--font-mono)' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <AnnouncementFeed announcements={announcements} isAdmin={isAdmin()} onRefresh={onRefreshNews} />
        
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <div>
                <div className="card-title">Pending Employee Requests</div>
                <div className="card-subtitle">{pendingEmployees.length} pending for approval</div>
             </div>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {pendingEmployees.length > 0 ? (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Department</th>
                      <th>Basic Salary</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingEmployees.map(emp => (
                      <tr key={emp.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{emp.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{emp.email}</div>
                        </td>
                        <td>{emp.department}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>₹{parseFloat(emp.basicSalary).toLocaleString('en-IN')}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn btn-success btn-sm" onClick={() => handleApprove(emp.id)}>Approve</button>
                            <button className="btn btn-warning btn-sm" onClick={() => handleReject(emp.id)}>Reject</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <span style={{ fontSize: '32px' }}>✅</span>
                <div className="empty-title">All clear!</div>
                <div className="empty-text">No pending requests.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmployeeDashboard({ user, payrolls, announcements }) {
  const latestPayroll = payrolls[0];
  const trend = [...payrolls].reverse().map(p => ({
    month: MONTHS[p.payMonth - 1],
    amount: parseFloat(p.netSalary || 0)
  }));

  const handleDownload = async (id) => {
    try {
      const response = await payrollService.exportPayslip(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payslip_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast.error('Failed to download payslip');
    }
  };

  return (
    <div className="fade-in">
      <div className="stats-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
        <div className="card" style={{ padding: '24px', background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)', color: 'white' }}>
          <div style={{ fontSize: '13px', opacity: 0.85, marginBottom: '4px' }}>Welcome back,</div>
          <div style={{ fontSize: '24px', fontWeight: 800 }}>{user.fullName || user.username}</div>
          <div style={{ fontSize: '13px', opacity: 0.85, marginTop: '8px' }}>{user.email}</div>
          <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
             <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', padding: '4px 10px' }}>{user.role}</span>
             {latestPayroll && (
               <span style={{ fontSize: '11px', opacity: 0.8 }}>
                 Last paid: {MONTHS[latestPayroll.payMonth-1]} {latestPayroll.payYear}
               </span>
             )}
          </div>
        </div>

        <StatCard icon="💰" label="Last Net Salary" value={latestPayroll ? formatCurrency(latestPayroll.netSalary) : '₹0'} color="green" />
        <StatCard icon="📅" label="Payrolls Received" value={payrolls.length} color="indigo" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginTop: '16px' }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Salary History</div>
            <div className="card-subtitle">Monthly net salary trend</div>
          </div>
          <div className="card-body" style={{ padding: '16px' }}>
            {trend.length > 0 ? (
               <ResponsiveContainer width="100%" height={280}>
                 <AreaChart data={trend}>
                   <defs>
                     <linearGradient id="gradEmp" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                       <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                     </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                   <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                   <YAxis tickFormatter={v => formatCurrency(v)} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                   <Tooltip content={<CustomTooltip />} />
                   <Area type="monotone" dataKey="amount" name="Net Salary" stroke="#10b981" fill="url(#gradEmp)" strokeWidth={2} />
                 </AreaChart>
               </ResponsiveContainer>
            ) : <div className="empty-state">No salary history found.</div>}
          </div>
        </div>

        <AnnouncementFeed announcements={announcements} isAdmin={false} />
      </div>

      <div className="card" style={{ marginTop: '16px' }}>
        <div className="card-header">
          <div className="card-title">Recent Payslips</div>
        </div>
        <div className="card-body" style={{ padding: '0' }}>
          {payrolls.length > 0 ? (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Salary Cycle</th>
                    <th>Net Salary</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payrolls.slice(0, 5).map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{MONTHS[p.payMonth-1]} {p.payYear}</td>
                      <td>{p.payMonth}/{p.payYear}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(p.netSalary)}</td>
                      <td><span className={`badge badge-${p.status?.toLowerCase()}`}>{p.status}</span></td>
                      <td>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleDownload(p.id)}>
                          📥 Download PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state text-muted">No payslips generated yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
