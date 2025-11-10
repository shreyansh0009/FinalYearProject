import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { logoutUser, getPendingDocuments, approveDocument, registerStudent, getMyStudents, getDepartmentStudents, getCurrentUser } from '../api/api';

export default function IssuerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingDocs, setPendingDocs] = useState([]);
  const [myStudents, setMyStudents] = useState([]);
  const [departmentStudents, setDepartmentStudents] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [newStudent, setNewStudent] = useState({
    name: '',
    username: '',
    password: '',
    email: ''
  });

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadCurrentUser = async () => {
    try {
      const res = await getCurrentUser();
      setCurrentUser(res.data);
    } catch (err) {
      console.error('Load user error:', err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'pending') {
        const res = await getPendingDocuments();
        setPendingDocs(res.data || []);
      }
      if (activeTab === 'myStudents') {
        const studentsRes = await getMyStudents();
        setMyStudents(studentsRes.data || []);
      }
      if (activeTab === 'departmentStudents') {
        const deptStudentsRes = await getDepartmentStudents();
        setDepartmentStudents(deptStudentsRes.data || []);
      }
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (documentId) => {
    try {
      await approveDocument(documentId);
      setSuccess('Document approved successfully!');
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve document');
    }
  };

  const handleRegisterStudent = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      // Use issuer's department for student registration
      const studentData = {
        fullName: newStudent.name,
        userName: newStudent.username,
        email: newStudent.email,
        password: newStudent.password,
        department: currentUser?.department?._id || user?.department?._id || user?.department,
        userType: 'STUDENT'
      };
      
      await registerStudent(studentData);
      setSuccess('Student registered successfully!');
      setNewStudent({ name: '', username: '', password: '', email: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register student');
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
      <header className="bg-gradient-to-r from-blue-600 to-cyan-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">Issuer Dashboard</h1>
              <p className="text-blue-100 mt-1">Welcome, {currentUser?.fullName || user?.fullName || 'Issuer'}</p>
              <p className="text-blue-50 text-sm">Email: {currentUser?.email || user?.email || 'N/A'} | Department: {currentUser?.department?.name || 'N/A'}</p>
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
            {['pending', 'departmentStudents', 'myStudents', 'registerStudent'].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'}`}>
                {tab === 'pending' ? 'Pending Documents' : 
                 tab === 'departmentStudents' ? 'Department Students' :
                 tab === 'myStudents' ? 'My Students' : 'Register Student'}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">{error}</div>}
        {success && <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">{success}</div>}

        {activeTab === 'pending' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Pending Documents for Approval</h2>
            {pendingDocs.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-500 text-lg">No pending documents</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {pendingDocs.map((doc) => (
                  <div key={doc._id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{doc.documentName}</h3>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p><span className="font-medium">Student:</span> {doc.owner?.fullName || doc.owner?.username}</p>
                          <p><span className="font-medium">Email:</span> {doc.owner?.email}</p>
                          <p><span className="font-medium">Department:</span> {doc.department?.name || 'N/A'}</p>
                          <p><span className="font-medium">Uploaded:</span> {new Date(doc.createdAt).toLocaleString()}</p>
                          {doc.storageUrl && (
                            <a href={doc.storageUrl} target="_blank" rel="noopener noreferrer" 
                              className="inline-block mt-2 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                              📄 View Document
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="ml-4 flex flex-col space-y-2">
                        <button onClick={() => handleApprove(doc._id)}
                          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                          ✓ Approve
                        </button>
                        <button className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                          ✕ Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'departmentStudents' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">All Students in Your Department</h2>
            <p className="text-gray-600 mb-4">View all students and their documents in your department</p>
            {departmentStudents.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <div className="text-6xl mb-4">👥</div>
                <p className="text-gray-500 text-lg">No students in your department yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {departmentStudents.map((student) => (
                  <div key={student._id} className="bg-white rounded-lg shadow">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-900">{student.fullName || student.username}</h3>
                          <p className="text-sm text-gray-600">Email: {student.email}</p>
                          <p className="text-sm text-gray-600">Department: {student.department?.name} ({student.department?.shortCode})</p>
                        </div>
                        <div className="flex gap-4 text-center">
                          <div className="px-4 py-2 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">{student.totalDocuments || 0}</div>
                            <div className="text-xs text-gray-600">Total</div>
                          </div>
                          <div className="px-4 py-2 bg-yellow-50 rounded-lg">
                            <div className="text-2xl font-bold text-yellow-600">{student.pendingDocuments || 0}</div>
                            <div className="text-xs text-gray-600">Pending</div>
                          </div>
                          <div className="px-4 py-2 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">{student.issuedDocuments || 0}</div>
                            <div className="text-xs text-gray-600">Issued</div>
                          </div>
                          <div className="px-4 py-2 bg-red-50 rounded-lg">
                            <div className="text-2xl font-bold text-red-600">{student.rejectedDocuments || 0}</div>
                            <div className="text-xs text-gray-600">Rejected</div>
                          </div>
                        </div>
                      </div>

                      {/* Toggle button for document list */}
                      <button
                        onClick={() => setExpandedStudent(expandedStudent === student._id ? null : student._id)}
                        className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 flex justify-between items-center"
                      >
                        <span>{expandedStudent === student._id ? '▼ Hide' : '▶ Show'} Documents ({student.documents?.length || 0})</span>
                      </button>

                      {/* Expanded document list */}
                      {expandedStudent === student._id && student.documents && student.documents.length > 0 && (
                        <div className="mt-4 border-t pt-4">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Document Name</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uploaded</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issued Date</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issued By</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {student.documents.map((doc) => (
                                <tr key={doc._id}>
                                  <td className="px-4 py-3 text-sm text-gray-900">{doc.documentName}</td>
                                  <td className="px-4 py-3 text-sm">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                      doc.status === 'ISSUED' ? 'bg-green-100 text-green-800' :
                                      doc.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-red-100 text-red-800'
                                    }`}>
                                      {doc.status}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600">
                                    {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : 'N/A'}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600">
                                    {doc.issuedAt ? new Date(doc.issuedAt).toLocaleDateString() : 'N/A'}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600">
                                    {doc.issuer?.fullName || doc.issuer?.username || 'N/A'}
                                  </td>
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

        {activeTab === 'myStudents' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">My Registered Students</h2>
            {myStudents.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <div className="text-6xl mb-4">👥</div>
                <p className="text-gray-500 text-lg">No students registered yet</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Docs</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pending</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issued</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rejected</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {myStudents.map((student) => {
                      const totalDocs = student.documents?.length || 0;
                      const pendingDocs = student.documents?.filter(doc => doc.status === 'PENDING').length || 0;
                      const issuedDocs = student.documents?.filter(doc => doc.status === 'ISSUED').length || 0;
                      const rejectedDocs = student.documents?.filter(doc => doc.status === 'REJECTED').length || 0;
                      
                      return (
                        <tr key={student._id}>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{student.fullName || student.username}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{student.email}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{student.department?.name || 'N/A'}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                              {totalDocs}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              {pendingDocs}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              {issuedDocs}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                              {rejectedDocs}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'registerStudent' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Register New Student</h2>
            <p className="text-gray-600 mb-4">Registering student in: <span className="font-semibold text-blue-600">{currentUser?.department?.name || 'Your Department'}</span></p>
            <div className="bg-white rounded-lg shadow p-6">
              <form onSubmit={handleRegisterStudent} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" value={newStudent.name} onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                    className="px-4 py-2 border rounded-lg" placeholder="Full Name" required />
                  <input type="text" value={newStudent.username} onChange={(e) => setNewStudent({ ...newStudent, username: e.target.value })}
                    className="px-4 py-2 border rounded-lg" placeholder="Username" required />
                  <input type="email" value={newStudent.email} onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                    className="px-4 py-2 border rounded-lg" placeholder="Email" required />
                  <input type="password" value={newStudent.password} onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
                    className="px-4 py-2 border rounded-lg" placeholder="Password" required />
                </div>
                <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  {loading ? 'Registering...' : 'Register Student'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
