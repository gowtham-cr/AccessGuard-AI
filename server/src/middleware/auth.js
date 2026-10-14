import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { get } from '../db/database.js';

/**
 * Generate a cryptographically signed JWT for an authenticated user.
 */
export function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role || 'user',
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

/**
 * Configure secure HttpOnly cookie for web browser session management.
 * Defends against XSS exfiltration by disallowing JavaScript access (HttpOnly).
 * Configures SameSite and Secure flags appropriately based on environment.
 */
export function setAuthCookie(res, token) {
  const isProd = config.nodeEnv === 'production';
  res.cookie(config.cookieName, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    maxAge: config.cookieMaxAgeMs,
    path: '/',
  });
}

/**
 * Clear the auth cookie on logout.
 */
export function clearAuthCookie(res) {
  const isProd = config.nodeEnv === 'production';
  res.clearCookie(config.cookieName, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    path: '/',
  });
}

/**
 * Authentication middleware to verify JWT from HttpOnly cookie or Authorization header.
 */
export function requireAuth(req, res, next) {
  try {
    let token = null;

    // 1. Check HttpOnly cookie
    if (req.cookies && req.cookies[config.cookieName]) {
      token = req.cookies[config.cookieName];
    }

    // 2. Fall back to Authorization: Bearer <token> header
    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
      }
    }

    if (!token) {
      return res.status(401).json({
        error: 'Authentication required. Please log in.',
      });
    }

    // Verify token signature and expiration
    const decoded = jwt.verify(token, config.jwtSecret);

    // Verify user still exists in database
    const user = get('SELECT id, email, name, role, created_at FROM users WHERE id = ?', decoded.id);

    if (!user) {
      return res.status(401).json({
        error: 'Session expired or user account no longer exists.',
      });
    }

    // Attach sanitized user context
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.created_at,
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ error: 'Invalid authentication token.' });
  }
}
