import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import deviceService from '../device.service.js'
import CryptoJS from 'crypto-js'
import logger from '../../logger/logger.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const cacheDir = path.resolve(__dirname, '../../cache')
const cacheFilePath = path.join(cacheDir, 'devices.json')

let cache = { devices: [] }
let isSaving = false

// -------------------------------
// 🔑 Gestion clé de chiffrement
// -------------------------------
const getEncryptionKey = () => {
  const key = process.env.CACHE_ENCRYPTION_KEY
  if (!key) {
    logger.warn('[DeviceCache] Using default encryption key — set CACHE_ENCRYPTION_KEY in production!')
    return 'monitoring-default-cache-key'
  }
  return key
}

// -------------------------------
// 🔐 Fonctions chiffrement
// -------------------------------
const encryptText = (plainText) => {
  const key = getEncryptionKey()
  return CryptoJS.AES.encrypt(plainText, key).toString()
}

const decryptText = (cipherText) => {
  const key = getEncryptionKey()
  const bytes = CryptoJS.AES.decrypt(cipherText, key)
  return bytes.toString(CryptoJS.enc.Utf8)
}

// -------------------------------
// 🚀 Chargement initial
// -------------------------------
export const loadCache = async () => {
  try {
    logger.info('[DeviceCache] Loading cache from disk...')
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true })
      logger.info(`[DeviceCache] Created cache directory at ${cacheDir}`)
    }

    if (!fs.existsSync(cacheFilePath)) {
      const encryptedEmpty = encryptText(JSON.stringify([], null, 2))
      fs.writeFileSync(cacheFilePath, encryptedEmpty)
      logger.info(`[DeviceCache] Initialized empty encrypted cache file at ${cacheFilePath}`)
    }

    const data = fs.readFileSync(cacheFilePath, 'utf-8')
    try {
      const decrypted = decryptText(data)
      cache.devices = JSON.parse(decrypted)
      logger.info(`[DeviceCache] Cache loaded (entries=${cache.devices.length})`)
    } catch {
      try {
        cache.devices = JSON.parse(data)
        await saveCache()
        logger.warn('[DeviceCache] Cache file was plain JSON; re-encrypted and loaded')
      } catch {
        cache.devices = []
        logger.warn('[DeviceCache] Cache file unreadable; starting with empty cache')
      }
    }
  } catch (err) {
    cache.devices = []
    logger.error(`[DeviceCache] Unexpected error loading cache: ${err.message}`)
  }
}

// -------------------------------
// 📦 Lecture (cache RAM prioritaire)
// -------------------------------
export const getDevices = (useMemory = true) => {
  if (useMemory && cache.devices.length > 0) {
    return cache.devices
  }

  try {
    const data = fs.readFileSync(cacheFilePath, 'utf-8')
    const decrypted = decryptText(data)
    const parsed = JSON.parse(decrypted)
    cache.devices = parsed
    logger.info(`[DeviceCache] getDevices (file) -> entries=${parsed.length}`)
    return parsed
  } catch (err) {
    logger.warn(`[DeviceCache] getDevices failed reading file: ${err.message}`)
    return cache.devices
  }
}

// -------------------------------
// 🧩 Mise à jour d’un device
// -------------------------------
export const updateDevice = async (id, payload) => {
  const idNum = Number(id)
  const index = cache.devices.findIndex(d => Number(d.id) === idNum)

  if (index !== -1) {
    cache.devices[index] = { ...cache.devices[index], ...payload }
    // await saveCache()
    logger.info(`[DeviceCache] Updated and saved device id=${idNum}`)
  } else {
    logger.warn(`[DeviceCache] updateDevice: id=${idNum} not found in cache`)
  }
}

// -------------------------------
// 💾 Sauvegarde sur disque
// -------------------------------
export const saveCache = async () => {
  if (isSaving) return
  isSaving = true

  try {
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true })
    const json = JSON.stringify(cache.devices)
    const encrypted = encryptText(json)
    fs.writeFileSync(cacheFilePath, encrypted)
    logger.info(`[DeviceCache] Cache saved (entries=${cache.devices.length})`)
  } catch (err) {
    logger.error(`[DeviceCache] saveCache failed: ${err.message}`)
  } finally {
    isSaving = false
  }
}

// -------------------------------
// 🔁 Recharge depuis la DB
// -------------------------------
export const refreshCacheFromDb = async (filter = {}) => {
  try {
    logger.info('[DeviceCache] Refreshing cache from DB...')
    const rows = await deviceService.getFullList(filter)
    cache.devices = Array.isArray(rows) ? rows : []
    await saveCache()
    logger.info(`[DeviceCache] Refreshed from DB (entries=${cache.devices.length})`)
  } catch (err) {
    logger.error(`[DeviceCache] refreshCacheFromDb failed: ${err.message}`)
  }
}
