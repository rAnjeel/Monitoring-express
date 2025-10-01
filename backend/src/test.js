const deviceService = require('./services/device.service');

(async () => {
  try {
    await deviceService.startPingConsumer();
    console.log('✅ PingConsumer démarré');
  } catch (err) {
    console.error('❌ Erreur au démarrage du PingConsumer:', err);
  }
})();
