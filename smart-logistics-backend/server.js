require("dotenv").config();
require("express-async-errors");

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const http = require("http");

const authRoutes = require("./routes/authRoutes");
const driverRoutes = require("./routes/driverRoutes");
const businessRoutes = require("./routes/businessRoutes");
const connectDB = require("./config/db");
const logger = require("./utils/logger");
const { notFound, errorHandler } = require("./middlewares/errorHandler");
const initSocketServer = require("./sockets/index");

const app = express();

// Middleware
app.use(helmet());

app.use(
  cors({
    origin: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(",").map((origin) => origin.trim())
      : "*",
  })
);

app.use(express.json());
app.use(morgan("dev"));

// Static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "smart-logistics-backend",
  });
});

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/driver", driverRoutes);
app.use("/api/v1/business", businessRoutes);
app.use("/api/v1/admin", require("./routes/adminRoutes"));

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Socket.IO
initSocketServer(server);

// Start server after MongoDB connection
const startServer = async () => {
  try {
    await connectDB();

    server.listen(PORT, () => {
      logger.info(
        `Server running on port ${PORT} in ${
          process.env.NODE_ENV || "development"
        } mode`
      );
    });
  } catch (error) {
    logger.error(`Server startup failed: ${error.message}`);
    process.exit(1);
  }
};

startServer();