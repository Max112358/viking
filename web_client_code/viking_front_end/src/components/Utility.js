// utility.js

// Store the base URL in a constant
const BASE_URL = 'https://hobefog.pythonanywhere.com';



// Function to check if the user is a teacher
export const is_teacher = async (username) => {
  try {
    const response = await fetch(`${BASE_URL}/is_teacher?username=${encodeURIComponent(username)}`);
    const data = await response.json();
    return data.is_teacher;
  } catch (error) {
    console.error("Error checking teacher status:", error);
    return false;
  }
};


// Function to get all rooms a user is a member of
export const get_user_rooms = async (username) => {
  try {
    const response = await fetch(`${BASE_URL}/get_user_rooms?user=${encodeURIComponent(username)}`);
    if (response.ok) {
      const data = await response.json();
      return data.rooms;  // Return the user's rooms
    } else {
      console.error('Failed to fetch user rooms.');
      return [];
    }
  } catch (error) {
    console.error('Error fetching user rooms:', error);
    return [];
  }
};



// Function to send a message to a specific user
export const send_message_to_specific_user = async (sender, recipient, message) => {
  try {
    const url = `${BASE_URL}/send_message_to_specific_user`;
    const body = `sender=${encodeURIComponent(sender)}&recipient=${encodeURIComponent(recipient)}&message=${encodeURIComponent(message)}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body,
    });

    if (response.ok) {
      return { success: true };
    } else {
      console.error('Failed to send message to user.');
      return { success: false };
    }
  } catch (error) {
    console.error('Error sending message to user:', error);
    return { success: false, error };
  }
};



// Function to send a message to a specific room
export const send_message_to_specific_room = async (sender, room, message) => {
  try {
    const url = `${BASE_URL}/send_message_to_specific_room`;
    const body = `sender=${encodeURIComponent(sender)}&room=${encodeURIComponent(room)}&message=${encodeURIComponent(message)}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body,
    });

    if (response.ok) {
      return { success: true };
    } else {
      console.error('Failed to send message to room.');
      return { success: false };
    }
  } catch (error) {
    console.error('Error sending message to room:', error);
    return { success: false, error };
  }
};


// Function to get all active rooms
export const get_all_rooms = async () => {
  try {
    const url = `${BASE_URL}/get_all_rooms`;
    const response = await fetch(url);

    if (response.ok) {
      const data = await response.json();
      return data.rooms;
    } else {
      console.error('Failed to fetch all rooms.');
      return [];
    }
  } catch (error) {
    console.error('Error fetching all rooms:', error);
    return [];
  }
};

// Function to send a message to all rooms
export const send_message_to_all_rooms = async (sender, message) => {
  try {
    const url = `${BASE_URL}/send_message_to_all_rooms`;
    const body = `sender=${encodeURIComponent(sender)}&message=${encodeURIComponent(message)}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body,
    });

    if (response.ok) {
      return await response.json();
    } else {
      console.error('Failed to send message to all rooms.');
      return { success: false };
    }
  } catch (error) {
    console.error('Error sending message to all rooms:', error);
    return { success: false, error };
  }
};

// Function to add a specific user to a room (Teacher privilege)
export const add_specific_user_to_room = async (teacher, user, room) => {
  try {
    const url = `${BASE_URL}/add_specific_user_to_room`;
    const body = `sender=${encodeURIComponent(teacher)}&user=${encodeURIComponent(user)}&room=${encodeURIComponent(room)}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body,
    });

    if (response.ok) {
      return await response.json();
    } else {
      console.error('Failed to add user to room.');
      return { success: false };
    }
  } catch (error) {
    console.error('Error adding user to room:', error);
    return { success: false, error };
  }
};

// Function to remove a specific user from a room (Teacher privilege)
export const remove_specific_user_from_room = async (teacher, user, room) => {
  try {
    const url = `${BASE_URL}/remove_specific_user_from_room`;
    const body = `sender=${encodeURIComponent(teacher)}&user=${encodeURIComponent(user)}&room=${encodeURIComponent(room)}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body,
    });

    if (response.ok) {
      return await response.json();
    } else {
      console.error('Failed to remove user from room.');
      return { success: false };
    }
  } catch (error) {
    console.error('Error removing user from room:', error);
    return { success: false, error };
  }
};

// Function to close a room (Teacher privilege)
export const close_room = async (teacher, room) => {
  try {
    const url = `${BASE_URL}/close_room`;
    const body = `sender=${encodeURIComponent(teacher)}&room=${encodeURIComponent(room)}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body,
    });

    if (response.ok) {
      return await response.json();
    } else {
      console.error('Failed to close room.');
      return { success: false };
    }
  } catch (error) {
    console.error('Error closing room:', error);
    return { success: false, error };
  }
};

// Function to toggle private communication (Teacher privilege)
export const toggle_private_communication = async (teacher) => {
  try {
    const url = `${BASE_URL}/toggle_private_communication`;
    const body = `sender=${encodeURIComponent(teacher)}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body,
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, isPrivateChatDisabled: data.status.includes('disabled') };
    } else {
      console.error('Failed to toggle private communication.');
      return { success: false };
    }
  } catch (error) {
    console.error('Error toggling private communication:', error);
    return { success: false, error };
  }
};
// Function to create a new room (Teacher privilege)
export const create_room = async (teacher, roomName) => {
  try {
    const url = `${BASE_URL}/create_room`;
    const body = `sender=${encodeURIComponent(teacher)}&room_name=${encodeURIComponent(roomName)}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body,
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, status: data.status };
    } else {
      const errorData = await response.json();
      console.error('Failed to create room:', errorData.status);
      return { success: false, status: errorData.status };
    }
  } catch (error) {
    console.error('Error creating room:', error);
    return { success: false, error: error.message };
  }
};

// Function to get messages for a specific room
export const get_messages_for_room = async (room) => {
  try {
    const url = `${BASE_URL}/get_messages_for_room?room=${encodeURIComponent(room)}`;
    const response = await fetch(url);

    if (response.ok) {
      const data = await response.json();
      return data.messages;
    } else {
      console.error('Failed to fetch messages for room.');
      return [];
    }
  } catch (error) {
    console.error('Error fetching messages for room:', error);
    return [];
  }
};

//Function to get messages for a specific user
export const get_messages_for_user = async (username) => {
  try {
    const response = await fetch(`${BASE_URL}/get_messages_for_user?user=${encodeURIComponent(username)}`);
    if (response.ok) {
      const data = await response.json();
      return data.messages;  // Return the full list of messages
    } else {
      console.error('Failed to fetch messages.');
      return [];
    }
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
};