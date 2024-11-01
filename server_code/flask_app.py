from flask import Flask, send_from_directory, jsonify, request
import os
from collections import defaultdict

#app = Flask(__name__)
app = Flask(__name__, static_folder='build', static_url_path='')


from flask_cors import CORS
CORS(app)

# Serve the React app
@app.route('/')
@app.route('/<path:path>')
def serve_react_app(path=''):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

# Store messages for each group/room
room_messages = defaultdict(list)

# Store user memberships (a dictionary where key is the room name, and value is a list of members)
room_members = defaultdict(list)

# Store private messages for individual users
private_messages = defaultdict(list)

# Default room where everyone starts
main_room = 'general'
room_members[main_room] = []

# Store if private messaging is enabled (default: True)
private_communication_enabled = True

# Special user (teacher) with extra privileges
# Central teacher definition (only defined here)
TEACHER_USERNAME = 'mingli'

# ---- Helper Functions ----

def is_teacher(user):
    """Check if the user is the teacher."""
    return user == TEACHER_USERNAME

def ensure_user_in_general(user):
    """Ensure a user is in the general room by default."""
    if user not in room_members[main_room]:
        room_members[main_room].append(user)

# ---- New Endpoint to Register Users ----
@app.route('/register_user', methods=['POST'])
def register_user():
    username = request.form.get('username')
    if username:
        ensure_user_in_general(username)  # Add user to general room
        return jsonify({"status": f"{username} registered and added to general room."}), 200
    return jsonify({"status": "Missing username."}), 400

    password = request.form.get('password')
    if password:
        ensure_user_in_general(password)  # Add user to general room
        return jsonify({"status": f"{password} registered and added to general room."}), 200
    return jsonify({"status": "Missing username."}), 400

# ---- New Endpoint to Check if a User is the Teacher ----
@app.route('/is_teacher', methods=['GET'])
def check_is_teacher():
    username = request.args.get('username')
    if username:
        if is_teacher(username):
            return jsonify({"is_teacher": True}), 200
        else:
            return jsonify({"is_teacher": False}), 200
    return jsonify({"status": "Missing username."}), 400


# ---- Flask Endpoints ----

@app.route('/send_message_to_all_rooms', methods=['POST'])
def send_message_to_all_rooms():
    sender = request.form.get('sender')
    message = request.form.get('message')

    ensure_user_in_general(sender)  # Ensure the sender is in the general room

    if sender and message:
        for room in room_members:
            room_messages[room].append({"type": "room", "room": room, "message": f"{sender}: {message}"})
        return jsonify({"status": "Message sent to all rooms successfully"}), 200
    else:
        return jsonify({"status": "Missing required fields"}), 400

@app.route('/send_message_to_specific_room', methods=['POST'])
def send_message_to_specific_room():
    sender = request.form.get('sender')
    room = request.form.get('room')
    message = request.form.get('message')

    ensure_user_in_general(sender)  # Ensure the sender is in the general room

    if sender and room and message:
        if sender not in room_members[room]:
            return jsonify({"status": f"{sender} is not a member of {room}"}), 400
        room_messages[room].append({"type": "room", "room": room, "message": f"{sender}: {message}"})
        return jsonify({"status": f"Message sent to room {room} successfully"}), 200
    else:
        return jsonify({"status": "Missing required fields"}), 400

@app.route('/send_message_to_specific_user', methods=['POST'])
def send_message_to_specific_user():
    sender = request.form.get('sender')
    recipient = request.form.get('recipient')
    message = request.form.get('message')

    global private_communication_enabled

    ensure_user_in_general(sender)  # Ensure the sender is in the general room

    if not private_communication_enabled:
        return jsonify({"status": "Private communication is disabled"}), 403

    if sender and recipient and message:
        private_messages[recipient].append({"type": "private", "from": sender, "message": f"{sender}: {message}"})
        return jsonify({"status": "Private message sent successfully"}), 200
    else:
        return jsonify({"status": "Missing required fields"}), 400

@app.route('/get_messages_for_room', methods=['GET'])
def get_messages_for_room():
    room = request.args.get('room')

    if room:
        room_msgs = room_messages[room]
        room_messages[room] = []  # Clear messages after sending
        return jsonify({"messages": room_msgs}), 200
    else:
        return jsonify({"status": "Room not specified"}), 400

