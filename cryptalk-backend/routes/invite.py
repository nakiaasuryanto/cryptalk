from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

import sys
sys.path.append('..')
from models.room import get_room_by_id, add_member, is_member
from models.invite import create_invite, get_invite, use_invite

invite_bp = Blueprint('invite', __name__)

@invite_bp.route('/invite/generate', methods=['POST'])
@jwt_required()
def generate_invite():
    user_id = get_jwt_identity()
    data = request.get_json()
    room_id = data.get('room_id')

    room = get_room_by_id(room_id)
    if not room:
        return jsonify({'status': 'error', 'message': 'Room not found'}), 404

    result = create_invite(room_id, user_id)
    return jsonify(result), 201

@invite_bp.route('/invite/<token>', methods=['GET'])
def validate_invite(token):
    invite = get_invite(token)
    if not invite:
        return jsonify({'status': 'error', 'message': 'Invalid token'}), 404

    if invite['used']:
        return jsonify({'status': 'valid', 'message': 'Token sudah digunakan'}), 200

    expired_at = invite['expired_at']
    if isinstance(expired_at, str):
        expired_at = datetime.fromisoformat(expired_at.replace('Z', '+00:00'))

    if expired_at.replace(tzinfo=None) < datetime.utcnow():
        return jsonify({'status': 'valid', 'message': 'Token expired'}), 200
        return jsonify({'status': 'success', 'valid': False, 'message': 'Token expired'}), 200

    room = get_room_by_id(invite['room_id'])
    return jsonify({
        'status': 'success',
        'valid': True,
        'room_id': invite['room_id'],
        'room_name': room['name'] if room else None
    }), 200

@invite_bp.route('/invite/<token>/use', methods=['POST'])
@jwt_required()
def use_invite_endpoint(token):
    user_id = get_jwt_identity()
    invite = get_invite(token)

    if not invite:
        return jsonify({'status': 'error', 'message': 'Invalid token'}), 404

    if invite['used']:
        return jsonify({'status': 'error', 'message': 'Token sudah digunakan'}), 400

    expired_at = invite['expired_at']
    if isinstance(expired_at, str):
        expired_at = datetime.fromisoformat(expired_at.replace('Z', '+00:00'))

    if expired_at.replace(tzinfo=None) < datetime.utcnow():
        return jsonify({'status': 'error', 'message': 'Token expired'}), 400

    if is_member(invite['room_id'], user_id):
        return jsonify({'status': 'success', 'room_id': invite['room_id'], 'message': 'Already a member'}), 200

    add_member(invite['room_id'], user_id)
    use_invite(token, user_id)

    return jsonify({'status': 'success', 'room_id': invite['room_id']}), 200