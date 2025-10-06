#!/usr/bin/env node
import path from 'path'
import { spawn } from 'child_process'
import cron from 'node-cron'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let isRunning = false

function runAgentOnce() {
  const agentPath = path.resolve(__dirname, 'agent_simule.js')
  try {
    const child = spawn(process.execPath, [agentPath], {
      env: process.env,
      stdio: 'ignore',
      detached: true,
      windowsHide: true,
    })
    child.unref()

    child.on('exit', () => {
      isRunning = false
    })

    child.on('error', () => {
      isRunning = false
    })
  } catch (_) {
    isRunning = false
  }
}

cron.schedule('* * * * *', () => {
  if (isRunning) return
  isRunning = true
  runAgentOnce()
}, { recoverMissedExecutions: false })



