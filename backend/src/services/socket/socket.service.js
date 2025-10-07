import { Server } from 'socket.io'
import logger from '../../logger/logger.js'

class SocketService {
    constructor() {
        this.io = null
        this.namespace = null
        this.isInitialized = false
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
}

export default new SocketService()