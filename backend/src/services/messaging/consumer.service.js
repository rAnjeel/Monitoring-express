// consumer.service.js
const amqp = require('amqplib')
const parser = require('./messageParser.service')

class ConsumerService {
	constructor() {
		this.connection = null
		this.channel = null
		this.queue = process.env.RABBIT_QUEUE || 'ping_results'
		this.url = process.env.RABBIT_URL
		this.isConsuming = false
	}

	start = async (onMessage) => {
		if (this.isConsuming) return
		if (!this.url) throw new Error('RABBIT_URL manquant dans l\'environnement')
		this.connection = await amqp.connect(this.url)
		this.channel = await this.connection.createChannel()
		await this.channel.assertQueue(this.queue, { durable: false })
		this.isConsuming = true

		await this.channel.consume(this.queue, async (msg) => {
			if (!msg) return
			try {
				const parsed = parser.parsePingMessage(msg.content.toString())
				if (parsed && typeof onMessage === 'function') {
					await onMessage(parsed)
				}
			} catch (e) {
				// eslint-disable-next-line no-console
				console.error('[Consumer] Message error:', e)
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
			// eslint-disable-next-line no-console
			console.error('[Consumer] Stop error:', e)
		} finally {
			this.channel = null
			this.connection = null
		}
	}
}

module.exports = new ConsumerService()


