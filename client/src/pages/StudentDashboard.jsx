import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  FiUploadCloud, FiFolder, FiLogOut, FiShield,
  FiChevronRight, FiAlertTriangle, FiX, FiCheck,
  FiExternalLink, FiDownload, FiFile, FiClock,
  FiCheckCircle, FiXCircle, FiSlash
} from 'react-icons/fi';
import { logoutUser, uploadDocument, getMyDocuments, getCurrentUser } from '../api/api';

const NAV_ITEMS = [
  { id: 'upload',      label: 'Upload Document', icon: FiUploadCloud },
  { id: 'myDocuments', label: 'My Documents',    icon: FiFolder },
];

const STATUS_CONFIG = {
  ISSUED:   { style: 'bg-emerald-50 text-emerald-700 border border-emerald-200', icon: FiCheckCircle, iconClass: 'text-emerald-500' },
  PENDING:  { style: 'bg-amber-50 text-amber-700 border border-amber-200',       icon: FiClock,        iconClass: 'text-amber-500' },
  REJECTED: { style: 'bg-red-50 text-red-700 border border-red-200',             icon: FiXCircle,      iconClass: 'text-red-500' },
  REVOKED:  { style: 'bg-slate-100 text-slate-600 border border-slate-200',      icon: FiSlash,        iconClass: 'text-slate-400' },
};

function Avatar({ name, size = 'md' }) {
  const sizes = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-11 h-11 text-base' };
  return (
    <div className={`${sizes[size]} bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-semibold flex-shrink-0`}>
      {(name || '?').charAt(0).toUpperCase()}
    </div>
  );
}

