import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import deviceService from '../device.service.js'
import CryptoJS from 'crypto-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const cacheDir = path.resolve(__dirname, '../../cache')
const cacheFilePath = path.join(cacheDir, 'devices.json')

let cache = { devices: [] }

const getEncryptionKey = () => process.env.CACHE_ENCRYPTION_KEY || 'monitoring-default-cache-key'

const encryptText = (plainText) => {
  const key = getEncryptionKey()
  return CryptoJS.AES.encrypt(plainText, key).toString()
}

const decryptText = (cipherText) => {
  const key = getEncryptionKey()
  const bytes = CryptoJS.AES.decrypt(cipherText, key)
  return bytes.toString(CryptoJS.enc.Utf8)
}

export const loadCache = async () => {
  try {
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true })
    }
    if (!fs.existsSync(cacheFilePath)) {
      const encryptedEmpty = encryptText(JSON.stringify([], null, 2))
      fs.writeFileSync(cacheFilePath, encryptedEmpty)
    }
    const data = fs.readFileSync(cacheFilePath, 'utf-8')
    try {
      const decrypted = decryptText(data)
      cache.devices = JSON.parse(decrypted)
    } catch {
      try {
        cache.devices = JSON.parse(data)
        await saveCache()
      } catch {
        cache.devices = []
      }
    }
  } catch {
    cache.devices = []
  }
}

export const getDevices = () => {
  try {
    const data = fs.readFileSync(cacheFilePath, 'utf-8')
    try {
      const decrypted = decryptText(data)
      return JSON.parse(decrypted)
    } catch {
      return JSON.parse(data)
    }
  } catch {
    return cache.devices
  }
}

export const updateDevice = (id, payload) => {
  const index = cache.devices.findIndex(d => d.id === id)
  if (index !== -1) {
    cache.devices[index] = { ...cache.devices[index], ...payload }
  }
}

export const saveCache = async () => {
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true })
  }
  const json = JSON.stringify(cache.devices, null, 2)
  const encrypted = encryptText(json)
  fs.writeFileSync(cacheFilePath, encrypted)
}

export const refreshCacheFromDb = async (filter = {}) => {
  const rows = await deviceService.getFullList(filter)
  cache.devices = Array.isArray(rows) ? rows : []
  await saveCache()
}


