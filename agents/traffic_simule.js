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
const UP_PROB = 0.9                  // probabilité que le port soit actif
const MIN_IN = 3000                  // delta minimal inOctets
const MAX_IN = 7000                  // delta maximal inOctets
const MIN_OUT = 2000                 // delta minimal outOctets
const MAX_OUT = 4000                 // delta maximal outOctets
const JITTER_PCT = 0.1               // ±10% de variation)

const mbpsToOctets = (mbps, seconds) => Math.max(0, Math.floor((mbps * 1_000_000 / 8) * seconds))

class TrafficAgent {
  constructor(sourceQueue) {
    this.sourceQueue = sourceQueue || process.env.RABBIT_QUEUE_PORTS || 'traffic_ports_tasks'
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

   applyJitter = (value, jitterPct) => {
    const jitter = 1 + (Math.random() * 2 - 1) * jitterPct
    return Math.max(0, value * jitter)
  }

  generatePortTraffic = async (port_id) => {
    const isUp = Math.random() < UP_PROB
    let deltaIn = 0
    let deltaOut = 0

    if (isUp) {
      // delta aléatoire par port avec jitter
      deltaIn = this.applyJitter(
        Math.floor(Math.random() * (MAX_IN - MIN_IN + 1) + MIN_IN),
        JITTER_PCT
      )
      deltaOut = this.applyJitter(
        Math.floor(Math.random() * (MAX_OUT - MIN_OUT + 1) + MIN_OUT),
        JITTER_PCT
      )
    }

    return {
      port_id,
      deltaInOctets: Math.round(deltaIn),
      deltaOutOctets: Math.round(deltaOut),
      status: isUp,
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
          // Traitement par batch de devices
          for (const group of payload.items) {
            const deviceId = group?.device_id
            const portsInGroup = Array.isArray(group?.ports) ? group.ports : []
            if (deviceId == null || portsInGroup.length === 0) continue
            
            // Générer le trafic pour tous les ports et les regrouper par device
            const ports = []
            for (const p of portsInGroup) {
              const baseIn = Number(p.ifInOctets) || 0
              const baseOut = Number(p.ifOutOctets) || 0
              const portTraffic = await this.generatePortTraffic(p.port_id)
              ports.push({
                port_id: p.port_id,
                inOctets: baseIn + (Number(portTraffic.deltaInOctets) || 0),
                outOctets: baseOut + (Number(portTraffic.deltaOutOctets) || 0),
                deltaInOctets: portTraffic.deltaInOctets,
                deltaOutOctets: portTraffic.deltaOutOctets,
                status: portTraffic.status
              })
            }
            
            const groupedResult = {
              device_id: deviceId,
              ports: ports,
              ts: new Date()
            }
            
            this.channel.sendToQueue(this.resultsQueue, Buffer.from(JSON.stringify(groupedResult)))
            console.log(`[TrafficAgent ${AGENT_ID}] device=${deviceId} → ${ports.length} ports grouped`)
          }
        } else {
          // Prendre un device unique
          const deviceId = payload?.device_id
          const portsInGroup = Array.isArray(payload?.ports) ? payload.ports : []
          if (deviceId != null && portsInGroup.length > 0) {
            // Get ports et genere traffic
            const ports = []
            for (const p of portsInGroup) {
              const baseIn = Number(p.ifInOctets) || 0
              const baseOut = Number(p.ifOutOctets) || 0
              const portTraffic = await this.generatePortTraffic(p.port_id)
              ports.push({
                port_id: p.port_id,
                inOctets: baseIn + (Number(portTraffic.deltaInOctets) || 0),
                outOctets: baseOut + (Number(portTraffic.deltaOutOctets) || 0),
                status: portTraffic.status
              })
            }
            
            const groupedResult = {
              device_id: deviceId,
              ports: ports,
              ts: new Date()
            }
            
            this.channel.sendToQueue(this.resultsQueue, Buffer.from(JSON.stringify(groupedResult)))
            console.log(`[TrafficAgent ${AGENT_ID}] device=${deviceId} → ${ports.length} ports grouped`)
          }
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

