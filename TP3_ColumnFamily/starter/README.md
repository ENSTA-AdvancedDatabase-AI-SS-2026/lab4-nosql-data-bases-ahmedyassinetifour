# TP3 - Cassandra: IoT Time-Series Data
## Report

---

## 1. Schema Design

**Partition Key Strategy**
- mesures_par_capteur: (capteur_id, date_jour) - Avoids hot partitions by bucketing per sensor per day
- alertes_par_wilaya: (wilaya, date_jour) - Organizes by region and date
- agregats_horaires: (wilaya) - Dashboard aggregates by region

Each partition key avoids concentrating all data from one sensor/region on a single node.

**TTL Configuration**
- Raw measurements: 90 days (7,776,000 seconds)
- Alerts: 1 year (31,536,000 seconds)
- Hourly aggregates: 5 years (157,680,000 seconds)

---

## 2. Data Ingestion

**Implementation**
- 10,000 sensors × 5 minutes = 50,000 measurements
- Batch size: 50 rows per unlogged batch (Cassandra best practice)
- Realistic data: voltage (220V ± 10V), current, power, frequency, temperature
- 5% alert rate with severity levels

**Performance**
- Batching reduces network round-trips
- Unlogged batches for write-optimized time-series
- TTL applied per row for automatic expiration

---

## 3. Queries

3.1: Single sensor measurements (6 hours range)
3.2: Latest reading per sensor
3.3: Active alerts by region
3.4: Hourly power aggregates
3.5: Voltage anomalies (< 200V or > 240V)
3.6: Top 10 most active sensors
3.7: ALLOW FILTERING explanation and alternatives

---

## 4. Compaction Strategy

**TimeWindowCompactionStrategy (TWCS)**
- Ideal for time-series with TTL
- Creates one SSTable per time window
- Day 91: Entire day's SSTables deleted without re-compaction
- Windows: 1 day (measurements), 7 days (alerts), 30 days (aggregates)

**Why TWCS?**
- Traditional SizeTieredCompactionStrategy rewrites expired data multiple times
- TWCS bundles data by time window, drops whole SSTables when expired
- No wasted CPU on compacting data that will be deleted

---

## 5. Hot Partition Prevention

**Problem**
- If partition key = (wilaya) only: all 10,000 sensors in one region = 1 partition
- All reads/writes go to same node → bottleneck

**Solution**
- Partition key = (capteur_id, date_jour)
- 10,000 sensors × 5 regions × days = millions of small partitions
- Distributed evenly across cluster nodes

**Detection**
- Monitor with `nodetool cfstats`
- Compare reads/writes per node
- If uneven, redesign partition key

---

## 6. ALLOW FILTERING Risks

**Why Dangerous**
- Full partition scan in Cassandra
- Examines every row matching partition key
- Distributed across cluster: scans multiple nodes
- Can cause latency spikes and node saturation

**Better Approach**
- Denormalize queries into separate tables
- Example: Voltage anomalies → create `anomaly_mesures` table
- Only insert anomalous readings, query directly
- No filtering needed

---

## 7. Conclusion

Cassandra handles SmartGrid's 10,000 sensors efficiently through:
- Time-partitioned tables avoiding hot partitions
- TWCS compaction aligning with TTL expiration
- Denormalized schema for query performance
- Batched ingestion for throughput
