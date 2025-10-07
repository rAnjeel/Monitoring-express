// consumer.service.js
import amqp from 'amqplib'
import PQueue from 'p-queue'
import parser from './messageParser.service.js'
import logger from '../../logger/logger.js'

class ConsumerService {
	constructor() {
		this.connection = null
		this.channel = null
		this.queueName = process.env.RABBIT_QUEUE
		this.url = process.env.RABBIT_URL
		this.isConsuming = false

		this.concurrentLimit = Number(process.env.CONSUMER_CONCURRENCY || 5)
		this.taskQueue = new PQueue({ concurrency: this.concurrentLimit })
	}

	start = async (onMessage) => {
		if (this.isConsuming) {
			logger.warn('[Consumer] Déjà en cours d\'exécution')
			return
		}

		if (!this.url) throw new Error('RABBIT_URL manquant')
		if (!this.queueName || typeof this.queueName !== 'string')
			throw new Error('RABBIT_QUEUE manquant ou invalide')

		try {
			logger.info(`[Consumer] Connexion à RabbitMQ: ${this.url}`)
			this.connection = await amqp.connect(this.url)
			this.channel = await this.connection.createChannel()

			await this.channel.assertQueue(this.queueName, { durable: false })
			const prefetchCount = Number(process.env.RABBIT_PREFETCH || 20)
			await this.channel.prefetch(prefetchCount)

			this.isConsuming = true
			logger.info(`[Consumer] Consommateur démarré sur: ${this.queueName} (prefetch=${prefetchCount}, concurrency=${this.concurrentLimit})`)
		} catch (error) {
			logger.error(`[Consumer] Erreur connexion RabbitMQ: ${error.message}`)
			throw error
		}

		await this.channel.consume(this.queueName, (msg) => {
			if (!msg) return
			this.taskQueue.add(async () => {
				try {
					const parsed = parser.parsePingMessage(msg.content.toString())
					if (parsed && typeof onMessage === 'function') {
						await onMessage(parsed)
					}
				} catch (e) {
					logger.error(`[Consumer] Erreur traitement message: ${e.message}`)
				} finally {
					try { this.channel.ack(msg) } catch {}
				}
			})
		})
	}

	stop = async () => {
		this.isConsuming = false
		try {
			if (this.channel) await this.channel.close()
			if (this.connection) await this.connection.close()
		} catch (e) {
			logger.error(`[Consumer] Erreur arrêt: ${e.message}`)
		} finally {
			this.channel = null
			this.connection = null
		}
	}
}

export default new ConsumerService()


