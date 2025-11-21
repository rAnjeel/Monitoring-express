import amqp from 'amqplib'
import logger from '../../logger/logger.js'
import portService from '../port.service.js'
import monitoringSettingService from '../monitoringSetting.service.js'

class SchedulerPortsService {
  constructor(deviceIds) {
    this.url = process.env.RABBIT_URL
    this.connection = null
    this.channel = null
    this.queueName = process.env.RABBIT_QUEUE_PORTS || 'traffic_ports_tasks'
    this.isTickRunning = false
    this.reconnectDelayMs = 5000
    this.batchSize = Number(process.env.SCHEDULER_PORT_BATCH || 200)
  }

  start = async () => {
    if (!this.url) throw new Error('RABBIT_URL manquant')

    await this.#connect()
    await this.#assertQueue()

    this.intervalMs = Number(process.env.SCHEDULER_PORTS_INTERVAL_MS || 60000)
    try {
      const row = (await monitoringSettingService.getByKeyName('SCHEDULER_PORTS_INTERVAL_MS'))?.[0]
      const ms = Number(row?.value)
      if (Number.isFinite(ms) && ms > 0) this.intervalMs = ms
    } catch {}
    logger.info(`[SchedulerPorts] Démarré (interval: ${this.intervalMs}ms) → queue=${this.queueName}`)
    this.#safeTick()
    this.timer = setInterval(this.#safeTick, this.intervalMs)
  }

  // 🧠 Sécurisation : évite deux ticks en même temps
  #safeTick = async () => {
    if (this.isTickRunning) {
      logger.warn('[SchedulerPorts] Tick précédent encore en cours — skip')
      return
    }

    this.isTickRunning = true
    const start = Date.now()

    try {
      await this.#tick()
      const dur = (Date.now() - start).toFixed(0)
      logger.info(`[SchedulerPorts] Tick terminé en ${dur} ms`)
    } catch (e) {
      logger.error(`[SchedulerPorts] Tick error: ${e.message}`)
      await this.#tryReconnect()
    } finally {
      this.isTickRunning = false
    }
  }

  // 🔌 Connexion RabbitMQ
  #connect = async () => {
    if (this.connection && this.channel) return
    logger.info(`[SchedulerPorts] Connexion à RabbitMQ: ${this.url}`)
    this.connection = await amqp.connect(this.url)
    this.channel = await this.connection.createChannel()

    this.connection.on('close', async () => {
      logger.warn('[SchedulerPorts] Connexion RabbitMQ fermée — tentative de reconnexion...')
      await this.#tryReconnect()
    })
  }

  // 🔁 Reconnexion avec délai
  #tryReconnect = async () => {
    try {
      await new Promise(r => setTimeout(r, this.reconnectDelayMs))
      await this.#connect()
      await this.#assertQueue()
      logger.info('[SchedulerPorts] Reconnexion RabbitMQ réussie')
    } catch (e) {
      logger.error(`[SchedulerPorts] Reconnexion échouée: ${e.message}`)
    }
  }

  #assertQueue = async () => {
    await this.channel.assertQueue(this.queueName, { durable: false })
  }

  // 🕒 Tick principal : récupère les ports et publie
  #tick = async () => {
    const groups = await portService.getPortsGroupedByDevice()
    if (!Array.isArray(groups) || groups.length === 0) return
    
    for (let i = groups.length - 1; i >= 0; i--) {
      const g = groups[i]
      if (!g || g.device_id == null || !Array.isArray(g.ports) || g.ports.length === 0) {
        groups.splice(i, 1)
      }
    }
    if (groups.length === 0) return

    const size = this.batchSize > 0 ? this.batchSize : 200
    let sent = 0

    for (let i = 0; i < groups.length; i += size) {
      const slice = groups.slice(i, i + size)

      await Promise.all(
        slice.map(async (g) => {
          if (!g || g.device_id == null || !Array.isArray(g.ports) || g.ports.length === 0) return
          const payload = { device_id: g.device_id, ports: g.ports }
          const buffer = Buffer.from(JSON.stringify(payload))
          this.channel.sendToQueue(this.queueName, buffer, { persistent: false })
          sent++
        })
      )

      // Laisse respirer la boucle pour éviter blocage CPU
      if (i % (size * 5) === 0) await new Promise(r => setImmediate(r))
    }

    logger.info(`[SchedulerPorts] Publish OK: devices=${sent}`)
  }
}

export default new SchedulerPortsService()
