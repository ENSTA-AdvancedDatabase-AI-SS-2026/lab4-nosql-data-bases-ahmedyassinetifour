// TP4 - Exercice 3 : Algorithmes de Graphe avec GDS
// Prérequis : Plugin Graph Data Science installé (inclus dans docker-compose)

// ─── 3.1 : Plus court chemin ──────────────────────────────────────────────────
// "Comment Ahmed peut-il rencontrer Yasmina ?"
MATCH p = shortestPath(
  (a:Etudiant {prenom: "Ahmed"})-[:CONNAIT*..10]-(b:Etudiant {prenom: "Yasmina"})
)
RETURN [n IN nodes(p) | n.prenom + " (" + n.universite + ")"] AS chemin,
       length(p) AS nb_intermediaires;


// Project graph for GDS algorithms
CALL gds.graph.project(
  'reseau_social',
  'Etudiant',
  'CONNAIT'
);

// 3.2: Degree centrality - most connected students
CALL gds.degree.stream('reseau_social')
YIELD nodeId, score
RETURN gds.util.asNode(nodeId).prenom AS etudiant,
       gds.util.asNode(nodeId).universite AS universite,
       score AS nb_connexions
ORDER BY score DESC
LIMIT 10;


// 3.3: Community detection - Louvain algorithm
CALL gds.louvain.stream('reseau_social')
YIELD nodeId, communityId
WITH communityId, collect(gds.util.asNode(nodeId)) AS membres
RETURN communityId,
       size(membres) AS taille,
       [m IN membres[0..5] | m.prenom] AS exemple_membres,
       [DISTINCT m.universite | m.universite] AS universites
ORDER BY taille DESC;


// 3.4: Contact recommendation - who Ahmed should connect with
MATCH (moi:Etudiant {prenom: "Ahmed"})
MATCH (suggestion:Etudiant)
WHERE suggestion.id <> moi.id AND NOT (moi)-[:CONNAIT]-(suggestion)
WITH moi, suggestion,
  size([(moi)-[:CONNAIT]-(ami)-[:CONNAIT]-(suggestion) | 1]) AS amis_communs,
  size([(moi)-[:SUIT]->(cours)<-[:SUIT]-(suggestion) | 1]) AS cours_communs,
  CASE WHEN moi.filiere = suggestion.filiere THEN 1 ELSE 0 END AS meme_filiere
RETURN suggestion.prenom + " (" + suggestion.universite + ")" AS suggestion,
       (amis_communs * 3 + cours_communs * 2 + meme_filiere) AS score,
       amis_communs, cours_communs
ORDER BY score DESC
LIMIT 5;


// ─── 3.5 : Chemin de compétences ─────────────────────────────────────────────
// "Quels cours mènent à Machine Learning ?"
MATCH path = (debut:Cours)-[:REQUIERT*]->(but:Competence {nom: "Machine Learning"})
RETURN [n IN nodes(path) | 
  CASE WHEN n:Cours THEN n.intitule ELSE n.nom END
] AS parcours_apprentissage;


// Nettoyage
CALL gds.graph.drop('reseau_social');
