# ⚡ Installation Rapide des Optimisations

## 🚀 3 étapes simples

### 1️⃣ Appliquer les migrations SQL (30 secondes)

```bash
# Se connecter à MySQL
mysql -u root -p monitoring

# Dans MySQL, exécuter:
source /home/angelo/Monitoring/Monitoring-express/SQL/performance_optimizations.sql
```

**OU** si vous êtes déjà dans le bon dossier:

```bash
cd ~/Monitoring/Monitoring-express/SQL
mysql -u root -p monitoring < performance_optimizations.sql
```

### 2️⃣ Installer node-cache (10 secondes)

```bash
cd ~/Monitoring/Monitoring-express/backend
npm install
```

### 3️⃣ Redémarrer l'application (5 secondes)

```bash
npm run pm2:restart
# ou
npm run dev
```

---

## ✅ Vérification

### Vérifier que les index sont créés

```sql
USE monitoring;
SHOW INDEX FROM device_events WHERE Key_name LIKE 'idx_%composite%';
```

**Résultat attendu:**
- `idx_device_events_composite`
- `idx_device_events_time_device`

### Vérifier que la table existe

```sql
SHOW TABLES LIKE 'daily_device_stats';
```

### Vérifier les logs de l'application

```bash
npm run pm2:logs
```

**Recherchez:**
- ✅ `Cache HIT` → Le cache fonctionne
- ✅ `Cache MISS` → Première requête (normal)
- ✅ `Found X latency records` → Les requêtes fonctionnent

---

## 🎯 Test de performance

### Requête sans cache (première fois)

```bash
# Mesurer le temps de réponse
time curl "http://localhost:3000/api/reporting/latency?start_date=2025-01-01&end_date=2025-10-27"
```

### Requête avec cache (deuxième fois - devrait être < 1ms)

```bash
time curl "http://localhost:3000/api/reporting/latency?start_date=2025-01-01&end_date=2025-10-27"
```

---

## 🔧 Calcul rétroactif des statistiques (OPTIONNEL)

Pour bénéficier immédiatement de la table pré-agrégée, calculer l'historique:

```sql
USE monitoring;

-- Créer la procédure de backfill (copier-coller tout ce bloc)
DROP PROCEDURE IF EXISTS backfill_daily_stats;
DELIMITER $$
CREATE PROCEDURE backfill_daily_stats(
    IN start_date DATE,
    IN end_date DATE
)
BEGIN
    DECLARE current_date DATE;
    SET current_date = start_date;
    WHILE current_date <= end_date DO
        CALL calculate_daily_stats(current_date);
        SET current_date = DATE_ADD(current_date, INTERVAL 1 DAY);
    END WHILE;
END$$
DELIMITER ;

-- Calculer les 90 derniers jours (ajuster selon vos besoins)
CALL backfill_daily_stats(CURDATE() - INTERVAL 90 DAY, CURDATE());
```

⚠️ **Note:** Cette opération peut prendre quelques minutes selon le volume de données.

---

## 📊 Gains attendus

| Type de requête | Avant | Après | Gain |
|----------------|-------|-------|------|
| 30 jours (1ère fois) | 2-5s | ~500ms | **4-10x** |
| 30 jours (cache) | 2-5s | <1ms | **2000x+** |
| 1 an (table pré-agrégée) | 10-30s | ~100ms | **100-300x** |

---

## ❓ Besoin d'aide ?

Consultez la documentation complète: `SQL/OPTIMIZATIONS_README.md`
