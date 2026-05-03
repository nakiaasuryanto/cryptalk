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
        // Check for redirect URL
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get('redirect');
        const hash = window.location.hash;
        window.location.href = redirect ? redirect + hash : '/dashboard';
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
      <img src="/LOGO_CT.png" alt="Cryptalk" style={{height: '60px', marginBottom: '1rem', display: 'block', marginLeft: 'auto', marginRight: 'auto'}} />
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
    width: '100%',
    maxWidth: '480px',
    margin: '0 auto',
    padding: 'clamp(1.5rem, 5vw, 2.5rem)',
    background: '#DCCCAC',
    borderRadius: '24px',
    color: '#3d3d3d',
    boxShadow: '0 4px 24px rgba(0,0,0,0.1)'
  },
  title: {
    color: '#546B41',
    textAlign: 'center',
    marginBottom: '1.5rem',
    fontWeight: '700'
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
    color: '#6b6b6b',
    fontSize: '0.875rem',
    fontWeight: '600'
  },
  input: {
    padding: '0.875rem',
    background: '#ffffff',
    border: '2px solid #c4b494',
    borderRadius: '10px',
    color: '#3d3d3d',
    fontSize: '1rem'
  },
  error: {
    color: '#c45a5a',
    fontSize: '0.875rem',
    padding: '0.75rem',
    background: '#f8e8e8',
    borderRadius: '10px',
    textAlign: 'center'
  },
  button: {
    padding: '0.875rem',
    background: '#546B41',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '1rem',
    fontWeight: '700',
    cursor: 'pointer',
    marginTop: '0.5rem'
  },
  link: {
    textAlign: 'center',
    marginTop: '1rem',
    color: '#6b6b6b'
  },
  a: {
    color: '#546B41',
    fontWeight: '600'
  }
};
