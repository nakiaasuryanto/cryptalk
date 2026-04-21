import React, { useState } from 'react';
import EncryptionInspector from './EncryptionInspector.jsx';

export default function MessageBubble({ message }) {
  const [inspectorVisible, setInspectorVisible] = useState(false);

  const isOwn = message.is_own;
  const hasDecryptError = message.plaintext === null;

  return (
    <div style={{ ...styles.wrapper, ...(isOwn ? styles.own : styles.other) }}>
      <div style={{ ...styles.bubble, ...(isOwn ? styles.bubbleOwn : styles.bubbleOther) }}>
        <div style={styles.meta}>
          <span style={styles.sender}>{message.sender_name}</span>
          <span style={styles.time}>{formatTime(message.timestamp)}</span>
        </div>

        {hasDecryptError ? (
          <div style={styles.errorMsg}>Pesan tidak dapat didekripsi</div>
        ) : (
          <div style={styles.text}>{message.plaintext}</div>
        )}

        <button
          onClick={() => setInspectorVisible(!inspectorVisible)}
          style={styles.inspectorToggle}
          title="Lihat detail enkripsi"
        >
          ?
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
    borderRadius: '16px',
    padding: '0.75rem 1rem',
    position: 'relative',
    wordBreak: 'break-word'
  },
  bubbleOwn: {
    background: '#546B41',
    color: '#ffffff'
  },
  bubbleOther: {
    background: '#DCCCAC',
    color: '#3d3d3d'
  },
  meta: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '1rem',
    marginBottom: '0.25rem'
  },
  sender: {
    fontSize: '0.8rem',
    fontWeight: '700',
    opacity: 0.8
  },
  time: {
    fontSize: '0.75rem',
    opacity: 0.6
  },
  text: {
    lineHeight: '1.4'
  },
  errorMsg: {
    color: '#c45a5a',
    fontSize: '0.875rem'
  },
  inspectorToggle: {
    position: 'absolute',
    bottom: '0.5rem',
    right: '0.5rem',
    background: '#99AD7A',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.65rem',
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    color: '#fff',
    fontWeight: '700',
    opacity: 0.7
  }
};
