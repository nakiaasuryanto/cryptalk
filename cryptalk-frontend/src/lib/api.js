import API_CONFIG from '../config.js';

export async function apiFetch(endpoint, options = {}) {
  try {
    const token = localStorage.getItem('aes_token');

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    if (response.status === 401) {
      localStorage.removeItem('aes_token');
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    return await response.json();
  } catch (error) {
    throw new Error(error.message || 'Network error');
  }
}
