const jwt = require('jsonwebtoken');
const User = require('../models/User');

// In-memory session store (in production, use Redis or database)
const sessionStore = new Map();

// Session configuration
const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

/**
 * Clean expired sessions
 */
const cleanExpiredSessions = () => {
  const now = Date.now();
  for (const [sessionId, session] of sessionStore.entries()) {
    if (session.expiresAt < now) {
      sessionStore.delete(sessionId);
    }
  }
};

// Clean expired sessions every 5 minutes
setInterval(cleanExpiredSessions, 5 * 60 * 1000);

/**
 * Create a new session
 */
const createSession = (userId, token) => {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const expiresAt = Date.now() + SESSION_DURATION;
  
  sessionStore.set(sessionId, {
    userId,
    token,
    createdAt: Date.now(),
    expiresAt,
    lastAccessed: Date.now()
  });
  
  return sessionId;
};

/**
 * Get session by token
 */
const getSessionByToken = (token) => {
  for (const [sessionId, session] of sessionStore.entries()) {
    if (session.token === token) {
      // Check if session is expired
      if (session.expiresAt < Date.now()) {
        sessionStore.delete(sessionId);
        return null;
      }
      
      // Update last accessed time
      session.lastAccessed = Date.now();
      return { sessionId, ...session };
    }
  }
  return null;
};

/**
 * Extend session expiration
 */
const extendSession = (sessionId) => {
  const session = sessionStore.get(sessionId);
  if (session) {
    session.expiresAt = Date.now() + SESSION_DURATION;
    session.lastAccessed = Date.now();
  }
};

/**
 * Remove session
 */
const removeSession = (sessionId) => {
  sessionStore.delete(sessionId);
};

/**
 * Middleware to protect routes that require authentication
 */
exports.protect = async (req, res, next) => {
  let token;

  try {
    console.log('Auth middleware - Checking authentication...');
    
    // Check if token exists in headers
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
      console.log('Auth middleware - Token found in Authorization header');
    }

    // Check if token exists
    if (!token) {
      console.log('Auth middleware - No token provided');
      return res.status(401).json({
        success: false,
        error: 'Access denied. No token provided. Please login to access this resource.'
      });
    }

    console.log('Auth middleware - Token preview:', token.substring(0, 20) + '...');

    // Check session first
    const session = getSessionByToken(token);
    if (!session) {
      console.log('Auth middleware - No valid session found for token');
      return res.status(401).json({
        success: false,
        error: 'Session expired or invalid. Please login again.'
      });
    }

    console.log('Auth middleware - Valid session found:', session.sessionId);

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Auth middleware - Token verified for user ID:', decoded.id);

    // Find user by id
    const user = await User.findById(decoded.id);

    if (!user) {
      console.log('Auth middleware - User not found in database');
      removeSession(session.sessionId);
      return res.status(401).json({
        success: false,
        error: 'User account not found. Please contact support.'
      });
    }

    // Extend session
    extendSession(session.sessionId);

    // Add user and session to request object
    req.user = user;
    req.sessionId = session.sessionId;
    req.session = session;

    console.log('Auth middleware - Authentication successful for user:', user.email);
    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    
    // Handle specific JWT errors
    if (err.name === 'TokenExpiredError') {
      // Remove expired session
      if (token) {
        const session = getSessionByToken(token);
        if (session) {
          removeSession(session.sessionId);
        }
      }
      
      return res.status(401).json({
        success: false,
        error: 'Token expired. Please login again.'
      });
    } else if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token. Please login again.'
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Authentication failed. Please login again.'
    });
  }
};

/**
 * Create session on login
 */
exports.createUserSession = (userId, token) => {
  return createSession(userId, token);
};

/**
 * Remove session on logout
 */
exports.removeUserSession = (sessionId) => {
  removeSession(sessionId);
};

/**
 * Get session info
 */
exports.getSessionInfo = (sessionId) => {
  return sessionStore.get(sessionId);
};

/**
 * Get all sessions for debugging (remove in production)
 */
exports.getAllSessions = () => {
  return Array.from(sessionStore.entries()).map(([id, session]) => ({
    sessionId: id,
    userId: session.userId,
    createdAt: new Date(session.createdAt).toISOString(),
    expiresAt: new Date(session.expiresAt).toISOString(),
    lastAccessed: new Date(session.lastAccessed).toISOString()
  }));
};
