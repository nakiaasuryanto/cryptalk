import uuid
from . import get_db

def create_room(name, host_id, key_hash):
    room_id = str(uuid.uuid4())
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute(
            'INSERT INTO rooms (room_id, name, host_id, key_hash) VALUES (%s, %s, %s, %s) RETURNING id',
            (room_id, name, host_id, key_hash)
        )
        # host automatically joins
        cursor.execute(
            'INSERT INTO room_members (room_id, user_id) VALUES (%s, %s)',
            (room_id, host_id)
        )
        conn.commit()
        conn.close()
        return {'status': 'success', 'room_id': room_id, 'name': name}
    except Exception as e:
        conn.close()
        return {'status': 'error', 'message': str(e)}

def get_room_by_id(room_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM rooms WHERE room_id = %s', (room_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None

def get_rooms_for_user(user_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT r.room_id, r.name, r.host_id, r.created_at
        FROM rooms r
        INNER JOIN room_members rm ON r.room_id = rm.room_id
        WHERE rm.user_id = %s AND rm.is_active = TRUE
        ORDER BY r.created_at DESC
    ''', (int(user_id),))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def add_member(room_id, user_id):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute(
            'INSERT INTO room_members (room_id, user_id) VALUES (%s, %s)',
            (room_id, int(user_id))
        )
        conn.commit()
        conn.close()
        return {'status': 'success'}
    except Exception as e:
        conn.close()
        return {'status': 'error', 'message': str(e)}

def get_room_members(room_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT u.id, u.username
        FROM room_members rm
        INNER JOIN users u ON rm.user_id = u.id
        WHERE rm.room_id = %s AND rm.is_active = TRUE
    ''', (room_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def is_member(room_id, user_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        'SELECT * FROM room_members WHERE room_id = %s AND user_id = %s AND is_active = TRUE',
        (room_id, int(user_id))
    )
    row = cursor.fetchone()
    conn.close()
    return row is not None
