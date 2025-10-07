#!/usr/bin/env node
// 🚀 Agent de Ping Simulé avec PM2 + RabbitMQ + node-cron optimisé (non-bloquant)

import fs from 'fs/promises'
import path from 'path'
import amqp from 'amqplib'
import cron from 'node-cron'
import dotenv from 'dotenv'
import os from 'os'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, './.env') })

// === CONFIG ===
const RABBIT_URL = process.env.RABBIT_URL
const QUEUE = 'ping_results'
const IPS_FILE = path.resolve(__dirname, 'data/ips.txt')
const CRON_PATTERN = process.env.CRON_PATTERN || '*/1 * * * *'
const ENABLE_CRON = String(process.env.AGENT_CRON || '').toLowerCase() === 'true'
const AGENT_ID = process.env.NODE_APP_INSTANCE ?? '0'

console.log(`[Agent ${AGENT_ID}] ➜ Cron activé : ${ENABLE_CRON} (${CRON_PATTERN})`)
console.log(`[Agent ${AGENT_ID}] ➜ RabbitMQ : ${RABBIT_URL}`)

// === UTILS ===
const randFloat3 = (min, max) => parseFloat((min + Math.random() * (max - min)).toFixed(3))

const simulatePing = (ip, successProb) => {
  const ok = Math.random() < successProb
  if (ok) return { ip, status: 'Réponse OK', timeMs: randFloat3(20, 200) }
  const fail = ['Délai dépassé (Timeout)', 'Hôte inaccessible']
  return { ip, status: fail[Math.floor(Math.random() * fail.length)], timeMs: null }
}

async function readIps() {
  try {
    const content = await fs.readFile(IPS_FILE, 'utf8')
    return content
      .split(/\r?\n/)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('#'))
  } catch (e) {
    console.error(`[Agent ${AGENT_ID}] ⚠️ Erreur lecture IPs :`, e.message)
    return []
  }
}

// === RÉPARTITION DES IPs ===
function getAgentIps(allIps) {
  const totalAgents = parseInt(process.env.PM2_INSTANCES || os.cpus().length, 10)
  const agentIndex = Number(AGENT_ID)
  const chunkSize = Math.ceil(allIps.length / totalAgents)
  return allIps.slice(agentIndex * chunkSize, (agentIndex + 1) * chunkSize)
}

// === TÂCHE PRINCIPALE (asynchrone & non-bloquante) ===
async function runOnce() {
  const allIps = await readIps()
  const ips = getAgentIps(allIps)
  if (ips.length === 0) {
    console.log(`[Agent ${AGENT_ID}] Aucune IP assignée.`)
    return
  }

  console.log(`[Agent ${AGENT_ID}] → ${ips.length} hôtes à tester...`)

  const conn = await amqp.connect(RABBIT_URL)
  const channel = await conn.createChannel()
  await channel.assertQueue(QUEUE, { durable: false })

  // Traiter les IPs par petits lots pour éviter les blocages
  const BATCH_SIZE = 5
  for (let i = 0; i < ips.length; i += BATCH_SIZE) {
    const batch = ips.slice(i, i + BATCH_SIZE)

    await Promise.all(
      batch.map(async ip => {
        const PACKET_COUNT = 4 + Math.floor(Math.random() * 7)
        const successProb = randFloat3(0.3, 0.95)

        const results = Array.from({ length: PACKET_COUNT }, () => simulatePing(ip, successProb))
        const hostTimes = results.filter(r => r.timeMs != null).map(r => r.timeMs)
        const received = hostTimes.length
        const transmitted = PACKET_COUNT
        const lossPct = parseFloat((((transmitted - received) / transmitted) * 100).toFixed(3))

        const sum = hostTimes.reduce((a, b) => a + b, 0)
        const avg = hostTimes.length ? parseFloat((sum / hostTimes.length).toFixed(3)) : 0
        const min = hostTimes.length ? Math.min(...hostTimes) : 0
        const max = hostTimes.length ? Math.max(...hostTimes) : 0
        const variance = hostTimes.length > 1 ? hostTimes.reduce((a, t) => a + Math.pow(t - avg, 2), 0) / hostTimes.length : 0
        const mdev = parseFloat(Math.sqrt(variance).toFixed(3))
        const totalTimeMs = parseFloat((sum + ((transmitted - received) * 1000)).toFixed(3))

        const result = { ip, transmitted, received, lossPct, totalTimeMs, min, avg, max, mdev, successProb }
        channel.sendToQueue(QUEUE, Buffer.from(JSON.stringify(result)))
        console.log(`[Agent ${AGENT_ID}] ${ip} → ${avg.toFixed(1)}ms (${lossPct}% loss)`)
      })
    )

    // pause
    await new Promise(res => setTimeout(res, 100))
  }

  await channel.close()
  await conn.close()
  console.log(`[Agent ${AGENT_ID}] ✅ Terminé à ${new Date().toISOString()}`)
}

// === PLANIFICATION ===
if (ENABLE_CRON) {
  if (!cron.validate(CRON_PATTERN)) {
    console.error(`[Agent ${AGENT_ID}] ❌ Pattern CRON invalide : ${CRON_PATTERN}`)
    process.exit(1)
  }

  cron.schedule(CRON_PATTERN, () => {
    console.log(`[Agent ${AGENT_ID}] 🔁 Tick CRON @ ${new Date().toLocaleTimeString()}`)
    runOnce().catch(err => console.error(`[Agent ${AGENT_ID}] Erreur runOnce:`, err.message))
  })
} else {
  runOnce().catch(err => console.error(`[Agent ${AGENT_ID}] Erreur:`, err.message))
}
