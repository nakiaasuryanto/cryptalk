import React, { useState } from 'react';
import { apiFetch } from '../../lib/api.js';

export default function RegisterForm() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password minimal 8 karakter');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password tidak cocok');
      return;
    }

    try {
      const data = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password })
      });

      if (data.status === 'success') {
        window.location.href = '/login';
      } else {
        setError(data.message || 'Registrasi gagal');
      }
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan');
    }
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Register</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.field}>
          <label htmlFor="username" style={styles.label}>Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            style={styles.input}
            autoComplete="username"
            required
          />
        </div>
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
            autoComplete="new-password"
            required
          />
        </div>
        <div style={styles.field}>
          <label htmlFor="confirmPassword" style={styles.label}>Konfirmasi Password</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            style={styles.input}
            autoComplete="new-password"
            required
          />
        </div>
        {error && <div style={styles.error}>{error}</div>}
        <button type="submit" style={styles.button}>Register</button>
      </form>
      <p style={styles.link}>
        Sudah punya akun? <a href="/login" style={styles.a}>Login</a>
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
