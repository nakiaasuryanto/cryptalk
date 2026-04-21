import React, { useEffect, useState, useRef } from 'react';
import { initSocket, joinRoom, leaveRoom, sendMessage, loadHistory, onReceiveMessage, onHistoryLoaded, disconnectSocket } from '../../lib/socket.js';
import { encryptMessage, decryptMessage } from '../../lib/aes.js';
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
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const storedKey = sessionStorage.getItem(`room_key_${roomId}`);
    if (!storedKey) {
      setError('Key tidak ditemukan. Pastikan kamu bergabung melalui link invite yang benar.');
      return;
    }
    setKey(storedKey);
    const userData = JSON.parse(localStorage.getItem('aes_user') || '{}');
    setUser(userData);

    // Fetch room info
    fetchRoomInfo();

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
      const decrypted = decryptMessage(data.ciphertext, data.iv, storedKey);
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
        plaintext: decryptMessage(msg.ciphertext, msg.iv, storedKey),
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
  }, [roomId]);

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

      {/* Sidebar */}
      {showSidebar && (
        <div style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <h3 style={styles.sidebarTitle}>Detail Room</h3>
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
    background: '#FFF8EC'
  },
  chatArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column'
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
    padding: '1rem'
  },
  empty: {
    color: '#6b6b6b',
    textAlign: 'center',
    marginTop: '2rem'
  },
  sidebar: {
    width: '280px',
    background: '#DCCCAC',
    borderLeft: '1px solid #c4b494',
    display: 'flex',
    flexDirection: 'column'
  },
  sidebarHeader: {
    padding: '1rem',
    borderBottom: '1px solid #c4b494'
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
  }
};
