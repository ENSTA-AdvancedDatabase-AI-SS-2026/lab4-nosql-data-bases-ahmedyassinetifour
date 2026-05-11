/**
 * TP2 - Exercice 3 : Pipelines d'Agrégation
 * Use Case : Statistiques médicales HealthCare DZ
 */

use("medical_db");

// Distribution of diagnoses by region
print("=== 3.1: Top diagnostics by region ===");

const diagParWilaya = db.patients.aggregate([
  { $unwind: "$consultations" },
  { $group: {
    _id: {
      wilaya: "$adresse.wilaya",
      diagnostic: "$consultations.diagnostic"
    },
    count: { $sum: 1 }
  }},
  { $sort: { count: -1 } },
  { $limit: 20 }
]).toArray();

printjson(diagParWilaya);

// Most prescribed medication by specialty
print("\n=== 3.2: Top medications by specialty ===");

const medsParSpecialite = db.patients.aggregate([
  { $unwind: "$consultations" },
  { $unwind: "$consultations.medicaments" },
  { $group: {
    _id: {
      specialite: "$consultations.medecin.specialite",
      medicament: "$consultations.medicaments.nom"
    },
    count: { $sum: 1 }
  }},
  { $sort: { "_id.specialite": 1, count: -1 } },
  { $group: {
    _id: "$_id.specialite",
    topMedicament: { $first: "$_id.medicament" },
    prescriptions: { $first: "$count" }
  }}
]).toArray();

printjson(medsParSpecialite);

// Monthly evolution of consultations over 12 months
print("\n=== 3.3: Consultations by month (last 12 months) ===");

const evolutionMensuelle = db.patients.aggregate([
  { $unwind: "$consultations" },
  { $match: {
    "consultations.date": {
      $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1))
    }
  }},
  { $group: {
    _id: {
      year: { $year: "$consultations.date" },
      month: { $month: "$consultations.date" }
    },
    count: { $sum: 1 }
  }},
  { $sort: { "_id.year": 1, "_id.month": 1 } },
  { $project: {
    _id: 0,
    period: {
      $dateToString: {
        format: "%Y-%m",
        date: new Date(new Date().setFullYear(this._id.year, this._id.month - 1))
      }
    },
    consultations: "$count"
  }}
]).toArray();

printjson(evolutionMensuelle);

// High-risk patients profile
print("\n=== 3.4: High-risk patient profile ===");

const patientsRisque = db.patients.aggregate([
  {
    $match: {
      antecedents: { $all: ["Diabète type 2", "HTA"] },
      dateNaissance: { $lte: new Date(new Date().getFullYear() - 60, 0, 1) }
    }
  },
  { $addFields: {
    age: { $year: new Date() - "$dateNaissance" },
    consultationCount: { $size: "$consultations" }
  }},
  { $group: {
    _id: null,
    totalPatients: { $sum: 1 },
    avgAge: { $avg: "$age" },
    avgConsultations: { $avg: "$consultationCount" },
    maxConsultations: { $max: "$consultationCount" }
  }}
]).toArray();

printjson(patientsRisque);

// Doctors report with re-consultation rate
print("\n=== 3.5: Top 5 doctors & re-consultation rate ===");

const rapportMedecins = db.patients.aggregate([
  { $unwind: "$consultations" },
  { $group: {
    _id: {
      medecin: "$consultations.medecin.nom",
      specialite: "$consultations.medecin.specialite"
    },
    uniquePatients: { $addToSet: "$_id" },
    totalConsultations: { $sum: 1 }
  }},
  { $addFields: {
    uniquePatientsCount: { $size: "$uniquePatients" }
  }},
  { $addFields: {
    retConsultationRate: {
      $cond: [
        { $gt: ["$uniquePatientsCount", 0] },
        {
          $multiply: [
            { $divide: [
              { $subtract: ["$totalConsultations", "$uniquePatientsCount"] },
              "$uniquePatientsCount"
            ]},
            100
          ]
        },
        0
      ]
    }
  }},
  { $sort: { totalConsultations: -1 } },
  { $limit: 5 },
  { $project: {
    _id: 0,
    medecin: "$_id.medecin",
    specialite: "$_id.specialite",
    totalConsultations: 1,
    uniquePatients: "$uniquePatientsCount",
    retConsultationRate: { $round: ["$retConsultationRate", 2] }
  }}
]).toArray();

printjson(rapportMedecins);
