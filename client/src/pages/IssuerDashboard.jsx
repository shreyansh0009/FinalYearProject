import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  FiClock, FiUsers, FiUserCheck, FiUserPlus,
  FiLogOut, FiShield, FiChevronRight, FiAlertTriangle,
  FiExternalLink, FiX, FiCheck, FiChevronDown, FiChevronUp
} from 'react-icons/fi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useWriteContract, usePublicClient } from 'wagmi';
import {
  logoutUser, getPendingDocuments, approveDocument, approveDocumentDirect,
  rejectDocument, registerStudent, getMyStudents, getDepartmentStudents, getCurrentUser
} from '../api/api';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contractConfig.js';

const NAV_ITEMS = [
  { id: 'pending',            label: 'Pending Approvals', icon: FiClock },
  { id: 'departmentStudents', label: 'Department',         icon: FiUsers },
  { id: 'myStudents',         label: 'My Students',        icon: FiUserCheck },
  { id: 'registerStudent',    label: 'Add Student',        icon: FiUserPlus },
];

function Avatar({ name, size = 'md', color = 'blue' }) {
  const sizes = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-11 h-11 text-base' };
  const colors = { blue: 'bg-blue-100 text-blue-700', cyan: 'bg-cyan-100 text-cyan-700', emerald: 'bg-emerald-100 text-emerald-700' };
  return (
    <div className={`${sizes[size]} ${colors[color] || colors.blue} rounded-full flex items-center justify-center font-semibold flex-shrink-0`}>
      {(name || '?').charAt(0).toUpperCase()}
    </div>
  );
}

const STATUS_STYLES = {
  ISSUED:   'bg-emerald-50 text-emerald-700 border border-emerald-200',
  PENDING:  'bg-amber-50 text-amber-700 border border-amber-200',
  REJECTED: 'bg-red-50 text-red-700 border border-red-200',
  REVOKED:  'bg-slate-100 text-slate-600 border border-slate-200',
};

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
function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

