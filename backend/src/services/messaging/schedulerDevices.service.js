import amqp from 'amqplib'
import logger from '../../logger/logger.js'
import deviceService from '../device.service.js'

const CORE_TYPES = new Set(['ROUTER', 'SWITCH', 'R6K'])
const ACCESS_TYPES = new Set(['IPDSLAM', 'AIRPON', 'TCU'])
const MOBILE_TYPES = new Set(['2G', '3G', '4G', '5G'])

class SchedulerDevicesService {
  constructor() {
    this.url = process.env.RABBIT_URL
    this.connection = null
    this.channel = null
    this.batchSize = Number(process.env.SCHEDULER_BATCH_SIZE || 200)
    this.intervalMs = Number(process.env.SCHEDULER_INTERVAL_MS || 60000)
    this.inProgress = false
    this.timer = null
    this.queues = {
      core: 'ping_core_tasks',
      access: 'ping_access_tasks',
      mobile: 'ping_mobile_tasks',
    }
  }

  start = async () => {
    if (!this.url) throw new Error('RABBIT_URL manquant')
    await this.#connect()
    await this.#assertQueues()
    logger.info(`[SchedulerDevices] Démarré (interval: ${this.intervalMs}ms) → queues=${Object.values(this.queues).join(',')}`)

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
    // Run once immediately, then schedule
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
    for (const q of Object.values(this.queues)) {
      await this.channel.assertQueue(q, { durable: false })
    }
  }

  #tick = async () => {
    const devices = await deviceService.getFullList({})
    if (!Array.isArray(devices) || devices.length === 0) return

    const buckets = { core: [], access: [], mobile: [] }
    for (const d of devices) {
      const typeRaw = (d?.type_device || '').toString().trim().toUpperCase()
      const ip = d?.hostname
      const deviceId = d?.id
      if (!ip) continue
      const msg = { ip, deviceId }
      if (CORE_TYPES.has(typeRaw)) buckets.core.push(msg)
      else if (ACCESS_TYPES.has(typeRaw)) buckets.access.push(msg)
      else if (MOBILE_TYPES.has(typeRaw)) buckets.mobile.push(msg)
    }

    await this.#publishBucket(this.queues.core, buckets.core)
    await this.#publishBucket(this.queues.access, buckets.access)
    await this.#publishBucket(this.queues.mobile, buckets.mobile)

    logger.info(`[SchedulerDevices] Publish OK: core=${buckets.core.length}, access=${buckets.access.length}, mobile=${buckets.mobile.length}`)
  }

  #publishBucket = async (queueName, items) => {
    if (!items || items.length === 0) return
    const size = this.batchSize > 0 ? this.batchSize : 100
    for (let i = 0; i < items.length; i += size) {
      const slice = items.slice(i, i + size)
      const payload = { batch: true, count: slice.length, items: slice }
      const buffer = Buffer.from(JSON.stringify(payload))
      this.channel.sendToQueue(queueName, buffer, { persistent: false })
    }
  }
}

export default new SchedulerDevicesService()
