#!/usr/bin/env node
// Agent de Ping Simulé avec envoi RabbitMQ

import fs from 'fs'
import path from 'path'
import amqp from 'amqplib'
import cron from 'node-cron'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ipsFile = path.resolve(__dirname, 'data/ips.txt')
dotenv.config({ path: path.join(__dirname, './.env') })
const RABBIT_URL = process.env.RABBIT_URL
const QUEUE = 'ping_results'

// Lecture des IPs
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

// utilitaire aléatoire 3 décimales
function randFloat3(min, max) {
	return parseFloat((min + Math.random() * (max - min)).toFixed(3))
}

function simulatePing(ip, successProb) {
	const ok = Math.random() < successProb
	if (ok) {
		return { ip, status: 'Réponse OK', timeMs: randFloat3(20, 200) }
	}
	const failStatuses = ['Délai dépassé (Timeout)', 'Hôte inaccessible']
	return { ip, status: failStatuses[Math.floor(Math.random() * failStatuses.length)], timeMs: null }
}

let isRunning = false

async function runOnce() {
	const ips = readIps(ipsFile)
	if (ips.length === 0) {
		console.error('[Info] Aucun hôte dans ips.txt')
		process.exit(1)
	}

	console.log('=== Agent de Ping Simulé (RabbitMQ) ===')

	// Connexion RabbitMQ
	console.log('Rabbit:',RABBIT_URL)
	const conn = await amqp.connect(RABBIT_URL)
	const channel = await conn.createChannel()
	await channel.assertQueue(QUEUE, { durable: false })

	for (const ip of ips) {
		const PACKET_COUNT = 4 + Math.floor(Math.random() * 7) // 4..10
		const successProb = randFloat3(0.300, 0.950)

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

		// Console
		console.log(`\n--- ${ip} ---`)
		console.log(`${transmitted} packets transmitted, ${received} received, ${lossPct.toFixed(3)}% packet loss, time ${totalTimeMs.toFixed(3)}ms`)
		console.log(`rtt min/avg/max/mdev = ${min.toFixed(3)}/${avg.toFixed(3)}/${max.toFixed(3)}/${mdev.toFixed(3)} ms`)
		console.log(`(debug) successProb=${successProb.toFixed(3)}`)

		// Envoi RabbitMQ
		channel.sendToQueue(QUEUE, Buffer.from(JSON.stringify(result)))
		console.log(`[RabbitMQ] Résultat envoyé pour ${ip}`)
	}

	// Fermeture propre
	setTimeout(() => {
		try { channel.close() } catch (_) {}
		try { conn.close() } catch (_) {}
		isRunning = false
	}, 500)
}

const AGENT_CRON = String(process.env.AGENT_CRON || 'true').toLowerCase() === 'true'

if (AGENT_CRON) {
	console.log('[Agent] Démarrage en mode cron (chaque minute)')
	cron.schedule('* * * * *', async () => {
		if (isRunning) {
			console.log('[Agent] Exécution précédente encore en cours, on saute ce tour')
			return
		}
		isRunning = true
		try {
			await runOnce()
		} catch (e) {
			console.error('[Erreur] Exécution:', e)
			isRunning = false
		}
	}, { recoverMissedExecutions: false })
} else {
	runOnce().catch(e => {
		console.error('[Erreur] Exécution:', e)
		process.exit(1)
	})
}
