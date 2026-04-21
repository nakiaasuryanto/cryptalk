import os
import psycopg2
from psycopg2.extras import RealDictCursor

# PostgreSQL connection (Supabase or any PostgreSQL)
DATABASE_URL = os.environ.get('DATABASE_URL', '')

def get_db():
    if not DATABASE_URL:
        # Fallback to local SQLite for development
        from .sqlite_init import get_db as sqlite_get_db
        return sqlite_get_db()

    conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
    return conn

def init_db():
    if not DATABASE_URL:
        # Use SQLite init for local dev
        from .sqlite_init import init_db as sqlite_init
        sqlite_init()
        return

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS rooms (
            id SERIAL PRIMARY KEY,
            room_id TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            host_id INTEGER NOT NULL REFERENCES users(id),
            key_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS room_members (
            id SERIAL PRIMARY KEY,
            room_id TEXT NOT NULL REFERENCES rooms(room_id),
            user_id INTEGER NOT NULL REFERENCES users(id),
            encryption_key TEXT,
            joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_active BOOLEAN DEFAULT TRUE,
            UNIQUE(room_id, user_id)
        )
    ''')

    # Add encryption_key column if not exists (for existing tables)
    cursor.execute('''
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                          WHERE table_name='room_members' AND column_name='encryption_key') THEN
                ALTER TABLE room_members ADD COLUMN encryption_key TEXT;
            END IF;
        END $$;
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id SERIAL PRIMARY KEY,
            room_id TEXT NOT NULL REFERENCES rooms(room_id),
            sender_id INTEGER NOT NULL REFERENCES users(id),
            ciphertext TEXT NOT NULL,
            iv TEXT NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS invites (
            id SERIAL PRIMARY KEY,
            token TEXT UNIQUE NOT NULL,
            room_id TEXT NOT NULL REFERENCES rooms(room_id),
            created_by INTEGER NOT NULL REFERENCES users(id),
            used BOOLEAN DEFAULT FALSE,
            used_by INTEGER REFERENCES users(id),
            expired_at TIMESTAMP NOT NULL
        )
    ''')

    # Create indexes
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_room_members_user ON room_members(user_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_invites_token ON invites(token)')

    conn.commit()
    conn.close()
