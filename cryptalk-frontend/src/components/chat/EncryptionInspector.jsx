import React, { useState } from 'react';

export default function EncryptionInspector({ plaintext, ciphertext, iv, visible }) {
  const [copied, setCopied] = useState(null);

  if (!visible) return null;

  async function copyToClipboard(text, field) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(field);
      setTimeout(() => setCopied(null), 1500);
    } catch (e) {
      // clipboard not available
    }
  }

  return (
    <div style={styles.panel}>
      <div style={styles.header}>🔍 Encryption Detail</div>
      <div style={styles.divider}>─────────────────────────────</div>

      <div style={styles.row}>
        <span style={styles.label}>Plaintext  :</span>
        <span style={styles.value}>"{plaintext || '(gagal dekripsi)'}"</span>
        <button onClick={() => copyToClipboard(plaintext || '', 'plaintext')} style={styles.copyBtn}>
          {copied === 'plaintext' ? '✓' : '📋'}
        </button>
      </div>

      <div style={styles.row}>
        <span style={styles.label}>IV         :</span>
        <span style={styles.valueMono}>{iv || '-'}</span>
        <button onClick={() => copyToClipboard(iv || '', 'iv')} style={styles.copyBtn}>
          {copied === 'iv' ? '✓' : '📋'}
        </button>
      </div>

      <div style={styles.row}>
        <span style={styles.label}>Ciphertext :</span>
        <span style={styles.valueMono} title={ciphertext}>
          {ciphertext ? (ciphertext.slice(0, 20) + '...') : '-'}
        </span>
        <button onClick={() => copyToClipboard(ciphertext || '', 'ciphertext')} style={styles.copyBtn}>
          {copied === 'ciphertext' ? '✓' : '📋'}
        </button>
      </div>

      <div style={styles.divider}>─────────────────────────────</div>
      <div style={styles.mode}>Mode       : AES-128-CBC</div>
    </div>
  );
}

const styles = {
  panel: {
    marginTop: '0.75rem',
    padding: '0.75rem',
    background: '#0a0a0a',
    border: '1px solid #222',
    borderRadius: '6px',
    fontSize: '0.8rem',
    animation: 'slideDown 0.2s ease-out'
  },
  header: {
    color: '#00ff88',
    fontWeight: 'bold',
    marginBottom: '0.25rem'
  },
  divider: {
    color: '#444',
    margin: '0.5rem 0'
  },
  row: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.5rem',
    marginBottom: '0.4rem',
    fontFamily: 'monospace'
  },
  label: {
    color: '#888',
    whiteSpace: 'nowrap'
  },
  value: {
    color: '#00ff88',
    wordBreak: 'break-all'
  },
  valueMono: {
    color: '#00ff88',
    fontFamily: 'monospace',
    fontSize: '0.75rem',
    wordBreak: 'break-all'
  },
  copyBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0 0.25rem',
    fontSize: '0.75rem',
    opacity: 0.6
  },
  mode: {
    color: '#888',
    fontFamily: 'monospace'
  }
};
