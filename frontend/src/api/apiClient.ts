import axios from 'axios';

const apiClient = axios.create({
  // The base URL is prefixed to all requests
  // Thanks to the proxy, this will be forwarded to http://localhost:3000/api
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the token in headers
apiClient.interceptors.request.use(
  (config) => {
    // Retrieve the token from local storage
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default apiClient;

// Add a response interceptor to handle auth expiry
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      try {
        localStorage.removeItem('token');
        // Optionally clear any cached user info
        localStorage.removeItem('user');
      } catch {}
      // Redirect to sign-in
      if (typeof window !== 'undefined') {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  },
);
