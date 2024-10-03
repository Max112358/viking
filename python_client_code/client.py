import requests
import time

base_url = 'https://hobefog.pythonanywhere.com'

def send_message(sender, recipient, message):
    response = requests.post(f'{base_url}/send_message', data={
        'sender': sender,
        'recipient': recipient,
        'message': message
    })
    return response.json()

def get_messages(recipient):
    response = requests.get(f'{base_url}/get_messages', params={'recipient': recipient})
    return response.json().get('messages', [])

def run_client(username):
    print(f"Running client for {username}")
    while True:
        # Check for new messages
        new_messages = get_messages(username)
        if new_messages:
            print("New messages:")
            for msg in new_messages:
                print(f"- {msg}")
        
        # Send a message
        recipient = input("Enter recipient's name (or press Enter to skip): ")
        if recipient:
            message = input("Enter your message: ")
            result = send_message(username, recipient, message)
            print(result.get('status', 'Message sent'))
        
        print("\nWaiting for 5 seconds before next check...\n")
        time.sleep(5)

if __name__ == "__main__":
    username = input("Enter your username: ")
    run_client(username)