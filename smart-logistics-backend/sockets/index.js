const { Server } = require('socket.io');
const socketAuthMiddleware = require('./socketAuth');
const registerLocationHandlers = require('./locationSocket');
const logger = require('../utils/logger');

function initSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_ORIGIN || '*', // tighten in production
      methods: ['GET', 'POST']
    }
  });

  // Apply JWT auth to every incoming socket connection
  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    logger.info(`Socket connected: userId=${socket.user.id} role=${socket.user.role}`);
    registerLocationHandlers(io, socket);
  });

  return io;
}

module.exports = initSocketServer;