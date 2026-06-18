// Centralized, env-driven API configuration.
// Override per environment via Vite env vars (frontend/.env):
//   VITE_API_ORIGIN=https://api.yourdomain.com
//   VITE_API_URL=https://api.yourdomain.com/api   (optional; defaults to ORIGIN + /api)
export const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || 'http://localhost:8080';
export const API_BASE_URL = import.meta.env.VITE_API_URL || `${API_ORIGIN}/api`;
