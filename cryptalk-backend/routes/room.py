from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

import sys
sys.path.append('..')
from models.room import create_room, get_room_by_id, get_rooms_for_user, get_room_members, add_member, is_member, get_member_key, save_member_key

room_bp = Blueprint('room', __name__)

@room_bp.route('/rooms', methods=['GET'])
@jwt_required()
def list_rooms():
    user_id = get_jwt_identity()
    rooms = get_rooms_for_user(user_id)
    return jsonify({'status': 'success', 'rooms': rooms}), 200

@room_bp.route('/rooms/create', methods=['POST'])
@jwt_required()
def make_room():
    user_id = get_jwt_identity()
    data = request.get_json()
    name = data.get('name')
    key_hash = data.get('key_hash')
    encryption_key = data.get('encryption_key')

    if not name or not key_hash:
        return jsonify({'status': 'error', 'message': 'Missing fields'}), 400

    result = create_room(name, user_id, key_hash, encryption_key)
    if result['status'] == 'error':
        return jsonify({'status': 'error', 'message': result['message']}), 500

    return jsonify({'status': 'success', 'room': {'room_id': result['room_id'], 'name': result['name']}}), 201

@room_bp.route('/rooms/<room_id>', methods=['GET'])
@jwt_required()
def get_room(room_id):
    user_id = get_jwt_identity()
    room = get_room_by_id(room_id)
    if not room:
        return jsonify({'status': 'error', 'message': 'Room not found'}), 404

    members = get_room_members(room_id)
    return jsonify({
        'status': 'success',
        'room': {
            'room_id': room['room_id'],
            'name': room['name'],
            'host_id': room['host_id'],
            'members': members
        }
    }), 200

@room_bp.route('/rooms/<room_id>/join', methods=['POST'])
@jwt_required()
def join_room(room_id):
    user_id = get_jwt_identity()
    if is_member(room_id, user_id):
        return jsonify({'status': 'success', 'message': 'Already a member'}), 200
    result = add_member(room_id, user_id)
    if result['status'] == 'error':
        return jsonify({'status': 'error', 'message': result['message']}), 500
    return jsonify({'status': 'success'}), 200

@room_bp.route('/rooms/<room_id>/verify-key', methods=['POST'])
@jwt_required()
def verify_key(room_id):
    user_id = get_jwt_identity()

    if not is_member(room_id, user_id):
        return jsonify({'status': 'error', 'message': 'Not a member'}), 403

    room = get_room_by_id(room_id)
    if not room:
        return jsonify({'status': 'error', 'message': 'Room not found'}), 404

    data = request.get_json()
    key_hash = data.get('key_hash')
    encryption_key = data.get('encryption_key')

    if not key_hash:
        return jsonify({'status': 'error', 'message': 'Key hash required'}), 400

    if room['key_hash'] == key_hash:
        # Save key to database if provided
        if encryption_key:
            save_member_key(room_id, user_id, encryption_key)
        return jsonify({'status': 'success', 'valid': True}), 200
    else:
        return jsonify({'status': 'success', 'valid': False}), 200

@room_bp.route('/rooms/<room_id>/key', methods=['GET'])
@jwt_required()
def get_key(room_id):
    user_id = get_jwt_identity()

    if not is_member(room_id, user_id):
        return jsonify({'status': 'error', 'message': 'Not a member'}), 403

    key = get_member_key(room_id, user_id)
    return jsonify({'status': 'success', 'encryption_key': key}), 200

@room_bp.route('/rooms/<room_id>/key', methods=['POST'])
@jwt_required()
def set_key(room_id):
    user_id = get_jwt_identity()

    if not is_member(room_id, user_id):
        return jsonify({'status': 'error', 'message': 'Not a member'}), 403

    data = request.get_json()
    encryption_key = data.get('encryption_key')

    if not encryption_key:
        return jsonify({'status': 'error', 'message': 'Key required'}), 400

    result = save_member_key(room_id, user_id, encryption_key)
    return jsonify(result), 200