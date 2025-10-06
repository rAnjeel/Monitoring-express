import path from 'path'
import { spawn } from 'child_process'
import cron from 'node-cron'
import logger from '../logger/logger.js'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let scheduledTask = null
let isRunning = false

function runAgentSimuleOnce() {
  try {
    const agentPath = path.resolve(__dirname, '../../../agent ping/agent_simule.js')
    const child = spawn(process.execPath, [agentPath], {
      env: process.env,
      stdio: 'ignore',
      detached: true,
      windowsHide: true,
    })

    child.unref()

    child.on('exit', (code, signal) => {
      isRunning = false
      if (code === 0) {
        logger.info('agent_simule.js terminé avec succès')
      } else {
        logger.error(`agent_simule.js terminé avec code=${code} signal=${signal || 'none'}`)
      }
    })

    child.on('error', (err) => {
      isRunning = false
      logger.error(`Erreur au lancement de agent_simule.js: ${err.message}`)
    })
  } catch (err) {
    isRunning = false
    logger.error(`Exception lors du démarrage de l'agent: ${err.message}`)
  }
}

function start() {
  if (scheduledTask) {
    return
  }
  // Toutes les minutes; TZ est contrôlé par l'environnement (ex: PM2)
  scheduledTask = cron.schedule('* * * * *', () => {
    if (isRunning) {
      logger.warn('Cron: exécution précédente encore en cours, on saute ce tour')
      return
    }
    isRunning = true
    logger.info('Cron: lancement de agent_simule.js')
    runAgentSimuleOnce()
  }, {
    scheduled: true,
    recoverMissedExecutions: false,
  })

  scheduledTask.start()
  logger.info('Scheduler démarré (toutes les minutes)')
}

function stop() {
  if (scheduledTask) {
    scheduledTask.stop()
    scheduledTask = null
    logger.info('Scheduler arrêté')
  }
}

export { start, stop, runAgentSimuleOnce }


