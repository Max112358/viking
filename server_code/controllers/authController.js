// controllers/authController.js
const bcrypt = require('bcrypt');
const db = require('../db');

exports.register = async (req, res) => {
  const { email, password } = req.body;

  try {
    const existingUser = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    await db.query(
      'INSERT INTO users (email, password) VALUES ($1, $2)',
      [email, hashedPassword]
    );

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error registering user' });
  }
};

exports.login = async (req, res) => {
    //console.log('Login endpoint hit with data:', req.body); 
    const { email, password } = req.body;
  
    try {
      const userResult = await db.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      //console.log('Database query result:', userResult.rows.length); 
  
      if (userResult.rows.length === 0) {
        return res.status(400).json({ message: 'User not found' });
      }
  
      const user = userResult.rows[0];
      const isMatch = await bcrypt.compare(password, user.password);
      //console.log('Password match result:', isMatch); 
  
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
  
      res.status(200).json({ message: 'Login successful' });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Error logging in' });
    }
  };