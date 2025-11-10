import axios from "axios";

// Create an Axios instance
const apiClient = axios.create({
  baseURL: "http://localhost:8000/api/v1",
  withCredentials: true, // This is important for sending cookies
});

// Add request interceptor to attach access token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Public verification - check if document exists by hash (no login required)
export const verifyDocument = async (hash) => {
  try {
    const response = await apiClient.post("/documents/verify", { hash });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Issuer approval - approve a pending document (requires login as issuer)
export const approveDocument = async (documentId) => {
  const response = await apiClient.patch(`/documents/approve/${documentId}`);
  return response.data;
};

// --- Authentication APIs ---

export const loginUser = async (credentials) => {
  const response = await apiClient.post("/users/login", credentials);
  return response.data;
};

export const logoutUser = async () => {
  const response = await apiClient.post("/users/logout");
  return response.data;
};

export const refreshAccessToken = async () => {
  const response = await apiClient.post("/users/refresh-accessToken");
  return response.data;
};

// --- Document APIs ---

export const uploadDocument = async (formData) => {
  const response = await apiClient.post("/documents/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const getPendingDocuments = async () => {
  const response = await apiClient.get("/documents/pending");
  return response.data;
};

export const getMyDocuments = async () => {
  const response = await apiClient.get("/documents/my-documents");
  return response.data;
};

export const rejectDocument = async (documentId, reason) => {
  const response = await apiClient.patch(`/documents/reject/${documentId}`, { reason });
  return response.data;
};

// --- Admin APIs ---

export const registerIssuer = async (issuerData) => {
  const response = await apiClient.post("/users/register-issuer", issuerData);
  return response.data;
};

export const createDepartment = async (departmentData) => {
  const response = await apiClient.post("/departments/createDept", departmentData);
  return response.data;
};

export const getAllDepartments = async () => {
  const response = await apiClient.get("/departments");
  return response.data;
};

export const getAllUsers = async () => {
  const response = await apiClient.get("/users/all");
  return response.data;
};

export const getAllDocuments = async () => {
  const response = await apiClient.get("/documents/all");
  return response.data;
};

// --- Issuer APIs ---

export const registerStudent = async (studentData) => {
  const response = await apiClient.post("/users/register-student", studentData);
  return response.data;
};

export const getMyStudents = async () => {
  const response = await apiClient.get("/users/my-students");
  return response.data;
};

export const getDepartmentStudents = async () => {
  const response = await apiClient.get("/users/department-students");
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await apiClient.get("/users/current");
  return response.data;
};
