/**
 * TP2 - Exercise 2: Basic MongoDB Queries
 * Use Case: HealthCare DZ - Medical queries
 */

use("medical_db");

// ─── 2.1 : Trouver tous les patients diabétiques de plus de 50 ans à Alger
print("=== 2.1: Diabetic patients over 50 in Algiers ===");
const diabeticOver50Algiers = db.patients.find({
  antecedents: "Diabète type 2",
  "adresse.wilaya": "Alger",
  dateNaissance: { $lte: new Date(new Date().getFullYear() - 50, 0, 1) }
}).toArray();
printjson(diabeticOver50Algiers);
print("Count:", diabeticOver50Algiers.length);

// ─── 2.2 : Patients allergiques à la Pénicilline avec au moins 3 consultations
print("\n=== 2.2: Penicillin-allergic patients with at least 3 consultations ===");
const penicillinAllergic = db.patients.find({
  allergies: "Pénicilline",
  $expr: { $gte: [{ $size: "$consultations" }, 3] }
}).toArray();
printjson(penicillinAllergic);
print("Count:", penicillinAllergic.length);

// ─── 2.3 : Projection : Nom, prénom, et dernière consultation seulement
print("\n=== 2.3: Name, first name, and latest consultation only ===");
const lastConsultationProj = db.patients.find(
  {},
  {
    nom: 1,
    prenom: 1,
    consultations: { $slice: -1 }
  }
).limit(5).toArray();
printjson(lastConsultationProj);

// ─── 2.4 : Patients sans antécédents dont la tension systolique > 140 en dernière consultation
print("\n=== 2.4: Patients with no antecedents, latest systolic BP > 140 ===");
const noAntecedentHighBP = db.patients.find({
  antecedents: { $size: 0 },
  "consultations.tension.systolique": { $gt: 140 }
}).toArray();
printjson(noAntecedentHighBP);
print("Count:", noAntecedentHighBP.length);

// ─── 2.5 : Recherche textuelle sur les diagnostics (créer index text d'abord)
print("\n=== 2.5: Full-text search on diagnoses ===");
// Create text index
db.patients.createIndex({ "consultations.diagnostic": "text" });

const textSearch = db.patients.find({
  $text: { $search: "Diabète" }
}).toArray();
printjson(textSearch);
print("Count:", textSearch.length);
