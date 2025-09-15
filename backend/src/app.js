const express = require('express');
const bodyParser = require('body-parser');
const deviceRoutes = require('./routes/device.routes');
const logger = require('./logger/logger');

const app = express();
app.use(bodyParser.json());

app.use('/devices', deviceRoutes);

app.use((err, req, res, next) => {
  logger.error(err.message);
  res.status(500).json({ message: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
