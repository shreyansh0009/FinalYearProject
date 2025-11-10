import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  logoutUser, 
  createDepartment, 
  registerIssuer, 
  getAllDepartments,
  getAllUsers,
  getAllDocuments 
} from '../api/api';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [newDept, setNewDept] = useState({ name: '', code: '' });
  const [newIssuer, setNewIssuer] = useState({
    name: '',
    username: '',
    password: '',
    email: '',
    ethereumAddress: '',
    departmentId: ''
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'departments' || activeTab === 'createIssuer' || activeTab === 'overview') {
        const deptRes = await getAllDepartments();
        console.log('Departments response:', deptRes);
        setDepartments(deptRes.data || []);
      }
      if (activeTab === 'users' || activeTab === 'overview') {
        const userRes = await getAllUsers();
        console.log('Users response:', userRes);
        console.log('Users data:', userRes.data);
        setUsers(userRes.data || []);
      }
      if (activeTab === 'documents' || activeTab === 'overview') {
        const docRes = await getAllDocuments();
        console.log('Documents response:', docRes);
        setDocuments(docRes.data || []);
      }
    } catch (err) {
      console.error('Load data error:', err);
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      await createDepartment({ name: newDept.name, shortCode: newDept.code });
      setSuccess('Department created successfully!');
      setNewDept({ name: '', code: '' });
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create department');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIssuer = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      // Map frontend field names to backend expected field names
      const issuerData = {
        fullName: newIssuer.name,
        userName: newIssuer.username,
        email: newIssuer.email,
        password: newIssuer.password,
        ethereumAddress: newIssuer.ethereumAddress,
        department: newIssuer.departmentId,
        userType: 'ISSUER'
      };
      
      await registerIssuer(issuerData);
      setSuccess('Issuer registered successfully!');
      setNewIssuer({ name: '', username: '', password: '', email: '', ethereumAddress: '', departmentId: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register issuer');
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-purple-600 to-indigo-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-purple-100 mt-1">Welcome, {user?.name || user?.fullName || 'Admin'}</p>
            </div>
            <button onClick={handleLogout} className="px-6 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 overflow-x-auto">
            {['overview', 'departments', 'createIssuer', 'users', 'documents'].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === tab ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500'}`}>
                {tab === 'createIssuer' ? 'Create Issuer' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">{error}</div>}
        {success && <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">{success}</div>}

        {activeTab === 'overview' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">System Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg shadow-lg p-6 text-white">
                <p className="text-purple-100 text-sm">Departments</p>
                <p className="text-3xl font-bold mt-2">{departments.length}</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg shadow-lg p-6 text-white">
                <p className="text-blue-100 text-sm">Users</p>
                <p className="text-3xl font-bold mt-2">{users.length}</p>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-lg shadow-lg p-6 text-white">
                <p className="text-green-100 text-sm">Documents</p>
                <p className="text-3xl font-bold mt-2">{documents.length}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'departments' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Manage Departments</h2>
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Create Department</h3>
              <form onSubmit={handleCreateDepartment} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" value={newDept.name} onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                    className="px-4 py-2 border rounded-lg" placeholder="Department Name" required />
                  <input type="text" value={newDept.code} onChange={(e) => setNewDept({ ...newDept, code: e.target.value })}
                    className="px-4 py-2 border rounded-lg" placeholder="Code" required />
                </div>
                <button type="submit" disabled={loading} className="px-6 py-2 bg-purple-600 text-white rounded-lg">
                  {loading ? 'Creating...' : 'Create'}
                </button>
              </form>
            </div>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {departments.map((dept) => (
                    <tr key={dept._id}>
                      <td className="px-6 py-4 text-sm">{dept.name}</td>
                      <td className="px-6 py-4 text-sm">{dept.shortCode || dept.code}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'createIssuer' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Register Issuer</h2>
            <div className="bg-white rounded-lg shadow p-6">
              <form onSubmit={handleCreateIssuer} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" value={newIssuer.name} onChange={(e) => setNewIssuer({ ...newIssuer, name: e.target.value })}
                    className="px-4 py-2 border rounded-lg" placeholder="Full Name" required />
                  <input type="text" value={newIssuer.username} onChange={(e) => setNewIssuer({ ...newIssuer, username: e.target.value })}
                    className="px-4 py-2 border rounded-lg" placeholder="Username" required />
                  <input type="email" value={newIssuer.email} onChange={(e) => setNewIssuer({ ...newIssuer, email: e.target.value })}
                    className="px-4 py-2 border rounded-lg" placeholder="Email" required />
                  <input type="password" value={newIssuer.password} onChange={(e) => setNewIssuer({ ...newIssuer, password: e.target.value })}
                    className="px-4 py-2 border rounded-lg" placeholder="Password" required />
                  <input type="text" value={newIssuer.ethereumAddress} onChange={(e) => setNewIssuer({ ...newIssuer, ethereumAddress: e.target.value })}
                    className="px-4 py-2 border rounded-lg" placeholder="Ethereum Address (0x...)" required />
                  <select value={newIssuer.departmentId} onChange={(e) => setNewIssuer({ ...newIssuer, departmentId: e.target.value })}
                    className="px-4 py-2 border rounded-lg" required>
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept._id} value={dept._id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" disabled={loading} className="px-6 py-2 bg-purple-600 text-white rounded-lg">
                  {loading ? 'Registering...' : 'Register'}
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-8">
            {console.log('Rendering users tab. Users array:', users)}
            {console.log('Issuers count:', users.filter(usr => usr.userType === 'ISSUER').length)}
            {console.log('Students count:', users.filter(usr => usr.userType === 'STUDENT').length)}
            {/* Issuers Section */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Issuers</h2>
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-blue-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ethereum Address</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(() => {
                      const issuers = users.filter(usr => usr.userType === 'ISSUER');
                      return issuers.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-6 py-8 text-center text-gray-500">No issuers found</td>
                        </tr>
                      ) : (
                        issuers.map((usr) => (
                          <tr key={usr._id}>
                            <td className="px-6 py-4 text-sm font-medium">{usr.fullName}</td>
                            <td className="px-6 py-4 text-sm">{usr.email}</td>
                            <td className="px-6 py-4 text-sm">{usr.username}</td>
                            <td className="px-6 py-4 text-sm">{usr.department?.name || 'N/A'}</td>
                            <td className="px-6 py-4 text-xs font-mono text-gray-600">{usr.ethereumAddress || 'N/A'}</td>
                          </tr>
                        ))
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Students Section */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Students</h2>
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-green-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(() => {
                      const students = users.filter(usr => usr.userType === 'STUDENT');
                      return students.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="px-6 py-8 text-center text-gray-500">No students found</td>
                        </tr>
                      ) : (
                        students.map((usr) => (
                          <tr key={usr._id}>
                            <td className="px-6 py-4 text-sm font-medium">{usr.fullName}</td>
                            <td className="px-6 py-4 text-sm">{usr.username}</td>
                            <td className="px-6 py-4 text-sm">{usr.email}</td>
                            <td className="px-6 py-4 text-sm">{usr.department?.name || 'N/A'}</td>
                          </tr>
                        ))
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">All Documents</h2>
            <p className="text-gray-600 mb-4">Complete overview of all documents in the system</p>
            {documents.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <div className="text-6xl mb-4">📄</div>
                <p className="text-gray-500 text-lg">No documents found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {documents.map((doc) => (
                  <div key={doc._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{doc.documentName}</h3>
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                              doc.status === 'ISSUED' ? 'bg-green-100 text-green-800' : 
                              doc.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {doc.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 mt-4">
                            <div>
                              <p className="text-xs text-gray-500 uppercase font-medium mb-1">Student Details</p>
                              <p className="text-sm text-gray-900 font-medium">{doc.owner?.fullName || doc.owner?.username || 'Unknown'}</p>
                              <p className="text-xs text-gray-600">{doc.owner?.email || 'N/A'}</p>
                              <p className="text-xs text-gray-600 mt-1">
                                <span className="font-medium">Department:</span> {doc.department?.name || 'N/A'} ({doc.department?.shortCode || 'N/A'})
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 uppercase font-medium mb-1">Timeline</p>
                              <div className="space-y-1">
                                <p className="text-sm text-gray-900">
                                  <span className="font-medium">Uploaded:</span> {new Date(doc.createdAt).toLocaleString()}
                                </p>
                                {doc.issuedAt && (
                                  <p className="text-sm text-green-700">
                                    <span className="font-medium">Issued:</span> {new Date(doc.issuedAt).toLocaleString()}
                                  </p>
                                )}
                                {doc.rejectedAt && (
                                  <p className="text-sm text-red-700">
                                    <span className="font-medium">Rejected:</span> {new Date(doc.rejectedAt).toLocaleString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs text-gray-500 uppercase font-medium mb-1">Issuer Details</p>
                                {doc.issuer ? (
                                  <>
                                    <p className="text-sm text-gray-900 font-medium">{doc.issuer?.fullName || doc.issuer?.username || 'N/A'}</p>
                                    <p className="text-xs text-gray-600">{doc.issuer?.email || 'N/A'}</p>
                                  </>
                                ) : (
                                  <p className="text-sm text-gray-500 italic">Not yet processed</p>
                                )}
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 uppercase font-medium mb-1">Document Info</p>
                                <p className="text-xs text-gray-600">
                                  <span className="font-medium">Hash:</span> <span className="font-mono text-xs break-all">{doc.documentHash?.substring(0, 16)}...</span>
                                </p>
                                {doc.rejectionReason && (
                                  <p className="text-xs text-red-600 mt-1">
                                    <span className="font-medium">Reason:</span> {doc.rejectionReason}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="ml-4">
                          {doc.storageUrl && (
                            <a 
                              href={doc.storageUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              <span className="mr-2">📄</span>
                              View Document
                            </a>
                          )}
                        </div>
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
