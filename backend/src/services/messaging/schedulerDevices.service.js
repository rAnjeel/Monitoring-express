import cron from 'node-cron'
import amqp from 'amqplib'
import logger from '../../logger/logger.js'
import deviceService from '../device.service.js'

const CORE_TYPES = new Set(['ROUTER', 'SWITCH', 'R6K'])
const ACCESS_TYPES = new Set(['IPDSLAM', 'AIRPON', 'TCU'])
const MOBILE_TYPES = new Set(['2G', '3G', '4G', '5G'])

class SchedulerService {
  constructor() {
    this.url = process.env.RABBIT_URL
    this.connection = null
    this.channel = null
    this.batchSize = Number(process.env.SCHEDULER_BATCH_SIZE || 100)
    this.queues = {
      core: 'ping_core_tasks',
      access: 'ping_access_tasks',
      mobile: 'ping_mobile_tasks',
    }

    this.isTickRunning = false
    this.reconnectDelayMs = 5000
  }

  // 🚀 Démarrage du scheduler
  start = async () => {
    if (!this.url) throw new Error('RABBIT_URL manquant')
    await this.#connect()
    await this.#assertQueues()

    logger.info(`[Scheduler] Démarré (cron: 1 min)`)

    // 🕒 Tick toutes les minutes — sans bloquer l’event loop
    cron.schedule('* * * * *', () => {
      this.#safeTick()
    })
  }

  // 🧠 Wrapper sécurisé qui évite les ticks simultanés
  #safeTick = async () => {
    if (this.isTickRunning) {
      logger.warn('[Scheduler] Tick précédent encore en cours — skip')
      return
    }
    this.isTickRunning = true
    const startTime = Date.now()

    try {
      await this.#tick()
      const duration = (Date.now() - startTime).toFixed(1)
      logger.info(`[Scheduler] Tick terminé en ${duration} ms`)
    } catch (e) {
      logger.error(`[Scheduler] Tick error: ${e.message}`)
      await this.#tryReconnect()
    } finally {
      this.isTickRunning = false
    }
  }

  // 🔌 Connexion RabbitMQ
  #connect = async () => {
    if (this.connection && this.channel) return
    logger.info(`[Scheduler] Connexion à RabbitMQ: ${this.url}`)
    this.connection = await amqp.connect(this.url)
    this.channel = await this.connection.createChannel()

    this.connection.on('close', async () => {
      logger.warn('[Scheduler] Connexion RabbitMQ fermée, tentative de reconnexion...')
      await this.#tryReconnect()
    })
  }

  #tryReconnect = async () => {
    try {
      await new Promise(r => setTimeout(r, this.reconnectDelayMs))
      await this.#connect()
      await this.#assertQueues()
      logger.info('[Scheduler] Reconnexion RabbitMQ réussie')
    } catch (e) {
      logger.error(`[Scheduler] Reconnexion échouée: ${e.message}`)
    }
  }

  #assertQueues = async () => {
    for (const q of Object.values(this.queues)) {
      await this.channel.assertQueue(q, { durable: false })
    }
  }

  // 🔁 Tick principal exécuté à chaque minute
  #tick = async () => {
    const devices = await deviceService.getFullList({})
    if (!Array.isArray(devices) || devices.length === 0) return

    const buckets = { core: [], access: [], mobile: [] }

    for (const d of devices) {
      const typeRaw = (d?.type_device || '').toString().trim().toUpperCase()
      const ip = d.hostname
      if (!ip) continue

      const msg = { ip }

      if (CORE_TYPES.has(typeRaw)) buckets.core.push(msg)
      else if (ACCESS_TYPES.has(typeRaw)) buckets.access.push(msg)
      else if (MOBILE_TYPES.has(typeRaw)) buckets.mobile.push(msg)
    }

    // Publie chaque bucket de façon non bloquante
    await Promise.all([
      this.#publishBucket(this.queues.core, buckets.core),
      this.#publishBucket(this.queues.access, buckets.access),
      this.#publishBucket(this.queues.mobile, buckets.mobile),
    ])

    logger.info(`[Scheduler] Publish OK: core=${buckets.core.length}, access=${buckets.access.length}, mobile=${buckets.mobile.length}`)
  }

  // ⚙️ Publication par batch avec "yield" pour relâcher la boucle
  #publishBucket = async (queueName, items) => {
    if (!items || items.length === 0) return

    const size = this.batchSize > 0 ? this.batchSize : 100
    for (let i = 0; i < items.length; i += size) {
      const slice = items.slice(i, i + size)
      const payload = { batch: true, count: slice.length, items: slice }
      const buffer = Buffer.from(JSON.stringify(payload))
      this.channel.sendToQueue(queueName, buffer, { persistent: false })

      // Relâcher l'event loop toutes les 10 batches
      if (i % (size * 10) === 0) {
        await new Promise(r => setImmediate(r))
      }
    }
  }
}

export default new SchedulerService()
