-- TP3 - Exercise 3: CQL Queries
-- Use Case: SmartGrid DZ - IoT time-series queries

USE smartgrid;

-- 3.1: Measurements of specific sensor in last 6 hours
SELECT * FROM mesures_par_capteur
WHERE capteur_id = ? AND date_jour = ? AND timestamp >= ?
LIMIT 360;  -- 6 hours × 60 minutes


-- 3.2: Latest measurement of each sensor in a region
SELECT DISTINCT ON (capteur_id) capteur_id, timestamp, tension_v, puissance_kw
FROM mesures_par_capteur
WHERE date_jour = ?
LIMIT 1;


-- 3.3: Sensors in alert in region "Alger" today
SELECT capteur_id, timestamp, code_alerte, gravite, description
FROM alertes_par_wilaya
WHERE wilaya = 'Alger' AND date_jour = ? AND resolue = false
ORDER BY timestamp DESC;


-- Count of active alerts
SELECT count(*) as nb_alertes_actives
FROM alertes_par_wilaya
WHERE wilaya = 'Alger' AND date_jour = ?;


-- 3.4: Total power consumption per hour on dashboard
SELECT date_heure, puissance_moy_kw, puissance_max_kw, nb_capteurs
FROM agregats_horaires
WHERE wilaya = 'Alger'
ORDER BY date_heure DESC
LIMIT 24;  -- Last 24 hours


-- 3.5: Anomaly detection - sensors with abnormal voltage (< 200V or > 240V)
-- Note: This requires a denormalized table for efficient querying
-- Query against a materialized view or a separate anomaly table
SELECT capteur_id, timestamp, tension_v, wilaya
FROM mesures_par_capteur
WHERE date_jour = ?
AND (tension_v < 200 OR tension_v > 240)
ALLOW FILTERING;
-- Note: ALLOW FILTERING is inefficient - ideally create a separate anomaly_mesures table


-- 3.6: Top 10 most active sensors this week
SELECT capteur_id, count(*) as nb_mesures
FROM mesures_par_capteur
WHERE date_jour >= ? AND date_jour <= ?
GROUP BY capteur_id
ORDER BY nb_mesures DESC
LIMIT 10;
-- Note: This requires aggregation which is inefficient in Cassandra
-- Better approach: use a separate "top_sensors" summary table


-- 3.7: Why ALLOW FILTERING is dangerous in production
/*
ALLOW FILTERING is dangerous because:
1. It performs a FULL TABLE SCAN on partitions that match the partition key
2. Without proper indexing, it examines every row in the partition
3. In distributed Cassandra, it scans across multiple nodes
4. With millions of rows, this causes massive latency and CPU spikes
5. Can bring down the cluster in production

Better approach: Model for the query
Instead of filtering on tension_v after fetching, create a separate table:

CREATE TABLE anomaly_mesures (
  wilaya TEXT,
  date_jour DATE,
  timestamp TIMESTAMP,
  capteur_id UUID,
  tension_v FLOAT,
  PRIMARY KEY ((wilaya, date_jour), timestamp)
) WITH CLUSTERING ORDER BY (timestamp DESC);

Then insert only anomalous measurements, making the query:
SELECT * FROM anomaly_mesures WHERE wilaya = ? AND date_jour = ?;
*/
