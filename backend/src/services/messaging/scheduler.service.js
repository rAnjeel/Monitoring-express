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
		this.timer = null
		this.intervalMs = Number(process.env.SCHEDULER_INTERVAL_MS || 60000)
		this.batchSize = Number(process.env.SCHEDULER_BATCH_SIZE || 100)
		this.queues = {
			core: 'ping_core_tasks',
			access: 'ping_access_tasks',
			mobile: 'ping_mobile_tasks',
		}
	}

	start = async (intervalMs) => {
		if (this.timer) {
			logger.warn('[Scheduler] Déjà démarré')
			return
		}
		if (!this.url) throw new Error('RABBIT_URL manquant')
		this.intervalMs = Number(intervalMs || this.intervalMs)
		await this.#connect()
		await this.#assertQueues()
		logger.info(`[Scheduler] Démarré: interval=${this.intervalMs}ms`)
		this.timer = setInterval(this.#tick, this.intervalMs)
		// run immediately once
		this.#tick()
	}

	stop = async () => {
		if (this.timer) clearInterval(this.timer)
		this.timer = null
		try {
			if (this.channel) await this.channel.close()
			if (this.connection) await this.connection.close()
		} catch (e) {
			logger.error(`[Scheduler] Erreur arrêt: ${e.message}`)
		} finally {
			this.channel = null
			this.connection = null
		}
	}

	#connect = async () => {
		if (this.connection && this.channel) return
		logger.info(`[Scheduler] Connexion à RabbitMQ: ${this.url}`)
		this.connection = await amqp.connect(this.url)
		this.channel = await this.connection.createChannel()
	}

	#assertQueues = async () => {
		await this.channel.assertQueue(this.queues.core, { durable: false })
		await this.channel.assertQueue(this.queues.access, { durable: false })
		await this.channel.assertQueue(this.queues.mobile, { durable: false })
	}

	#tick = async () => {
		try {
			const devices = await deviceService.getFullList({})
			if (!Array.isArray(devices) || devices.length === 0) return

			const buckets = { core: [], access: [], mobile: [] }
			for (const d of devices) {
				const typeRaw = (d?.type_device || '').toString().trim().toUpperCase()
				const ip = d.hostname
				const msg = { ip }
				if (CORE_TYPES.has(typeRaw)) buckets.core.push(msg)
				else if (ACCESS_TYPES.has(typeRaw)) buckets.access.push(msg)
				else if (MOBILE_TYPES.has(typeRaw)) buckets.mobile.push(msg)
			}

			await this.#publishBucket(this.queues.core, buckets.core)
			await this.#publishBucket(this.queues.access, buckets.access)
			await this.#publishBucket(this.queues.mobile, buckets.mobile)

			logger.info(`[Scheduler] Publish OK: core=${buckets.core.length}, access=${buckets.access.length}, mobile=${buckets.mobile.length}`)
		} catch (e) {
			logger.error(`[Scheduler] Tick error: ${e.message}`)
			// try reconnect on next tick
			this.connection = null
			this.channel = null
			try { await this.#connect(); await this.#assertQueues() } catch {}
		}
	}

	#publishBucket = async (queueName, items) => {
		if (!items || items.length === 0) return
		const size = Number.isFinite(this.batchSize) && this.batchSize > 0 ? this.batchSize : 100
		for (let i = 0; i < items.length; i += size) {
			const slice = items.slice(i, i + size)
			const payload = { batch: true, count: slice.length, items: slice }
			const buffer = Buffer.from(JSON.stringify(payload))
			this.channel.sendToQueue(queueName, buffer, { persistent: false })
		}
	}
}

export default new SchedulerService()


