import axios from "axios";

// Shared axios instance. baseURL comes from the Vite env (the app reads
// VITE_API_BASE_URL everywhere); the previous `../config/api` import pointed at
// a file that does not exist, which left this instance unusable.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach the bearer token (sessionStorage) to every request.
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalize the backend's structured error shape `{ message, ref }`.
// Existing callers already read `err.message`; this also surfaces the server
// correlation id as `err.ref` (and the status as `err.status`) without changing
// any UI. Falls back gracefully for non-JSON bodies and network errors.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const data = error?.response?.data;
    error.ref = data?.ref ?? null;
    error.status = error?.response?.status ?? null;
    error.message =
      (data && (data.message || data.error)) ||
      error.message ||
      "Something went wrong. Please try again.";
    return Promise.reject(error);
  },
);

export default api;
