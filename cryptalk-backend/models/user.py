from . import get_db
import bcrypt

def get_user_by_email(email):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users WHERE email = %s', (email,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None

def get_user_by_id(user_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users WHERE id = %s', (int(user_id),))
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None

def create_user(username, email, password):
    conn = get_db()
    cursor = conn.cursor()
    try:
        pw_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        cursor.execute(
            'INSERT INTO users (username, email, password) VALUES (%s, %s, %s) RETURNING id',
            (username, email, pw_hash)
        )
        user_id = cursor.fetchone()['id']
        conn.commit()
        conn.close()
        return {'status': 'success', 'user_id': user_id}
    except Exception as e:
        conn.close()
        return {'status': 'error', 'message': str(e)}
