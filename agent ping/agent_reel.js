#!/usr/bin/env node
// Agent de Ping Réel avec envoi RabbitMQ
// - Lit les IPs depuis data/ipreal.txt (une par ligne)
// - Exécute la commande ping native et parse la sortie
// - Envoie les statistiques à RabbitMQ

import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import amqp from 'amqplib'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'

dotenv.config()
const RABBIT_URL = process.env.RABBIT_URL
const QUEUE = 'ping_results'

const isWindows = process.platform === 'win32'
const PING_COUNT_ARG = isWindows ? '-n' : '-c'
const PING_TIMEOUT_ARG = isWindows ? '-w' : '-W' // seconds (linux/mac) / ms (windows)
const PACKET_COUNT = 4

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ipsFile = path.resolve(__dirname, 'data/ipreal.txt')

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

function buildPingCommand(ip) {
    // Timeout court: 2s pour Linux/macOS, 2000ms pour Windows
    const timeoutVal = isWindows ? '2000' : '2'
    return isWindows
        ? `ping ${PING_COUNT_ARG} ${PACKET_COUNT} ${PING_TIMEOUT_ARG} ${timeoutVal} ${ip}`
        : `ping ${PING_COUNT_ARG} ${PACKET_COUNT} ${PING_TIMEOUT_ARG} ${timeoutVal} ${ip}`
}

function parsePingOutput(ip, stdout, stderr) {
	const output = `${stdout}\n${stderr || ''}`

	// Détections d'échec courantes
	const isTimeout = /Request timed out|Délai d'attente de la demande dépassé|100% packet loss|100.0% packet loss|Destination Host Unreachable|Destination host unreachable|Echec|could not find host/i.test(output)
	if (isTimeout) {
		return { 
			ip, 
			transmitted: PACKET_COUNT, 
			received: 0, 
			lossPct: 100.0, 
			totalTimeMs: PACKET_COUNT * 1000, 
			min: 0, 
			avg: 0, 
			max: 0, 
			mdev: 0 
		}
	}

	// Extraction des statistiques de paquets
	// Windows: "Packets: Sent = 4, Received = 4, Lost = 0 (0% loss)"
	// Linux: "4 packets transmitted, 4 received, 0% packet loss"
	let transmitted = PACKET_COUNT
	let received = PACKET_COUNT
	let lossPct = 0

	// Windows format
	const winStats = output.match(/Packets:\s*Sent\s*=\s*(\d+),\s*Received\s*=\s*(\d+),\s*Lost\s*=\s*(\d+)/i)
	if (winStats) {
		transmitted = parseInt(winStats[1])
		received = parseInt(winStats[2])
		const lost = parseInt(winStats[3])
		lossPct = transmitted > 0 ? (lost / transmitted) * 100 : 0
	} else {
		// Linux format
		const linuxStats = output.match(/(\d+)\s*packets\s*transmitted,\s*(\d+)\s*received,\s*(\d+(?:\.\d+)?)%\s*packet\s*loss/i)
		if (linuxStats) {
			transmitted = parseInt(linuxStats[1])
			received = parseInt(linuxStats[2])
			lossPct = parseFloat(linuxStats[3])
		}
	}

	// Extraction du temps total
	let totalTimeMs = 0
	const timeMatch = output.match(/time\s*(\d+(?:\.\d+)?)\s*ms/i)
	if (timeMatch) {
		totalTimeMs = parseFloat(timeMatch[1])
	}

	// Extraction des statistiques RTT
	// Linux: "rtt min/avg/max/mdev = 63.126/161.058/316.919/78.737 ms"
	// Windows: "Minimum = 12ms, Maximum = 15ms, Average = 13ms"
	let min = 0, avg = 0, max = 0, mdev = 0

	const rttMatch = output.match(/rtt\s*min\/avg\/max\/mdev\s*=\s*(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)\s*ms/i)
	if (rttMatch) {
		min = parseFloat(rttMatch[1])
		avg = parseFloat(rttMatch[2])
		max = parseFloat(rttMatch[3])
		mdev = parseFloat(rttMatch[4])
	} else {
		// Windows format
		const winMin = output.match(/Minimum\s*=\s*(\d+(?:\.\d+)?)\s*ms/i)
		const winMax = output.match(/Maximum\s*=\s*(\d+(?:\.\d+)?)\s*ms/i)
		const winAvg = output.match(/Average\s*=\s*(\d+(?:\.\d+)?)\s*ms/i)
		
		if (winMin) min = parseFloat(winMin[1])
		if (winMax) max = parseFloat(winMax[1])
		if (winAvg) avg = parseFloat(winAvg[1])
	}

	return { 
		ip, 
		transmitted, 
		received, 
		lossPct: parseFloat(lossPct.toFixed(3)), 
		totalTimeMs: parseFloat(totalTimeMs.toFixed(3)), 
		min: parseFloat(min.toFixed(3)), 
		avg: parseFloat(avg.toFixed(3)), 
		max: parseFloat(max.toFixed(3)), 
		mdev: parseFloat(mdev.toFixed(3)) 
	}
}

function pingIp(ip) {
	return new Promise((resolve) => {
		const cmd = buildPingCommand(ip)
		exec(cmd, { windowsHide: true, timeout: 10000 }, (error, stdout, stderr) => {
			const res = parsePingOutput(ip, stdout || '', stderr || error?.message || '')
			return resolve(res)
		})
	})
}

async function main() {
	const ips = readIps(ipsFile)
	if (ips.length === 0) {
		console.error('[Info] Aucun hôte dans data/ipreal.txt')
		process.exit(1)
	}

	console.log('=== Agent de Ping Réel (RabbitMQ) ===')

	// Connexion RabbitMQ
	console.log('Rabbit:', RABBIT_URL)
	const conn = await amqp.connect(RABBIT_URL)
	const channel = await conn.createChannel()
	await channel.assertQueue(QUEUE, { durable: false })

	for (const ip of ips) {
		// eslint-disable-next-line no-await-in-loop
		const result = await pingIp(ip)
		
		// Console
		console.log(`\n--- ${ip} ---`)
		console.log(`${result.transmitted} packets transmitted, ${result.received} received, ${result.lossPct.toFixed(3)}% packet loss, time ${result.totalTimeMs.toFixed(3)}ms`)
		console.log(`rtt min/avg/max/mdev = ${result.min.toFixed(3)}/${result.avg.toFixed(3)}/${result.max.toFixed(3)}/${result.mdev.toFixed(3)} ms`)

		// Envoi RabbitMQ
		channel.sendToQueue(QUEUE, Buffer.from(JSON.stringify(result)))
		console.log(`[RabbitMQ] Résultat envoyé pour ${ip}`)
	}

	// Fermeture propre
	setTimeout(() => {
		channel.close()
		conn.close()
		process.exit(0)
	}, 500)
}

main().catch((e) => {
	console.error('[Erreur] Exécution:', e)
	process.exit(1)
})


