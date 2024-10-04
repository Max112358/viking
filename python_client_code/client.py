import requests
import time

base_url = 'https://hobefog.pythonanywhere.com'

# Function to send a message to all rooms
def send_message_to_all_rooms(sender, message):
    try:
        response = requests.post(f'{base_url}/send_message_to_all_rooms', data={
            'sender': sender,
            'message': message
        })
        return response.json()
    except Exception as e:
        print(f"Error sending message to all rooms: {e}")
        return {}

# Function to send a message to a specific room
def send_message_to_specific_room(sender, room, message):
    try:
        response = requests.post(f'{base_url}/send_message_to_specific_room', data={
            'sender': sender,
            'room': room,
            'message': message
        })
        return response.json()
    except Exception as e:
        print(f"Error sending message to room {room}: {e}")
        return {}

# Function to send a private message to a specific user
def send_message_to_specific_user(sender, recipient, message):
    try:
        response = requests.post(f'{base_url}/send_message_to_specific_user', data={
            'sender': sender,
            'recipient': recipient,
            'message': message
        })
        return response.json()
    except Exception as e:
        print(f"Error sending private message to {recipient}: {e}")
        return {}

# Function to get messages for a specific room
def get_messages_for_room(room):
    try:
        response = requests.get(f'{base_url}/get_messages_for_room', params={'room': room})
        return response.json().get('messages', [])
    except Exception as e:
        print(f"Error retrieving messages for room {room}: {e}")
        return []

# Function to get messages for a specific user
def get_messages_for_user(user):
    try:
        response = requests.get(f'{base_url}/get_messages_for_user', params={'user': user})
        return response.json().get('messages', [])
    except Exception as e:
        print(f"Error retrieving messages for user {user}: {e}")
        return []

# Function to add a specific user to a room (Teacher privilege)
def add_specific_user_to_room(teacher, user, room):
    try:
        response = requests.post(f'{base_url}/add_specific_user_to_room', data={
            'sender': teacher,
            'user': user,
            'room': room
        })
        return response.json()
    except Exception as e:
        print(f"Error adding {user} to room {room}: {e}")
        return {}

# Function to remove a specific user from a room (Teacher privilege)
def remove_specific_user_from_room(teacher, user, room):
    try:
        response = requests.post(f'{base_url}/remove_specific_user_from_room', data={
            'sender': teacher,
            'user': user,
            'room': room
        })
        return response.json()
    except Exception as e:
        print(f"Error removing {user} from room {room}: {e}")
        return {}

# Function to close a room (Teacher privilege)
def close_room(teacher, room):
    try:
        response = requests.post(f'{base_url}/close_room', data={
            'sender': teacher,
            'room': room
        })
        return response.json()
    except Exception as e:
        print(f"Error closing room {room}: {e}")
        return {}

# Function to toggle private communication (Teacher privilege)
def toggle_private_communication(teacher):
    try:
        response = requests.post(f'{base_url}/toggle_private_communication', data={
            'sender': teacher
        })
        return response.json()
    except Exception as e:
        print(f"Error toggling private communication: {e}")
        return {}

# Function to get the rooms a user is a member of
def get_user_rooms(user):
    try:
        response = requests.get(f'{base_url}/get_user_rooms', params={'user': user})
        return response.json().get('rooms', [])
    except Exception as e:
        print(f"Error retrieving rooms for user {user}: {e}")
        return []

# Helper function to print messages with their source (room or private)
def print_messages(username):
    print(f"Checking for messages for {username}...")
    messages = get_messages_for_user(username)  # Get all messages for the user
    
    if messages:
        print("New messages:")
        for msg in messages:
            if msg['type'] == 'room':
                print(f"Room {msg['room']}: {msg['message']}")
            elif msg['type'] == 'private':
                print(f"Private message from {msg['from']}: {msg['message']}")
    else:
        print("No new messages.")

def run_client(username):
    print(f"Running client for {username}")

    if username == 'mingli':
        print("\nYou are the teacher (mingli) and have special privileges.")
    
    # Show which rooms the user is part of at the start
    check_user_rooms(username)
    
    while True:
        # Periodically check for new messages (every 5 seconds)
        print_messages(username)

        # Only allow mingli to manage rooms and toggle private messaging
        if username == 'mingli':
            print("\nTeacher menu:")
            print("1. Send message to all rooms")
            print("2. Send message to specific room")
            print("3. Send private message to a user")
            print("4. Add user to a room")
            print("5. Remove user from a room")
            print("6. Close a room")
            print("7. Toggle private communication")
            print("8. Check rooms for a user")
            print("9. Skip to next message check")

            choice = input("Choose an option (1-9): ").strip()
            
            if choice == '1':
                message = input("Enter the message to send to all rooms: ")
                result = send_message_to_all_rooms(username, message)
                print(result.get('status', 'Message sent'))

            elif choice == '2':
                room = input("Enter the room name: ")
                message = input(f"Enter the message to send to room {room}: ")
                result = send_message_to_specific_room(username, room, message)
                print(result.get('status', 'Message sent'))

            elif choice == '3':
                recipient = input("Enter the recipient's username: ")
                message = input(f"Enter the private message for {recipient}: ")
                result = send_message_to_specific_user(username, recipient, message)
                print(result.get('status', 'Message sent'))

            elif choice == '4':
                user = input("Enter the username of the person to add: ")
                room = input("Enter the room name to add them to: ")
                result = add_specific_user_to_room(username, user, room)
                print(result.get('status', 'User added'))

            elif choice == '5':
                user = input("Enter the username of the person to remove: ")
                room = input("Enter the room name to remove them from: ")
                result = remove_specific_user_from_room(username, user, room)
                print(result.get('status', 'User removed'))

            elif choice == '6':
                room = input("Enter the room name to close: ")
                result = close_room(username, room)
                print(result.get('status', 'Room closed'))

            elif choice == '7':
                result = toggle_private_communication(username)
                print(result.get('status', 'Private communication toggled'))

            elif choice == '8':
                user = input("Enter the username to check rooms for: ")
                check_user_rooms(user)

            elif choice == '9':
                print("Skipping to the next message check...")

        else:
            # Student menu for sending messages
            print("\nStudent menu:")
            print("1. Send message to specific room")
            print("2. Send private message to a user")
            print("3. Check which rooms you are part of")
            print("4. Skip to next message check")

            choice = input("Choose an option (1-4): ").strip()

            if choice == '1':
                room = input("Enter the room name: ")
                message = input(f"Enter the message to send to room {room}: ")
                result = send_message_to_specific_room(username, room, message)
                print(result.get('status', 'Message sent'))

            elif choice == '2':
                recipient = input("Enter the recipient's username: ")
                message = input(f"Enter the private message for {recipient}: ")
                result = send_message_to_specific_user(username, recipient, message)
                print(result.get('status', 'Message sent'))

            elif choice == '3':
                check_user_rooms(username)

            elif choice == '4':
                print("Skipping to the next message check...")

        # Wait for 5 seconds before checking for new messages again
        print("\nWaiting for 5 seconds before the next check...\n")
        time.sleep(5)

# Function to check which rooms a user is a member of
def check_user_rooms(username):
    print(f"Getting rooms for {username}...")
    rooms = get_user_rooms(username)
    print(f"{username} is a member of: {', '.join(rooms) if rooms else 'No rooms'}")

if __name__ == "__main__":
    username = input("Enter your username: ")
    run_client(username)
