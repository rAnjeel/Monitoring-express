import TrafficAgent from '../traffic_simule.js'

const makeAgent = (queue) => {
  const agent = new TrafficAgent(queue)
  agent.start().catch(err => {
    console.error(`[Agent] Erreur au démarrage (${queue}):`, err.message)
    process.exit(1)
  })
  return agent
}
makeAgent('traffic_ports_tasks')
