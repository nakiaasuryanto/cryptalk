import React, { useState } from 'react';
import EncryptionInspector from './EncryptionInspector.jsx';

export default function MessageBubble({ message }) {
  const [inspectorVisible, setInspectorVisible] = useState(false);

  const isOwn = message.is_own;
  const hasDecryptError = message.plaintext === null;

  return (
    <div style={{ ...styles.wrapper, ...(isOwn ? styles.own : styles.other) }}>
      <div style={styles.bubble}>
        <div style={styles.meta}>
          <span style={styles.sender}>{message.sender_name}</span>
          <span style={styles.time}>{formatTime(message.timestamp)}</span>
        </div>

        {hasDecryptError ? (
          <div style={styles.errorMsg}>⚠️ Pesan tidak dapat didekripsi</div>
        ) : (
          <div style={styles.text}>{message.plaintext}</div>
        )}

        <button
          onClick={() => setInspectorVisible(!inspectorVisible)}
          style={styles.inspectorToggle}
          title="Lihat detail enkripsi"
        >
          🔍
        </button>

        {inspectorVisible && (
          <EncryptionInspector
            plaintext={message.plaintext}
            ciphertext={message.ciphertext}
            iv={message.iv}
            visible={inspectorVisible}
          />
        )}
      </div>
    </div>
  );
}

function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const styles = {
  wrapper: {
    display: 'flex',
    marginBottom: '0.75rem'
  },
  own: {
    justifyContent: 'flex-end'
  },
  other: {
    justifyContent: 'flex-start'
  },
  bubble: {
    maxWidth: '70%',
    background: '#1a1a1a',
    borderRadius: '12px',
    padding: '0.75rem 1rem',
    position: 'relative'
  },
  meta: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '1rem',
    marginBottom: '0.25rem'
  },
  sender: {
    color: '#00ff88',
    fontSize: '0.8rem',
    fontWeight: 'bold'
  },
  time: {
    color: '#666',
    fontSize: '0.75rem'
  },
  text: {
    color: '#e0e0e0',
    lineHeight: '1.4'
  },
  errorMsg: {
    color: '#ffaa00',
    fontSize: '0.875rem'
  },
  inspectorToggle: {
    position: 'absolute',
    top: '0.5rem',
    right: '-2rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.9rem',
    opacity: 0.4,
    padding: '0.25rem'
  }
};
