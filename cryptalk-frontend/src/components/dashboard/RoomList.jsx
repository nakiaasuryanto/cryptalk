import React, { useState } from 'react';
import { apiFetch } from '../../lib/api.js';
import { encodeKeyForURL } from '../../lib/aes.js';
import API_CONFIG from '../../config.js';
import CreateRoomModal from './CreateRoomModal.jsx';

export default function RoomList() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [inviteLinks, setInviteLinks] = useState({});
  const [error, setError] = useState('');
  const [user, setUser] = useState({});

  React.useEffect(() => {
    setUser(JSON.parse(localStorage.getItem('aes_user') || '{}'));
    fetchRooms();
  }, []);

  async function fetchRooms() {
    setLoading(true);
    try {
      const data = await apiFetch('/rooms');
      if (data.status === 'success') {
        setRooms(data.rooms || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleInvite(room) {
    try {
      const data = await apiFetch('/invite/generate', {
        method: 'POST',
        body: JSON.stringify({ room_id: room.room_id })
      });

      if (data.status === 'success') {
        const key = sessionStorage.getItem(`room_key_${room.room_id}`);
        const encodedKey = key ? encodeKeyForURL(key) : '';
        const inviteLink = `${API_CONFIG.FRONTEND_URL}/invite/${data.token}#${encodedKey}`;
        setInviteLinks(prev => ({ ...prev, [room.room_id]: inviteLink }));
      }
    } catch (err) {
      setError(err.message);
    }
  }

  function handleRoomCreated(room) {
    setRooms(prev => [...prev, room]);
    setShowModal(false);
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Dashboard</h2>
        <button onClick={() => setShowModal(true)} style={styles.createBtn}>
          + Buat Room
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {loading ? (
        <div style={styles.loading}>Memuat...</div>
      ) : rooms.length === 0 ? (
        <div style={styles.empty}>Belum ada room. Buat room pertama!</div>
      ) : (
        <div style={styles.list}>
          {rooms.map(room => (
            <div key={room.room_id} style={styles.roomCard}>
              <div style={styles.roomInfo}>
                <span style={styles.roomName}>{room.name}</span>
                <span style={styles.roomMeta}>
                  Host: {room.host_id === user.id ? 'Kamu' : `User ${room.host_id}`}
                </span>
              </div>
              <div style={styles.roomActions}>
                <button
                  onClick={() => window.location.href = `/chat/${room.room_id}`}
                  style={styles.enterBtn}
                >
                  Masuk
                </button>
                {room.host_id === user.id && (
                  <button onClick={() => handleInvite(room)} style={styles.inviteBtn}>
                    Invite
                  </button>
                )}
              </div>
              {inviteLinks[room.room_id] && (
                <div style={styles.inviteBox}>
                  <span style={styles.inviteLabel}>Link Invite:</span>
                  <code style={styles.inviteLink}>{inviteLinks[room.room_id]}</code>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <CreateRoomModal
          onClose={() => setShowModal(false)}
          onCreated={handleRoomCreated}
        />
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '1rem',
    maxWidth: '800px',
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem'
  },
  title: {
    color: '#00ff88',
    margin: 0
  },
  createBtn: {
    padding: '0.5rem 1rem',
    background: '#00ff88',
    color: '#0a0a0a',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  error: {
    color: '#ff4444',
    padding: '0.75rem',
    background: '#2a1a1a',
    borderRadius: '4px',
    marginBottom: '1rem'
  },
  loading: {
    color: '#888',
    textAlign: 'center',
    padding: '2rem'
  },
  empty: {
    color: '#888',
    textAlign: 'center',
    padding: '2rem'
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  },
  roomCard: {
    background: '#111',
    border: '1px solid #222',
    borderRadius: '8px',
    padding: '1rem'
  },
  roomInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    marginBottom: '0.75rem'
  },
  roomName: {
    color: '#e0e0e0',
    fontSize: '1.1rem',
    fontWeight: 'bold'
  },
  roomMeta: {
    color: '#888',
    fontSize: '0.8rem'
  },
  roomActions: {
    display: 'flex',
    gap: '0.5rem'
  },
  enterBtn: {
    padding: '0.5rem 1rem',
    background: '#00ff88',
    color: '#0a0a0a',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  inviteBtn: {
    padding: '0.5rem 1rem',
    background: '#222',
    color: '#e0e0e0',
    border: '1px solid #444',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  inviteBox: {
    marginTop: '0.75rem',
    padding: '0.75rem',
    background: '#0a0a0a',
    borderRadius: '4px'
  },
  inviteLabel: {
    color: '#888',
    fontSize: '0.8rem',
    display: 'block',
    marginBottom: '0.25rem'
  },
  inviteLink: {
    color: '#00ff88',
    fontSize: '0.85rem',
    wordBreak: 'break-all'
  }
};
