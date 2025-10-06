export default {
  apps: [
    {
      name: 'agent-simule',
      script: 'agent_cron.js',
      cwd: process.cwd(),
      interpreter: 'node',
      env: {
        // Renseigne ta variable RabbitMQ
        RABBIT_URL: process.env.RABBIT_URL || 'amqp://guest:guest@localhost:5672',
        // Désactive le cron interne de l'agent, géré ici par agent_cron.js
        AGENT_CRON: 'false',
        // PM2/Node utiliseront ce TZ pour les logs et la planification interne
        TZ: process.env.TZ || 'Indian/Antananarivo',
      },
      // Redémarrer sur crash/erreur
      max_restarts: 10,
      restart_delay: 2000,
      // Logs
      out_file: 'logs/out.log',
      error_file: 'logs/error.log',
      merge_logs: true,
    },
  ],
}


