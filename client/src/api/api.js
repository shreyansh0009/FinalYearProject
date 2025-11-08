import axios from "axios";

// Create an Axios instance
const apiClient = axios.create({
  baseURL: "http://localhost:8000/api/v1",
  withCredentials: true, // This is important for sending cookies
});

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
  try {
    const response = await apiClient.patch(`/documents/approve/${documentId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// --- We will add all other API calls here ---

// export const loginUser = async (credentials) => { ... }
// export const uploadDocument = async (formData) => { ... }
