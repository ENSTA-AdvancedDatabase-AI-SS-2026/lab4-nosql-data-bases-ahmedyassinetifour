// TP4 - Exercise 2: Basic Cypher Queries

// 2.1: Find all direct friends of Ahmed
MATCH (ahmed:Etudiant {prenom: "Ahmed"})-[:CONNAIT]-(ami:Etudiant)
RETURN ami.prenom AS prenom, ami.universite AS universite, ami.filiere AS filiere;


// 2.2: Friends of friends who are not already direct friends
MATCH (ahmed:Etudiant {prenom: "Ahmed"})-[:CONNAIT*2]-(suggestion:Etudiant)
WHERE NOT (ahmed)-[:CONNAIT]-(suggestion)
RETURN DISTINCT suggestion.prenom AS suggestion, suggestion.universite AS universite
LIMIT 10;


// 2.3: Students taking same course as Fatima but don't know her
MATCH (fatima:Etudiant {prenom: "Fatima"})-[:SUIT]->(cours:Cours)<-[:SUIT]-(etudiant:Etudiant)
WHERE NOT (etudiant)-[:CONNAIT]-(fatima) AND etudiant.id <> fatima.id
RETURN DISTINCT etudiant.prenom AS prenom, etudiant.universite AS universite, cours.intitule AS cours;


// 2.4: Most popular clubs by member count
MATCH (c:Club)<-[:MEMBRE_DE]-(e:Etudiant)
RETURN c.nom AS club, c.universite AS universite, count(e) AS nb_membres
ORDER BY nb_membres DESC;


// 2.5: Complete profile of a student
MATCH (e:Etudiant {prenom: "Ahmed"})
OPTIONAL MATCH (e)-[:CONNAIT]-(ami:Etudiant)
OPTIONAL MATCH (e)-[:SUIT]-(cours:Cours)
OPTIONAL MATCH (e)-[:MAITRISE]-(skill:Competence)
OPTIONAL MATCH (e)-[:MEMBRE_DE]-(club:Club)
RETURN {
  etudiant: e.prenom + " " + e.nom,
  universite: e.universite,
  filiere: e.filiere,
  amis: collect(DISTINCT ami.prenom),
  cours: collect(DISTINCT cours.intitule),
  competences: collect(DISTINCT skill.nom),
  clubs: collect(DISTINCT club.nom)
} AS profil;
