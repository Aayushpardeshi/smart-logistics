const Shipment = require('../models/Shipment');
const LocationHistory = require('../models/LocationHistory');
const logger = require('../utils/logger');

// In-memory throttle tracker: driverId -> last emit timestamp (ms)
const lastEmitTime = new Map();
const THROTTLE_MS = 45 * 1000; // 45 sec

function registerLocationHandlers(io, socket) {
  const { id: userId, role } = socket.user;

  // ---------------------------------------------------------
  // DRIVER: start_trip -> join shipment room, mark active
  // ---------------------------------------------------------
  socket.on('driver:start_trip', async ({ shipmentId }) => {
    try {
      if (role !== 'driver') {
        return socket.emit('error:tracking', { message: 'Only drivers can start a trip' });
      }

      const shipment = await Shipment.findById(shipmentId);
      if (!shipment) {
        return socket.emit('error:tracking', { message: 'Shipment not found' });
      }

      if (String(shipment.assignedDriver) !== String(userId)) {
        logger.warn(`Unauthorized start_trip attempt: driver=${userId} shipment=${shipmentId}`);
        return socket.emit('error:tracking', { message: 'You are not assigned to this shipment' });
      }

      if (shipment.status !== 'in_transit') {
        return socket.emit('error:tracking', { message: `Shipment status must be in_transit, currently: ${shipment.status}` });
      }

      const room = `shipment:${shipmentId}`;
      socket.join(room);
      socket.currentShipmentRoom = room;
      socket.currentShipmentId = shipmentId;

      shipment.liveTracking.isActive = true;
      shipment.liveTracking.startedAt = new Date();
      await shipment.save();

      logger.info(`Driver ${userId} started trip, joined room ${room}`);
      socket.emit('trip:started', { shipmentId, room });
    } catch (err) {
      logger.error(`start_trip error: ${err.message}`);
      socket.emit('error:tracking', { message: 'Failed to start trip' });
    }
  });

  // ---------------------------------------------------------
  // DRIVER: location_update -> throttled, saved, broadcast to room
  // ---------------------------------------------------------
  socket.on('driver:location_update', async ({ shipmentId, lat, lng, speed, heading, accuracy }) => {
    try {
      if (role !== 'driver') return;
      if (!socket.currentShipmentRoom || socket.currentShipmentId !== shipmentId) {
        return socket.emit('error:tracking', { message: 'Not an active trip room for this shipment' });
      }

      // Throttle check (45s per driver)
      const now = Date.now();
      const last = lastEmitTime.get(userId) || 0;
      if (now - last < THROTTLE_MS) {
        return; // silently drop, no error needed
      }
      lastEmitTime.set(userId, now);

      const shipment = await Shipment.findById(shipmentId);
      if (!shipment || shipment.status !== 'in_transit') {
        return socket.emit('error:tracking', { message: 'Shipment not active for tracking' });
      }

      // Update lastLocation snapshot
      shipment.liveTracking.lastLocation = {
        lat, lng, speed: speed ?? null, heading: heading ?? null, updatedAt: new Date()
      };
      await shipment.save();

      // Log to history (fire-and-forget style, but awaited for reliability)
      await LocationHistory.create({
        shipment: shipmentId,
        driver: userId,
        lat, lng, speed: speed ?? null, heading: heading ?? null, accuracy: accuracy ?? null
      });

      // Broadcast to room (business owner listening here)
      io.to(socket.currentShipmentRoom).emit('location:update', {
        shipmentId, lat, lng, speed, heading, accuracy, timestamp: new Date()
      });

      logger.info(`Location updated: shipment=${shipmentId} driver=${userId}`);
    } catch (err) {
      logger.error(`location_update error: ${err.message}`);
      socket.emit('error:tracking', { message: 'Failed to update location' });
    }
  });

  // ---------------------------------------------------------
  // BUSINESS: join_shipment_room -> subscribe to their own shipment only
  // ---------------------------------------------------------
  socket.on('business:join_shipment_room', async ({ shipmentId }) => {
    try {
      if (role !== 'business') {
        return socket.emit('error:tracking', { message: 'Only business owners can view tracking' });
      }

      const shipment = await Shipment.findById(shipmentId);
      if (!shipment) {
        return socket.emit('error:tracking', { message: 'Shipment not found' });
      }

      if (String(shipment.business) !== String(userId)) {
        logger.warn(`Unauthorized room join attempt: business=${userId} shipment=${shipmentId}`);
        return socket.emit('error:tracking', { message: 'You do not own this shipment' });
      }

      const room = `shipment:${shipmentId}`;
      socket.join(room);
      socket.currentShipmentRoom = room;

      logger.info(`Business ${userId} subscribed to room ${room}`);
      socket.emit('room:joined', {
        shipmentId,
        lastLocation: shipment.liveTracking.lastLocation
      });
    } catch (err) {
      logger.error(`join_shipment_room error: ${err.message}`);
      socket.emit('error:tracking', { message: 'Failed to join tracking room' });
    }
  });

  // ---------------------------------------------------------
  // BUSINESS: confirm_delivery -> ONLY way to end tracking
  // ---------------------------------------------------------
  socket.on('business:confirm_delivery', async ({ shipmentId }) => {
    try {
      if (role !== 'business') {
        return socket.emit('error:tracking', { message: 'Only business owners can confirm delivery' });
      }

      const shipment = await Shipment.findById(shipmentId);
      if (!shipment) {
        return socket.emit('error:tracking', { message: 'Shipment not found' });
      }

      if (String(shipment.business) !== String(userId)) {
        logger.warn(`Unauthorized confirm_delivery attempt: business=${userId} shipment=${shipmentId}`);
        return socket.emit('error:tracking', { message: 'You do not own this shipment' });
      }

      shipment.status = 'delivered';
      shipment.liveTracking.isActive = false;
      shipment.liveTracking.endedAt = new Date();
      await shipment.save();

      const room = `shipment:${shipmentId}`;
      io.to(room).emit('trip:ended', { shipmentId, message: 'Delivery confirmed' });

      // Force disconnect all sockets in room from this room (cleanup)
      const socketsInRoom = await io.in(room).fetchSockets();
      socketsInRoom.forEach((s) => s.leave(room));

      lastEmitTime.delete(String(shipment.assignedDriver));

      logger.info(`Delivery confirmed: shipment=${shipmentId} by business=${userId}`);
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
    // No shipment status change — driver can reconnect and resume
    // since shipment.status remains 'in_transit'
  });
}

module.exports = registerLocationHandlers;