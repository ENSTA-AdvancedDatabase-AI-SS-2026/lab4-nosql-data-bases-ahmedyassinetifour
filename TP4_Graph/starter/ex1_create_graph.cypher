// TP4 - Exercice 1 : Création du graphe UniConnect DZ
// Effacer la base pour partir propre
MATCH (n) DETACH DELETE n;

// ─── 1.1 : Contraintes d'unicité ─────────────────────────────────────────────
CREATE CONSTRAINT etudiant_id IF NOT EXISTS FOR (e:Etudiant) REQUIRE e.id IS UNIQUE;
CREATE CONSTRAINT cours_code IF NOT EXISTS FOR (c:Cours) REQUIRE c.code IS UNIQUE;
CREATE CONSTRAINT competence_nom IF NOT EXISTS FOR (c:Competence) REQUIRE c.nom IS UNIQUE;

// ─── 1.2 : Créer les compétences ──────────────────────────────────────────────
UNWIND [
  {nom: "Python", categorie: "Programmation"},
  {nom: "Java", categorie: "Programmation"},
  {nom: "SQL", categorie: "Bases de Données"},
  {nom: "NoSQL", categorie: "Bases de Données"},
  {nom: "Machine Learning", categorie: "IA"},
  {nom: "Deep Learning", categorie: "IA"},
  {nom: "React", categorie: "Web"},
  {nom: "Docker", categorie: "DevOps"},
  {nom: "Linux", categorie: "Systèmes"},
  {nom: "Réseaux", categorie: "Infrastructure"}
] AS comp
MERGE (:Competence {nom: comp.nom, categorie: comp.categorie});

// ─── 1.3 : Créer les cours ────────────────────────────────────────────────────
UNWIND [
  {code: "INFO401", intitule: "Bases de Données Avancées", credits: 6, dept: "Informatique"},
  {code: "INFO402", intitule: "Intelligence Artificielle", credits: 6, dept: "Informatique"},
  {code: "INFO403", intitule: "Développement Web", credits: 4, dept: "Informatique"},
  {code: "INFO404", intitule: "Systèmes Distribués", credits: 5, dept: "Informatique"},
  {code: "INFO405", intitule: "Cloud Computing", credits: 4, dept: "Informatique"}
] AS cours
MERGE (:Cours {code: cours.code, intitule: cours.intitule, 
               credits: cours.credits, departement: cours.dept});

// ─── 1.4 : Créer les étudiants ────────────────────────────────────────────────
// TODO: Créer 50 étudiants avec données algériennes réalistes
// Utiliser UNWIND avec une liste de maps
// Universités : USTHB, UMBB, USTO, UMC, UBMA
// Filieres : Informatique, Mathématiques, Electronique, Telecoms, GL

