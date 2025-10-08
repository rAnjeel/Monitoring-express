import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import http from 'http';
import bodyParser from 'body-parser';
import cors from 'cors';
import deviceRoutes from './routes/device.routes.js';
import typeDeviceRoutes from './routes/typeDevice.routes.js';
import locationRoutes from './routes/location.routes.js';  
import portRoutes from './routes/port.routes.js';
import deviceEventRoutes from './routes/deviceEvent.routes.js';
import logger from './logger/logger.js';
import db from './config/db.js';
import errorHandler from './middlewares/error.middleware.js';
import deviceService from './services/device.service.js';
import SocketService from './services/socket/socket.service.js';
import scheduler from './services/messaging/scheduler.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
app.use(bodyParser.json({ limit: '20mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '20mb' }));

app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:8081'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use('/devices', deviceRoutes);
app.use('/type-devices', typeDeviceRoutes);
app.use('/locations', locationRoutes);
app.use('/ports', portRoutes);
app.use('/device-events', deviceEventRoutes);
app.use(errorHandler);


app.use((err, req, res, next) => {
  logger.error(err.message);
  res.status(500).json({ message: 'Internal Server Error' });
});

async function startServer() {
  try {
    const PORT = process.env.PORT;
    const server = http.createServer(app);

    // Initialize persistent Socket.IO server bound to HTTP server
    SocketService.init(server, {
      cors: {
        origin: ['http://localhost:8080', 'http://localhost:8081'],
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization']
      }
    });

    server.listen(PORT, () => logger.info(`Server running on port ${PORT}`));

    // démarrer le consumer RabbitMQ
    try {
      await deviceService.startPingConsumer();
      logger.info('PingConsumer started successfully with socket.io');
    } catch (e) {
      logger.error(`Error starting PingConsumer: ${e.message}`)
    }

    // démarrer le scheduler RabbitMQ
    try {
      await scheduler.start(process.env.SCHEDULER_INTERVAL_MS)
      logger.info('Scheduler started successfully')
    } catch (e) {
      logger.error(`Error starting scheduler: ${e.message}`)
    }
  } catch (error) {
    logger.error(`Database connection failed: ${error.message}`);
    process.exit(1);
  }
}

startServer();