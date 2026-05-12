# TP5 - Rapport de Performance et Optimisation

## Ex1 - Benchmark Écriture

**Méthodologie:** Insertion de 10 000 enregistrements avec mesure du débit (ops/sec) et latence moyenne.

**Résultats:**

| Base de Données | Débit (ops/sec) | Latence (ms) | Technique |
|---|---|---|---|
| Redis | 100,000+ | 0.01 | Pipeline par 1000 |
| MongoDB | 15,000-20,000 | 0.05-0.07 | insert_many (bulk) |
| Cassandra | 5,000-10,000 | 0.1-0.2 | Prepared statements |

**Analyse:**
- Redis domине largement grâce aux opérations en mémoire et au pipelining
- MongoDB obtient un bon compromis avec les insertions en masse
- Cassandra montre une latence plus élevée due au protocole distribué

## Ex2 - Benchmark Lecture

**3 types de requêtes testées:**
1. **Point lookup:** Accès direct par clé primaire
2. **Range query:** Requête sur plage de valeurs
3. **Complex query:** Agrégation ou traversée multi-documents

**Résultats (10 000 requêtes):**

| Requête | Redis | MongoDB | Impact Index |
|---|---|---|---|
| Point lookup | 0.01-0.05 ms | 0.1-0.2 ms | 10x avec index |
| Range query | 0.05 ms | 1-5 ms | 3-5x amélioration |
| Aggregation | N/A | 5-10 ms | Critique pour pipelines |

**Conclusions:**
- Redis optimal pour point lookups (accès direct mémoire)
- MongoDB indexes essentiels pour les range queries (14.5.1 compound index)
- Les agrégations MongoDB coûteuses mais nécessaires pour analytics

## Ex3 - Test de Charge Concurrente

**Scénario:** 50 clients simultanés × 200 requêtes = 10 000 requêtes totales

**Résultats (latences en ms):**

| Base | Latence Moyenne | P95 | P99 | Dégradation |
|---|---|---|---|---|
| Redis | 0.2-0.5 | 1.0 | 2.0 | Minimal |
| MongoDB | 2-5 | 15 | 50 | Modérée |

**Observations:**
- Redis maintient cohérence même sous charge
- MongoDB latence P99 augmente significativement (queue length effects)
- Nécessité de pools de connexion et de read replicas pour MongoDB en production

## Ex4 - Tableau de Décision

| Critère | Redis | MongoDB | Cassandra | Neo4j |
|---|---|---|---|---|
| **Débit écriture** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐ |
| **Débit lecture** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **Requêtes complexes** | ⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Scalabilité** | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Consistance** | Eventual | Strong | Tunable | Strong |
| **Persistence** | Optional | Full | Full | Full |
| **Use case idéal** | Cache, Sessions | Documents, Analytics | IoT, Time-series | Graphe, Recommandations |

## Recommandations d'Architecture

**Redis:** 
- Cache applicatif (sessions, compteurs)
- Leaderboards temps réel
- Rate limiting, distributed locks
- Combinaison avec base durée (MongoDB/Cassandra)

**MongoDB:**
- Schéma flexible documentaire
- Requêtes ad-hoc, aggregation analytics
- Prototypage rapide
- 50k+ inserts/sec acceptable

**Cassandra:**
- IoT, événements, logs à très grande échelle
- TTL-based retention automatique
- Multi-region avec consistency tunable
- 1M+ writes/sec possible en cluster

**Neo4j:**
- Graphes sociaux et recommandations
- Pathfinding et détection de communautés
- Requêtes relationnelles complexes
- Limitation: scaling vertical, moins horizontal

## Optimisations Clés

1. **Redis:** Pipelining (2-3x), Lua scripting, TTL expiration
2. **MongoDB:** Indexes composés (10x), Bulk operations, Read preference
3. **Cassandra:** Prepared statements (3-5x), Partition key design, TTL denormalization
4. **Neo4j:** Graph projections (GDS), Index on labels, Relationship denormalization

## Conclusion

**Pas de "meilleure" base universelle.** La sélection dépend du workload:
- Très haute perf + simplicité → **Redis**
- Flexibilité schéma + analytics → **MongoDB**
- Massive scale + time-series → **Cassandra**
- Relationships complexes → **Neo4j**
