from flask import Flask, jsonify, request
from collections import defaultdict

app = Flask(__name__)

# Store messages for each user
messages = defaultdict(list)

@app.route('/send_message', methods=['POST'])
def send_message():
    sender = request.form.get('sender')
    recipient = request.form.get('recipient')
    message = request.form.get('message')
    
    if sender and recipient and message:
        messages[recipient].append(f"{sender}: {message}")
        return jsonify({"status": "Message sent successfully"}), 200
    else:
        return jsonify({"status": "Missing required fields"}), 400

@app.route('/get_messages', methods=['GET'])
def get_messages():
    recipient = request.args.get('recipient')
    
    if recipient:
        user_messages = messages[recipient]
        # Clear the messages after retrieving
        messages[recipient] = []
        return jsonify({"messages": user_messages})
    else:
        return jsonify({"status": "Recipient not specified"}), 400

if __name__ == '__main__':
    app.run(debug=True)