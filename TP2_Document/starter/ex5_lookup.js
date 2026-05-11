/**
 * TP2 - Exercise 5: $lookup and Referenced Data
 * Use Case: Joining patients with analyses
 */

use("medical_db");

// ─── 5.1 : Joindre patients et analyses pour récupérer le dossier complet
print("=== 5.1: Join patients and analyses for complete medical record ===");

const completeDossier = db.patients.aggregate([
  { $match: { cin: "198001015671" } },
  { $lookup: {
    from: "analyses",
    localField: "_id",
    foreignField: "patient_id",
    as: "analysesCompletes"
  }},
  { $project: {
    _id: 1,
    nom: 1,
    prenom: 1,
    cin: 1,
    dateNaissance: 1,
    adresse: 1,
    consultations: 1,
    analysesCompletes: 1
  }}
]).toArray();

printjson(completeDossier);

// ─── 5.2 : Trouver les patients dont la glycémie dépasse 1.26 g/L
print("\n=== 5.2: Patients with glycemia > 126 mg/dL ===");

const highGlycemia = db.analyses.aggregate([
  { $match: {
    type: "Glycémie",
    "resultats.valeur": { $gt: 126 }
  }},
  { $lookup: {
    from: "patients",
    localField: "patient_id",
    foreignField: "_id",
    as: "patientInfo"
  }},
  { $unwind: "$patientInfo" },
  { $project: {
    patient: "$patientInfo.prenom",
    surname: "$patientInfo.nom",
    date: "$date",
    glycemia: "$resultats.valeur",
    laboratoire: "$laboratoire"
  }}
]).toArray();

printjson(highGlycemia);

// ─── 5.3 : Statistiques croisées : taux d'analyses anormales par wilaya
print("\n=== 5.3: Cross statistics - abnormal analysis rate by region ===");

const abnormalRateByWilaya = db.analyses.aggregate([
  { $lookup: {
    from: "patients",
    localField: "patient_id",
    foreignField: "_id",
    as: "patient"
  }},
  { $unwind: "$patient" },
  { $group: {
    _id: "$patient.adresse.wilaya",
    totalAnalyses: { $sum: 1 },
    abnormalCount: {
      $sum: {
        $cond: [
          {
            $or: [
              { $gt: ["$resultats.valeur", 150] },
              { $lt: ["$resultats.valeur", 70] }
            ]
          },
          1,
          0
        ]
      }
    }
  }},
  { $addFields: {
    abnormalRate: {
      $multiply: [
        { $divide: ["$abnormalCount", "$totalAnalyses"] },
        100
      ]
    }
  }},
  { $sort: { abnormalRate: -1 } },
  { $project: {
    _id: 0,
    wilaya: "$_id",
    totalAnalyses: 1,
    abnormalCount: 1,
    abnormalRate: { $round: ["$abnormalRate", 2] }
  }}
]).toArray();

printjson(abnormalRateByWilaya);
