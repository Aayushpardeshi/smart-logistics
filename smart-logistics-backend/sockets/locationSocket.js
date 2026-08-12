const Trip = require('../models/Trip');
const Load = require('../models/Load');
const LocationHistory = require('../models/LocationHistory');
const logger = require('../utils/logger');

// In-memory throttle tracker: driverId -> last emit timestamp (ms)
const lastEmitTime = new Map();
const THROTTLE_MS = 45 * 1000; // 45 sec

function registerLocationHandlers(io, socket) {
  const { id: userId, role } = socket.user;

  // ---------------------------------------------------------
  // DRIVER: start_trip -> join trip room, mark active
  // ---------------------------------------------------------
  socket.on('driver:start_trip', async ({ tripId }) => {
    try {
      if (role !== 'driver') {
        return socket.emit('error:tracking', { message: 'Only drivers can start a trip' });
      }

      const trip = await Trip.findById(tripId);
      if (!trip) {
        return socket.emit('error:tracking', { message: 'Trip not found' });
      }

      if (String(trip.driverId) !== String(userId)) {
        logger.warn(`Unauthorized start_trip attempt: driver=${userId} trip=${tripId}`);
        return socket.emit('error:tracking', { message: 'You are not assigned to this trip' });
      }

      if (trip.status !== 'IN_TRANSIT' && trip.status !== 'READY' && trip.status !== 'ASSIGNED') {
        return socket.emit('error:tracking', { message: `Trip status must be ASSIGNED, READY or IN_TRANSIT, currently: ${trip.status}` });
      }

      const room = `trip:${tripId}`;
      socket.join(room);
      socket.currentTripRoom = room;
      socket.currentTripId = tripId;

      if (trip.status !== 'IN_TRANSIT') {
        trip.status = 'IN_TRANSIT';
        trip.startedAt = new Date();
        await trip.save();

        if (trip.loadId) {
          await Load.findByIdAndUpdate(trip.loadId, { status: 'IN_TRANSIT' });
        }
      }

      logger.info(`Driver ${userId} started trip, joined room ${room}`);
      socket.emit('trip:started', { tripId, room });
    } catch (err) {
      logger.error(`start_trip error: ${err.message}`);
      socket.emit('error:tracking', { message: 'Failed to start trip' });
    }
  });

  // ---------------------------------------------------------
  // DRIVER: location_update -> throttled, saved, broadcast to room
  // ---------------------------------------------------------
  socket.on('driver:location_update', async ({ tripId, lat, lng, speed, heading, accuracy }) => {
    try {
      if (role !== 'driver') return;
      if (!socket.currentTripRoom || socket.currentTripId !== tripId) {
        return socket.emit('error:tracking', { message: 'Not an active trip room for this trip' });
      }

      // Throttle check (45s per driver)
      const now = Date.now();
      const last = lastEmitTime.get(userId) || 0;
      if (now - last < THROTTLE_MS) {
        return; // silently drop, no error needed
      }
      lastEmitTime.set(userId, now);

      const trip = await Trip.findById(tripId);
      if (!trip || trip.status !== 'IN_TRANSIT') {
        return socket.emit('error:tracking', { message: 'Trip not active for tracking' });
      }

      // Update currentLocation snapshot
      trip.currentLocation = {
        lat, lng, timestamp: new Date()
      };
      await trip.save();

      // Log to history (fire-and-forget style, but awaited for reliability)
      await LocationHistory.create({
        trip: tripId,
        driver: userId,
        lat, lng, speed: speed ?? null, heading: heading ?? null, accuracy: accuracy ?? null
      });

      // Broadcast to room (business owner listening here)
      io.to(socket.currentTripRoom).emit('location:update', {
        tripId, lat, lng, speed, heading, accuracy, timestamp: new Date()
      });

      logger.info(`Location updated: trip=${tripId} driver=${userId}`);
    } catch (err) {
      logger.error(`location_update error: ${err.message}`);
      socket.emit('error:tracking', { message: 'Failed to update location' });
    }
  });

  // ---------------------------------------------------------
  // BUSINESS: join_trip_room -> subscribe to their own trip only
  // ---------------------------------------------------------
  socket.on('business:join_trip_room', async ({ tripId }) => {
    try {
      if (role !== 'business') {
        return socket.emit('error:tracking', { message: 'Only business owners can view tracking' });
      }

      const trip = await Trip.findById(tripId);
      if (!trip) {
        return socket.emit('error:tracking', { message: 'Trip not found' });
      }

      if (String(trip.businessId) !== String(userId)) {
        logger.warn(`Unauthorized room join attempt: business=${userId} trip=${tripId}`);
        return socket.emit('error:tracking', { message: 'You do not own this trip' });
      }

      const room = `trip:${tripId}`;
      socket.join(room);
      socket.currentTripRoom = room;

      logger.info(`Business ${userId} subscribed to room ${room}`);
      socket.emit('room:joined', {
        tripId,
        currentLocation: trip.currentLocation
      });
    } catch (err) {
      logger.error(`join_trip_room error: ${err.message}`);
      socket.emit('error:tracking', { message: 'Failed to join tracking room' });
    }
  });

  // ---------------------------------------------------------
  // BUSINESS: confirm_delivery -> ONLY way to end tracking
  // ---------------------------------------------------------
  socket.on('business:confirm_delivery', async ({ tripId }) => {
    try {
      if (role !== 'business') {
        return socket.emit('error:tracking', { message: 'Only business owners can confirm delivery' });
      }

      const trip = await Trip.findById(tripId);
      if (!trip) {
        return socket.emit('error:tracking', { message: 'Trip not found' });
      }

      if (String(trip.businessId) !== String(userId)) {
        logger.warn(`Unauthorized confirm_delivery attempt: business=${userId} trip=${tripId}`);
        return socket.emit('error:tracking', { message: 'You do not own this trip' });
      }

      trip.status = 'DELIVERED';
      trip.deliveredAt = new Date();
      await trip.save();

      if (trip.loadId) {
        await Load.findByIdAndUpdate(trip.loadId, { status: 'DELIVERED' });
      }

      const room = `trip:${tripId}`;
      io.to(room).emit('trip:ended', { tripId, message: 'Delivery confirmed' });

      // Force disconnect all sockets in room from this room (cleanup)
      const socketsInRoom = await io.in(room).fetchSockets();
      socketsInRoom.forEach((s) => s.leave(room));

      lastEmitTime.delete(String(trip.driverId));

      logger.info(`Delivery confirmed: trip=${tripId} by business=${userId}`);
    } catch (err) {
      logger.error(`confirm_delivery error: ${err.message}`);
      socket.emit('error:tracking', { message: 'Failed to confirm delivery' });
    }
  });

  // ---------------------------------------------------------
  // DISCONNECT: unexpected drop -> do NOT end trip, just log
  // ---------------------------------------------------------
  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: userId=${userId} role=${role}`);
  });
}

module.exports = registerLocationHandlers;