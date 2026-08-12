require("dotenv").config();
require("express-async-errors");

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const authRoutes = require("./routes/authRoutes");
const connectDB = require("./config/db");
const logger = require("./utils/logger");
const { notFound, errorHandler } = require("./middlewares/errorHandler");
const driverRoutes = require("./routes/driverRoutes");
const businessRoutes = require("./routes/businessRoutes");
const path = require("path");
const http = require("http");
const initSocketServer = require('./sockets/index');
const app = express();

connectDB();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGINS?.split(",") || "*" }));
app.use(express.json());
app.use(morgan("dev"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "smart-logistics-backend" });
});

// Feature routes will be mounted here
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/driver", driverRoutes);
app.use("/api/v1/business", businessRoutes);
app.use("/api/v1/admin", require("./routes/adminRoutes"));
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
initSocketServer(server);

server.listen(PORT, () => logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`));