UNWIND [
  {id: "E001", prenom: "Ahmed", nom: "Bensalem", universite: "USTHB", filiere: "Informatique", annee: 3, ville: "Alger"},
  {id: "E002", prenom: "Fatima", nom: "Ouali", universite: "USTHB", filiere: "Informatique", annee: 3, ville: "Alger"},
  {id: "E003", prenom: "Karim", nom: "Meziane", universite: "UMBB", filiere: "Informatique", annee: 2, ville: "Boumerdes"},
  {id: "E004", prenom: "Yasmina", nom: "Hamdi", universite: "USTO", filiere: "Informatique", annee: 4, ville: "Oran"},
  {id: "E005", prenom: "Rania", nom: "Belkacem", universite: "UMC", filiere: "GL", annee: 3, ville: "Constantine"},
  {id: "E006", prenom: "Mehdi", nom: "Derbal", universite: "USTHB", filiere: "Electronique", annee: 2, ville: "Alger"},
  {id: "E007", prenom: "Sara", nom: "Amrani", universite: "UBMA", filiere: "Telecoms", annee: 3, ville: "Annaba"},
  {id: "E008", prenom: "Youcef", nom: "Cherif", universite: "UMBB", filiere: "Mathematiques", annee: 4, ville: "Boumerdes"},
  {id: "E009", prenom: "Lina", nom: "Boudia", universite: "USTHB", filiere: "Informatique", annee: 1, ville: "Alger"},
  {id: "E010", prenom: "Anis", nom: "Haddar", universite: "USTO", filiere: "GL", annee: 3, ville: "Oran"},
  {id: "E011", prenom: "Leila", nom: "Saoud", universite: "USTHB", filiere: "Informatique", annee: 2, ville: "Alger"},
  {id: "E012", prenom: "Omar", nom: "Benali", universite: "UMC", filiere: "Informatique", annee: 3, ville: "Constantine"},
  {id: "E013", prenom: "Samira", nom: "Farès", universite: "UBMA", filiere: "GL", annee: 2, ville: "Annaba"},
  {id: "E014", prenom: "Tariq", nom: "Bouali", universite: "USTHB", filiere: "Electronique", annee: 3, ville: "Alger"},
  {id: "E015", prenom: "Hana", nom: "Aithamou", universite: "UMBB", filiere: "Telecoms", annee: 2, ville: "Boumerdes"},
  {id: "E016", prenom: "Samir", nom: "Hadj", universite: "USTO", filiere: "Informatique", annee: 2, ville: "Oran"},
  {id: "E017", prenom: "Nadia", nom: "Kaci", universite: "UMC", filiere: "Mathematiques", annee: 4, ville: "Constantine"},
  {id: "E018", prenom: "Bilal", nom: "Abdi", universite: "USTHB", filiere: "GL", annee: 1, ville: "Alger"},
  {id: "E019", prenom: "Zineb", nom: "Rahmani", universite: "UBMA", filiere: "Informatique", annee: 3, ville: "Annaba"},
  {id: "E020", prenom: "Zaki", nom: "Hamida", universite: "USTHB", filiere: "Informatique", annee: 4, ville: "Alger"},
  {id: "E021", prenom: "Amira", nom: "Sidali", universite: "UMBB", filiere: "GL", annee: 3, ville: "Boumerdes"},
  {id: "E022", prenom: "Habib", nom: "Bennour", universite: "USTO", filiere: "Electronique", annee: 2, ville: "Oran"},
  {id: "E023", prenom: "Wafa", nom: "Bachir", universite: "UMC", filiere: "Telecoms", annee: 3, ville: "Constantine"},
  {id: "E024", prenom: "Kamel", nom: "Daoud", universite: "USTHB", filiere: "Informatique", annee: 2, ville: "Alger"},
  {id: "E025", prenom: "Noura", nom: "Chebel", universite: "UBMA", filiere: "Mathematiques", annee: 4, ville: "Annaba"},
  {id: "E026", prenom: "Fares", nom: "Moussa", universite: "USTHB", filiere: "Electronique", annee: 4, ville: "Alger"},
  {id: "E027", prenom: "Salma", nom: "Tidjani", universite: "UMBB", filiere: "Informatique", annee: 3, ville: "Boumerdes"},
  {id: "E028", prenom: "Hamza", nom: "Sahraoui", universite: "USTO", filiere: "GL", annee: 4, ville: "Oran"},
  {id: "E029", prenom: "Maha", nom: "Lakehal", universite: "UMC", filiere: "Informatique", annee: 2, ville: "Constantine"},
  {id: "E030", prenom: "Yassin", nom: "Mebarki", universite: "USTHB", filiere: "GL", annee: 3, ville: "Alger"},
  {id: "E031", prenom: "Ines", nom: "Boudriga", universite: "UBMA", filiere: "Telecoms", annee: 2, ville: "Annaba"},
  {id: "E032", prenom: "Nadim", nom: "Bouazza", universite: "UMBB", filiere: "Mathematiques", annee: 3, ville: "Boumerdes"},
  {id: "E033", prenom: "Dina", nom: "Meddah", universite: "USTO", filiere: "Informatique", annee: 1, ville: "Oran"},
  {id: "E034", prenom: "Jamal", nom: "Mihoubi", universite: "UMC", filiere: "Electronique", annee: 3, ville: "Constantine"},
  {id: "E035", prenom: "Hiba", nom: "Seghouani", universite: "USTHB", filiere: "Informatique", annee: 2, ville: "Alger"},
  {id: "E036", prenom: "Khaled", nom: "Belhadj", universite: "UBMA", filiere: "GL", annee: 4, ville: "Annaba"},
  {id: "E037", prenom: "Rima", nom: "Bouslama", universite: "USTHB", filiere: "Telecoms", annee: 3, ville: "Alger"},
  {id: "E038", prenom: "Abbas", nom: "Saïd", universite: "UMBB", filiere: "Informatique", annee: 4, ville: "Boumerdes"},
  {id: "E039", prenom: "Farida", nom: "Toumache", universite: "USTO", filiere: "Mathematiques", annee: 2, ville: "Oran"},
  {id: "E040", prenom: "Walid", nom: "Hamani", universite: "UMC", filiere: "GL", annee: 2, ville: "Constantine"},
  {id: "E041", prenom: "Samya", nom: "Douma", universite: "USTHB", filiere: "Electronique", annee: 1, ville: "Alger"},
  {id: "E042", prenom: "Lahcene", nom: "Kemlal", universite: "UBMA", filiere: "Informatique", annee: 3, ville: "Annaba"},
  {id: "E043", prenom: "Miriam", nom: "Abed", universite: "USTHB", filiere: "GL", annee: 2, ville: "Alger"},
  {id: "E044", prenom: "Sami", nom: "Baba", universite: "UMBB", filiere: "Telecoms", annee: 3, ville: "Boumerdes"},
  {id: "E045", prenom: "Mina", nom: "Rekab", universite: "USTO", filiere: "Informatique", annee: 3, ville: "Oran"},
  {id: "E046", prenom: "Rashid", nom: "Hakim", universite: "UMC", filiere: "Mathematiques", annee: 3, ville: "Constantine"},
  {id: "E047", prenom: "Amina", nom: "Zoubir", universite: "USTHB", filiere: "Informatique", annee: 1, ville: "Alger"},
  {id: "E048", prenom: "Nabil", nom: "Chibani", universite: "UBMA", filiere: "Electronique", annee: 2, ville: "Annaba"},
  {id: "E049", prenom: "Soraya", nom: "Boucetta", universite: "USTHB", filiere: "GL", annee: 4, ville: "Alger"},
  {id: "E050", prenom: "Riad", nom: "Karsi", universite: "UMBB", filiere: "Informatique", annee: 2, ville: "Boumerdes"}
] AS data
MERGE (e:Etudiant {id: data.id})
SET e += data;

