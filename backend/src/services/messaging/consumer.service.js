// consumer.service.js
import amqp from 'amqplib'
import PQueue from 'p-queue'
import parser from './messageParser.service.js'
import logger from '../../logger/logger.js'


class ConsumerService {
	constructor() {
		this.connection = null
		this.channel = null
		this.queue = process.env.RABBIT_QUEUE
		this.url = process.env.RABBIT_URL
		this.isConsuming = false
		this.concurrentLimit = Number(process.env.CONSUMER_CONCURRENCY || 5)
		this.queue = new PQueue({ concurrency: this.concurrentLimit })
	}

	start = async (onMessage) => {
		if (this.isConsuming) {
			logger.warn('[Consumer] Consumer déjà en cours d\'exécution')
			return
		}
		
		if (!this.url) {
			logger.error('[Consumer] RABBIT_URL manquant dans l\'environnement')
			throw new Error('RABBIT_URL manquant dans l\'environnement')
		}
		
		try {
			logger.info(`[Consumer] Connexion à RabbitMQ: ${this.url}`)
			this.connection = await amqp.connect(this.url)
			this.channel = await this.connection.createChannel()
			await this.channel.assertQueue(this.queue, { durable: false })
			const prefetchCount = Number(process.env.RABBIT_PREFETCH)
			await this.channel.prefetch(prefetchCount)
			this.isConsuming = true
			logger.info(`[Consumer] Consommateur démarré sur la queue: ${this.queue}`)
		} catch (error) {
			logger.error(`[Consumer] Erreur de connexion RabbitMQ: ${error.message}`)
			throw error
		}


		await this.channel.consume(this.queue, (msg) => {
			if (!msg) return
			this.queue.add(async () => {
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


