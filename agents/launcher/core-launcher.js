import PingAgent from '../agent_simule.js'

const makeAgent = (queue) => {
  const agent = new PingAgent(queue)
  agent.start().catch(err => {
    console.error(`[Agent] Erreur au démarrage (${queue}):`, err.message)
    process.exit(1)
  })
  return agent
}
makeAgent('ping_core_tasks')