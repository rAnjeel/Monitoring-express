#!/usr/bin/env node
// Agent de Ping Réel
// - Lit les IPs depuis ips.txt (une par ligne)
// - Exécute la commande ping native (Windows: -n 1, Linux/macOS: -c 1)
// - Analyse la sortie pour afficher le statut et le temps de réponse

const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')

const isWindows = process.platform === 'win32'
const PING_COUNT_ARG = isWindows ? '-n' : '-c'
const PING_TIMEOUT_ARG = isWindows ? '-w' : '-W' // seconds (linux/mac) / ms (windows)
const PACKET_COUNT = 4

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
		return { ip, status: 'Délai dépassé (Timeout) ou Hôte inaccessible', timeMs: null }
	}

	// Extraction du temps
	// Windows: time=12ms ou time<1ms
	let timeMatch = output.match(/time[=<]\s*(\d+(?:\.\d+)?)\s*ms/i)
	if (!timeMatch) {
		// Linux/macOS: time=12.3 ms
		timeMatch = output.match(/time=\s*(\d+(?:\.\d+)?)\s*ms/i)
	}

	if (timeMatch) {
		const timeMs = Number(timeMatch[1])
		return { ip, status: 'Réponse OK', timeMs: isFinite(timeMs) ? timeMs : null }
	}

	// Cas sans time mais pas d'échec explicite
	return { ip, status: 'Réponse OK (temps inconnu)', timeMs: null }
}

function pingIp(ip) {
	return new Promise((resolve) => {
		const cmd = buildPingCommand(ip)
		exec(cmd, { windowsHide: true, timeout: 5000 }, (error, stdout, stderr) => {
			if (error) {
				// Même en cas d'erreur, tenter d'interpréter la sortie pour un message plus clair
                const res = parsePingOutput(ip, stdout || '', stderr || error.message || '')
                return resolve({ ...res, raw: stdout || '' })
			}
            const res = parsePingOutput(ip, stdout || '', stderr || '')
            return resolve({ ...res, raw: stdout || '' })
		})
	})
}

async function main() {
	const ips = readIps(ipsFile)
	if (ips.length === 0) {
		console.error('[Info] Aucun hôte dans ips.txt')
		process.exit(1)
	}

    console.log('=== Agent de Ping Réel ===')
	for (const ip of ips) {
		// eslint-disable-next-line no-await-in-loop
        const result = await pingIp(ip)
        console.log(`\n--- ${ip} ---`)
        if (result.raw && String(result.raw).trim().length > 0) {
            console.log(result.raw.trim())
        } else {
            const timeStr = result.timeMs != null ? `${result.timeMs} ms` : '-'
            console.log(`${ip.padEnd(30)} | ${result.status.padEnd(32)} | ${timeStr}`)
        }
	}
}

main().catch((e) => {
	console.error('[Erreur] Exécution:', e)
	process.exit(1)
})


