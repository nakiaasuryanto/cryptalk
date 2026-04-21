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
      const authToken = localStorage.getItem('aes_token');
      if (!authToken) {
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
          <span style={styles.errorIcon}>:(</span>
          <p style={styles.errorText}>{error || 'Link tidak valid atau sudah digunakan'}</p>
          <a href="/dashboard" style={styles.link}>Kembali ke Dashboard</a>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <img src="/LOGO_CT.png" alt="Cryptalk" style={{height: '50px', marginBottom: '1rem'}} />
        <div style={styles.info}>
          <p style={styles.roomName}>Room: <strong>{roomInfo?.room_name}</strong></p>
          <p style={styles.roomMeta}>
            Kamu diundang untuk bergabung ke room ini!
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
    background: '#FFF8EC',
    padding: '1rem'
  },
  loading: {
    color: '#6b6b6b'
  },
  errorBox: {
    background: '#DCCCAC',
    border: '2px solid #c45a5a',
    borderRadius: '20px',
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
    color: '#c45a5a',
    marginBottom: '1rem'
  },
  link: {
    color: '#546B41',
    fontWeight: '600'
  },
  card: {
    background: '#DCCCAC',
    borderRadius: '20px',
    padding: '2rem',
    width: '400px',
    maxWidth: '90vw',
    textAlign: 'center',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
  },
  title: {
    color: '#546B41',
    marginBottom: '1.5rem',
    fontWeight: '700'
  },
  info: {
    marginBottom: '1.5rem'
  },
  roomName: {
    color: '#3d3d3d',
    fontSize: '1.1rem'
  },
  roomMeta: {
    color: '#6b6b6b',
    marginTop: '0.5rem'
  },
  joinBtn: {
    width: '100%',
    padding: '0.875rem',
    background: '#546B41',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '1rem',
    fontWeight: '700',
    cursor: 'pointer',
    marginBottom: '0.75rem'
  },
  cancelLink: {
    color: '#6b6b6b',
    fontSize: '0.875rem'
  }
};
