import express from 'express';
import bcrypt from 'bcryptjs';
import { run, get } from '../db/database.js';
import { generateToken, setAuthCookie, clearAuthCookie, requireAuth } from '../middleware/auth.js';

export const authRouter = express.Router();

// Email format regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate input fields for user registration.
 */
function validateRegistrationInput({ email, password, name }) {
  const errors = [];

  // Name validation
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long.');
  } else if (name.trim().length > 100) {
    errors.push('Name cannot exceed 100 characters.');
  }

  // Email validation
  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push('A valid email address is required.');
  } else if (email.trim().length > 255) {
    errors.push('Email address cannot exceed 255 characters.');
  }

  // Password validation
  if (!password || typeof password !== 'string') {
    errors.push('Password is required.');
  } else {
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long.');
    }
    if (password.length > 128) {
      errors.push('Password cannot exceed 128 characters.');
    }
    // Must contain at least one letter and one number or symbol
    if (!/[a-zA-Z]/.test(password) || !/[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      errors.push('Password must include at least one letter and one number or special character.');
    }
  }

  return errors;
}

/**
 * POST /api/auth/register
 * Secure registration with bcrypt hashing (12 salt rounds) and input validation.
 */
authRouter.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body || {};

    const validationErrors = validateRegistrationInput({ email, password, name });
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationErrors,
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    // Check if email already exists
    const existing = get('SELECT id FROM users WHERE email = ?', cleanEmail);
    if (existing) {
      return res.status(409).json({
        error: 'An account with this email address already exists.',
      });
    }

    // Hash password with 12 salt rounds
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user
    const result = run(
      'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
      cleanEmail,
      passwordHash,
      cleanName,
      'user'
    );

    const newUser = get(
      'SELECT id, email, name, role, created_at FROM users WHERE id = ?',
      result.lastInsertRowid
    );

    const token = generateToken(newUser);
    setAuthCookie(res, token);

    return res.status(201).json({
      message: 'Registration successful',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        createdAt: newUser.created_at,
      },
      token,
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

/**
 * POST /api/auth/login
 * Secure authentication with constant-time comparison defense.
 */
authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        error: 'Email and password are required.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = get('SELECT * FROM users WHERE email = ?', cleanEmail);

    if (!user) {
      // Prevent user enumeration by returning generic 401
      return res.status(401).json({
        error: 'Invalid email or password.',
      });
    }

    // Verify bcrypt password hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        error: 'Invalid email or password.',
      });
    }

    const token = generateToken(user);
    setAuthCookie(res, token);

    return res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.created_at,
      },
      token,
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
});

/**
 * POST /api/auth/logout
 * Clears the HttpOnly authentication cookie.
 */
authRouter.post('/logout', (req, res) => {
  clearAuthCookie(res);
  return res.status(200).json({
    message: 'Logged out successfully',
  });
});

/**
 * GET /api/auth/me
 * Protected route returning the current authenticated user profile.
 */
authRouter.get('/me', requireAuth, (req, res) => {
  return res.status(200).json({
    user: req.user,
  });
});
