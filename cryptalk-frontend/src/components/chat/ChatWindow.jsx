import React, { useEffect, useState, useRef } from 'react';
import { initSocket, joinRoom, leaveRoom, sendMessage, loadHistory, onReceiveMessage, onHistoryLoaded, disconnectSocket } from '../../lib/socket.js';
import { encryptMessage, decryptMessage, validateKey } from '../../lib/aes.js';
import { apiFetch } from '../../lib/api.js';
import MessageBubble from './MessageBubble.jsx';
import MessageInput from './MessageInput.jsx';

export default function ChatWindow({ roomId }) {
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const [key, setKey] = useState(null);
  const [user, setUser] = useState({});
  const [roomInfo, setRoomInfo] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [needKey, setNeedKey] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [keyError, setKeyError] = useState('');
  const [keyLoading, setKeyLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('aes_user') || '{}');
    setUser(userData);
    fetchRoomInfo();

    async function loadKey() {
      // Cek localStorage dulu
      const storedKey = localStorage.getItem(`room_key_${roomId}`);
      if (storedKey) {
        setKey(storedKey);
        return;
      }

      // Kalau tidak ada, coba ambil dari database
      try {
        const data = await apiFetch(`/rooms/${roomId}/key`);
        if (data.status === 'success' && data.encryption_key) {
          localStorage.setItem(`room_key_${roomId}`, data.encryption_key);
          setKey(data.encryption_key);
          return;
        }
      } catch (err) {
        console.error('Failed to fetch key:', err);
      }

      // Kalau masih tidak ada, minta input manual
      setNeedKey(true);
    }

    loadKey();
  }, [roomId]);

  useEffect(() => {
    if (!key) return;

    const userData = JSON.parse(localStorage.getItem('aes_user') || '{}');
    const socket = initSocket();

    socket.on('connect', () => {
      setConnected(true);
      joinRoom(roomId, userData.id);
      loadHistory(roomId, userData.id);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    const unsubscribeMsg = onReceiveMessage((data) => {
      const decrypted = decryptMessage(data.ciphertext, data.iv, key);
      const msg = {
        message_id: data.message_id,
        sender_id: data.sender_id,
        sender_name: data.sender_name,
        ciphertext: data.ciphertext,
        iv: data.iv,
        timestamp: data.timestamp,
        plaintext: decrypted,
        is_own: data.sender_id === userData.id
      };
      setMessages(prev => [...prev, msg]);
    });

    const unsubscribeHistory = onHistoryLoaded((data) => {
      const decrypted = data.messages.map(msg => ({
        ...msg,
        plaintext: decryptMessage(msg.ciphertext, msg.iv, key),
        is_own: msg.sender_id === userData.id
      }));
      setMessages(decrypted);
    });

    return () => {
      leaveRoom(roomId, userData.id);
      unsubscribeMsg();
      unsubscribeHistory();
      disconnectSocket();
    };
  }, [roomId, key]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function fetchRoomInfo() {
    try {
      const data = await apiFetch(`/rooms/${roomId}`);
      if (data.status === 'success') {
        setRoomInfo(data.room);
      }
    } catch (err) {
      console.error('Failed to fetch room info:', err);
    }
  }

  async function handleSend(plaintext) {
    if (!key) return;

    const { ciphertext, iv } = encryptMessage(plaintext, key);
    sendMessage({
      roomId,
      senderId: user.id,
      ciphertext,
      iv
    });
  }

  async function hashKey(inputKey) {
    const encoder = new TextEncoder();
    const data = encoder.encode(inputKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async function handleKeySubmit(e) {
    e.preventDefault();
    setKeyError('');

    if (!validateKey(keyInput)) {
      setKeyError('Key harus tepat 16 karakter');
      return;
    }

    setKeyLoading(true);
    try {
      const keyHash = await hashKey(keyInput);
      const data = await apiFetch(`/rooms/${roomId}/verify-key`, {
        method: 'POST',
        body: JSON.stringify({ key_hash: keyHash, encryption_key: keyInput })
      });

      if (data.status === 'success' && data.valid) {
        localStorage.setItem(`room_key_${roomId}`, keyInput);
        setKey(keyInput);
        setNeedKey(false);
      } else {
        setKeyError('Key tidak cocok dengan room ini');
      }
    } catch (err) {
      setKeyError(err.message || 'Terjadi kesalahan');
    } finally {
      setKeyLoading(false);
    }
  }

  if (needKey) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.keyBox}>
          <img src="/LOGO_CT.png" alt="Cryptalk" style={{height: '40px', marginBottom: '1rem'}} />
          <h3 style={styles.keyTitle}>Masukkan Key Room</h3>
          <p style={styles.keyDesc}>Room: {roomInfo?.name || 'Loading...'}</p>
          <form onSubmit={handleKeySubmit} style={styles.keyForm}>
            <input
              type="text"
              value={keyInput}
              onChange={e => setKeyInput(e.target.value)}
              placeholder="Key 16 karakter"
              maxLength={16}
              style={styles.keyInput}
            />
            <span style={styles.keyCount}>{keyInput.length}/16</span>
            {keyError && <div style={styles.keyError}>{keyError}</div>}
            <button type="submit" disabled={keyLoading} style={styles.keyBtn}>
              {keyLoading ? 'Memverifikasi...' : 'Masuk Room'}
            </button>
          </form>
          <a href="/dashboard" style={styles.errorLink}>Kembali ke Dashboard</a>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorBox}>
          <span style={styles.errorIcon}>:(</span>
          <p style={styles.errorText}>{error}</p>
          <a href="/dashboard" style={styles.errorLink}>Kembali ke Dashboard</a>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      {/* Main Chat Area */}
      <div style={styles.chatArea}>
        <div style={styles.header}>
          <a href="/dashboard" style={styles.backLink}>← Kembali</a>
          <span style={styles.roomName}>{roomInfo?.name || 'Room'}</span>
          <button onClick={() => setShowSidebar(!showSidebar)} style={styles.toggleBtn}>
            {showSidebar ? '→' : '←'}
          </button>
        </div>

        <div style={styles.messages}>
          {messages.length === 0 && (
            <div style={styles.empty}>
              {connected ? 'Belum ada pesan. Mulai ngobrol!' : 'Memuat riwayat...'}
            </div>
          )}
          {messages.map(msg => (
            <MessageBubble key={msg.message_id || msg.timestamp} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        <MessageInput onSend={handleSend} />
      </div>

      {/* Mobile Overlay */}
      {isMobile && showSidebar && (
        <div style={styles.overlay} onClick={() => setShowSidebar(false)} />
      )}

      {/* Sidebar */}
      {showSidebar && (
        <div style={{
          ...styles.sidebar,
          ...(isMobile ? styles.sidebarMobile : {})
        }}>
          <div style={styles.sidebarHeader}>
            <h3 style={styles.sidebarTitle}>Detail Room</h3>
            {isMobile && (
              <button onClick={() => setShowSidebar(false)} style={styles.closeSidebarBtn}>×</button>
            )}
          </div>

          <div style={styles.sidebarContent}>
            <div style={styles.infoSection}>
              <span style={styles.infoLabel}>Nama Room</span>
              <span style={styles.infoValue}>{roomInfo?.name || '-'}</span>
            </div>

            <div style={styles.infoSection}>
              <span style={styles.infoLabel}>Status</span>
              <span style={{...styles.statusBadge, background: connected ? '#99AD7A' : '#c45a5a'}}>
                {connected ? 'Terhubung' : 'Terputus'}
              </span>
            </div>

            <div style={styles.infoSection}>
              <span style={styles.infoLabel}>Enkripsi</span>
              <span style={styles.infoBadge}>AES-128-CBC</span>
            </div>

            <div style={styles.infoSection}>
              <span style={styles.infoLabel}>Member ({roomInfo?.members?.length || 0})</span>
              <div style={styles.memberList}>
                {roomInfo?.members?.map(member => (
                  <div key={member.id} style={styles.memberItem}>
                    <div style={styles.memberAvatar}>
                      {member.username?.charAt(0).toUpperCase()}
                    </div>
                    <span style={styles.memberName}>
                      {member.username}
                      {member.id === roomInfo?.host_id && <span style={styles.hostBadge}>Host</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    background: '#FFF8EC',
    overflow: 'hidden'
  },
  chatArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    overflow: 'hidden'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.875rem 1.25rem',
    background: '#DCCCAC',
    borderBottom: '1px solid #c4b494'
  },
  backLink: {
    color: '#546B41',
    textDecoration: 'none',
    fontSize: '0.9rem',
    fontWeight: '600'
  },
  roomName: {
    color: '#3d3d3d',
    fontWeight: '700',
    fontSize: '1rem'
  },
  toggleBtn: {
    background: '#546B41',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '0.4rem 0.75rem',
    cursor: 'pointer',
    fontWeight: '600'
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: '1rem'
  },
  empty: {
    color: '#6b6b6b',
    textAlign: 'center',
    marginTop: '2rem'
  },
  sidebar: {
    width: '280px',
    minWidth: '280px',
    background: '#DCCCAC',
    borderLeft: '1px solid #c4b494',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  sidebarMobile: {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    borderLeft: '1px solid #c4b494'
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
  sidebarHeader: {
    padding: '1rem',
    borderBottom: '1px solid #c4b494',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  closeSidebarBtn: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    color: '#3d3d3d',
    cursor: 'pointer',
    padding: '0 0.25rem'
  },
  sidebarTitle: {
    margin: 0,
    color: '#546B41',
    fontWeight: '700',
    fontSize: '1rem'
  },
  sidebarContent: {
    padding: '1rem',
    flex: 1,
    overflowY: 'auto'
  },
  infoSection: {
    marginBottom: '1.25rem'
  },
  infoLabel: {
    display: 'block',
    color: '#6b6b6b',
    fontSize: '0.75rem',
    fontWeight: '600',
    marginBottom: '0.5rem',
    textTransform: 'uppercase'
  },
  infoValue: {
    color: '#3d3d3d',
    fontWeight: '600'
  },
  infoBadge: {
    display: 'inline-block',
    background: '#99AD7A',
    color: '#fff',
    padding: '0.25rem 0.5rem',
    borderRadius: '6px',
    fontSize: '0.8rem',
    fontWeight: '600'
  },
  statusBadge: {
    display: 'inline-block',
    color: '#fff',
    padding: '0.25rem 0.5rem',
    borderRadius: '6px',
    fontSize: '0.8rem',
    fontWeight: '600'
  },
  memberList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  memberItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem',
    background: '#FFF8EC',
    borderRadius: '8px'
  },
  memberAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: '#546B41',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.8rem',
    fontWeight: '700'
  },
  memberName: {
    color: '#3d3d3d',
    fontSize: '0.9rem',
    fontWeight: '500'
  },
  hostBadge: {
    marginLeft: '0.5rem',
    background: '#546B41',
    color: '#fff',
    padding: '0.125rem 0.375rem',
    borderRadius: '4px',
    fontSize: '0.65rem',
    fontWeight: '600'
  },
  errorContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#FFF8EC'
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
  errorLink: {
    color: '#546B41',
    fontWeight: '600'
  },
  keyBox: {
    background: '#DCCCAC',
    borderRadius: '20px',
    padding: '2rem',
    textAlign: 'center',
    maxWidth: '400px',
    width: '90vw'
  },
  keyTitle: {
    color: '#546B41',
    margin: '0 0 0.5rem 0',
    fontWeight: '700'
  },
  keyDesc: {
    color: '#6b6b6b',
    margin: '0 0 1.5rem 0',
    fontSize: '0.9rem'
  },
  keyForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginBottom: '1rem'
  },
  keyInput: {
    padding: '0.875rem',
    background: '#ffffff',
    border: '2px solid #c4b494',
    borderRadius: '10px',
    color: '#3d3d3d',
    fontSize: '1rem',
    textAlign: 'center',
    fontFamily: 'monospace'
  },
  keyCount: {
    color: '#6b6b6b',
    fontSize: '0.8rem'
  },
  keyError: {
    color: '#c45a5a',
    fontSize: '0.875rem',
    padding: '0.5rem',
    background: '#f8e8e8',
    borderRadius: '8px'
  },
  keyBtn: {
    padding: '0.875rem',
    background: '#546B41',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontWeight: '700',
    cursor: 'pointer',
    fontSize: '1rem'
  }
};
