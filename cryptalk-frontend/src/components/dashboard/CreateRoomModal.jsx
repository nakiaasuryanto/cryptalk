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
        <h2 style={styles.title}>Buat Room</h2>
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
              <span style={{color: key.length === 16 ? '#546B41' : '#6b6b6b'}}>{key.length}/16</span>
            </label>
            <input
              type="text"
              value={key}
              onChange={e => setKey(e.target.value)}
              style={styles.input}
              maxLength={16}
              placeholder="rahasia12345678"
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
    background: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    background: '#DCCCAC',
    borderRadius: '20px',
    padding: '2rem',
    width: '400px',
    maxWidth: '90vw',
    boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
  },
  title: {
    color: '#546B41',
    marginBottom: '1.5rem',
    textAlign: 'center',
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
    display: 'flex',
    justifyContent: 'space-between',
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
  actions: {
    display: 'flex',
    gap: '1rem',
    marginTop: '0.5rem'
  },
  cancelBtn: {
    flex: 1,
    padding: '0.875rem',
    background: '#c4b494',
    color: '#3d3d3d',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '600'
  },
  submitBtn: {
    flex: 1,
    padding: '0.875rem',
    background: '#546B41',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontWeight: '700',
    cursor: 'pointer'
  }
};