const DOC_TYPES = [
  'Degree Certificate', 'Marksheet', 'Transcript', 'ID Card', 'Transfer Certificate', 'Other'
];

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

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { isDark, toggle: toggleTheme } = useTheme();

  const [activeTab, setActiveTab]       = useState('upload');
  const [myDocuments, setMyDocuments]   = useState([]);
  const [currentUser, setCurrentUser]   = useState(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [success, setSuccess]           = useState('');
  const [dragOver, setDragOver]         = useState(false);

  const abortControllerRef = useRef(null);
  const fileInputRef        = useRef(null);

  const [uploadForm, setUploadForm] = useState({ documentType: '', file: null });

  useEffect(() => { loadCurrentUser(); }, []);

  useEffect(() => {
    if (activeTab === 'myDocuments') loadMyDocuments();
    return () => { if (abortControllerRef.current) abortControllerRef.current.abort(); };
  }, [activeTab]);

  const loadCurrentUser = async () => {
    try { const r = await getCurrentUser(); setCurrentUser(r.data); }
    catch (err) { console.error('Load user error:', err); }
  };

  const loadMyDocuments = async () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    setLoading(true); setError('');
    try { const r = await getMyDocuments(); setMyDocuments(r.data || []); }
    catch (err) {
      if (err.name !== 'CanceledError')
        setError(err.response?.data?.message || 'Failed to load documents');
    } finally { setLoading(false); }
  };

  const validateFile = (file) => {
    if (file.size > 10 * 1024 * 1024) return 'File too large. Maximum size is 10MB.';
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowed.includes(file.type)) return 'Only PDF, JPG, and PNG files are allowed.';
    return null;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const err = validateFile(file);
    if (err) { setError(err); return; }
    setError(''); setUploadForm(f => ({ ...f, file }));
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const err = validateFile(file);
    if (err) { setError(err); return; }
    setError(''); setUploadForm(f => ({ ...f, file }));
  };

  const handleUpload = async (e) => {
    e.preventDefault(); setError(''); setSuccess(''); setLoading(true);
    try {
      const formData = new FormData();
      formData.append('document', uploadForm.file);
      formData.append('documentType', uploadForm.documentType);
      await uploadDocument(formData);
      setSuccess('Document uploaded successfully! Awaiting issuer approval.');
      setUploadForm({ documentType: '', file: null });
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload document');
    } finally { setLoading(false); }
  };

  const handleLogout = async () => {
    try { await logoutUser(); } catch {}
    logout(); navigate('/');
  };

  const issuedCount   = myDocuments.filter(d => d.status === 'ISSUED').length;
  const pendingCount  = myDocuments.filter(d => d.status === 'PENDING').length;
  const rejectedCount = myDocuments.filter(d => d.status === 'REJECTED').length;

  const currentLabel = NAV_ITEMS.find(n => n.id === activeTab)?.label || '';

  return (
    <div className={`flex min-h-screen ${isDark ? 'bg-gray-950' : 'bg-slate-50'}`}>

      {/* ── Sidebar ── */}
      <aside className={`w-60 flex flex-col sticky top-0 h-screen overflow-y-auto flex-shrink-0 ${isDark ? 'bg-gray-900 border-r border-gray-800' : 'bg-white border-r border-slate-200'}`}>
        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <FiShield className="text-white text-sm" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 leading-tight">DocVerify</p>
              <p className="text-[11px] text-slate-400">Student Portal</p>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        {activeTab === 'myDocuments' && myDocuments.length > 0 && (
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Documents</p>
            <div className="space-y-1.5">
              {[
                { label: 'Issued',   value: issuedCount,   color: 'text-emerald-600' },
                { label: 'Pending',  value: pendingCount,  color: 'text-amber-600' },
                { label: 'Rejected', value: rejectedCount, color: 'text-red-500' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">{label}</span>
                  <span className={`font-semibold ${color}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                activeTab === id ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              }`}>
              <Icon className={`text-base flex-shrink-0 ${activeTab === id ? 'text-emerald-600' : 'text-slate-400'}`} />
              {label}
            </button>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-4 py-4 border-t border-slate-100 space-y-2">
          <div className="flex items-center gap-2.5 px-1">
            <Avatar name={currentUser?.fullName || user?.fullName || 'S'} size="sm" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate leading-tight">{currentUser?.fullName || user?.fullName || 'Student'}</p>
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
          <span className="text-xs text-slate-400">Student</span>
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

          {/* ── UPLOAD ── */}
          {activeTab === 'upload' && (
            <div className="space-y-6 max-w-xl">
              <div>
                <h2 className="text-xl font-bold text-slate-800 mb-1">Upload Document</h2>
                <p className="text-sm text-slate-500">Submit a document for blockchain verification</p>
              </div>

              <form onSubmit={handleUpload} className="space-y-5">
                {/* Document Type */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Document Type</label>
                  <select value={uploadForm.documentType}
                    onChange={e => setUploadForm({ ...uploadForm, documentType: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                    required>
                    <option value="">Select type…</option>
                    {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                {/* Drop zone */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">File</label>
                  <div
                    onDrop={handleDrop}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                      dragOver
                        ? 'border-emerald-400 bg-emerald-50'
                        : uploadForm.file
                        ? 'border-emerald-300 bg-emerald-50'
                        : 'border-slate-300 bg-slate-50 hover:border-emerald-400 hover:bg-emerald-50'
                    }`}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                    />
                    {uploadForm.file ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                          <FiFile className="text-emerald-600 text-xl" />
                        </div>
                        <p className="text-sm font-semibold text-emerald-700">{uploadForm.file.name}</p>
                        <p className="text-xs text-emerald-500">{(uploadForm.file.size / 1024).toFixed(1)} KB · Click to change</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                          <FiUploadCloud className="text-slate-400 text-xl" />
                        </div>
                        <p className="text-sm font-medium text-slate-600">Drop file here or click to browse</p>
                        <p className="text-xs text-slate-400">PDF, JPG, PNG — max 10 MB</p>
                      </div>
                    )}
                  </div>
                </div>

                <button type="submit" disabled={loading || !uploadForm.file}
                  className="w-full py-3 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                  {loading ? (
                    <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Uploading…</>
                  ) : <><FiUploadCloud /> Upload Document</>}
                </button>
              </form>

              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-semibold text-slate-600 mb-2">How it works</p>
                <ol className="text-xs text-slate-500 space-y-1.5">
                  {[
                    'Upload your document — it is hashed locally (SHA-256)',
                    'An issuer from your department reviews and approves it',
                    'On approval, the hash is recorded permanently on the blockchain',
                    'Anyone can verify your document using the public portal',
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-4 h-4 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center font-bold flex-shrink-0 text-[10px] mt-0.5">{i + 1}</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}

          {/* ── MY DOCUMENTS ── */}
          {activeTab === 'myDocuments' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800 mb-1">My Documents</h2>
                <p className="text-sm text-slate-500">{myDocuments.length} document{myDocuments.length !== 1 ? 's' : ''} submitted</p>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20 text-slate-400 text-sm">Loading…</div>
              ) : myDocuments.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 py-20 text-center">
                  <FiFolder className="text-4xl text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No documents yet</p>
                  <p className="text-slate-400 text-sm mt-1 mb-5">Upload your first document to get started</p>
                  <button onClick={() => setActiveTab('upload')}
                    className="px-5 py-2.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700">
                    Upload Document
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {myDocuments.map(doc => {
                    const cfg = STATUS_CONFIG[doc.status] || STATUS_CONFIG.PENDING;
                    const StatusIcon = cfg.icon;
                    return (
                      <div key={doc._id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-slate-300 transition-all">
                        <div className="p-5">
                          <div className="flex items-start gap-4">
                            {/* Left: doc icon */}
                            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                              <FiFile className="text-slate-500 text-lg" />
                            </div>

                            {/* Middle: info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h3 className="text-sm font-semibold text-slate-800 truncate">{doc.documentName}</h3>
                                {doc.documentType && (
                                  <span className="px-2 py-0.5 text-[11px] bg-slate-100 text-slate-500 rounded-full">{doc.documentType}</span>
                                )}
                                <span className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-full flex items-center gap-1 ${cfg.style}`}>
                                  <StatusIcon className={`text-xs ${cfg.iconClass}`} /> {doc.status}
                                </span>
                              </div>

                              <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-400 mb-3">
                                <span>Uploaded {new Date(doc.createdAt).toLocaleDateString()}</span>
                                {doc.status === 'ISSUED' && doc.issuedAt && (
                                  <span className="text-emerald-600">Issued {new Date(doc.issuedAt).toLocaleDateString()}</span>
                                )}
                                {doc.status === 'ISSUED' && doc.issuer && (
                                  <span className="text-slate-500">by {doc.issuer.fullName}</span>
                                )}
                              </div>

                              {/* Status-specific info */}
                              {doc.status === 'REJECTED' && (
                                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-lg mb-3">
                                  <FiAlertTriangle className="text-red-400 flex-shrink-0 mt-0.5 text-sm" />
                                  <div>
                                    <p className="text-xs font-semibold text-red-700">Rejection reason</p>
                                    <p className="text-xs text-red-600 mt-0.5">{doc.rejectionReason || 'No reason provided'}</p>
                                    {doc.rejectedAt && (
                                      <p className="text-[11px] text-red-400 mt-1">{new Date(doc.rejectedAt).toLocaleDateString()}</p>
                                    )}
                                  </div>
                                </div>
                              )}

                              {doc.status === 'REVOKED' && (
                                <div className="flex items-start gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg mb-3">
                                  <FiSlash className="text-slate-400 flex-shrink-0 mt-0.5 text-sm" />
                                  <div>
                                    <p className="text-xs font-semibold text-slate-600">Document revoked</p>
                                    {doc.revokedAt && (
                                      <p className="text-[11px] text-slate-400 mt-0.5">Revoked on {new Date(doc.revokedAt).toLocaleDateString()}</p>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Hash */}
                              {doc.documentHash && (
                                <div className="flex items-center gap-2">
                                  <p className="text-[11px] text-slate-400 font-mono bg-slate-50 px-2 py-1 rounded truncate max-w-xs">
                                    {doc.documentHash.slice(0, 20)}…{doc.documentHash.slice(-8)}
                                  </p>
                                </div>
                              )}

                              {/* Blockchain link */}
                              {doc.transactionHash && (
                                <a href={`https://amoy.polygonscan.com/tx/${doc.transactionHash}`}
                                  target="_blank" rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 mt-2 text-xs text-violet-600 hover:text-violet-800 font-medium">
                                  <FiExternalLink className="text-xs" /> View on Polygonscan
                                </a>
                              )}
                            </div>

                            {/* Right: QR + actions */}
                            <div className="flex flex-col items-center gap-3 flex-shrink-0">
                              {doc.qrCodeUrl && doc.status === 'ISSUED' && (
                                <div className="flex flex-col items-center">
                                  <div className="w-[72px] h-[72px] border border-slate-200 rounded-lg overflow-hidden">
                                    <img src={doc.qrCodeUrl} alt="QR" className="w-full h-full" />
                                  </div>
                                  <p className="text-[10px] text-slate-400 mt-1">Scan to verify</p>
                                </div>
                              )}
                              <div className="flex flex-col gap-1.5">
                                {doc.storageUrl && (
                                  <a href={doc.storageUrl} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                                    <FiExternalLink className="text-xs" /> View
                                  </a>
                                )}
                                {doc.status === 'ISSUED' && doc.storageUrl && (
                                  <a href={doc.storageUrl} download target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200">
                                    <FiDownload className="text-xs" /> Download
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
