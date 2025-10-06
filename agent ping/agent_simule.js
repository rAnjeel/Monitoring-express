#!/usr/bin/env node
// Agent de Ping Simulé avec PM2 + RabbitMQ + node-cron

import fs from 'fs'
import path from 'path'
import amqp from 'amqplib'
import cron from 'node-cron'
import dotenv from 'dotenv'
import os from 'os'
import { fileURLToPath } from 'url'
dotenv.config()

const ENABLE_CRON = String(process.env.AGENT_CRON || '').toLowerCase() === 'true'
const CRON_PATTERN = process.env.CRON_PATTERN || '* * * * *'

console.log(`[Agent ${process.env.NODE_APP_INSTANCE ?? '0'}] CRON activé : ${ENABLE_CRON}`)
console.log(`[Agent ${process.env.NODE_APP_INSTANCE ?? '0'}] Pattern : ${CRON_PATTERN}`)

if (ENABLE_CRON) {
  if (!cron.validate(CRON_PATTERN)) {
    console.error(`[Agent ${process.env.NODE_APP_INSTANCE ?? '0'}] ❌ Pattern CRON invalide : ${CRON_PATTERN}`)
    process.exit(1)
  }

  cron.schedule(CRON_PATTERN, async () => {
    console.log(`[Agent ${process.env.NODE_APP_INSTANCE ?? '0'}] → Exécution cron ${new Date().toISOString()}`)
    try {
      await runOnce()
    } catch (err) {
      console.error(`[Agent ${process.env.NODE_APP_INSTANCE ?? '0'}] Erreur runOnce:`, err.message)
    }
  })
} else {
  console.log(`[Agent ${process.env.NODE_APP_INSTANCE ?? '0'}] Mode CRON désactivé, exécution unique`)
  await runOnce()
}


const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, './.env') })

const RABBIT_URL = process.env.RABBIT_URL
const QUEUE = 'ping_results'
const IPS_FILE = path.resolve(__dirname, 'data/ips.txt')
const CRON_SCHEDULE = process.env.CRON_PATTERN || '*/2 * * * *' // par défaut toutes les 2 minutes

// ---- UTILITAIRES ----
function readIps(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    return content
      .split(/\r?\n/)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('#'))
  } catch (e) {
    console.error(`[Erreur] Impossible de lire ${filePath}:`, e.message)
    process.exit(1)
  }
}

function randFloat3(min, max) {
  return parseFloat((min + Math.random() * (max - min)).toFixed(3))
}

function simulatePing(ip, successProb) {
  const ok = Math.random() < successProb
  if (ok) return { ip, status: 'Réponse OK', timeMs: randFloat3(20, 200) }
  const fail = ['Délai dépassé (Timeout)', 'Hôte inaccessible']
  return { ip, status: fail[Math.floor(Math.random() * fail.length)], timeMs: null }
}

// ---- RÉPARTITION IPs SELON INSTANCE PM2 ----
function getAgentIps(allIps) {
  const totalAgents = os.cpus().length
  const agentIndex = Number(process.env.NODE_APP_INSTANCE || 0)
  const chunkSize = Math.ceil(allIps.length / totalAgents)
  const start = agentIndex * chunkSize
  const end = start + chunkSize
  return allIps.slice(start, end)
}

// ---- TÂCHE PRINCIPALE ----
async function runOnce() {
  const allIps = readIps(IPS_FILE)
  const ips = getAgentIps(allIps)
  if (ips.length === 0) {
    console.log(`[Agent ${process.env.NODE_APP_INSTANCE}] Aucune IP assignée.`)
    return
  }

  console.log(`=== [Agent ${process.env.NODE_APP_INSTANCE}] Ping ${ips.length} hôtes ===`)

  const conn = await amqp.connect(RABBIT_URL)
  const channel = await conn.createChannel()
  await channel.assertQueue(QUEUE, { durable: false })

  for (const ip of ips) {
    const PACKET_COUNT = 4 + Math.floor(Math.random() * 7)
    const successProb = randFloat3(0.3, 0.95)
    const hostTimes = []
    let received = 0

    for (let i = 0; i < PACKET_COUNT; i++) {
      const r = simulatePing(ip, successProb)
      if (r.status === 'Réponse OK' && typeof r.timeMs === 'number') {
        received++
        hostTimes.push(r.timeMs)
      }
    }

    const transmitted = PACKET_COUNT
    const lossPct = parseFloat((((transmitted - received) / transmitted) * 100).toFixed(3))
    const sumHostTimes = hostTimes.reduce((a, b) => a + b, 0)
    const totalTimeMs = parseFloat((sumHostTimes + ((transmitted - received) * 1000)).toFixed(3))
    const min = hostTimes.length ? Math.min(...hostTimes) : 0
    const max = hostTimes.length ? Math.max(...hostTimes) : 0
    const avg = hostTimes.length ? parseFloat((sumHostTimes / hostTimes.length).toFixed(3)) : 0
    let mdev = 0
    if (hostTimes.length > 1) {
      const variance = hostTimes.reduce((acc, t) => acc + Math.pow(t - avg, 2), 0) / hostTimes.length
      mdev = parseFloat(Math.sqrt(variance).toFixed(3))
    }

    const result = { ip, transmitted, received, lossPct, totalTimeMs, min, avg, max, mdev, successProb }
    channel.sendToQueue(QUEUE, Buffer.from(JSON.stringify(result)))
    console.log(`[Agent ${process.env.NODE_APP_INSTANCE}] ${ip} → envoyé (${avg.toFixed(1)} ms, perte ${lossPct}%)`)
  }

  await channel.close()
  await conn.close()
}

// ---- CRON UNIQUE ----
console.log(`[Agent ${process.env.NODE_APP_INSTANCE}] CRON activé : ${CRON_SCHEDULE}`)
cron.schedule(CRON_SCHEDULE, async () => {
  console.log(`[Agent ${process.env.NODE_APP_INSTANCE}] → Exécution CRON`)
  try {
    await runOnce()
  } catch (e) {
    console.error(`[Agent ${process.env.NODE_APP_INSTANCE}] Erreur`, e.message)
  }
})
