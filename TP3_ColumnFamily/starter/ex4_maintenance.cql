-- TP3 - Exercise 4: Compaction and Maintenance
-- Use Case: SmartGrid DZ - Time-series maintenance

USE smartgrid;

-- 4.1: Compaction strategy for time-series
-- TimeWindowCompactionStrategy (TWCS) is ideal for time-series data
-- because old data expires and is removed in time-window batches

-- 4.2: Configure TWCS for raw measurements table
ALTER TABLE mesures_par_capteur
WITH compaction = {
  'class': 'TimeWindowCompactionStrategy',
  'compaction_window_unit': 'DAYS',
  'compaction_window_size': 1
};
-- Rationale: TWCS creates one SSTable per day. Old data expires automatically.
-- On day 91, entire SSTables from 90 days ago are dropped without compaction overhead.
-- Perfect for write-once time-series with TTL-based expiration.


-- Configure TWCS for alerts table
ALTER TABLE alertes_par_wilaya
WITH compaction = {
  'class': 'TimeWindowCompactionStrategy',
  'compaction_window_unit': 'DAYS',
  'compaction_window_size': 7
};
-- Window size: 7 days (alerts kept longer than raw measurements)


-- Configure TWCS for hourly aggregates
ALTER TABLE agregats_horaires
WITH compaction = {
  'class': 'TimeWindowCompactionStrategy',
  'compaction_window_unit': 'DAYS',
  'compaction_window_size': 30
};
-- Window size: 30 days (aggregates kept even longer, 5-year TTL)


-- 4.3: Verify TTL usage
-- Check how many rows will expire in next 7 days
SELECT COUNT(*) as rows_expiring_soon
FROM mesures_par_capteur
WHERE TTL(tension_v) > 0 AND TTL(tension_v) < 604800;
-- 604800 seconds = 7 days


-- 4.4: Detecting and correcting hot partitions
/*
Hot partition detection:
1. Monitor node CPU and memory per partition using nodetool
2. Check if one partition has disproportionate reads/writes
3. In SmartGrid example:
   - Partition Key ((capteur_id, date_jour), timestamp) prevents hot partitions
   - Each sensor gets its own partition per day
   - Load distributed across 10,000 sensors × 5 regions

If a partition becomes hot:
Problem: Using only (wilaya) as partition key would create hot partitions
- All sensors in region → single partition
- All reads/writes → one node
- Causes bottleneck

Solution: Use (capteur_id, date_jour) as partition key
- 10,000 sensors × days = millions of small partitions
- Evenly distributed across cluster
- Each node handles subset of sensors

Verification:
- Run: nodetool cfstats smartgrid.mesures_par_capteur
- Check: Writes/Reads per partition should be similar across nodes
- If uneven, redesign partition key
*/

-- TTL verification query
SELECT capteur_id, date_jour, count(*) as nb_rows, max(timestamp) as latest
FROM mesures_par_capteur
WHERE date_jour >= ? AND date_jour <= ?
GROUP BY capteur_id, date_jour;
-- Use to verify data is being inserted and will auto-expire


-- Monitor table stats
DESCRIBE TABLE mesures_par_capteur;
-- Shows compaction settings and TTL configuration


-- Check disk usage after compaction
-- Run in cqlsh or monitoring tool:
-- nodetool cfstats smartgrid.mesures_par_capteur
-- Look for "Compacted Partition Mean Size" and "Compacted Partition Max Size"
