# Agent Ping - Guide de déploiement PM2

## Vue d'ensemble

Ce système d'agents de ping simulé consomme des queues RabbitMQ et génère des résultats de ping simulés. Il est organisé en 3 types d'agents :

- **Core** : ROUTER, SWITCH, R6K
- **Access** : IPDSLAM, AIRPON, TCU
- **Mobile** : 2G, 3G, 4G, 5G

## Configuration requise

### Variables d'environnement (.env)

```bash
# RabbitMQ
RABBIT_URL=amqp://user:pass@host:5672

# Queue de résultats
RESULTS_QUEUE=ping_results

# Probabilités de succès (0.0 à 1.0)
PING_SUCCESS_MIN=0.3
PING_SUCCESS_MAX=0.95

# Instance ID (pour PM2)
NODE_APP_INSTANCE=0
```

## Déploiement PM2

### 1. Installation des dépendances

```bash
cd "agent ping"
npm install
```

### 2. Lancement avec PM2

#### Option A : Lancement individuel

```bash
# Agent Core (1 instance)
pm2 start launcher/core-launcher.js --name "ping-core" --instances 2

# Agent Access (2 instances)
pm2 start launcher/access-launcher.js --name "ping-access" --instances 1

# Agent Mobile (3 instances)
pm2 start launcher/mobile-Launcher.js --name "ping-mobile" --instances 3
```

#### Option B : Configuration PM2 (ecosystem.config.js)

```bash
pm2 start ecosystem.config.js
```

### 3. Gestion des processus

```bash
# Voir le statut
pm2 status

# Voir les logs
pm2 logs ping-core
pm2 logs ping-access
pm2 logs ping-mobile

# Redémarrer un agent
pm2 restart ping-core

# Arrêter tous les agents
pm2 stop all

# Supprimer tous les agents
pm2 delete all
```

## Recommandations d'instances

| Type d'agent | Nombre d'instances | Justification                          |
| ------------ | ------------------ | -------------------------------------- |
| **Core**     | 1-2                | Équipements critiques, volume modéré   |
| **Access**   | 2-4                | Volume élevé, équipements d'accès      |
| **Mobile**   | 3-6                | Volume très élevé, équipements mobiles |

### Exemple de configuration optimisée

```bash
# Core : 1 instance
pm2 start launcher/core-launcher.js --name "ping-core" --instances 1

# Access : 3 instances
pm2 start launcher/access-launcher.js --name "ping-access" --instances 3

# Mobile : 5 instances
pm2 start launcher/mobile-Launcher.js --name "ping-mobile" --instances 5
```

## Monitoring

### Logs en temps réel

```bash
# Tous les agents
pm2 logs

# Agent spécifique
pm2 logs ping-core --lines 100

# Logs avec timestamps
pm2 logs --timestamp
```

### Métriques PM2

```bash
# Monitoring en temps réel
pm2 monit

# Informations détaillées
pm2 show ping-core
```

## Architecture des queues

```
Scheduler → [ping_core_tasks] → Core Agent → [ping_results]
          → [ping_access_tasks] → Access Agent → [ping_results]
          → [ping_mobile_tasks] → Mobile Agent → [ping_results]
```

## Dépannage

### Problèmes courants

1. **Erreur de connexion RabbitMQ**

   ```bash
   # Vérifier la configuration
   echo $RABBIT_URL
   ```

2. **Queue vide**

   ```bash
   # Vérifier que le scheduler fonctionne
   pm2 logs monitoring-express
   ```

3. **Agent ne démarre pas**
   ```bash
   # Vérifier les logs
   pm2 logs ping-core --err
   ```

### Redémarrage complet

```bash
# Arrêter tout
pm2 delete all

# Redémarrer le scheduler backend
pm2 restart monitoring-express

# Redémarrer les agents
pm2 start ecosystem.config.js
```

## Performance

### Optimisation des instances

- **CPU** : 1 instance par cœur disponible
- **Mémoire** : ~50MB par instance
- **Queue** : Surveiller la longueur des queues RabbitMQ

### Surveillance

```bash
# Surveiller l'utilisation CPU/Mémoire
pm2 monit

# Logs de performance
pm2 logs --timestamp | grep "Agent"
```

## Exemple de déploiement complet

```bash
# 1. Démarrer le backend avec scheduler
cd ../backend
pm2 start src/app.js --name "monitoring-express"

# 2. Démarrer les agents ping
cd "../agent ping"
pm2 start ecosystem.config.js

# 3. Vérifier le statut
pm2 status

# 4. Surveiller les logs
pm2 logs --timestamp
```

## Notes importantes

- Chaque agent consomme une queue spécifique
- Les résultats sont publiés dans `ping_results`
- Le scheduler backend alimente les queues `ping_*_tasks`
- Les agents sont indépendants et peuvent être redémarrés individuellement
