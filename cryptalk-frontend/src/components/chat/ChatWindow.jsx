import React, { useEffect, useState, useRef } from 'react';
import { initSocket, joinRoom, leaveRoom, sendMessage, loadHistory, onReceiveMessage, onHistoryLoaded, disconnectSocket } from '../../lib/socket.js';
import { encryptMessage, decryptMessage } from '../../lib/aes.js';
import MessageBubble from './MessageBubble.jsx';
import MessageInput from './MessageInput.jsx';

export default function ChatWindow({ roomId }) {
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const [key, setKey] = useState(null);
  const [user, setUser] = useState({});
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const storedKey = sessionStorage.getItem(`room_key_${roomId}`);
    if (!storedKey) {
      setError('Key tidak ditemukan. Pastikan Anda bergabung melalui link invite yang benar.');
      return;
    }
    setKey(storedKey);
    setUser(JSON.parse(localStorage.getItem('aes_user') || '{}'));

    const socket = initSocket();

    socket.on('connect', () => {
      setConnected(true);
      joinRoom(roomId, user.id);
      loadHistory(roomId);
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
        is_own: data.sender_id === user.id
      };
      setMessages(prev => [...prev, msg]);
    });

    const unsubscribeHistory = onHistoryLoaded((data) => {
      const decrypted = data.messages.map(msg => ({
        ...msg,
        plaintext: decryptMessage(msg.ciphertext, msg.iv, storedKey),
        is_own: msg.sender_id === user.id
      }));
      setMessages(decrypted);
    });

    return () => {
      leaveRoom(roomId, user.id);
      unsubscribeMsg();
      unsubscribeHistory();
      disconnectSocket();
    };
  }, [roomId, user.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
          <span style={styles.errorIcon}>⚠️</span>
          <p style={styles.errorText}>{error}</p>
          <a href="/dashboard" style={styles.errorLink}>Kembali ke Dashboard</a>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <a href="/dashboard" style={styles.backLink}>← Kembali</a>
        <span style={styles.status}>
          {connected ? (
            <span style={styles.connected}>🟢 Terhubung</span>
          ) : (
            <span style={styles.disconnected}>🔴 Memuat...</span>
          )}
        </span>
        <span style={styles.secure}>🔒 AES-128</span>
      </div>

      <div style={styles.messages}>
        {messages.length === 0 && (
          <div style={styles.empty}>
            {connected ? 'Belum ada pesan. Mulai percakapan!' : 'Memuat riwayat...'}
          </div>
        )}
        {messages.map(msg => (
          <MessageBubble key={msg.message_id || msg.timestamp} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <MessageInput onSend={handleSend} />
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    background: '#0a0a0a'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem 1rem',
    background: '#111',
    borderBottom: '1px solid #222'
  },
  backLink: {
    color: '#00ff88',
    textDecoration: 'none',
    fontSize: '0.9rem'
  },
  status: {
    fontSize: '0.8rem'
  },
  connected: {
    color: '#00ff88'
  },
  disconnected: {
    color: '#ff4444'
  },
  secure: {
    color: '#888',
    fontSize: '0.8rem'
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '1rem'
  },
  empty: {
    color: '#666',
    textAlign: 'center',
    marginTop: '2rem'
  },
  errorContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0a0a0a'
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
  errorLink: {
    color: '#00ff88'
  }
};
