import uuid
from datetime import datetime, timedelta
from . import get_db

def create_invite(room_id, created_by):
    token = str(uuid.uuid4())
    expired_at = datetime.utcnow() + timedelta(hours=24)
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute(
            'INSERT INTO invites (token, room_id, created_by, expired_at) VALUES (%s, %s, %s, %s) RETURNING id',
            (token, room_id, created_by, expired_at)
        )
        conn.commit()
        conn.close()
        return {'status': 'success', 'token': token, 'expires_at': expired_at.isoformat()}
    except Exception as e:
        conn.close()
        return {'status': 'error', 'message': str(e)}

def get_invite(token):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM invites WHERE token = %s', (token,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None

def use_invite(token, user_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        'UPDATE invites SET used = TRUE, used_by = %s WHERE token = %s',
        (int(user_id), token)
    )
    conn.commit()
    conn.close()
    return {'status': 'success'}
