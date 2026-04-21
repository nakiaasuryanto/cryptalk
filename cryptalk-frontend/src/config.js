// API Configuration - exposed to client
const API_CONFIG = {
  BASE_URL: import.meta.env.PUBLIC_API_URL || 'http://localhost:5001',
  FRONTEND_URL: import.meta.env.PUBLIC_FRONTEND_URL || 'http://localhost:4321'
};

export default API_CONFIG;
