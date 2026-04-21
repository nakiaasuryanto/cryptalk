import os
from flask import Flask
from flask_socketio import SocketIO
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from models import init_db
from routes import auth_bp, room_bp, invite_bp
from events import register_socket_events

app = Flask(__name__)

app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-prod')
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-key-change-in-prod')

# CORS - allow multiple origins
ALLOWED_ORIGINS = [origin.strip() for origin in os.environ.get('ALLOWED_ORIGINS', 'http://localhost:4321').split(',')]
CORS(app,
     origins=ALLOWED_ORIGINS,
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

jwt = JWTManager(app)

socketio = SocketIO(
    app,
    cors_allowed_origins=ALLOWED_ORIGINS,
    async_mode='threading',
    ping_timeout=60,
    ping_interval=25
)

# register blueprints
app.register_blueprint(auth_bp, url_prefix='/auth')
app.register_blueprint(room_bp, url_prefix='')
app.register_blueprint(invite_bp, url_prefix='')

# register socket events
register_socket_events(socketio)

# init database on startup
init_db()

@app.route('/')
def index():
    return {'status': 'ok', 'message': 'AES Messenger Backend'}

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    print(f"Starting AES Messenger backend on http://0.0.0.0:{port}")
    socketio.run(app, host='0.0.0.0', port=port, debug=False, allow_unsafe_werkzeug=True, use_reloader=False)
