import amqp from 'amqplib'
import logger from '../../logger/logger.js'
import deviceService from '../device.service.js'
import SocketService from '../socket/socket.service.js'


class SchedulerDevicesService {
  constructor() {
    this.url = process.env.RABBIT_URL
    this.connection = null
    this.channel = null
    this.batchSize = Number(process.env.SCHEDULER_BATCH_SIZE || 200)
    this.intervalMs = Number(process.env.SCHEDULER_INTERVAL_MS || 60000)
    this.inProgress = false
    this.timer = null
    this.queueName = process.env.RABBIT_QUEUE_DEVICES || 'ping_devices_tasks'
  }

  start = async () => {
    if (!this.url) throw new Error('RABBIT_URL manquant')
    await this.#connect()
    await this.#assertQueues()
    logger.info(`[SchedulerDevices] Démarré (interval: ${this.intervalMs}ms) → queue=${this.queueName}`)

    const wrapped = async () => {
      if (this.inProgress) {
        logger.warn('[SchedulerDevices] Tick skipped (previous still running)')
        return
      }
      this.inProgress = true
      try {
        await this.#tick()
      } catch (e) {
        logger.error(`[SchedulerDevices] Tick error: ${e.message}`)
      } finally {
        this.inProgress = false
      }
    }
    wrapped()
    this.timer = setInterval(wrapped, this.intervalMs)
  }

  #connect = async () => {
    if (this.connection && this.channel) return
    logger.info(`[SchedulerDevices] Connexion à RabbitMQ: ${this.url}`)
    this.connection = await amqp.connect(this.url)
    this.channel = await this.connection.createChannel()
  }

  #assertQueues = async () => {
    await this.channel.assertQueue(this.queueName, { durable: false })
  }

  #tick = async () => {    
    const devices = await deviceService.getHostnamesAndIds()
    if (!Array.isArray(devices) || devices.length === 0) return
    
    await this.#publishBucket(this.queueName, devices)

    logger.info(`[SchedulerDevices] Publish OK: total=${devices.length} devices`)
  }

  #publishBucket = async (queueName, items) => {
    if (!items || items.length === 0) return
    const batchSize = 200
    const payloads = []

    for (let i = 0; i < items.length; i += batchSize) {
      const slice = items.slice(i, i + batchSize)
      payloads.push(Buffer.from(JSON.stringify({ batch: true, count: slice.length, items: slice })))
    }

    await Promise.all(
      payloads.map(buffer => this.channel.sendToQueue(queueName, buffer, { persistent: false }))
    )
  }
}

export default new SchedulerDevicesService()
