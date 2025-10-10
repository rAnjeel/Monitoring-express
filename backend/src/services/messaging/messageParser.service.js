// messageParser.service.js
class MessageParserService {
	// Valide et normalise le message d'un agent ping
	// Entrée attendue (JSON): { ip, transmitted, received, lossPct, totalTimeMs, min, avg, max, mdev }
	parsePingMessage = (raw) => {
		if (!raw) return null
		let msg = raw
		if (typeof raw === 'string') {
			try { msg = JSON.parse(raw) } catch (e) { return null }
		}
		if (typeof msg !== 'object' || msg === null) return null

		const ip = typeof msg.ip === 'string' ? msg.ip.trim() : null
		if (!ip) return null

		const transmitted = this.#toIntOrNull(msg.transmitted)
		const received = this.#toIntOrNull(msg.received)
		const lossPct = this.#toFloatOrNull(msg.lossPct)
		const totalTimeMs = this.#toFloatOrNull(msg.totalTimeMs)
		const min = this.#toFloatOrNull(msg.min)
		const avg = this.#toFloatOrNull(msg.avg)
		const max = this.#toFloatOrNull(msg.max)
		const mdev = this.#toFloatOrNull(msg.mdev)
		const deviceId = this.#toIntOrNull(msg.deviceId)

		return {
			ip,
			transmitted: transmitted ?? 0,
			received: received ?? 0,
			lossPct: lossPct ?? 0,
			totalTimeMs: totalTimeMs ?? 0,
			min: min ?? 0,
			avg: avg ?? 0,
			max: max ?? 0,
			mdev: mdev ?? 0,
			deviceId: deviceId
		}
	}

	#toNull = (v) => {
		if (v === undefined || v === null) return null
		const s = typeof v === 'string' ? v.trim() : v
		if (s === '' || s === '\\N' || s === '\\n' || s === 'NULL' || s === 'null') return null
		return s
	}

	#toIntOrNull = (v) => {
		const x = this.#toNull(v)
		if (x === null) return null
		const n = Number(x)
		return Number.isFinite(n) ? Math.trunc(n) : null
	}

	#toFloatOrNull = (v) => {
		const x = this.#toNull(v)
		if (x === null) return null
		const n = Number(x)
		return Number.isFinite(n) ? n : null
	}
}

export default new MessageParserService()


