const express = require('express');
const bodyParser = require('body-parser');
const deviceRoutes = require('./routes/device.routes');
const typeDeviceRoutes = require('./routes/typeDevice.routes');
const logger = require('./logger/logger');
const db = require('./config/db');
const errorHandler = require('./middlewares/error.middleware');

const app = express();
app.use(bodyParser.json());

app.use('/devices', deviceRoutes);
app.use('/type-devices', typeDeviceRoutes);
app.use(errorHandler);


app.use((err, req, res, next) => {
  logger.error(err.message);
  res.status(500).json({ message: 'Internal Server Error' });
});

async function startServer() {
  try {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
  } catch (error) {
    logger.error(`Database connection failed: ${error.message}`);
    process.exit(1);
  }
}

startServer();