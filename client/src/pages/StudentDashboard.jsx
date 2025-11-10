import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { logoutUser, uploadDocument, getMyDocuments, getCurrentUser } from '../api/api';

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('upload');
  const [myDocuments, setMyDocuments] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [uploadForm, setUploadForm] = useState({
    documentType: '',
    file: null
  });

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (activeTab === 'myDocuments') {
      loadMyDocuments();
    }
  }, [activeTab]);

  const loadCurrentUser = async () => {
    try {
      const res = await getCurrentUser();
      setCurrentUser(res.data);
    } catch (err) {
      console.error('Load user error:', err);
    }
  };

  const loadMyDocuments = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getMyDocuments();
      setMyDocuments(res.data || []);
    } catch (err) {
      console.error('Load error:', err);
      setError(err.response?.data?.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadForm({ ...uploadForm, file });
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('document', uploadForm.file); // Changed from 'file' to 'document' to match backend
      formData.append('documentType', uploadForm.documentType);
      
      console.log('Uploading document...');
      const response = await uploadDocument(formData);
      console.log('Upload response:', response);
      setSuccess('Document uploaded successfully! Awaiting approval.');
      setUploadForm({ documentType: '', file: null });
      const fileInput = document.getElementById('fileInput');
      if (fileInput) fileInput.value = '';
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.message || 'Failed to upload document');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      logout();
      navigate('/');
    } catch {
      logout();
      navigate('/');
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'ISSUED': return 'bg-green-100 text-green-800';
      case 'APPROVED': return 'bg-green-100 text-green-800'; // backward compatibility
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-green-600 to-emerald-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">Student Dashboard</h1>
              <p className="text-green-100 mt-1">Welcome, {currentUser?.fullName || user?.fullName || 'Student'}</p>
              <p className="text-green-50 text-sm">Email: {currentUser?.email || user?.email || 'N/A'} | Department: {currentUser?.department?.name || 'N/A'}</p>
            </div>
            <button onClick={handleLogout} className="px-6 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {['upload', 'myDocuments'].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === tab ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500'}`}>
                {tab === 'upload' ? 'Upload Document' : 'My Documents'}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">{error}</div>}
        {success && <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">{success}</div>}

        {activeTab === 'upload' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload Document for Verification</h2>
            <div className="bg-white rounded-lg shadow p-8 max-w-2xl mx-auto">
              <form onSubmit={handleUpload} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Document Type *</label>
                  <select value={uploadForm.documentType} onChange={(e) => setUploadForm({ ...uploadForm, documentType: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" required>
                    <option value="">Select Document Type</option>
                    <option value="Degree Certificate">Degree Certificate</option>
                    <option value="Marksheet">Marksheet</option>
                    <option value="Transcript">Transcript</option>
                    <option value="ID Card">ID Card</option>
                    <option value="Transfer Certificate">Transfer Certificate</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Choose File *</label>
                  <input id="fileInput" type="file" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" required />
                  <p className="mt-2 text-sm text-gray-500">Supported formats: PDF, JPG, PNG (Max: 10MB)</p>
                  {uploadForm.file && (
                    <p className="mt-2 text-sm text-green-600">Selected: {uploadForm.file.name}</p>
                  )}
                </div>

                <button type="submit" disabled={loading} 
                  className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-semibold">
                  {loading ? 'Uploading...' : '�� Upload Document'}
                </button>
              </form>

              <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">📋 Upload Instructions:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Ensure document is clear and readable</li>
                  <li>• Select correct document type</li>
                  <li>• Wait for issuer approval after upload</li>
                  <li>• Approved documents will be recorded on blockchain</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'myDocuments' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">My Documents</h2>
            {myDocuments.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <div className="text-6xl mb-4">📄</div>
                <p className="text-gray-500 text-lg mb-4">No documents uploaded yet</p>
                <button onClick={() => setActiveTab('upload')} 
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  Upload Your First Document
                </button>
              </div>
            ) : (
              <div className="grid gap-6">
                {myDocuments.map((doc) => (
                  <div key={doc._id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">{doc.documentName}</h3>
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(doc.status)}`}>
                            {doc.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <p className="font-medium text-gray-700">Uploaded:</p>
                            <p>{new Date(doc.createdAt).toLocaleDateString()}</p>
                          </div>
                          {doc.status === 'ISSUED' && doc.issuer && (
                            <div>
                              <p className="font-medium text-gray-700">Issued By:</p>
                              <p>{doc.issuer.fullName}</p>
                            </div>
                          )}
                          {doc.documentHash && (
                            <div className="col-span-2">
                              <p className="font-medium text-gray-700">Blockchain Hash:</p>
                              <p className="text-xs font-mono bg-gray-100 p-2 rounded mt-1 break-all">{doc.documentHash}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="ml-4 flex flex-col space-y-2">
                        {doc.storageUrl && (
                          <a href={doc.storageUrl} target="_blank" rel="noopener noreferrer"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center">
                            📄 View
                          </a>
                        )}
                        {doc.status === 'ISSUED' && (
                          <a href={doc.storageUrl} download className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-center">
                            ⬇ Download
                          </a>
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
  );
}
