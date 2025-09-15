const express = require('express');
const bodyParser = require('body-parser');
const deviceRoutes = require('./routes/device.routes');

const app = express();
app.use(bodyParser.json());

app.use('/devices', deviceRoutes);

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
