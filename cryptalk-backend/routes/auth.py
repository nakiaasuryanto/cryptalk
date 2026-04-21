from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import bcrypt

import sys
sys.path.append('..')
from models.user import create_user, get_user_by_email, get_user_by_id

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({'status': 'error', 'message': 'Missing fields'}), 400

    pw_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    result = create_user(username, email, pw_hash)

    if result['status'] == 'error':
        return jsonify({'status': 'error', 'message': result['message']}), 409

    return jsonify({'status': 'success', 'message': 'User registered'}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'status': 'error', 'message': 'Missing fields'}), 400

    user = get_user_by_email(email)
    if not user:
        return jsonify({'status': 'error', 'message': 'Invalid credentials'}), 401

    # Check password
    if not bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
        return jsonify({'status': 'error', 'message': 'Invalid credentials'}), 401

    access_token = create_access_token(identity=str(user['id']))
    return jsonify({
        'status': 'success',
        'token': access_token,
        'user': {'id': user['id'], 'username': user['username'], 'email': user['email']}
    }), 200

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    return jsonify({'status': 'success', 'message': 'Logged out'}), 200