@app.route('/get_messages_for_user', methods=['GET'])
def get_messages_for_user():
    user = request.args.get('user')

    ensure_user_in_general(user)  # Ensure the user is in the general room

    if user:
        # Get messages from rooms the user belongs to
        user_msgs = []
        for room in room_members:
            if user in room_members[room]:
                user_msgs.extend(room_messages[room])

        # Get private messages for the user
        user_msgs.extend(private_messages[user])
        private_messages[user] = []  # Clear private messages after retrieving

        return jsonify({"messages": user_msgs}), 200
    else:
        return jsonify({"status": "User not specified"}), 400

@app.route('/add_specific_user_to_room', methods=['POST'])
def add_specific_user_to_room():
    user = request.form.get('user')
    room = request.form.get('room')
    sender = request.form.get('sender')

    if not is_teacher(sender):
        return jsonify({"status": "Unauthorized access"}), 403

    ensure_user_in_general(user)  # Ensure the user is in the general room

    if user and room:
        if room not in room_members:
            room_members[room] = []  # Create the room if it doesn't exist
        room_members[room].append(user)
        return jsonify({"status": f"{user} added to room {room}"}), 200
    else:
        return jsonify({"status": "Missing required fields"}), 400

@app.route('/remove_specific_user_from_room', methods=['POST'])
def remove_specific_user_from_room():
    user = request.form.get('user')
    room = request.form.get('room')
    sender = request.form.get('sender')

    if not is_teacher(sender):
        return jsonify({"status": "Unauthorized access"}), 403

    ensure_user_in_general(user)  # Ensure the user is in the general room

    if user and room:
        if user in room_members[room]:
            room_members[room].remove(user)
            room_members[main_room].append(user)  # Move them to the main room
            return jsonify({"status": f"{user} removed from room {room} and moved to {main_room}"}), 200
        else:
            return jsonify({"status": f"{user} is not in room {room}"}), 400
    else:
        return jsonify({"status": "Missing required fields"}), 400

@app.route('/close_room', methods=['POST'])
def close_room():
    room = request.form.get('room')
    sender = request.form.get('sender')

    if not is_teacher(sender):
        return jsonify({"status": "Unauthorized access"}), 403

    if room:
        if room == main_room:  # Prevent closing the general room
            return jsonify({"status": f"The '{main_room}' room cannot be closed."}), 422  # Using 422 Unprocessable Entity
        if room in room_members:
            # Move all users back to the main room
            for user in room_members[room]:
                if user not in room_members[main_room]:
                    room_members[main_room].append(user)
            room_members.pop(room)  # Remove the room
            return jsonify({"status": f"Room {room} closed and users moved to {main_room}"}), 200
        else:
            return jsonify({"status": f"Room {room} does not exist"}), 404
    else:
        return jsonify({"status": "Room not specified"}), 400

#change the current status of private chat
@app.route('/toggle_private_communication', methods=['POST'])
def toggle_private_communication():
    sender = request.form.get('sender')

    if not is_teacher(sender):
        return jsonify({"status": "Unauthorized access"}), 403

    global private_communication_enabled
    private_communication_enabled = not private_communication_enabled
    status = "disabled" if not private_communication_enabled else "enabled"

    return jsonify({
        "status": f"Private communication has been {status}",
        "isPrivateChatDisabled": not private_communication_enabled
    }), 200

#get the current status of private chat
@app.route('/get_private_chat_status', methods=['GET'])
def get_private_chat_status():
    return jsonify({"isPrivateChatDisabled": not private_communication_enabled}), 200

# function to get rooms a user is a member of
@app.route('/get_user_rooms', methods=['GET'])
def get_user_rooms():
    user = request.args.get('user')

    ensure_user_in_general(user)  # Ensure the user is in the general room

    if user:
        user_rooms = [room for room in room_members if user in room_members[room]]
        return jsonify({"rooms": user_rooms}), 200
    else:
        return jsonify({"status": "User not specified"}), 400

# function to get every room that exists
@app.route('/get_all_rooms', methods=['GET'])
def get_all_rooms():
    """Get all active rooms, including the general room."""
    return jsonify({"rooms": list(room_members.keys())}), 200


# New endpoint to create a room
@app.route('/create_room', methods=['POST'])
def create_room():
    room_name = request.form.get('room_name')
    sender = request.form.get('sender')

    if not is_teacher(sender):
        return jsonify({"status": "Unauthorized access"}), 403

    if room_name:
        if room_name in room_members:
            return jsonify({"status": f"Room '{room_name}' already exists"}), 400
        else:
            room_members[room_name] = []  # Create an empty room
            return jsonify({"status": f"Room '{room_name}' created successfully"}), 200
    else:
        return jsonify({"status": "Missing room name"}), 400




if __name__ == '__main__':
    app.run(debug=True)
