from . import get_db

def save_message(room_id, sender_id, ciphertext, iv):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO messages (room_id, sender_id, ciphertext, iv) VALUES (%s, %s, %s, %s) RETURNING id',
        (room_id, int(sender_id), ciphertext, iv)
    )
    message_id = cursor.fetchone()['id']
    cursor.execute('SELECT timestamp FROM messages WHERE id = %s', (message_id,))
    timestamp = cursor.fetchone()['timestamp']
    conn.commit()
    conn.close()
    return {'status': 'success', 'message_id': message_id, 'timestamp': timestamp.isoformat()}

def get_room_messages(room_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT m.id, m.room_id, m.sender_id, m.ciphertext, m.iv, m.timestamp,
               u.username as sender_name
        FROM messages m
        INNER JOIN users u ON m.sender_id = u.id
        WHERE m.room_id = %s
        ORDER BY m.timestamp ASC
    ''', (room_id,))
    rows = cursor.fetchall()
    conn.close()
    result = []
    for row in rows:
        msg = dict(row)
        # Convert timestamp to string for JSON serialization
        if msg.get('timestamp'):
            msg['timestamp'] = msg['timestamp'].isoformat()
        result.append(msg)
    return result
