const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Middleware to parse URL-encoded data
app.use(bodyParser.urlencoded({ extended: true }));

// Registration Endpoint
app.post('/register_user', (req, res) => {
  const { email } = req.body;

  // Here, you would typically check if the user already exists in the database
  // and insert a new user if they don't.
  console.log(`Received registration request for email: ${email}`);

  // Temporary mock response
  if (email) {
    res.status(200).json({ message: 'User registered successfully!' });
  } else {
    res.status(400).json({ message: 'Invalid registration data' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
