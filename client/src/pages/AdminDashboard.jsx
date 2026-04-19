import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  FiGrid, FiLayers, FiUserPlus, FiUsers, FiFileText,
  FiLogOut, FiShield, FiTrendingUp, FiAlertTriangle,
  FiExternalLink, FiX, FiChevronRight
} from 'react-icons/fi';
import {
  logoutUser, createDepartment, registerIssuer,
  getAllDepartments, getAllUsers, getAllDocuments,
  revokeDocument, getAnalytics
} from '../api/api';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line
} from 'recharts';

const STATUS_COLORS = {
  ISSUED: '#10b981',
  PENDING: '#f59e0b',
  REJECTED: '#ef4444',
  REVOKED: '#94a3b8',
};

const STATUS_STYLES = {
  ISSUED:   'bg-emerald-50 text-emerald-700 border border-emerald-200',
  PENDING:  'bg-amber-50 text-amber-700 border border-amber-200',
  REJECTED: 'bg-red-50 text-red-700 border border-red-200',
  REVOKED:  'bg-slate-100 text-slate-600 border border-slate-200',
};

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const NAV_ITEMS = [
  { id: 'overview',      label: 'Overview',        icon: FiGrid },
  { id: 'departments',   label: 'Departments',      icon: FiLayers },
  { id: 'createIssuer',  label: 'Register Issuer',  icon: FiUserPlus },
  { id: 'users',         label: 'Users',            icon: FiUsers },
  { id: 'documents',     label: 'Documents',        icon: FiFileText },
];

