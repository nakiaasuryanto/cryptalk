import { io } from 'socket.io-client';
import API_CONFIG from '../config.js';

let socket = null;

export function initSocket() {
  if (socket && socket.connected) {
    return socket;
  }

  socket = io(API_CONFIG.BASE_URL, {
    auth: {
      token: localStorage.getItem('aes_token')
    }
  });

  socket.on('connect', () => {
    console.log('Socket connected');
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  return socket;
}

export function joinRoom(roomId, userId) {
  if (socket) {
    socket.emit('join_room', { room_id: roomId, user_id: userId });
  }
}

export function leaveRoom(roomId, userId) {
  if (socket) {
    socket.emit('leave_room', { room_id: roomId, user_id: userId });
  }
}

export function sendMessage({ roomId, senderId, ciphertext, iv }) {
  if (socket) {
    socket.emit('send_message', {
      room_id: roomId,
      sender_id: senderId,
      ciphertext,
      iv
    });
  }
}

export function loadHistory(roomId, userId) {
  if (socket) {
    socket.emit('load_history', { room_id: roomId, user_id: userId });
  }
}

export function onReceiveMessage(callback) {
  if (socket) {
    socket.on('receive_message', callback);
    return () => socket.off('receive_message', callback);
  }
  return () => {};
}

export function onHistoryLoaded(callback) {
  if (socket) {
    socket.on('history_loaded', callback);
    return () => socket.off('history_loaded', callback);
  }
  return () => {};
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
