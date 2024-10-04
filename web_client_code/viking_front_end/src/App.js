import React, { useState } from 'react';

function App() {
  const [username, setUsername] = useState('');
  const [response, setResponse] = useState('');

  // Function to register user
  const registerUser = async () => {
    try {
      // Create form data
      const formData = new FormData();
      formData.append('username', username);  // Adding the username field like in your Python client
  
      // Send the form data using POST
      const res = await fetch('https://hobefog.pythonanywhere.com/register_user', {
        method: 'POST',
        body: formData,  // Form data instead of JSON
      });
  
      const data = await res.json();  // Parse the response
      setResponse(data.status);       // Update the state to show the response
    } catch (error) {
      setResponse('Error registering user');
    }
  };
  


  return (
    <div>
      <h1>Register User</h1>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Enter username"
      />
      <button onClick={registerUser}>Register</button>
      <p>{response}</p>
    </div>
  );
}

export default App;
