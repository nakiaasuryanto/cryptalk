import React, { useState } from 'react';
import { apiFetch } from '../../lib/api.js';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    try {
      console.log('Attempting login with:', email);
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      console.log('Login response:', data);

      if (data.status === 'success') {
        localStorage.setItem('aes_token', data.token);
        localStorage.setItem('aes_user', JSON.stringify(data.user));
        window.location.href = '/dashboard';
      } else {
        setError(data.message || 'Login gagal');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Terjadi kesalahan');
    }
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Login</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.field}>
          <label htmlFor="email" style={styles.label}>Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={styles.input}
            autoComplete="email"
            required
          />
        </div>
        <div style={styles.field}>
          <label htmlFor="password" style={styles.label}>Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={styles.input}
            autoComplete="current-password"
            required
          />
        </div>
        {error && <div style={styles.error}>{error}</div>}
        <button type="submit" style={styles.button}>Login</button>
      </form>
      <p style={styles.link}>
        Belum punya akun? <a href="/register" style={styles.a}>Register</a>
      </p>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '400px',
    margin: '0 auto',
    padding: '2rem',
    background: '#111',
    borderRadius: '8px',
    color: '#e0e0e0'
  },
  title: {
    color: '#00ff88',
    textAlign: 'center',
    marginBottom: '1.5rem'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem'
  },
  label: {
    color: '#888',
    fontSize: '0.875rem'
  },
  input: {
    padding: '0.75rem',
    background: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '4px',
    color: '#e0e0e0',
    fontSize: '1rem'
  },
  error: {
    color: '#ff4444',
    fontSize: '0.875rem',
    padding: '0.5rem',
    background: '#2a1a1a',
    borderRadius: '4px'
  },
  button: {
    padding: '0.75rem',
    background: '#00ff88',
    color: '#0a0a0a',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '0.5rem'
  },
  link: {
    textAlign: 'center',
    marginTop: '1rem',
    color: '#888'
  },
  a: {
    color: '#00ff88'
  }
};
