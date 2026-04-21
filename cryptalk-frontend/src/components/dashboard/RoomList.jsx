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

  function handleLogout() {
    localStorage.removeItem('aes_token');
    localStorage.removeItem('aes_user');
    window.location.href = '/login';
  }

  return (
    <div style={styles.wrapper}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <img src="/LOGO_CT.png" alt="Cryptalk" style={{height: '40px', marginBottom: '2rem'}} />

        <div style={styles.userCard}>
          <div style={styles.avatar}>{user.username?.charAt(0).toUpperCase() || '?'}</div>
          <div style={styles.userInfo}>
            <span style={styles.userName}>{user.username}</span>
            <span style={styles.userEmail}>{user.email}</span>
          </div>
        </div>

        <button onClick={handleLogout} style={styles.logoutBtn}>
          Logout
        </button>
      </div>

      {/* Main Content */}
      <div style={styles.main}>
        <div style={styles.header}>
          <h2 style={styles.title}>Room Kamu</h2>
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
                    {room.host_id === user.id ? 'Host: Kamu' : ''}
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
    </div>
  );
}

const styles = {
  wrapper: {
    display: 'flex',
    minHeight: '100vh'
  },
  sidebar: {
    width: '280px',
    background: '#DCCCAC',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  userCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '1.5rem',
    width: '100%'
  },
  avatar: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: '#546B41',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    fontWeight: '700',
    marginBottom: '0.75rem'
  },
  userInfo: {
    textAlign: 'center'
  },
  userName: {
    display: 'block',
    color: '#3d3d3d',
    fontWeight: '700',
    fontSize: '1rem'
  },
  userEmail: {
    display: 'block',
    color: '#6b6b6b',
    fontSize: '0.8rem'
  },
  logoutBtn: {
    marginTop: 'auto',
    padding: '0.625rem 1.5rem',
    background: '#c4b494',
    color: '#3d3d3d',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '600',
    width: '100%'
  },
  main: {
    flex: 1,
    padding: '2rem',
    maxWidth: '800px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem'
  },
  title: {
    color: '#546B41',
    margin: 0,
    fontWeight: '700'
  },
  createBtn: {
    padding: '0.625rem 1.25rem',
    background: '#546B41',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '700'
  },
  error: {
    color: '#c45a5a',
    padding: '0.75rem',
    background: '#f8e8e8',
    borderRadius: '10px',
    marginBottom: '1rem'
  },
  loading: {
    color: '#6b6b6b',
    textAlign: 'center',
    padding: '2rem'
  },
  empty: {
    color: '#6b6b6b',
    textAlign: 'center',
    padding: '2rem',
    background: '#DCCCAC',
    borderRadius: '16px'
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  },
  roomCard: {
    background: '#DCCCAC',
    borderRadius: '16px',
    padding: '1.25rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  },
  roomInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    marginBottom: '0.75rem'
  },
  roomName: {
    color: '#3d3d3d',
    fontSize: '1.1rem',
    fontWeight: '700'
  },
  roomMeta: {
    color: '#6b6b6b',
    fontSize: '0.8rem'
  },
  roomActions: {
    display: 'flex',
    gap: '0.5rem'
  },
  enterBtn: {
    padding: '0.5rem 1rem',
    background: '#546B41',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600'
  },
  inviteBtn: {
    padding: '0.5rem 1rem',
    background: '#99AD7A',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600'
  },
  inviteBox: {
    marginTop: '0.75rem',
    padding: '0.75rem',
    background: '#FFF8EC',
    borderRadius: '10px'
  },
  inviteLabel: {
    color: '#6b6b6b',
    fontSize: '0.8rem',
    display: 'block',
    marginBottom: '0.25rem'
  },
  inviteLink: {
    color: '#546B41',
    fontSize: '0.85rem',
    wordBreak: 'break-all'
  }
};
