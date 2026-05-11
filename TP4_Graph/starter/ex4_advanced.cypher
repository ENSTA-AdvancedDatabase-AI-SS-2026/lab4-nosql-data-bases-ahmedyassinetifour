// TP4 - Exercise 4: Advanced Cypher Queries

// 4.1: Find a tutor - Master student skilled in Python with >14/20 in BDD
MATCH (tuteur:Etudiant)-[:MAITRISE {niveau: "Avancé"}]-(python:Competence {nom: "Python"})
MATCH (tuteur)-[suit:SUIT]->(bdd:Cours {code: "INFO401"})
WHERE tuteur.annee >= 3 AND suit.note > 14
RETURN tuteur.prenom + " " + tuteur.nom AS tuteur, tuteur.universite AS universite,
       suit.note AS note_BDD, python.nom AS specialite;


// 4.2: Alumni network in a company - who in my network works at Sonatrach
MATCH (moi:Etudiant {prenom: "Ahmed"})
MATCH (moi)-[:CONNAIT*..3]-(personne:Etudiant)
MATCH (personne)-[:A_STAGE_CHEZ]->(entreprise:Entreprise {nom: "Sonatrach"})
RETURN DISTINCT personne.prenom AS personne,
       entreprise.nom AS entreprise,
       length(shortestPath((moi)-[:CONNAIT*]-(personne))) AS distance;


// 4.3: Bridge detection - students connecting isolated communities
MATCH (e:Etudiant)
WITH e, size([(e)-[:CONNAIT]-() | 1]) AS degree
WHERE degree >= 2
MATCH (e)-[:CONNAIT]-(voisin:Etudiant)
WITH e, voisin,
  size([(voisin)-[:CONNAIT]-(autre)-[:CONNAIT]-(e) | 1]) AS triangles
RETURN e.prenom AS pont_potentiel,
       count(voisin) AS voisins,
       sum(triangles) AS triangles_formes
ORDER BY voisins - sum(triangles) DESC
LIMIT 5;


// 4.4: Temporal analysis - network growth by year
MATCH (e1:Etudiant)-[r:CONNAIT]-(e2:Etudiant)
RETURN r.depuis AS annee, count(r) AS nb_connexions
ORDER BY annee DESC;


// 4.5: Similarity score using Jaccard coefficient
MATCH (moi:Etudiant {prenom: "Ahmed"})
MATCH (autre:Etudiant)
WHERE autre.id <> moi.id
WITH moi, autre,
  [(moi)-[:SUIT]->(cours)<-[:SUIT]-(autre) | cours] AS cours_communs,
  [(moi)-[:SUIT]->() | 1] AS mes_cours,
  [(autre)-[:SUIT]->() | 1] AS ses_cours
WITH moi, autre,
  size(cours_communs) AS intersection,
  size(mes_cours) + size(ses_cours) - size(cours_communs) AS union
WHERE union > 0
RETURN autre.prenom + " (" + autre.universite + ")" AS similaire,
       round(100.0 * intersection / union, 1) AS jaccard_score
ORDER BY jaccard_score DESC
LIMIT 5;
