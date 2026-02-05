// services/api.js
import axios from "axios";

const baseURL =
  import.meta.env.MODE === "production"
    ? import.meta.env.VITE_PRODUCAO
    : import.meta.env.VITE_LOCALHOST;

const api = axios.create({
  baseURL: baseURL,
  withCredentials: true // IMPORTANTE para enviar cookies
});

// Interceptor de resposta para erro 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config; 
    if (error.response?.status === 401 && originalRequest.url !== "/usuario/me") {
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;

// services/api.js
/*import axios from "axios";
import {jwtDecode} from "jwt-decode";
const baseURL =
  import.meta.env.MODE === "production"
    ? import.meta.env.VITE_PRODUCAO
    : import.meta.env.VITE_LOCALHOST;
const api = axios.create({
  baseURL: baseURL,
});

// Interceptor para verificar expiração
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    const decoded = jwtDecode(token);
    if (decoded.exp * 1000 < Date.now()) {
      localStorage.removeItem("token");
      window.location.href = "/login";
      throw new axios.Cancel("Token expirado");
    }

    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Interceptor de resposta para erro 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
*/