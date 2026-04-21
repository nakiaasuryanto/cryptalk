from flask_socketio import emit, join_room as socketio_join_room, leave_room as socketio_leave_room
from flask_jwt_extended import decode_token
from models.room import is_member, get_room_by_id
from models.message import save_message, get_room_messages
from models.user import get_user_by_id

active_users = {}  # room_id -> set of user_ids

def register_socket_events(socketio):

    @socketio.on('connect')
    def handle_connect():
        emit('connected', {'status': 'ok'})

    @socketio.on('join_room')
    def handle_join_room(data):
        room_id = data.get('room_id')
        user_id = data.get('user_id')

        if not is_member(room_id, user_id):
            emit('error', {'message': 'Not a member of this room'})
            return

        socketio_join_room(room_id)

        if room_id not in active_users:
            active_users[room_id] = set()
        active_users[room_id].add(user_id)

        user = get_user_by_id(user_id)
        username = user['username'] if user else 'Unknown'
        emit('user_joined', {'user_id': user_id, 'username': username}, room=room_id)
        emit('joined', {'status': 'ok', 'room_id': room_id})

    @socketio.on('leave_room')
    def handle_leave_room(data):
        room_id = data.get('room_id')
        user_id = data.get('user_id')

        socketio_leave_room(room_id)

        if room_id in active_users:
            active_users[room_id].discard(user_id)

        user = get_user_by_id(user_id)
        username = user['username'] if user else 'Unknown'
        emit('user_left', {'user_id': user_id, 'username': username}, room=room_id)

    @socketio.on('send_message')
    def handle_send_message(data):
        try:
            room_id = data.get('room_id')
            sender_id = data.get('sender_id')
            ciphertext = data.get('ciphertext')
            iv = data.get('iv')

            if not is_member(room_id, sender_id):
                emit('error', {'message': 'Not a member of this room'})
                return

            result = save_message(room_id, sender_id, ciphertext, iv)
            message_id = result.get('message_id')

            sender = get_user_by_id(sender_id)
            sender_name = sender['username'] if sender else 'Unknown'

            emit('receive_message', {
                'sender_id': sender_id,
                'sender_name': sender_name,
                'ciphertext': ciphertext,
                'iv': iv,
                'timestamp': result.get('timestamp', ''),
                'message_id': message_id
            }, room=room_id)
        except Exception as e:
            print(f'Error in send_message: {e}')
            emit('error', {'message': str(e)})

    @socketio.on('load_history')
    def handle_load_history(data):
        try:
            room_id = data.get('room_id')
            user_id = data.get('user_id')

            if not is_member(room_id, user_id):
                emit('error', {'message': 'Not a member of this room'})
                return

            messages = get_room_messages(room_id)
            formatted = []
            for m in messages:
                formatted.append({
                    'sender_id': m['sender_id'],
                    'sender_name': m['sender_name'],
                    'ciphertext': m['ciphertext'],
                    'iv': m['iv'],
                    'timestamp': m['timestamp'],
                    'message_id': m['id']
                })
            emit('history_loaded', {'messages': formatted})
        except Exception as e:
            print(f'Error in load_history: {e}')
            emit('error', {'message': str(e)})