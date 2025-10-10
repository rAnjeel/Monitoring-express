#!/usr/bin/env node
import amqp from 'amqplib'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, './.env') })

const AGENT_ID = process.env.NODE_APP_INSTANCE ?? '0'
const RABBIT_URL = process.env.RABBIT_URL
const RESULTS_QUEUE = process.env.RESULTS_QUEUE || 'ping_results'

const randFloat3 = (min, max) => parseFloat((min + Math.random() * (max - min)).toFixed(3))

class PingAgent {
  constructor(sourceQueue) {
    this.sourceQueue = sourceQueue
    this.resultsQueue = RESULTS_QUEUE
    this.successMin = parseFloat(process.env.PING_SUCCESS_MIN || '0.3')
    this.successMax = parseFloat(process.env.PING_SUCCESS_MAX || '0.95')
    this.connection = null
    this.channel = null
    this.isRunning = false
  }

  connect = async () => {
    if (!RABBIT_URL) throw new Error('RABBIT_URL manquant')
    if (!this.sourceQueue) throw new Error('Queue source manquante')
    this.connection = await amqp.connect(RABBIT_URL)
    this.channel = await this.connection.createChannel()
    await this.channel.assertQueue(this.sourceQueue, { durable: false })
    await this.channel.assertQueue(this.resultsQueue, { durable: false })
  }

  // Génération d'un résultat de ping pour une IP
  generatePingResult = async (ip, deviceId) => {
    const PACKET_COUNT = 4 + Math.floor(Math.random() * 7)
    const successProb = randFloat3(this.successMin, this.successMax)

    const samples = Array.from({ length: PACKET_COUNT }, () => {
      const ok = Math.random() < successProb
      if (ok) return { ok: true, timeMs: randFloat3(20, 200) }
      return { ok: false, timeMs: null }
    })

    const hostTimes = samples.filter(s => s.timeMs != null).map(s => s.timeMs)
    const received = hostTimes.length
    const transmitted = PACKET_COUNT
    const lossPct = parseFloat((((transmitted - received) / transmitted) * 100).toFixed(3))

    const sum = hostTimes.reduce((a, b) => a + b, 0)
    const avg = hostTimes.length ? parseFloat((sum / hostTimes.length).toFixed(3)) : 0
    const min = hostTimes.length ? Math.min(...hostTimes) : 0
    const max = hostTimes.length ? Math.max(...hostTimes) : 0
    const variance = hostTimes.length > 1
      ? hostTimes.reduce((a, t) => a + Math.pow(t - avg, 2), 0) / hostTimes.length
      : 0
    const mdev = parseFloat(Math.sqrt(variance).toFixed(3))
    const totalTimeMs = parseFloat((sum + ((transmitted - received) * 1000)).toFixed(3))

    return { ip, transmitted, received, lossPct, totalTimeMs, min, avg, max, mdev, successProb, deviceId }
  }

  start = async () => {
    if (this.isRunning) return
    await this.connect()
    this.isRunning = true
    console.log(`[Agent ${AGENT_ID}] Consuming from '${this.sourceQueue}', publishing to '${this.resultsQueue}'`)

    await this.channel.consume(this.sourceQueue, async (msg) => {
      if (!msg) return
      try {
        const payload = JSON.parse(msg.content.toString())

        if (payload && payload.batch === true && Array.isArray(payload.items)) {
          for (const item of payload.items) {
            const ip = item?.ip || item?.hostname
            const deviceId = item?.deviceId
            if (!ip) continue
            const result = await this.generatePingResult(ip, deviceId)
            this.channel.sendToQueue(this.resultsQueue, Buffer.from(JSON.stringify(result)))
            console.log(`[Agent ${AGENT_ID}] ${ip} → ${result.avg.toFixed(1)}ms (${result.lossPct}% loss) deviceId=${deviceId}`) 
          }
        } else {
          const ip = payload?.ip || payload?.hostname
          const deviceId = payload?.deviceId
          if (ip) {
            const result = await this.generatePingResult(ip, deviceId)
            this.channel.sendToQueue(this.resultsQueue, Buffer.from(JSON.stringify(result)))
            console.log(`[Agent ${AGENT_ID}] ${ip} → ${result.avg.toFixed(1)}ms (${result.lossPct}% loss) deviceId=${deviceId}`) 
          }
        }
      } catch (e) {
        console.error(`[Agent ${AGENT_ID}] Erreur traitement message: ${e.message}`)
      } finally {
        try { this.channel.ack(msg) } catch {}
      }
    })
  }

  stop = async () => {
    this.isRunning = false
    try { if (this.channel) await this.channel.close() } catch {}
    try { if (this.connection) await this.connection.close() } catch {}
    this.channel = null
    this.connection = null
  }
}

export default PingAgent

