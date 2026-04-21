import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api.js';
import { decodeKeyFromURL } from '../../lib/aes.js';

export default function InviteHandler({ token }) {
  const [status, setStatus] = useState('loading');
  const [roomInfo, setRoomInfo] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    handleInvite();
  }, [token]);

  async function handleInvite() {
    try {
      // Baca key dari URL fragment
      const hash = window.location.hash.slice(1);
      let decodedKey = null;
      if (hash) {
        try {
          decodedKey = decodeKeyFromURL(hash);
        } catch (e) {
          // invalid key encoding
        }
      }

      // Cek apakah user sudah login
      const token = localStorage.getItem('aes_token');
      if (!token) {
        window.location.href = `/login?redirect=/invite/${token}#${hash || ''}`;
        return;
      }

      // Validasi token invite
      const data = await apiFetch(`/invite/${token}`);

      if (data.status === 'valid') {
        setRoomInfo(data);
        setStatus('valid');
        // Simpan key ke sessionStorage nanti saat gabung
        if (decodedKey) {
          sessionStorage.setItem(`room_key_${data.room_id}`, decodedKey);
        }
      } else {
        setStatus('invalid');
        setError(data.message || 'Link tidak valid atau sudah digunakan');
      }
    } catch (err) {
      setStatus('invalid');
      setError(err.message || 'Terjadi kesalahan');
    }
  }

  async function handleJoin() {
    try {
      const data = await apiFetch(`/invite/${token}/use`, {
        method: 'POST'
      });

      if (data.status === 'success') {
        window.location.href = `/chat/${data.room_id}`;
      } else {
        setError(data.message || 'Gagal bergabung');
      }
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan');
    }
  }

  if (status === 'loading') {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Memuat...</div>
      </div>
    );
  }

  if (status === 'invalid') {
    return (
      <div style={styles.container}>
        <div style={styles.errorBox}>
          <span style={styles.errorIcon}>⚠️</span>
          <p style={styles.errorText}>{error || 'Link tidak valid atau sudah digunakan'}</p>
          <a href="/dashboard" style={styles.link}>Kembali ke Dashboard</a>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Undangan Room</h2>
        <div style={styles.info}>
          <p style={styles.roomName}>Room: <strong>{roomInfo?.room_name}</strong></p>
          <p style={styles.roomMeta}>
            Anda diundang untuk bergabung ke room enkripsi ini.
          </p>
        </div>
        <button onClick={handleJoin} style={styles.joinBtn}>
          Gabung Room
        </button>
        <a href="/dashboard" style={styles.cancelLink}>Batal</a>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0a0a0a',
    padding: '1rem'
  },
  loading: {
    color: '#888'
  },
  errorBox: {
    background: '#111',
    border: '1px solid #ff4444',
    borderRadius: '8px',
    padding: '2rem',
    textAlign: 'center',
    maxWidth: '400px'
  },
  errorIcon: {
    fontSize: '2rem',
    display: 'block',
    marginBottom: '1rem'
  },
  errorText: {
    color: '#ff4444',
    marginBottom: '1rem'
  },
  link: {
    color: '#00ff88'
  },
  card: {
    background: '#111',
    border: '1px solid #222',
    borderRadius: '8px',
    padding: '2rem',
    width: '400px',
    maxWidth: '90vw',
    textAlign: 'center'
  },
  title: {
    color: '#00ff88',
    marginBottom: '1.5rem'
  },
  info: {
    marginBottom: '1.5rem'
  },
  roomName: {
    color: '#e0e0e0',
    fontSize: '1.1rem'
  },
  roomMeta: {
    color: '#888',
    marginTop: '0.5rem'
  },
  joinBtn: {
    width: '100%',
    padding: '0.75rem',
    background: '#00ff88',
    color: '#0a0a0a',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginBottom: '0.75rem'
  },
  cancelLink: {
    color: '#888',
    fontSize: '0.875rem'
  }
};
