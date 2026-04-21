import React, { useState } from 'react';
import { apiFetch } from '../../lib/api.js';
import { validateKey, encodeKeyForURL } from '../../lib/aes.js';

export default function CreateRoomModal({ onClose, onCreated }) {
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!validateKey(key)) {
      setError('Key harus tepat 16 karakter');
      return;
    }

    setLoading(true);

    try {
      // Hash key dengan SHA-256 untuk dikirim ke server
      const keyHash = await hashKey(key);

      const data = await apiFetch('/rooms/create', {
        method: 'POST',
        body: JSON.stringify({ name, key_hash: keyHash })
      });

      if (data.status === 'success') {
        // Simpan key asli ke sessionStorage
        sessionStorage.setItem(`room_key_${data.room.room_id}`, key);
        onCreated(data.room);
        onClose();
      } else {
        setError(data.message || 'Gagal membuat room');
      }
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }

  async function hashKey(key) {
    const encoder = new TextEncoder();
    const data = encoder.encode(key);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.title}>Buat Room Baru</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Nama Room</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              style={styles.input}
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>
              Key AES-128 (16 karakter)
              <span style={styles.counter}>{key.length}/16</span>
            </label>
            <input
              type="text"
              value={key}
              onChange={e => setKey(e.target.value)}
              style={styles.input}
              maxLength={16}
              placeholder="kriptografi123"
              required
            />
          </div>
          {error && <div style={styles.error}>{error}</div>}
          <div style={styles.actions}>
            <button type="button" onClick={onClose} style={styles.cancelBtn}>
              Batal
            </button>
            <button type="submit" disabled={loading} style={styles.submitBtn}>
              {loading ? 'Membuat...' : 'Buat Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    background: '#111',
    border: '1px solid #333',
    borderRadius: '8px',
    padding: '2rem',
    width: '400px',
    maxWidth: '90vw'
  },
  title: {
    color: '#00ff88',
    marginBottom: '1.5rem',
    textAlign: 'center'
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
    fontSize: '0.875rem',
    display: 'flex',
    justifyContent: 'space-between'
  },
  counter: {
    color: key => key.length === 16 ? '#00ff88' : '#888'
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
  actions: {
    display: 'flex',
    gap: '1rem',
    marginTop: '0.5rem'
  },
  cancelBtn: {
    flex: 1,
    padding: '0.75rem',
    background: '#333',
    color: '#e0e0e0',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  submitBtn: {
    flex: 1,
    padding: '0.75rem',
    background: '#00ff88',
    color: '#0a0a0a',
    border: 'none',
    borderRadius: '4px',
    fontWeight: 'bold',
    cursor: 'pointer'
  }
};
