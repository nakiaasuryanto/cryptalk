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
      <span style={styles.indicator} title="AES-128 Active">AES-128</span>
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
    padding: '0.875rem 1.25rem',
    background: '#DCCCAC',
    borderTop: '1px solid #c4b494'
  },
  indicator: {
    color: '#fff',
    fontSize: '0.7rem',
    whiteSpace: 'nowrap',
    background: '#99AD7A',
    padding: '0.25rem 0.5rem',
    borderRadius: '6px',
    fontWeight: '600'
  },
  input: {
    flex: 1,
    padding: '0.75rem 1rem',
    background: '#ffffff',
    border: '2px solid #c4b494',
    borderRadius: '12px',
    color: '#3d3d3d',
    fontSize: '0.95rem'
  },
  button: {
    padding: '0.75rem 1.5rem',
    background: '#546B41',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    fontSize: '0.9rem'
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed'
  }
};