// CONNAIT relationships - ensure connectivity
MATCH (e1:Etudiant {id: "E001"}), (e2:Etudiant {id: "E002"}), (e3:Etudiant {id: "E003"})
MERGE (e1)-[:CONNAIT {depuis: 2022, contexte: "Camarades de classe"}]-(e2)
MERGE (e1)-[:CONNAIT {depuis: 2023, contexte: "Projet"}]-(e3)
MERGE (e2)-[:CONNAIT {depuis: 2022, contexte: "Amis"}]-(e3);

// Connect each student to at least one other
MATCH (e:Etudiant)
WITH e, [(e)-[:CONNAIT]-() | 1] AS connections
WHERE size(connections) = 0
LIMIT 10
MATCH (other:Etudiant)
WHERE other.id > e.id
MERGE (e)-[:CONNAIT {depuis: 2023, contexte: "Réseau"}]-(other)
RETURN COUNT(*);

// SUIT relationships - assign courses
MATCH (e:Etudiant), (c:Cours)
WHERE (e.id IN ["E001", "E002", "E003", "E004", "E009", "E012", "E016", "E020", "E024", "E027", "E029", "E033", "E035", "E038", "E042", "E045", "E047"] AND c.code IN ["INFO401", "INFO402"])
  OR (e.filiere = "Informatique" AND (rand() < 0.6))
MERGE (e)-[:SUIT {semestre: "S5", note: round(rand() * 20)}]->(c);

// MAITRISE relationships - assign skills
MATCH (e:Etudiant), (c:Competence)
WHERE (e.id IN ["E001", "E002", "E004"] AND c.nom IN ["Python", "SQL", "Machine Learning"])
  OR (e.filiere = "Informatique" AND rand() < 0.5 AND c.categorie IN ["Programmation", "Bases de Données"])
MERGE (e)-[:MAITRISE {niveau: CASE WHEN rand() < 0.3 THEN "Débutant" WHEN rand() < 0.7 THEN "Intermédiaire" ELSE "Avancé" END}]->(c);

// Verification
MATCH (n) RETURN labels(n)[0] AS type, count(n) AS total ORDER BY total DESC;
MATCH ()-[r]->() RETURN type(r) AS relation, count(r) AS total ORDER BY total DESC;
