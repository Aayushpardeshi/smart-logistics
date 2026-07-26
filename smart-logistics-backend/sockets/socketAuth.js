const jwt = require('jsonwebtoken');
const logger = require('../utils/logger'); // adjust path if your logger differs

/**
 * Socket.IO handshake middleware — verifies JWT same way as existing
 * Express auth middleware. Attaches decoded user to socket.user.
 */
function socketAuthMiddleware(socket, next) {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      logger.warn('Socket connection rejected: no token provided');
      return next(new Error('Authentication token missing'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    socket.user = {
      id: decoded.id || decoded._id,
      role: decoded.role
    };

    logger.info(`Socket authenticated: userId=${socket.user.id}, role=${socket.user.role}`);
    next();
  } catch (err) {
    logger.error(`Socket auth failed: ${err.message}`);
    next(new Error('Authentication failed'));
  }
}

module.exports = socketAuthMiddleware;