// src/api/axiosInstance.ts
import axios from 'axios';
// import { TTaskEntity } from './types';

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api', // Use environment variable for base URL
  timeout: 10000, // Request timeout in milliseconds
  headers: {
    'Content-Type': 'application/json',
    // Add any other default headers here (e.g., Authorization)
  },
});
// src/api/axiosInstance.ts (continued)

// Request Interceptor
axiosInstance.interceptors.request.use(
    (config) => {
      // Example: Add an authorization token
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response Interceptor
  axiosInstance.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      // Example: Handle 401 Unauthorized errors
      if (error.response && error.response.status === 401) {
        // Redirect to login page or refresh token
        console.log('Unauthorized access, redirecting to login...');
      }
      return Promise.reject(error);
    }
  );
export default axiosInstance;