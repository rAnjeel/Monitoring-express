// consumer.service.js
const amqp = require('amqplib')
const parser = require('./messageParser.service')
const logger = require('../../logger/logger')


class ConsumerService {
	constructor() {
		this.connection = null
		this.channel = null
		this.queue = process.env.RABBIT_QUEUE
		this.url = process.env.RABBIT_URL
		this.isConsuming = false
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
			this.isConsuming = true
			logger.info(`[Consumer] Consommateur démarré sur la queue: ${this.queue}`)
		} catch (error) {
			logger.error(`[Consumer] Erreur de connexion RabbitMQ: ${error.message}`)
			throw error
		}

		await this.channel.consume(this.queue, async (msg) => {
			if (!msg) return
			try {
				const parsed = parser.parsePingMessage(msg.content.toString())
				if (parsed && typeof onMessage === 'function') {
					await onMessage(parsed)
				}
			} catch (e) {
				logger.error(`[Consumer] Erreur traitement message: ${e.message}`)
			} finally {
				this.channel.ack(msg)
			}
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

module.exports = new ConsumerService()


