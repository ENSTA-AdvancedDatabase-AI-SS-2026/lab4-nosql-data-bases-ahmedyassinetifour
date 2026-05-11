-- TP3 - Exercice 1 : Schéma Cassandra
-- Use Case : SmartGrid DZ - IoT Électrique

-- Create keyspace with replication for production
CREATE KEYSPACE IF NOT EXISTS smartgrid
WITH replication = { 'class': 'SimpleStrategy', 'replication_factor': 1 }
AND durable_writes = true;

USE smartgrid;

-- Sensor measurements table
-- Primary Key: (capteur_id, date) partition, timestamp clustering
-- Avoids hot partitions by bucketing by day within each sensor
CREATE TABLE IF NOT EXISTS mesures_par_capteur (
  capteur_id   UUID,
  date_jour    DATE,
  timestamp    TIMESTAMP,
  wilaya       TEXT,
  commune      TEXT,
  tension_v    FLOAT,
  courant_a    FLOAT,
  puissance_kw FLOAT,
  frequence_hz FLOAT,
  temperature  FLOAT,
  alerte       BOOLEAN,
  code_alerte  TEXT,
  PRIMARY KEY ((capteur_id, date_jour), timestamp)
) WITH CLUSTERING ORDER BY (timestamp DESC)
  AND default_time_to_live = 7776000;  -- 90 days


-- Alerts table organized by region and date
-- Primary Key: (wilaya, date_jour) partition, timestamp clustering
-- Query: "All alerts for region X on day Y"
CREATE TABLE IF NOT EXISTS alertes_par_wilaya (
  wilaya       TEXT,
  date_jour    DATE,
  timestamp    TIMESTAMP,
  capteur_id   UUID,
  code_alerte  TEXT,
  description  TEXT,
  gravite      INT,   -- 1=info, 2=warning, 3=critical
  resolue      BOOLEAN,
  PRIMARY KEY ((wilaya, date_jour), timestamp)
) WITH CLUSTERING ORDER BY (timestamp DESC)
  AND default_time_to_live = 31536000;  -- 1 year


-- Hourly aggregates for dashboard
-- Primary Key: (wilaya) partition, date_heure clustering
-- Query: "Average power consumption per hour for region dashboard"
CREATE TABLE IF NOT EXISTS agregats_horaires (
  wilaya            TEXT,
  date_heure        TIMESTAMP,
  nb_capteurs       INT,
  puissance_moy_kw  FLOAT,
  puissance_max_kw  FLOAT,
  puissance_min_kw  FLOAT,
  tension_moy_v     FLOAT,
  nb_alertes        INT,
  PRIMARY KEY (wilaya, date_heure)
) WITH CLUSTERING ORDER BY (date_heure DESC)
  AND default_time_to_live = 157680000;  -- 5 years


-- Vérification
DESCRIBE TABLES;
