#!/usr/bin/env node
// 🚦 Agent de Trafic Simulé (classe) — consomme une queue et publie des métriques de ports

import amqp from 'amqplib'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, './.env') })

const AGENT_ID = process.env.NODE_APP_INSTANCE ?? '0'
const RABBIT_URL = process.env.RABBIT_URL
const TRAFFIC_RESULTS_QUEUE = process.env.TRAFFIC_RESULTS_QUEUE || 'traffic_results'

// bornes de génération
const MAX_RATE_Mbps = parseFloat(process.env.TRAFFIC_MAX_RATE_MBPS || '1000') // bande passante max simulée
const SAMPLE_INTERVAL_SEC = parseInt(process.env.TRAFFIC_SAMPLE_INTERVAL_SEC || '60', 10) // conversion vers octets
const UP_PROB = parseFloat(process.env.TRAFFIC_UP_PROB || '0.98')

const mbpsToOctets = (mbps, seconds) => Math.max(0, Math.floor((mbps * 1_000_000 / 8) * seconds))

class TrafficAgent {
  constructor(sourceQueue) {
    this.sourceQueue = sourceQueue
    this.resultsQueue = TRAFFIC_RESULTS_QUEUE
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

  // Génère un échantillon de trafic pour un port
  generateTrafficResult = async (target) => {
    // target peut contenir { ip, hostname, ifIndex, ifName }
    const ip = target?.ip || target?.hostname || '0.0.0.0'
    const ifIndex = target?.ifIndex ?? null
    const ifName = target?.ifName ?? null

    const isUp = Math.random() < UP_PROB
    let inOctets = 0
    let outOctets = 0
    if (isUp) {
      // génère des débits aléatoires jusqu'à MAX_RATE_Mbps
      const inRate = Math.random() * MAX_RATE_Mbps
      const outRate = Math.random() * MAX_RATE_Mbps
      inOctets = mbpsToOctets(inRate, SAMPLE_INTERVAL_SEC)
      outOctets = mbpsToOctets(outRate, SAMPLE_INTERVAL_SEC)
    }

    return {
      ip,
      ifIndex,
      ifName,
      sampleIntervalSec: SAMPLE_INTERVAL_SEC,
      inOctets,
      outOctets,
      status: isUp, // true = up, false = down
      ts: new Date().toISOString()
    }
  }

  start = async () => {
    if (this.isRunning) return
    await this.connect()
    this.isRunning = true
    console.log(`[TrafficAgent ${AGENT_ID}] Consuming from '${this.sourceQueue}', publishing to '${this.resultsQueue}'`)

    await this.channel.consume(this.sourceQueue, async (msg) => {
      if (!msg) return
      try {
        const payload = JSON.parse(msg.content.toString())

        if (payload && payload.batch === true && Array.isArray(payload.items)) {
          for (const item of payload.items) {
            const res = await this.generateTrafficResult(item)
            this.channel.sendToQueue(this.resultsQueue, Buffer.from(JSON.stringify(res)))
            console.log(`[TrafficAgent ${AGENT_ID}] ${res.ip}${res.ifName ? ' ' + res.ifName : ''} → in=${res.inOctets} out=${res.outOctets} status=${res.status ? 'UP' : 'DOWN'}`)
          }
        } else {
          const res = await this.generateTrafficResult(payload)
          this.channel.sendToQueue(this.resultsQueue, Buffer.from(JSON.stringify(res)))
          console.log(`[TrafficAgent ${AGENT_ID}] ${res.ip}${res.ifName ? ' ' + res.ifName : ''} → in=${res.inOctets} out=${res.outOctets} status=${res.status ? 'UP' : 'DOWN'}`)
        }
      } catch (e) {
        console.error(`[TrafficAgent ${AGENT_ID}] Erreur traitement message: ${e.message}`)
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

export default TrafficAgent


