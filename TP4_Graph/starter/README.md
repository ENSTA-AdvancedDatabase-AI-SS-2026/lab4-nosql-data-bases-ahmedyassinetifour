# TP4 - Neo4j Graph Database Report

## Schema Design

UniConnect DZ models an academic social network as a property graph:

**Nodes:**
- `Etudiant` (50 Algerian students across 5 universities): id, prenom, nom, universite, filiere, annee, ville
- `Cours` (5 advanced courses): code, intitule, credits, departement
- `Competence` (10 technical skills): nom, categorie
- `Club` (implicitly referenced): nom, universite
- `Entreprise` (internship employers): nom

**Relationships:**
- `CONNAIT` (friendship): since, contexte
- `SUIT` (enrollment): semestre, note (grade)
- `MAITRISE` (skill proficiency): niveau (Débutant/Intermédiaire/Avancé)
- `MEMBRE_DE` (club membership)
- `A_STAGE_CHEZ` (internship at company)
- `REQUIERT` (course prerequisites)

Constraints enforce unique identifiers on students, courses, and competencies.

## Cypher Query Patterns

**Pattern 1: Path Traversal (Variable-length relationships)**
```
MATCH (a)-[:CONNAIT*..3]-(b)  // Friends up to distance 3
WHERE NOT (a)-[:CONNAIT]-(b)  // Not direct friends
```

**Pattern 2: Aggregation with Relationships**
```
MATCH (e)-[:SUIT]->(c)
RETURN c.intitule, collect(e.prenom) AS students, count(e) AS enrollment
```

**Pattern 3: Set Operations (Jaccard Similarity)**
```
WITH [(a)-[:SUIT]->(c)<-[:SUIT]-(b) | c] AS common,
     [(a)-[:SUIT]->() | 1] AS my_courses,
     [(b)-[:SUIT]->() | 1] AS other_courses
RETURN intersection / (size(my_courses) + size(other_courses) - intersection) AS jaccard
```

## Graph Data Science Algorithms

**Degree Centrality:** Identifies most connected students within the network
- Top 10 students ranked by connection count
- Useful for identifying influencers or well-networked individuals

**Louvain Community Detection:** Partitions students into densely-connected communities
- Each community groups students by university or field of study
- Returns community size, example members, and universities represented

**Shortest Path:** Finds minimum intermediaries between distant students
- Example: "How many people connect Ahmed to Yasmina?"
- Uses variable-length relationship matching with limit

**Contact Recommendation:** Scoring formula balances multiple factors
- Common friends (weight: 3x) — strongest signal
- Common courses (weight: 2x) — medium signal
- Same department (weight: 1x) — weak signal
- Returns top 5 candidates excluding existing connections

## Neo4j vs SQL for Graph Queries

**Query 2.2: Friends-of-friends (2-hop traversal)**
```
-- Neo4j: 1 line
MATCH (a)-[:CONNAIT*2]-(b) WHERE NOT (a)-[:CONNAIT]-(b)

-- SQL: 3-way join + EXCEPT
SELECT DISTINCT b.id FROM students a
  JOIN connections ac ON a.id = ac.student_a
  JOIN students c ON ac.student_b = c.id
  JOIN connections cb ON c.id = cb.student_a
  JOIN students b ON cb.student_b = b.id
EXCEPT
SELECT student_b FROM connections WHERE student_a = a.id
```

**Query 3.2: Degree Centrality (connection count)**
```
-- Neo4j: GDS library (optimized traversal)
CALL gds.degree.stream('reseau_social')

-- SQL: Self-join with aggregation
SELECT a.id, COUNT(*) as degree FROM students a
  JOIN connections c ON a.id IN (c.student_a, c.student_b)
GROUP BY a.id
```

Neo4j's advantages:
- Native path queries without join explosion
- Graph algorithms optimized for adjacency patterns
- Single-line variable-length relationships
- Relationship properties easily accessible during traversal

## Design Decisions

**Connectivity:** Each student has ≥1 connection; course enrollment distributed by department (60% for Informatique students). Ensures traversal queries return meaningful results without isolated nodes.

**Temporal Metadata:** CONNAIT relationships store `depuis` (year) enabling temporal analysis — network growth analysis queries return connection count by year for network evolution trends.

**Skill Proficiency Levels:** Stratified across three levels (Débutant/Intermédiaire/Avancé) based on random distribution (30%/40%/30%), allowing expertise-based tutor searches.

**Bridge Detection Algorithm:** Counts triangles formed by common neighbors to identify students connecting otherwise isolated sub-communities. Bridges have high neighbor count but low triangle participation.

**Constraint Design:** Prevents duplicate competence/course entries (MERGE ensures idempotency) and duplicate students by enforcing unique IDs.
