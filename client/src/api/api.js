import axios from "axios";

// Create an Axios instance
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1",
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

// Add response interceptor to handle 401 errors with token refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retried, try to refresh the token
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't retry login or refresh requests
      if (originalRequest.url?.includes('/login') || originalRequest.url?.includes('/refresh-accessToken')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue the request until refresh is done
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await apiClient.post("/users/refresh-accessToken", {
          refreshToken: localStorage.getItem("refreshToken"),
        });
        const { accessToken, refreshToken } = response.data.data;

        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);

        processQueue(null, accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Clear auth state and redirect to login
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Public verification - check if document exists by hash (no login required)
export const verifyDocument = async (hash) => {
  const response = await apiClient.post("/documents/verify", { hash });
  return response.data;
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

export const revokeDocument = async (documentId) => {
  const response = await apiClient.patch(`/documents/revoke/${documentId}`);
  return response.data;
};

// Called after issuer signs issueDocument() directly from their wallet
export const approveDocumentDirect = async (documentId, txHash) => {
  const response = await apiClient.patch(`/documents/approve-direct/${documentId}`, { txHash });
  return response.data;
};

export const getAnalytics = async () => {
  const response = await apiClient.get("/documents/analytics");
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
