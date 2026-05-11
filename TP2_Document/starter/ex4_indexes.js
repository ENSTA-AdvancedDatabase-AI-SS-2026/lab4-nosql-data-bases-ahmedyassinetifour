/**
 * TP2 - Exercice 4 : Index et Optimisation
 */

use("medical_db");

// Create appropriate indexes

// Index 1: Frequent search by region + antecedents
db.patients.createIndex({ "adresse.wilaya": 1, antecedents: 1 });

// Index 2: Search by consultation date
db.patients.createIndex({ "consultations.date": 1 });

// Index 3: Text index on diagnoses for full-text search
db.patients.createIndex({ "consultations.diagnostic": "text" });

// Index 4: Patient lookup for analyses
db.analyses.createIndex({ patient_id: 1 });


// Compare query performance with explain()

const requeteTest = {
  "adresse.wilaya": "Alger",
  antecedents: "Diabète type 2"
};

print("=== BEFORE index (using COLLSCAN) ===");
const beforeIndex = db.patients.find(requeteTest).explain("executionStats");
print("Docs returned:", beforeIndex.executionStats.nReturned);
print("Docs examined:", beforeIndex.executionStats.totalDocsExamined);
print("Execution time (ms):", beforeIndex.executionStats.executionStages.executionTimeMillis);

print("\n=== AFTER index (using IXSCAN) ===");
const afterIndex = db.patients.find(requeteTest).explain("executionStats");
print("Docs returned:", afterIndex.executionStats.nReturned);
print("Docs examined:", afterIndex.executionStats.totalDocsExamined);
print("Execution time (ms):", afterIndex.executionStats.executionStages.executionTimeMillis);

// Compound index for most complex query
print("\n=== Compound index explanation ===");
print("Index on (adresse.wilaya, antecedents) allows:");
print("- Fast filtering by region first");
print("- Then filtering by antecedents within that region");
print("- Avoids scanning all documents (COLLSCAN)");

// TTL index for analysis archival (5 years)
db.analyses.createIndex(
  { date: 1 },
  { expireAfterSeconds: 157680000 }  // 5 years in seconds
);
print("\nTTL index created: Analyses older than 5 years will auto-expire");
