import React, { useState } from 'react';

export default function MessageInput({ onSend }) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (!text.trim() || sending) return;

    setSending(true);
    try {
      await onSend(text.trim());
      setText('');
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div style={styles.container}>
      <span style={styles.indicator} title="AES-128 Active">🔒 AES-128</span>
      <input
        type="text"
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        style={styles.input}
        placeholder="Ketik pesan..."
        disabled={sending}
      />
      <button
        onClick={handleSend}
        style={{ ...styles.button, ...(sending ? styles.buttonDisabled : {}) }}
        disabled={sending || !text.trim()}
      >
        Kirim
      </button>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    background: '#111',
    borderTop: '1px solid #222'
  },
  indicator: {
    color: '#00ff88',
    fontSize: '0.75rem',
    whiteSpace: 'nowrap'
  },
  input: {
    flex: 1,
    padding: '0.6rem 0.75rem',
    background: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '4px',
    color: '#e0e0e0',
    fontSize: '0.95rem'
  },
  button: {
    padding: '0.6rem 1.25rem',
    background: '#00ff88',
    color: '#0a0a0a',
    border: 'none',
    borderRadius: '4px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '0.9rem'
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed'
  }
};
