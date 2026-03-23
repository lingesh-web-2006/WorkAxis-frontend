/* eslint-disable no-use-before-define */
import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { payrollService, employeeService } from '../services/api';
import toast from 'react-hot-toast';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const COLORS = ['#6366f1','#10b981','#f59e0b','#3b82f6','#a855f7','#ef4444','#14b8a6','#f97316'];

function formatCurrency(val) {
  if (!val && val !== 0) return '₹0';
  if (val >= 10000000) return `₹${(val/10000000).toFixed(2)}Cr`;
  if (val >= 100000) return `₹${(val/100000).toFixed(1)}L`;
  if (val >= 1000) return `₹${(val/1000).toFixed(0)}K`;
  return `₹${parseFloat(val).toFixed(0)}`;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-hover)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px' }}>
        <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color, fontWeight: 600 }}>
            {p.name}: {typeof p.value === 'number' && p.value > 999 ? formatCurrency(p.value) : p.value}
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function Reports() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [stats, setStats] = useState(null);
  const [deptSalary, setDeptSalary] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, deptRes, statusRes] = await Promise.all([
        payrollService.getDashboardStats({ month: new Date().getMonth() + 1, year }),
        employeeService.getDeptStats(),
        employeeService.getStatusDistribution(),
      ]);
      setStats(statsRes.data);
      setDeptSalary(deptRes.data || []);
      setStatusData(statusRes.data || []);
    } catch (err) {
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <div className="loading-wrapper"><div className="spinner" /></div>;

  const trend = (stats?.monthlyTrend || []).map(m => ({
    month: MONTHS[m.month - 1],
    amount: parseFloat(m.totalAmount || 0)
  }));

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div />
        <div className="flex items-center gap-3">
          <label style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Reporting Year:</label>
          <select className="form-control" style={{ width: '100px' }} value={year} onChange={e => setYear(parseInt(e.target.value))}>
            {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        {[
          { icon: '👥', label: 'Total Employees', value: stats?.totalEmployees || 0, color: 'indigo' },
          { icon: '✅', label: 'Active Employees', value: stats?.activeEmployees || 0, color: 'green' },
          { icon: '💰', label: `${year} Total Payroll`, value: formatCurrency(stats?.totalPayrollThisYear), color: 'amber' },
          { icon: '📅', label: 'Avg Monthly Payroll', value: formatCurrency((stats?.totalPayrollThisYear || 0) / 12), color: 'blue' },
        ].map((s, i) => (
          <div key={i} className={`stat-card ${s.color}`}>
            <div className={`stat-icon ${s.color}`}><span style={{ fontSize: '18px' }}>{s.icon}</span></div>
            <div className="stat-value" style={{ fontSize: '22px' }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        {/* Annual trend */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Annual Payroll Trend — {year}</div>
              <div className="card-subtitle">Monthly payroll expenditure</div>
            </div>
          </div>
          <div className="card-body" style={{ padding: '16px 20px 20px' }}>
            {trend.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <YAxis tickFormatter={formatCurrency} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="amount" name="Payroll" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state"><span className="empty-title">No payroll data for {year}</span></div>
            )}
          </div>
        </div>

        {/* Dept salary */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Salary by Department</div>
              <div className="card-subtitle">Average basic salary per department</div>
            </div>
          </div>
          <div className="card-body" style={{ padding: '16px 20px 20px' }}>
            {deptSalary.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={deptSalary} layout="vertical" barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={false} />
                  <XAxis type="number" tickFormatter={formatCurrency} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="avgSalary" name="Avg Salary" radius={[0,4,4,0]}>
                    {deptSalary.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state"><span className="empty-title">No department data</span></div>
            )}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        {/* Dept pie */}
        <div className="card">
          <div className="card-header"><div className="card-title">Employees by Department</div></div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px' }}>
            {deptSalary.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie data={deptSalary} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="employees" nameKey="name" paddingAngle={2}>
                      {deptSalary.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                {deptSalary.map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '3px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                    <span>{d.name}:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{d.employees}</strong>
                  </div>
                ))}
              </>
            ) : (
              <div className="empty-state"><span className="empty-title">No data</span></div>
            )}
          </div>
        </div>

        {/* Status pie */}
        <div className="card">
          <div className="card-header"><div className="card-title">Employee Status</div></div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px' }}>
            {statusData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" outerRadius={65} dataKey="value" nameKey="name" paddingAngle={3}>
                      {statusData.map((entry, i) => {
                        const colors = { ACTIVE: '#10b981', INACTIVE: '#f59e0b', TERMINATED: '#ef4444' };
                        return <Cell key={i} fill={colors[entry.name] || COLORS[i]} />;
                      })}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                {statusData.map((d, i) => {
                  const colors = { ACTIVE: '#10b981', INACTIVE: '#f59e0b', TERMINATED: '#ef4444' };
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '3px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: colors[d.name], flexShrink: 0 }} />
                      <span>{d.name}:</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{d.value}</strong>
                    </div>
                  );
                })}
              </>
            ) : (
              <div className="empty-state"><span className="empty-title">No data</span></div>
            )}
          </div>
        </div>

        {/* Dept summary table */}
        <div className="card">
          <div className="card-header"><div className="card-title">Department Summary</div></div>
          <div style={{ overflow: 'auto', maxHeight: '280px' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Dept</th>
                  <th>Staff</th>
                  <th>Total Salary</th>
                </tr>
              </thead>
              <tbody>
                {deptSalary.length === 0 ? (
                  <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>No data</td></tr>
                ) : deptSalary.map((d, i) => (
                  <tr key={i}>
                    <td style={{ fontSize: '12.5px' }}>{d.name}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12.5px' }}>{d.employees}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12.5px', color: 'var(--accent-secondary)' }}>{formatCurrency(d.totalSalary)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Monthly breakdown table */}
      {trend.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Monthly Payroll Breakdown — {year}</div>
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Total Payroll</th>
                  <th>Distribution</th>
                </tr>
              </thead>
              <tbody>
                {trend.map((row, i) => {
                  const maxAmount = Math.max(...trend.map(t => t.amount));
                  const pct = maxAmount > 0 ? (row.amount / maxAmount) * 100 : 0;
                  return (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{row.month}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-secondary)', fontWeight: 700 }}>
                        {formatCurrency(row.amount)}
                      </td>
                      <td style={{ width: '40%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1, height: '6px', background: 'var(--bg-input)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent-primary)', borderRadius: '3px', transition: 'width 0.5s ease' }} />
                          </div>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', minWidth: '32px' }}>{pct.toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