function Avatar({ name, size = 'md', color = 'violet' }) {
  const sizes = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-11 h-11 text-base' };
  const colors = {
    violet: 'bg-violet-100 text-violet-700',
    blue: 'bg-blue-100 text-blue-700',
    emerald: 'bg-emerald-100 text-emerald-700',
  };
  return (
    <div className={`${sizes[size]} ${colors[color]} rounded-full flex items-center justify-center font-semibold flex-shrink-0`}>
      {(name || '?').charAt(0).toUpperCase()}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    violet: { bg: 'bg-violet-50', icon: 'text-violet-600', val: 'text-violet-700' },
    blue:   { bg: 'bg-blue-50',   icon: 'text-blue-600',   val: 'text-blue-700' },
    emerald:{ bg: 'bg-emerald-50',icon: 'text-emerald-600',val: 'text-emerald-700' },
    amber:  { bg: 'bg-amber-50',  icon: 'text-amber-600',  val: 'text-amber-700' },
  };
  const c = colors[color] || colors.violet;
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className={`w-10 h-10 ${c.bg} rounded-lg flex items-center justify-center mb-3`}>
        <Icon className={`${c.icon} text-lg`} />
      </div>
      <p className={`text-2xl font-bold ${c.val}`}>{value ?? '—'}</p>
      <p className="text-sm text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

// Sun icon for light mode
function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  );
}
// Moon icon for dark mode
function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { isDark, toggle: toggleTheme } = useTheme();

  const [activeTab, setActiveTab] = useState('overview');
  const [departments, setDepartments]   = useState([]);
  const [users, setUsers]               = useState([]);
  const [documents, setDocuments]       = useState([]);
  const [analytics, setAnalytics]       = useState(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [success, setSuccess]           = useState('');
  const [revokeConfirm, setRevokeConfirm] = useState(null);

  const abortControllerRef = useRef(null);

  const [newDept, setNewDept] = useState({ name: '', code: '' });
  const [newIssuer, setNewIssuer] = useState({
    name: '', username: '', password: '', email: '', ethereumAddress: '', departmentId: ''
  });

  useEffect(() => {
    loadData();
    return () => { if (abortControllerRef.current) abortControllerRef.current.abort(); };
  }, [activeTab]);

  const loadData = async () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    setLoading(true); setError('');
    try {
      if (['departments','createIssuer','overview'].includes(activeTab)) {
        const r = await getAllDepartments(); setDepartments(r.data || []);
      }
      if (['users','overview'].includes(activeTab)) {
        const r = await getAllUsers(); setUsers(r.data || []);
      }
      if (['documents','overview'].includes(activeTab)) {
        const r = await getAllDocuments(); setDocuments(r.data || []);
      }
      if (activeTab === 'overview') {
        const r = await getAnalytics(); setAnalytics(r.data || null);
      }
    } catch (err) {
      if (err.name !== 'CanceledError') setError(err.response?.data?.message || 'Failed to load data');
    } finally { setLoading(false); }
  };

  const handleCreateDepartment = async (e) => {
    e.preventDefault(); setError(''); setSuccess(''); setLoading(true);
    try {
      await createDepartment({ name: newDept.name, shortCode: newDept.code });
      setSuccess('Department created successfully!');
      setNewDept({ name: '', code: '' }); loadData();
    } catch (err) { setError(err.response?.data?.message || 'Failed to create department'); }
    finally { setLoading(false); }
  };

  const handleCreateIssuer = async (e) => {
    e.preventDefault(); setError(''); setSuccess('');
    if (!/^0x[a-fA-F0-9]{40}$/.test(newIssuer.ethereumAddress)) {
      setError('Invalid Ethereum address. Must be 42 characters starting with 0x'); return;
    }
    setLoading(true);
    try {
      await registerIssuer({
        fullName: newIssuer.name, userName: newIssuer.username, email: newIssuer.email,
        password: newIssuer.password, ethereumAddress: newIssuer.ethereumAddress,
        department: newIssuer.departmentId, userType: 'ISSUER'
      });
      setSuccess('Issuer registered successfully!');
      setNewIssuer({ name:'',username:'',password:'',email:'',ethereumAddress:'',departmentId:'' });
    } catch (err) { setError(err.response?.data?.message || 'Failed to register issuer'); }
    finally { setLoading(false); }
  };

  const handleRevoke = async (documentId) => {
    setError(''); setSuccess(''); setLoading(true); setRevokeConfirm(null);
    try {
      await revokeDocument(documentId);
      setSuccess('Document revoked successfully on-chain.');
      const r = await getAllDocuments(); setDocuments(r.data || []);
    } catch (err) { setError(err.response?.data?.message || 'Failed to revoke document'); }
    finally { setLoading(false); }
  };

  const handleLogout = async () => {
    try { await logoutUser(); } catch {}
    logout(); navigate('/');
  };

  const issuers  = users.filter(u => u.userType === 'ISSUER');
  const students = users.filter(u => u.userType === 'STUDENT');

  const pieData  = analytics?.statusBreakdown?.map(i => ({ name: i._id, value: i.count })) || [];
  const barData  = analytics?.perDepartment?.map(i  => ({ name: i.name, issued: i.count })) || [];
  const lineData = analytics?.monthlyTrend?.map(i   => ({
    name: `${MONTH_NAMES[i._id.month - 1]} ${i._id.year}`, issued: i.count
  })) || [];

  const currentLabel = NAV_ITEMS.find(n => n.id === activeTab)?.label || '';

  return (
    <div className={`flex min-h-screen ${isDark ? 'bg-gray-950' : 'bg-slate-50'}`}>

      {/* ── Sidebar ── */}
      <aside className={`w-60 flex flex-col sticky top-0 h-screen overflow-y-auto flex-shrink-0 ${isDark ? 'bg-gray-900 border-r border-gray-800' : 'bg-white border-r border-slate-200'}`}>
        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
              <FiShield className="text-white text-sm" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 leading-tight">DocVerify</p>
              <p className="text-[11px] text-slate-400">Admin Portal</p>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                activeTab === id
                  ? isDark ? 'bg-violet-900/40 text-violet-300' : 'bg-violet-50 text-violet-700'
                  : isDark ? 'text-slate-400 hover:bg-gray-800 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <Icon className={`text-base flex-shrink-0 ${activeTab === id ? 'text-violet-500' : isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              {label}
            </button>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-4 py-4 border-t border-slate-100 space-y-2">
          <div className="flex items-center gap-2.5 px-1">
            <Avatar name={user?.fullName || 'A'} size="sm" color="violet" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate leading-tight">{user?.fullName || 'Admin'}</p>
              <p className="text-[11px] text-slate-400 truncate">{user?.email || ''}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
          >
            <FiLogOut className="text-base" />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top bar */}
        <header className={`px-8 py-4 flex items-center gap-2 sticky top-0 z-10 ${isDark ? 'bg-gray-900 border-b border-gray-800' : 'bg-white border-b border-slate-200'}`}>
          <span className="text-xs text-slate-400">Admin</span>
          <FiChevronRight className="text-xs text-slate-400" />
          <span className={`text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{currentLabel}</span>
          <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isDark
                ? 'bg-gray-800 text-amber-400 hover:bg-gray-700'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
            {isDark ? 'Light' : 'Dark'}
          </button>
        </header>

        <main className={`flex-1 overflow-y-auto p-8 ${isDark ? 'text-slate-100' : ''}`}>
          {/* Alerts */}
          {error && (
            <div className={`mb-6 flex items-start gap-3 p-4 rounded-xl text-sm ${isDark ? 'bg-red-900/20 border border-red-800 text-red-400' : 'bg-red-50 border border-red-200 text-red-700'}`}>
              <FiAlertTriangle className="text-base mt-0.5 flex-shrink-0" />
              <span>{error}</span>
              <button onClick={() => setError('')} className="ml-auto"><FiX /></button>
            </div>
          )}
          {success && (
            <div className={`mb-6 flex items-start gap-3 p-4 rounded-xl text-sm ${isDark ? 'bg-emerald-900/20 border border-emerald-800 text-emerald-400' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'}`}>
              <span className="mt-0.5">✓</span>
              <span>{success}</span>
              <button onClick={() => setSuccess('')} className="ml-auto"><FiX /></button>
            </div>
          )}

          {/* ── OVERVIEW ── */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div>
                <h2 className={`text-xl font-bold mb-1 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>System Overview</h2>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Real-time analytics across the platform</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard icon={FiLayers} label="Departments" value={analytics?.totals?.totalDepartments ?? departments.length} color="violet" />
                <StatCard icon={FiUsers}  label="Total Users"  value={analytics?.totals?.totalUsers ?? users.length}       color="blue" />
                <StatCard icon={FiFileText} label="Documents"  value={analytics?.totals?.totalDocuments ?? documents.length} color="emerald" />
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20 text-slate-400 text-sm">Loading analytics…</div>
              ) : analytics ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className={`rounded-xl border p-6 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200'}`}>
                    <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Document Status Distribution</h3>
                    {pieData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" paddingAngle={3}>
                            {pieData.map(entry => <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#8884d8'} />)}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : <p className="text-slate-400 text-sm text-center py-16">No data yet</p>}
                  </div>

                  <div className={`rounded-xl border p-6 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200'}`}>
                    <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Issued per Department</h3>
                    {barData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={barData} margin={{ top: 5, right: 10, left: -20, bottom: 40 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="name" angle={-30} textAnchor="end" tick={{ fontSize: 11 }} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                          <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                          <Bar dataKey="issued" fill="#7c3aed" radius={[4,4,0,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <p className="text-slate-400 text-sm text-center py-16">No issued documents yet</p>}
                  </div>

                  <div className={`rounded-xl border p-6 lg:col-span-2 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200'}`}>
                    <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Monthly Issuance Trend</h3>
                    {lineData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={lineData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                          <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                          <Line type="monotone" dataKey="issued" stroke="#7c3aed" strokeWidth={2.5} dot={{ r: 4, fill: '#7c3aed' }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : <p className="text-slate-400 text-sm text-center py-12">No data for the last 6 months</p>}
                  </div>
                </div>
              ) : (
                <p className="text-slate-400 text-sm text-center py-12">Could not load analytics.</p>
              )}
            </div>
          )}

          {/* ── DEPARTMENTS ── */}
          {activeTab === 'departments' && (
            <div className="space-y-6">
              <div>
                <h2 className={`text-xl font-bold mb-1 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>Departments</h2>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Manage academic departments in the system</p>
              </div>

              <div className={`rounded-xl border p-6 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200'}`}>
                <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Add New Department</h3>
                <form onSubmit={handleCreateDepartment} className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Department Name</label>
                    <input type="text" value={newDept.name}
                      onChange={e => setNewDept({ ...newDept, name: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      placeholder="e.g. Computer Science" required />
                  </div>
                  <div className="w-36">
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Short Code</label>
                    <input type="text" value={newDept.code}
                      onChange={e => setNewDept({ ...newDept, code: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      placeholder="e.g. CS" required />
                  </div>
                  <button type="submit" disabled={loading}
                    className="px-5 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors">
                    {loading ? 'Creating…' : 'Create'}
                  </button>
                </form>
              </div>

              <div className={`rounded-xl border overflow-hidden ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200'}`}>
                {departments.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 text-sm">No departments yet</div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className={`border-b ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-slate-50 border-slate-200'}`}>
                        <th className={`text-left text-xs font-semibold uppercase tracking-wider px-6 py-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Department</th>
                        <th className={`text-left text-xs font-semibold uppercase tracking-wider px-6 py-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Code</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {departments.map(dept => (
                        <tr key={dept._id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 text-sm font-medium text-slate-800">{dept.name}</td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 text-xs font-mono font-medium bg-violet-50 text-violet-700 rounded-md">
                              {dept.shortCode || dept.code}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ── CREATE ISSUER ── */}
          {activeTab === 'createIssuer' && (
            <div className="space-y-6">
              <div>
                <h2 className={`text-xl font-bold mb-1 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>Register Issuer</h2>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Add a new document issuer to the system</p>
              </div>

              <div className={`rounded-xl border p-6 max-w-2xl ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200'}`}>
                <form onSubmit={handleCreateIssuer} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { field: 'name',      label: 'Full Name',      type: 'text',     placeholder: 'Jane Doe' },
                      { field: 'username',  label: 'Username',       type: 'text',     placeholder: 'jane.doe' },
                      { field: 'email',     label: 'Email',          type: 'email',    placeholder: 'jane@university.edu' },
                      { field: 'password',  label: 'Password',       type: 'password', placeholder: '••••••••' },
                    ].map(({ field, label, type, placeholder }) => (
                      <div key={field}>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">{label}</label>
                        <input type={type} value={newIssuer[field]}
                          onChange={e => setNewIssuer({ ...newIssuer, [field]: e.target.value })}
                          className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                          placeholder={placeholder} required minLength={field === 'password' ? 6 : undefined} />
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Ethereum Address</label>
                    <input type="text" value={newIssuer.ethereumAddress}
                      onChange={e => setNewIssuer({ ...newIssuer, ethereumAddress: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      placeholder="0x..." required />
                    <p className="text-xs text-slate-400 mt-1">42-character address starting with 0x</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Department</label>
                    <select value={newIssuer.departmentId}
                      onChange={e => setNewIssuer({ ...newIssuer, departmentId: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      required>
                      <option value="">Select department</option>
                      {departments.map(dept => <option key={dept._id} value={dept._id}>{dept.name}</option>)}
                    </select>
                  </div>

                  <button type="submit" disabled={loading}
                    className="w-full py-2.5 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors">
                    {loading ? 'Registering…' : 'Register Issuer'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ── USERS ── */}
          {activeTab === 'users' && (
            <div className="space-y-8">
              <div>
                <h2 className={`text-xl font-bold mb-1 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>Users</h2>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{issuers.length} issuers · {students.length} students</p>
              </div>

              {/* Issuers */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Issuers</span>
                  <span className="px-2 py-0.5 text-xs bg-violet-100 text-violet-700 rounded-full font-medium">{issuers.length}</span>
                </div>
                <div className={`rounded-xl border overflow-hidden ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200'}`}>
                  {issuers.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-sm">No issuers registered yet</div>
                  ) : (
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          {['Name', 'Email', 'Username', 'Department', 'Ethereum Address'].map(h => (
                            <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {issuers.map(usr => (
                          <tr key={usr._id} className={`transition-colors ${isDark ? 'hover:bg-gray-800 border-b border-gray-800' : 'hover:bg-slate-50'}`}>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2.5">
                                <Avatar name={usr.fullName} size="sm" color="violet" />
                                <span className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{usr.fullName}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-sm text-slate-600">{usr.email}</td>
                            <td className="px-5 py-3.5 text-sm text-slate-500 font-mono">{usr.username}</td>
                            <td className="px-5 py-3.5">
                              <span className="px-2.5 py-1 text-xs bg-slate-100 text-slate-700 rounded-md font-medium">{usr.department?.name || '—'}</span>
                            </td>
                            <td className="px-5 py-3.5 text-xs text-slate-400 font-mono">
                              {usr.ethereumAddress ? `${usr.ethereumAddress.slice(0,10)}…${usr.ethereumAddress.slice(-6)}` : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Students */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Students</span>
                  <span className="px-2 py-0.5 text-xs bg-emerald-100 text-emerald-700 rounded-full font-medium">{students.length}</span>
                </div>
                <div className={`rounded-xl border overflow-hidden ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200'}`}>
                  {students.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-sm">No students registered yet</div>
                  ) : (
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          {['Name', 'Username', 'Email', 'Department'].map(h => (
                            <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {students.map(usr => (
                          <tr key={usr._id} className={`transition-colors ${isDark ? 'hover:bg-gray-800 border-b border-gray-800' : 'hover:bg-slate-50'}`}>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2.5">
                                <Avatar name={usr.fullName} size="sm" color="emerald" />
                                <span className="text-sm font-medium text-slate-800">{usr.fullName}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-sm text-slate-500 font-mono">{usr.username}</td>
                            <td className="px-5 py-3.5 text-sm text-slate-600">{usr.email}</td>
                            <td className="px-5 py-3.5">
                              <span className="px-2.5 py-1 text-xs bg-slate-100 text-slate-700 rounded-md font-medium">{usr.department?.name || '—'}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── DOCUMENTS ── */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              <div>
                <h2 className={`text-xl font-bold mb-1 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>All Documents</h2>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{documents.length} total documents in the system</p>
              </div>

              {documents.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 py-20 text-center">
                  <FiFileText className="text-4xl text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">No documents found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map(doc => (
                    <div key={doc._id} className={`rounded-xl border transition-all p-5 ${isDark ? 'bg-gray-900 border-gray-800 hover:border-gray-700' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2.5 mb-3">
                            <h3 className={`text-sm font-semibold truncate ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{doc.documentName}</h3>
                            <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full flex-shrink-0 ${STATUS_STYLES[doc.status] || 'bg-slate-100 text-slate-600'}`}>
                              {doc.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-x-6 gap-y-2 text-xs">
                            <div>
                              <p className="text-slate-400 mb-0.5">Student</p>
                              <p className="text-slate-700 font-medium">{doc.owner?.fullName || doc.owner?.username || '—'}</p>
                              <p className="text-slate-500">{doc.owner?.email || '—'}</p>
                            </div>
                            <div>
                              <p className="text-slate-400 mb-0.5">Department</p>
                              <p className="text-slate-700 font-medium">{doc.department?.name || '—'}</p>
                              <p className="text-slate-500">{doc.department?.shortCode || ''}</p>
                            </div>
                            <div>
                              <p className="text-slate-400 mb-0.5">Timeline</p>
                              <p className="text-slate-700">Uploaded {new Date(doc.createdAt).toLocaleDateString()}</p>
                              {doc.issuedAt   && <p className="text-emerald-600">Issued {new Date(doc.issuedAt).toLocaleDateString()}</p>}
                              {doc.rejectedAt && <p className="text-red-500">Rejected {new Date(doc.rejectedAt).toLocaleDateString()}</p>}
                              {doc.revokedAt  && <p className="text-slate-500">Revoked {new Date(doc.revokedAt).toLocaleDateString()}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100">
                            {doc.issuer && (
                              <span className="text-xs text-slate-500">
                                Issuer: <span className="text-slate-700 font-medium">{doc.issuer.fullName || doc.issuer.username}</span>
                              </span>
                            )}
                            {doc.transactionHash && (
                              <a href={`https://amoy.polygonscan.com/tx/${doc.transactionHash}`} target="_blank" rel="noopener noreferrer"
                                className="text-xs text-violet-600 hover:text-violet-800 flex items-center gap-1">
                                <FiTrendingUp className="text-xs" /> View on-chain <FiExternalLink className="text-xs" />
                              </a>
                            )}
                            {doc.rejectionReason && (
                              <span className="text-xs text-red-500">Reason: {doc.rejectionReason}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 flex-shrink-0">
                          {doc.storageUrl && (
                            <a href={doc.storageUrl} target="_blank" rel="noopener noreferrer"
                              className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5">
                              <FiExternalLink className="text-xs" /> View
                            </a>
                          )}
                          {doc.status === 'ISSUED' && (
                            <button onClick={() => setRevokeConfirm(doc._id)}
                              className="px-4 py-2 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200">
                              Revoke
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ── Revoke Modal ── */}
      {revokeConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl shadow-xl p-6 max-w-sm w-full ${isDark ? 'bg-gray-900 border border-gray-700' : 'bg-white'}`}>
            <div className="w-11 h-11 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiAlertTriangle className="text-red-600 text-xl" />
            </div>
            <h3 className={`text-base font-bold text-center mb-1 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>Revoke Document?</h3>
            <p className={`text-sm text-center mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              This will permanently invalidate the document on the blockchain and cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setRevokeConfirm(null)}
                className="flex-1 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button onClick={() => handleRevoke(revokeConfirm)} disabled={loading}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">
                {loading ? 'Revoking…' : 'Yes, Revoke'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
