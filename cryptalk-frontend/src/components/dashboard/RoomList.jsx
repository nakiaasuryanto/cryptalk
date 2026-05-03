import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api.js';
import { encodeKeyForURL } from '../../lib/aes.js';
import { initSocket, joinRoom, onReceiveMessage, disconnectSocket } from '../../lib/socket.js';
import API_CONFIG from '../../config.js';
import CreateRoomModal from './CreateRoomModal.jsx';

export default function RoomList() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [inviteLinks, setInviteLinks] = useState({});
  const [error, setError] = useState('');
  const [user, setUser] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('aes_user') || '{}');
    setUser(userData);
    fetchRooms();

    // Connect socket untuk listen pesan baru
    const socket = initSocket();

    const unsubscribe = onReceiveMessage((data) => {
      // Tambah unread count untuk room yang dapat pesan
      if (data.sender_id !== userData.id) {
        setUnreadCounts(prev => ({
          ...prev,
          [data.room_id]: (prev[data.room_id] || 0) + 1
        }));
      }
    });

    return () => {
      unsubscribe();
      disconnectSocket();
    };
  }, []);

  async function fetchRooms() {
    setLoading(true);
    try {
      const data = await apiFetch('/rooms');
      if (data.status === 'success') {
        setRooms(data.rooms || []);
        // Join semua room untuk terima notifikasi
        const userData = JSON.parse(localStorage.getItem('aes_user') || '{}');
        (data.rooms || []).forEach(room => {
          joinRoom(room.room_id, userData.id);
        });
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
        const key = localStorage.getItem(`room_key_${room.room_id}`);
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

  const sidebarContent = (
    <>
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
    </>
  );

  return (
    <div style={styles.wrapper}>
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div style={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar - Desktop or Mobile Drawer */}
      <div style={{
        ...styles.sidebar,
        ...(isMobile ? styles.sidebarMobile : {}),
        ...(isMobile && sidebarOpen ? styles.sidebarMobileOpen : {})
      }}>
        {isMobile && (
          <button onClick={() => setSidebarOpen(false)} style={styles.closeBtn}>×</button>
        )}
        {sidebarContent}
      </div>

      {/* Main Content */}
      <div style={styles.main}>
        <div style={styles.header}>
          {isMobile && (
            <button onClick={() => setSidebarOpen(true)} style={styles.menuBtn}>
              ☰
            </button>
          )}
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
                  <div style={styles.roomNameRow}>
                    <span style={styles.roomName}>{room.name}</span>
                    {unreadCounts[room.room_id] > 0 && (
                      <span style={styles.unreadBadge}>
                        {unreadCounts[room.room_id] > 9 ? '9+' : unreadCounts[room.room_id]}
                      </span>
                    )}
                  </div>
                  <span style={styles.roomMeta}>
                    {room.host_id === user.id ? 'Host: Kamu' : ''}
                  </span>
                </div>
                <div style={styles.roomActions}>
                  <button
                    onClick={() => {
                      setUnreadCounts(prev => ({ ...prev, [room.room_id]: 0 }));
                      window.location.href = `/chat/${room.room_id}`;
                    }}
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
    minHeight: '100vh',
    position: 'relative'
  },
  sidebar: {
    width: '280px',
    background: '#DCCCAC',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  sidebarMobile: {
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 100,
    transform: 'translateX(-100%)',
    transition: 'transform 0.3s ease'
  },
  sidebarMobileOpen: {
    transform: 'translateX(0)'
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    zIndex: 99
  },
  closeBtn: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    color: '#3d3d3d',
    cursor: 'pointer'
  },
  menuBtn: {
    background: '#546B41',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '0.5rem 0.75rem',
    fontSize: '1.25rem',
    cursor: 'pointer',
    marginRight: '0.75rem'
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
    minWidth: 0
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '1.5rem',
    gap: '0.5rem'
  },
  title: {
    color: '#546B41',
    margin: 0,
    fontWeight: '700',
    flex: 1
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
  roomNameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  roomName: {
    color: '#3d3d3d',
    fontSize: '1.1rem',
    fontWeight: '700'
  },
  unreadBadge: {
    background: '#c45a5a',
    color: '#fff',
    fontSize: '0.75rem',
    fontWeight: '700',
    padding: '0.125rem 0.5rem',
    borderRadius: '10px',
    minWidth: '20px',
    textAlign: 'center'
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