export default function IssuerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { isDark, toggle: toggleTheme } = useTheme();

  const { address: walletAddress, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const [activeTab, setActiveTab]             = useState('pending');
  const [pendingDocs, setPendingDocs]         = useState([]);
  const [myStudents, setMyStudents]           = useState([]);
  const [departmentStudents, setDepartmentStudents] = useState([]);
  const [currentUser, setCurrentUser]         = useState(null);
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState('');
  const [success, setSuccess]                 = useState('');
  const [rejecting, setRejecting]             = useState({});
  const [approving, setApproving]             = useState({});
  const [rejectReason, setRejectReason]       = useState({});
  const [showRejectInput, setShowRejectInput] = useState({});

  const abortControllerRef = useRef(null);

  const [newStudent, setNewStudent] = useState({ name: '', username: '', password: '', email: '', phone: '' });

  useEffect(() => { loadCurrentUser(); }, []);

  useEffect(() => {
    loadData();
    return () => { if (abortControllerRef.current) abortControllerRef.current.abort(); };
  }, [activeTab]);

  const loadCurrentUser = async () => {
    try { const r = await getCurrentUser(); setCurrentUser(r.data); }
    catch (err) { console.error('Load user error:', err); }
  };

  const loadData = async () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    setLoading(true); setError('');
    try {
      if (activeTab === 'pending') {
        const r = await getPendingDocuments(); setPendingDocs(r.data || []);
      } else if (activeTab === 'myStudents') {
        const r = await getMyStudents(); setMyStudents(r.data || []);
      } else if (activeTab === 'departmentStudents') {
        const r = await getDepartmentStudents(); setDepartmentStudents(r.data || []);
      }
    } catch (err) {
      if (err.name !== 'CanceledError') setError(err.response?.data?.message || 'Failed to load data');
    } finally { setLoading(false); }
  };

  const issuerEthAddress = currentUser?.ethereumAddress || user?.ethereumAddress;
  const isWalletMatching =
    isConnected && walletAddress && issuerEthAddress &&
    walletAddress.toLowerCase() === issuerEthAddress.toLowerCase();

  const handleApproveWithWallet = async (documentId, documentHash) => {
    if (approving[documentId]) return;
    setApproving(p => ({ ...p, [documentId]: true }));
    setError(''); setSuccess('');
    try {
      const hashBytes32 = `0x${documentHash}`;
      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESS, abi: CONTRACT_ABI,
        functionName: 'issueDocument', args: [hashBytes32],
      });
      setSuccess('Transaction submitted — waiting for confirmation…');
      await publicClient.waitForTransactionReceipt({ hash: txHash });
      await approveDocumentDirect(documentId, txHash);
      setSuccess('Document issued on-chain and recorded in database!');
      loadData();
    } catch (err) {
      if (err.name === 'UserRejectedRequestError' || err.message?.includes('rejected'))
        setError('Transaction was cancelled in wallet.');
      else
        setError(err.response?.data?.message || err.message || 'Transaction failed');
    } finally { setApproving(p => ({ ...p, [documentId]: false })); }
  };

  const handleApprove = async (documentId) => {
    if (approving[documentId]) return;
    setApproving(p => ({ ...p, [documentId]: true }));
    setError(''); setSuccess('');
    try {
      await approveDocument(documentId);
      setSuccess('Document approved successfully!'); loadData();
    } catch (err) { setError(err.response?.data?.message || 'Failed to approve'); }
    finally { setApproving(p => ({ ...p, [documentId]: false })); }
  };

  const handleReject = async (documentId) => {
    if (rejecting[documentId]) return;
    setRejecting(p => ({ ...p, [documentId]: true }));
    setError(''); setSuccess('');
    try {
      await rejectDocument(documentId, rejectReason[documentId] || '');
      setSuccess('Document rejected.');
      setRejectReason(p => ({ ...p, [documentId]: '' }));
      setShowRejectInput(p => ({ ...p, [documentId]: false }));
      loadData();
    } catch (err) { setError(err.response?.data?.message || 'Failed to reject'); }
    finally { setRejecting(p => ({ ...p, [documentId]: false })); }
  };

  const handleRegisterStudent = async (e) => {
    e.preventDefault(); setError(''); setSuccess(''); setLoading(true);
    try {
      await registerStudent({
        fullName: newStudent.name, userName: newStudent.username,
        email: newStudent.email, password: newStudent.password,
        phone: newStudent.phone || undefined,
        department: currentUser?.department?._id || user?.department?._id || user?.department,
        userType: 'STUDENT'
      });
      setSuccess('Student registered successfully!');
      setNewStudent({ name: '', username: '', password: '', email: '', phone: '' });
    } catch (err) { setError(err.response?.data?.message || 'Failed to register student'); }
    finally { setLoading(false); }
  };

  const handleLogout = async () => {
    try { await logoutUser(); } catch {}
    logout(); navigate('/');
  };

  const currentLabel = NAV_ITEMS.find(n => n.id === activeTab)?.label || '';

  return (
    <div className={`flex min-h-screen ${isDark ? 'bg-gray-950' : 'bg-slate-50'}`}>

      {/* ── Sidebar ── */}
      <aside className={`w-60 flex flex-col sticky top-0 h-screen overflow-y-auto flex-shrink-0 ${isDark ? 'bg-gray-900 border-r border-gray-800' : 'bg-white border-r border-slate-200'}`}>
        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <FiShield className="text-white text-sm" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 leading-tight">DocVerify</p>
              <p className="text-[11px] text-slate-400">Issuer Portal</p>
            </div>
          </div>
        </div>

        {/* Wallet status */}
        <div className="px-4 py-3 border-b border-slate-100">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Wallet</p>
          <ConnectButton chainStatus="icon" showBalance={false} accountStatus="address" />
          {isConnected && (
            <div className={`mt-2 flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-lg ${
              isWalletMatching ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isWalletMatching ? 'bg-emerald-500' : 'bg-red-500'}`} />
              {isWalletMatching ? 'Wallet verified' : 'Address mismatch'}
            </div>
          )}
          {!isConnected && issuerEthAddress && (
            <p className="text-[11px] text-slate-400 mt-1.5 font-mono truncate">{issuerEthAddress.slice(0,10)}…</p>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                activeTab === id ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              }`}>
              <Icon className={`text-base flex-shrink-0 ${activeTab === id ? 'text-blue-600' : 'text-slate-400'}`} />
              {label}
              {id === 'pending' && pendingDocs.length > 0 && (
                <span className="ml-auto px-1.5 py-0.5 text-[10px] font-bold bg-blue-600 text-white rounded-full min-w-[18px] text-center">
                  {pendingDocs.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-4 py-4 border-t border-slate-100 space-y-2">
          <div className="flex items-center gap-2.5 px-1">
            <Avatar name={currentUser?.fullName || user?.fullName || 'I'} size="sm" color="blue" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate leading-tight">{currentUser?.fullName || user?.fullName || 'Issuer'}</p>
              <p className="text-[11px] text-slate-400 truncate">{currentUser?.department?.name || 'N/A'}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
            <FiLogOut className="text-base" /> Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className={`px-8 py-4 flex items-center gap-2 sticky top-0 z-10 ${isDark ? 'bg-gray-900 border-b border-gray-800' : 'bg-white border-b border-slate-200'}`}>
          <span className="text-xs text-slate-400">Issuer</span>
          <FiChevronRight className="text-xs text-slate-400" />
          <span className={`text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{currentLabel}</span>
          <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isDark ? 'bg-gray-800 text-amber-400 hover:bg-gray-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
            {isDark ? 'Light' : 'Dark'}
          </button>
        </header>

        <main className={`flex-1 overflow-y-auto p-8 ${isDark ? 'text-slate-100' : ''}`}>
          {error && (
            <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              <FiAlertTriangle className="text-base mt-0.5 flex-shrink-0" />
              <span className="flex-1">{error}</span>
              <button onClick={() => setError('')}><FiX /></button>
            </div>
          )}
          {success && (
            <div className="mb-6 flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm">
              <FiCheck className="text-base mt-0.5 flex-shrink-0" />
              <span className="flex-1">{success}</span>
              <button onClick={() => setSuccess('')}><FiX /></button>
            </div>
          )}

          {/* ── PENDING DOCUMENTS ── */}
          {activeTab === 'pending' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800 mb-1">Pending Approvals</h2>
                <p className="text-sm text-slate-500">
                  {pendingDocs.length} document{pendingDocs.length !== 1 ? 's' : ''} awaiting your review
                </p>
              </div>

              {/* Wallet warning */}
              {isConnected && !isWalletMatching && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
                  <FiAlertTriangle className="flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Wallet address mismatch</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Connected: <span className="font-mono">{walletAddress?.slice(0,8)}…{walletAddress?.slice(-6)}</span>
                      {' '}— Expected: <span className="font-mono">{issuerEthAddress?.slice(0,8)}…{issuerEthAddress?.slice(-6)}</span>
                    </p>
                  </div>
                </div>
              )}

              {loading ? (
                <div className="flex items-center justify-center py-20 text-slate-400 text-sm">Loading…</div>
              ) : pendingDocs.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 py-20 text-center">
                  <FiCheck className="text-4xl text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">All caught up!</p>
                  <p className="text-slate-400 text-sm mt-1">No pending documents to review</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingDocs.map(doc => (
                    <div key={doc._id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-sm font-semibold text-slate-800">{doc.documentName}</h3>
                              {doc.documentType && (
                                <span className="px-2 py-0.5 text-[11px] bg-slate-100 text-slate-600 rounded-full">{doc.documentType}</span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mt-2">
                              <span>
                                <span className="text-slate-400">Student</span>{' '}
                                <span className="text-slate-700 font-medium">{doc.owner?.fullName || doc.owner?.username}</span>
                              </span>
                              <span>{doc.owner?.email}</span>
                              <span>
                                <span className="text-slate-400">Dept</span>{' '}
                                <span className="text-slate-700">{doc.department?.name || '—'}</span>
                              </span>
                              <span>Uploaded {new Date(doc.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>

                          {doc.storageUrl && (
                            <a href={doc.storageUrl} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 px-3 py-1.5 bg-slate-50 hover:bg-blue-50 rounded-lg transition-colors border border-slate-200 flex-shrink-0">
                              <FiExternalLink className="text-xs" /> View file
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Action bar */}
                      <div className="px-5 pb-4 flex items-center gap-3">
                        {isWalletMatching ? (
                          <button
                            onClick={() => handleApproveWithWallet(doc._id, doc.documentHash)}
                            disabled={approving[doc._id]}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                            {approving[doc._id] ? (
                              <><svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Signing…</>
                            ) : <><span>🦊</span> Sign & Approve</>}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleApprove(doc._id)}
                            disabled={approving[doc._id]}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                            {approving[doc._id] ? 'Approving…' : <><FiCheck className="text-sm" /> Approve</>}
                          </button>
                        )}

                        <button
                          onClick={() => setShowRejectInput(p => ({ ...p, [doc._id]: !p[doc._id] }))}
                          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors">
                          <FiX className="text-sm" /> Reject
                        </button>

                        {!isWalletMatching && isConnected && (
                          <span className="text-xs text-slate-400 ml-1">Admin signing (wallet mismatch)</span>
                        )}
                        {!isConnected && (
                          <span className="text-xs text-slate-400 ml-1">Admin signing (no wallet)</span>
                        )}
                      </div>

                      {/* Reject input */}
                      {showRejectInput[doc._id] && (
                        <div className="px-5 pb-4 pt-0 border-t border-slate-100 bg-red-50">
                          <div className="pt-3 flex gap-2">
                            <input
                              type="text"
                              value={rejectReason[doc._id] || ''}
                              onChange={e => setRejectReason(p => ({ ...p, [doc._id]: e.target.value }))}
                              placeholder="Reason for rejection (optional)"
                              className="flex-1 px-3 py-2 text-sm border border-red-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
                            />
                            <button
                              onClick={() => handleReject(doc._id)}
                              disabled={rejecting[doc._id]}
                              className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">
                              {rejecting[doc._id] ? 'Rejecting…' : 'Confirm Reject'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── DEPARTMENT STUDENTS ── */}
          {activeTab === 'departmentStudents' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800 mb-1">Department Students</h2>
                <p className="text-sm text-slate-500">All students in {currentUser?.department?.name || 'your department'}</p>
              </div>

              {departmentStudents.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 py-20 text-center">
                  <FiUsers className="text-4xl text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">No students in your department yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {departmentStudents.map(student => (
                    <div key={student._id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                      <div className="p-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar name={student.fullName || student.username} color="blue" />
                            <div>
                              <p className="text-sm font-semibold text-slate-800">{student.fullName || student.username}</p>
                              <p className="text-xs text-slate-400">{student.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {[
                              { label: 'Total',    value: student.totalDocuments || 0,    color: 'bg-slate-100 text-slate-700' },
                              { label: 'Pending',  value: student.pendingDocuments || 0,  color: 'bg-amber-50 text-amber-700' },
                              { label: 'Issued',   value: student.issuedDocuments || 0,   color: 'bg-emerald-50 text-emerald-700' },
                              { label: 'Rejected', value: student.rejectedDocuments || 0, color: 'bg-red-50 text-red-700' },
                            ].map(({ label, value, color }) => (
                              <div key={label} className={`px-3 py-1.5 ${color} rounded-lg text-center`}>
                                <p className="text-base font-bold leading-tight">{value}</p>
                                <p className="text-[10px] font-medium">{label}</p>
                              </div>
                            ))}
                            <button
                              onClick={() => setExpandedStudent(expandedStudent === student._id ? null : student._id)}
                              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                              {expandedStudent === student._id ? <FiChevronUp /> : <FiChevronDown />}
                            </button>
                          </div>
                        </div>

                        {expandedStudent === student._id && student.documents?.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-slate-100">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-slate-400 border-b border-slate-100">
                                  <th className="text-left pb-2 font-medium">Document</th>
                                  <th className="text-left pb-2 font-medium">Status</th>
                                  <th className="text-left pb-2 font-medium">Uploaded</th>
                                  <th className="text-left pb-2 font-medium">Issued</th>
                                  <th className="text-left pb-2 font-medium">By</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                {student.documents.map(doc => (
                                  <tr key={doc._id} className="hover:bg-slate-50">
                                    <td className="py-2 pr-4 text-slate-700 font-medium">{doc.documentName}</td>
                                    <td className="py-2 pr-4">
                                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_STYLES[doc.status] || 'bg-slate-100 text-slate-600'}`}>
                                        {doc.status}
                                      </span>
                                    </td>
                                    <td className="py-2 pr-4 text-slate-500">{doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : '—'}</td>
                                    <td className="py-2 pr-4 text-slate-500">{doc.issuedAt ? new Date(doc.issuedAt).toLocaleDateString() : '—'}</td>
                                    <td className="py-2 text-slate-500">{doc.issuer?.fullName || '—'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── MY STUDENTS ── */}
          {activeTab === 'myStudents' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800 mb-1">My Students</h2>
                <p className="text-sm text-slate-500">Students you have registered</p>
              </div>

              {myStudents.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 py-20 text-center">
                  <FiUserCheck className="text-4xl text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">You haven't registered any students yet</p>
                  <button onClick={() => setActiveTab('registerStudent')}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                    Register a Student
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        {['Student', 'Email', 'Department', 'Total', 'Pending', 'Issued', 'Rejected'].map(h => (
                          <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {myStudents.map(student => {
                        const docs = student.documents || [];
                        return (
                          <tr key={student._id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2.5">
                                <Avatar name={student.fullName} size="sm" color="blue" />
                                <span className="text-sm font-medium text-slate-800">{student.fullName || student.username}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-sm text-slate-500">{student.email}</td>
                            <td className="px-5 py-3.5">
                              <span className="px-2.5 py-1 text-xs bg-slate-100 text-slate-700 rounded-md">{student.department?.name || '—'}</span>
                            </td>
                            <td className="px-5 py-3.5 text-sm text-center font-semibold text-slate-700">{docs.length}</td>
                            <td className="px-5 py-3.5 text-sm text-center font-semibold text-amber-600">{docs.filter(d => d.status === 'PENDING').length}</td>
                            <td className="px-5 py-3.5 text-sm text-center font-semibold text-emerald-600">{docs.filter(d => d.status === 'ISSUED').length}</td>
                            <td className="px-5 py-3.5 text-sm text-center font-semibold text-red-500">{docs.filter(d => d.status === 'REJECTED').length}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── REGISTER STUDENT ── */}
          {activeTab === 'registerStudent' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800 mb-1">Register New Student</h2>
                <p className="text-sm text-slate-500">
                  Adding to <span className="font-semibold text-blue-600">{currentUser?.department?.name || 'your department'}</span>
                </p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-xl">
                <form onSubmit={handleRegisterStudent} className="space-y-4">
                  {[
                    { field: 'name',     label: 'Full Name',       type: 'text',     placeholder: 'John Smith',           required: true },
                    { field: 'username', label: 'Username',        type: 'text',     placeholder: 'john.smith',           required: true },
                    { field: 'email',    label: 'Email',           type: 'email',    placeholder: 'john@university.edu',  required: true },
                    { field: 'password', label: 'Password',        type: 'password', placeholder: '••••••••',             required: true },
                    { field: 'phone',    label: 'Phone (Optional)', type: 'tel',     placeholder: '9876543210',           required: false },
                  ].map(({ field, label, type, placeholder, required: isRequired }) => (
                    <div key={field}>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">{label}</label>
                      <input type={type} value={newStudent[field]}
                        onChange={e => setNewStudent({ ...newStudent, [field]: e.target.value })}
                        className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={placeholder} required={isRequired} minLength={field === 'password' ? 6 : undefined} />
                    </div>
                  ))}
                  <button type="submit" disabled={loading}
                    className="w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                    {loading ? 'Registering…' : 'Register Student'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
