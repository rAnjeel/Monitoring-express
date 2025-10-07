import { Server } from 'socket.io'
import logger from '../../logger/logger.js'

class SocketService {
    constructor() {
        this.io = null
        this.namespace = null
        this.isInitialized = false
        this.bulkBuffer = new Set()
        this.bulkTimer = null
        this.bulkIntervalMs = Number(process.env.SOCKET_BULK_INTERVAL_MS || 2000)
    }

    // Initialize Socket.IO on an existing HTTP/S server instance
    init = (httpServer, options = {}) => {
        if (this.isInitialized) {
            logger.warn('[Socket] Déjà initialisé')
            return this.io
        }

        const cors = options.cors || {
            origin: options.origin || '*',
            methods: ['GET', 'POST']
        }

        this.io = new Server(httpServer, { cors })
        this.namespace = this.io.of('/')

        this.io.on('connection', (socket) => {
            logger.info(`[Socket] Client connecté: ${socket.id}`)

            socket.on('disconnect', (reason) => {
                logger.info(`[Socket] Client déconnecté: ${socket.id} (raison: ${reason})`)
            })
        })

        this.isInitialized = true
        logger.info('[Socket] Initialisation terminée')
        return this.io
    }

    // Emit to all connected clients
    emitToAll = (eventName, payload) => {
        if (!this.io) return
        this.io.emit(eventName, payload)
    }

    // Emit to a specific room
    emitToRoom = (roomName, eventName, payload) => {
        if (!this.io) return
        this.io.to(roomName).emit(eventName, payload)
    }

    // Allow a socket to join a room (expects socket instance)
    joinRoom = async (socket, roomName) => {
        if (!socket || !roomName) return
        await socket.join(roomName)
    }

    // Allow a socket to leave a room (expects socket instance)
    leaveRoom = async (socket, roomName) => {
        if (!socket || !roomName) return
        await socket.leave(roomName)
    }

    // Queue device ids for bulk update emits
    enqueueDeviceUpdate = (deviceId) => {
        this.bulkBuffer.add(Number(deviceId))
        if (!this.bulkTimer) {
            this.bulkTimer = setTimeout(() => this.flushBulk(), this.bulkIntervalMs)
        }
    }

    flushBulk = () => {
        if (!this.io) {
            this.bulkBuffer.clear()
            this.bulkTimer && clearTimeout(this.bulkTimer)
            this.bulkTimer = null
            return
        }
        if (this.bulkBuffer.size === 0) {
            this.bulkTimer && clearTimeout(this.bulkTimer)
            this.bulkTimer = null
            return
        }
        const ids = Array.from(this.bulkBuffer)
        this.bulkBuffer.clear()
        this.bulkTimer && clearTimeout(this.bulkTimer)
        this.bulkTimer = null
        this.io.emit('devices:bulk_update', ids)
    }
}

export default new SocketService()