# 🚀 Optimisations de Performance - Module Reporting

Ce document décrit les optimisations appliquées au module de reporting pour améliorer drastiquement les performances des requêtes d'agrégation.

## 📋 Table des matières

- [Optimisations appliquées](#optimisations-appliquées)
- [Installation](#installation)
- [Utilisation](#utilisation)
- [Performance attendue](#performance-attendue)
- [Maintenance](#maintenance)

---

## ⚡ Optimisations appliquées

### 1. **Index composites SQL**

#### Avant
```sql
-- Index simples
CREATE INDEX idx_device_events_device_id ON device_events(device_id);
CREATE INDEX idx_device_events_event_time ON device_events(event_time);
```

#### Après
```sql
-- Index composites optimisés pour les requêtes de reporting
CREATE INDEX idx_device_events_composite ON device_events(device_id, event_time, status);
CREATE INDEX idx_device_events_time_device ON device_events(event_time, device_id);
CREATE INDEX idx_devices_hostname_type ON devices(hostname, type_device_id);
```

**Gain attendu:** 3-5x plus rapide pour les requêtes avec JOIN et filtres temporels

---

### 2. **Table de pré-agrégation (`daily_device_stats`)**

Une table qui stocke les statistiques journalières pré-calculées pour éviter de recalculer les agrégations à chaque requête.

```sql
CREATE TABLE daily_device_stats (
    device_id INT,
    date DATE,
    avg_latency DECIMAL(10,2),
    min_latency DECIMAL(10,2),
    max_latency DECIMAL(10,2),
    jitter DECIMAL(10,2),
    availability_percent DECIMAL(5,2),
    total_events INT,
    ...
);
```

**Gain attendu:** 10-50x plus rapide pour les requêtes sur de longues périodes (> 30 jours)

---

### 3. **Système de cache in-memory (NodeCache)**

Cache des résultats de requête pendant 5 minutes pour éviter les requêtes répétitives.

#### Avant
```javascript
const rows = await mysqlPool.execute(sqlQuery, params);
return rows;
```

#### Après
```javascript
const cacheKey = `latency_${start_date}_${end_date}_...`;
const cached = reportingCache.get(cacheKey);
if (cached) return cached;

const rows = await mysqlPool.execute(sqlQuery, params);
reportingCache.set(cacheKey, rows);
return rows;
```

**Gain attendu:** Temps de réponse < 1ms pour les requêtes en cache

---

### 4. **Optimisations SQL**

- ✅ Remplacement de `JOIN` par `INNER JOIN` (plus explicite et optimisé)
- ✅ Simplification des expressions SQL (`SUM(e.status = 'up')` au lieu de `CASE WHEN`)
- ✅ Ajout de pagination obligatoire (limite par défaut: 365 jours)
- ✅ Utilisation automatique de la table pré-agrégée quand possible

---

## 📦 Installation

### Étape 1: Appliquer les migrations SQL

```bash
# Se connecter à MySQL
mysql -u root -p monitoring

# Exécuter le script d'optimisation
source /path/to/Monitoring-express/SQL/performance_optimizations.sql
```

### Étape 2: Installer les dépendances Node.js

```bash
cd Monitoring-express/backend
npm install node-cache
```

### Étape 3: Redémarrer l'application

```bash
npm run pm2:restart
# ou
npm run dev
```

---

## 🎯 Utilisation

### Utilisation de base (avec optimisations automatiques)

```javascript
// Requête standard - utilise le cache et les index automatiquement
const results = await reportingService.getAverageLatencyByDayAndSite({
  start_date: '2025-01-01',
  end_date: '2025-10-27',
  type_device: 1
});
```

### Options avancées

```javascript
// Désactiver le cache (pour avoir des données temps réel)
const results = await reportingService.getAverageLatencyByDayAndSite({
  start_date: '2025-01-01',
  end_date: '2025-10-27',
  use_cache: false
});

// Limiter le nombre de jours retournés
const results = await reportingService.getAverageLatencyByDayAndSite({
  start_date: '2025-01-01',
  end_date: '2025-10-27',
  limit: 30  // Seulement les 30 premiers jours
});

// Grouper par site (hostname)
const results = await reportingService.getAverageLatencyByDayAndSite({
  start_date: '2025-01-01',
  end_date: '2025-10-27',
  group_by: 'site'  // Ajoute le hostname dans les résultats
});
```

---

## 📊 Performance attendue

| Scénario | Avant | Après | Gain |
|----------|-------|-------|------|
| Requête 30 jours (sans cache) | ~2-5s | ~500ms | **4-10x** |
| Requête 30 jours (avec cache) | ~2-5s | <1ms | **2000x+** |
| Requête 365 jours (table pré-agrégée) | ~10-30s | ~100ms | **100-300x** |
| Requête répétitive (cache hit) | ~2-5s | <1ms | **2000x+** |

### Conditions pour performance optimale

✅ **Index créés** → Requêtes 3-5x plus rapides  
✅ **Cache activé** → Requêtes répétitives < 1ms  
✅ **Table pré-agrégée peuplée** → Requêtes longues périodes 10-50x plus rapides  
✅ **Event scheduler actif** → Mise à jour automatique des stats nocturnes  

---

## 🔧 Maintenance

### 1. Calcul rétroactif des statistiques

Pour peupler la table `daily_device_stats` avec l'historique:

```sql
-- Calculer les stats pour une période
CALL backfill_daily_stats('2025-01-01', '2025-10-27');
```

### 2. Vérification de l'event scheduler

```sql
-- Vérifier si l'event scheduler est actif
SHOW VARIABLES LIKE 'event_scheduler';

-- Activer si nécessaire
SET GLOBAL event_scheduler = ON;

-- Vérifier les events
SHOW EVENTS;
```

### 3. Vider le cache manuellement

Si vous avez besoin de forcer le rafraîchissement des données:

```javascript
// Dans le code, passer use_cache: false
const results = await reportingService.getAverageLatencyByDayAndSite({
  start_date: '2025-01-01',
  end_date: '2025-10-27',
  use_cache: false
});
```

### 4. Monitoring des performances

```sql
-- Vérifier la taille des tables
SELECT 
  table_name,
  table_rows,
  ROUND((data_length + index_length) / 1024 / 1024, 2) AS size_mb
FROM information_schema.tables
WHERE table_schema = 'monitoring'
  AND table_name IN ('device_events', 'daily_device_stats');

-- Analyser une requête
EXPLAIN ANALYZE
SELECT DATE(e.event_time) AS jour, ...;

-- Vérifier l'utilisation des index
SHOW INDEX FROM device_events;
SHOW INDEX FROM devices;
```

### 5. Statistiques du cache

Le cache est configuré avec:
- **TTL (Time To Live):** 5 minutes
- **Check period:** 60 secondes
- **Clone:** Désactivé pour performance

Pour ajuster ces paramètres, modifier `reporting.service.js`:

```javascript
const reportingCache = new NodeCache({ 
  stdTTL: 300,        // Modifier le TTL (en secondes)
  checkperiod: 60,    // Fréquence de vérification
  useClones: false
});
```

---

## 🐛 Dépannage

### Problème: La table `daily_device_stats` n'existe pas

**Solution:** Exécuter le script `performance_optimizations.sql`

```bash
mysql -u root -p monitoring < SQL/performance_optimizations.sql
```

### Problème: L'event scheduler ne se lance pas

**Solution:** Vérifier les permissions et activer manuellement

```sql
SET GLOBAL event_scheduler = ON;
SHOW PROCESSLIST;  -- Vérifier qu'il y a un process "event_scheduler"
```

### Problème: Erreur "Cannot find module 'node-cache'"

**Solution:** Installer la dépendance

```bash
cd backend
npm install node-cache
npm run pm2:restart
```

### Problème: Les requêtes sont toujours lentes

**Actions à vérifier:**

1. ✅ Les index sont créés: `SHOW INDEX FROM device_events;`
2. ✅ La table pré-agrégée est peuplée: `SELECT COUNT(*) FROM daily_device_stats;`
3. ✅ Le cache fonctionne: Regarder les logs "[ReportingService] Cache HIT"
4. ✅ Analyser le plan d'exécution: `EXPLAIN ANALYZE SELECT ...`

---

## 📝 Notes importantes

- 🔄 **L'event scheduler doit être activé** pour que les stats se calculent automatiquement chaque nuit
- 💾 **Le calcul rétroactif est optionnel** mais recommandé pour bénéficier immédiatement des optimisations
- 🔍 **Le cache est automatique** mais peut être désactivé par requête avec `use_cache: false`
- ⚙️ **La pagination est obligatoire** pour éviter les timeouts (max 730 jours par requête)

---

## 🎉 Résultat

Ces optimisations permettent de réduire les temps de réponse de **plusieurs secondes à quelques millisecondes** pour la plupart des requêtes de reporting, tout en maintenant la flexibilité du système.
