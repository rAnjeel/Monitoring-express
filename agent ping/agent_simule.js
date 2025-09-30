#!/usr/bin/env node
// Agent de Ping Simulé (valeurs aléatoires avec 3 décimales)

const fs = require('fs')
const path = require('path')

const ipsFile = path.resolve(__dirname, 'ips.txt')

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

// renvoie un nombre flottant arrondi à 3 décimales
function randFloat3(min, max) {
	return parseFloat((min + Math.random() * (max - min)).toFixed(3))
}

// simulatePing prend maintenant une probabilité de succès par paquet
function simulatePing(ip, successProb) {
	const ok = Math.random() < successProb
	if (ok) {
		// temps en ms avec 3 décimales (20.000 .. 200.000)
		const timeMs = randFloat3(20, 200)
		return { ip, status: 'Réponse OK', timeMs }
	}
	const failStatuses = ['Délai dépassé (Timeout)', 'Hôte inaccessible']
	const status = failStatuses[Math.floor(Math.random() * failStatuses.length)]
	return { ip, status, timeMs: null }
}

async function main() {
	const ips = readIps(ipsFile)
	if (ips.length === 0) {
		console.error('[Info] Aucun hôte dans ips.txt')
		process.exit(1)
	}

	console.log('=== Agent de Ping Simulé (3 décimales) ===')

	const results = []
	for (const ip of ips) {
		// nombre de paquets aléatoire par hôte (4..10)
		const PACKET_COUNT = 4 + Math.floor(Math.random() * 7) // 4..10

		// probabilité de succès par hôte (0.300 .. 0.950) avec 3 décimales
		const successProb = randFloat3(0.300, 0.950)

		const hostTimes = []
		let received = 0
		for (let i = 0; i < PACKET_COUNT; i++) {
			const r = simulatePing(ip, successProb)
			if (r.status === 'Réponse OK' && typeof r.timeMs === 'number') {
				received += 1
				hostTimes.push(r.timeMs)
			}
		}
		const transmitted = PACKET_COUNT
		const lossPct = parseFloat((((transmitted - received) / transmitted) * 100).toFixed(3))

		// Total time : somme des temps reçus + pénalité pour paquets perdus (1000 ms par lost)
		const sumHostTimes = hostTimes.reduce((a, b) => a + b, 0)
		const totalTimeMs = parseFloat((sumHostTimes + ((transmitted - received) * 1000)).toFixed(3))

		const min = hostTimes.length ? Math.min(...hostTimes) : 0
		const max = hostTimes.length ? Math.max(...hostTimes) : 0
		const avg = hostTimes.length ? parseFloat((hostTimes.reduce((a, b) => a + b, 0) / hostTimes.length).toFixed(3)) : 0
		let mdev = 0
		if (hostTimes.length > 1) {
			const variance = hostTimes.reduce((acc, t) => acc + Math.pow(t - avg, 2), 0) / hostTimes.length
			mdev = parseFloat(Math.sqrt(variance).toFixed(3))
		}

		console.log(`\n--- ${ip} ---`)
		console.log(`${transmitted} packets transmitted, ${received} received, ${lossPct.toFixed(3)}% packet loss, time ${totalTimeMs.toFixed(3)}ms`)
		console.log(`rtt min/avg/max/mdev = ${min.toFixed(3)}/${avg.toFixed(3)}/${max.toFixed(3)}/${mdev.toFixed(3)} ms`)
		console.log(`(debug) packets=${transmitted}, successProb=${successProb.toFixed(3)}`)
		results.push({ ip, transmitted, received, lossPct, totalTimeMs, min, avg, max, mdev })
	}
}

main().catch((e) => {
	console.error('[Erreur] Exécution:', e)
	process.exit(1)
})
