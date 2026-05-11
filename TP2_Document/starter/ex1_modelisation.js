/**
 * TP2 - Exercice 1 : Modélisation MongoDB
 * Use Case : HealthCare DZ - Dossiers Médicaux
 */

use("medical_db");

// Drop collections if they exist for fresh start
db.patients.drop();
db.analyses.drop();

// 1.1: Create patients collection with schema validation
db.createCollection("patients", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["cin", "nom", "prenom", "dateNaissance", "sexe", "adresse"],
      properties: {
        _id: { bsonType: "objectId" },
        cin: { bsonType: "string", description: "National ID (unique)" },
        nom: { bsonType: "string", description: "Last name" },
        prenom: { bsonType: "string", description: "First name" },
        dateNaissance: { bsonType: "date", description: "Birth date" },
        sexe: { enum: ["M", "F"], description: "Gender" },
        adresse: {
          bsonType: "object",
          required: ["wilaya", "commune"],
          properties: {
            wilaya: { bsonType: "string" },
            commune: { bsonType: "string" },
          },
        },
        groupeSanguin: {
          enum: ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"],
        },
        antecedents: { bsonType: "array", items: { bsonType: "string" } },
        allergies: { bsonType: "array", items: { bsonType: "string" } },
        consultations: { bsonType: "array" },
      },
    },
  },
});

// 1.2: Insert 20 patients with Algerian names and medical data
const patients = [
  {
    cin: "198001015671",
    nom: "Bensalem",
    prenom: "Ahmed",
    dateNaissance: new Date("1980-01-15"),
    sexe: "M",
    adresse: { wilaya: "Alger", commune: "Bab Ezzouar" },
    groupeSanguin: "O+",
    antecedents: ["Diabète type 2", "HTA"],
    allergies: ["Pénicilline"],
    consultations: [
      {
        id: UUID(),
        date: new Date("2024-01-15"),
        medecin: { nom: "Dr. Mansouri", specialite: "Cardiologie" },
        diagnostic: "Hypertension artérielle",
        tension: { systolique: 145, diastolique: 92 },
        medicaments: [{ nom: "Amlodipine", dosage: "5mg", duree: "30 jours" }],
        notes: "Blood pressure monitoring recommended",
      },
      {
        id: UUID(),
        date: new Date("2024-03-20"),
        medecin: { nom: "Dr. Saïdi", specialite: "Endocrinologie" },
        diagnostic: "Diabète type 2 contrôlé",
        tension: { systolique: 130, diastolique: 85 },
        medicaments: [{ nom: "Metformine", dosage: "1000mg", duree: "3 mois" }],
        notes: "Glucose levels stable",
      },
    ],
  },
  {
    cin: "198502101245",
    nom: "Chabane",
    prenom: "Fatima",
    dateNaissance: new Date("1985-02-10"),
    sexe: "F",
    adresse: { wilaya: "Oran", commune: "Sidi El Houari" },
    groupeSanguin: "A+",
    antecedents: ["Asthme", "Allergies saisonnières"],
    allergies: ["Pénicilline", "Arachides"],
    consultations: [
      {
        id: UUID(),
        date: new Date("2024-02-08"),
        medecin: { nom: "Dr. Belkaïd", specialite: "Pneumologie" },
        diagnostic: "Asthme persistant léger",
        tension: { systolique: 120, diastolique: 80 },
        medicaments: [
          { nom: "Salbutamol", dosage: "2 bouffées", duree: "Au besoin" },
        ],
        notes: "Inhaler technique correct",
      },
    ],
  },
  {
    cin: "197103251890",
    nom: "Hadjadj",
    prenom: "Karim",
    dateNaissance: new Date("1971-03-25"),
    sexe: "M",
    adresse: { wilaya: "Constantine", commune: "Sidi Ambroise" },
    groupeSanguin: "B+",
    antecedents: ["HTA", "Hypercholestérolémie"],
    allergies: [],
    consultations: [
      {
        id: UUID(),
        date: new Date("2024-04-12"),
        medecin: { nom: "Dr. Ziane", specialite: "Cardiologie" },
        diagnostic: "Hypertension bien contrôlée",
        tension: { systolique: 135, diastolique: 88 },
        medicaments: [{ nom: "Lisinopril", dosage: "10mg", duree: "1 mois" }],
        notes: "Continue current regimen",
      },
      {
        id: UUID(),
        date: new Date("2024-05-05"),
        medecin: { nom: "Dr. Mansouri", specialite: "Cardiologie" },
        diagnostic: "Cholestérol élevé",
        tension: { systolique: 138, diastolique: 90 },
        medicaments: [
          { nom: "Atorvastatine", dosage: "20mg", duree: "2 mois" },
        ],
        notes: "Lifestyle modifications needed",
      },
    ],
  },
  {
    cin: "199001081234",
    nom: "Medour",
    prenom: "Leila",
    dateNaissance: new Date("1990-01-08"),
    sexe: "F",
    adresse: { wilaya: "Annaba", commune: "Centre" },
    groupeSanguin: "O-",
    antecedents: ["Anémie"],
    allergies: ["AINS"],
    consultations: [
      {
        id: UUID(),
        date: new Date("2024-03-15"),
        medecin: { nom: "Dr. Amina", specialite: "Hématologie" },
        diagnostic: "Anémie légère",
        tension: { systolique: 110, diastolique: 70 },
        medicaments: [{ nom: "Fer", dosage: "325mg", duree: "3 mois" }],
        notes: "Recheck hemoglobin in 3 months",
      },
    ],
  },
  {
    cin: "196805031567",
    nom: "Kaddouri",
    prenom: "Mohamed",
    dateNaissance: new Date("1968-05-03"),
    sexe: "M",
    adresse: { wilaya: "Blida", commune: "Boufarik" },
    groupeSanguin: "AB+",
    antecedents: ["Diabète type 2", "HTA", "Obésité"],
    allergies: [],
    consultations: [
      {
        id: UUID(),
        date: new Date("2024-02-20"),
        medecin: { nom: "Dr. Saïdi", specialite: "Endocrinologie" },
        diagnostic: "Diabète type 2 mal contrôlé",
        tension: { systolique: 150, diastolique: 95 },
        medicaments: [{ nom: "Glibenclamide", dosage: "5mg", duree: "2 mois" }],
        notes: "Weight loss and diet counseling needed",
      },
      {
        id: UUID(),
        date: new Date("2024-04-25"),
        medecin: { nom: "Dr. Mansouri", specialite: "Cardiologie" },
        diagnostic: "Obésité avec complications",
        tension: { systolique: 148, diastolique: 92 },
        medicaments: [],
        notes: "Referral to dietitian",
      },
    ],
  },
  {
    cin: "198701104532",
    nom: "Benhamiche",
    prenom: "Yasmine",
    dateNaissance: new Date("1987-01-10"),
    sexe: "F",
    adresse: { wilaya: "Algiers", commune: "Kouba" },
    groupeSanguin: "A-",
    antecedents: ["Thyroïdite d'Hashimoto"],
    allergies: ["Iode"],
    consultations: [
      {
        id: UUID(),
        date: new Date("2024-03-10"),
        medecin: { nom: "Dr. Ziane", specialite: "Endocrinologie" },
        diagnostic: "Hypothyroïdie stable",
        tension: { systolique: 115, diastolique: 75 },
        medicaments: [
          { nom: "Levothyroxine", dosage: "75mcg", duree: "Continu" },
        ],
        notes: "TSH levels normal",
      },
    ],
  },
  {
    cin: "197603217890",
    nom: "Bouazza",
    prenom: "Rachid",
    dateNaissance: new Date("1976-03-21"),
    sexe: "M",
    adresse: { wilaya: "Sétif", commune: "Centre" },
    groupeSanguin: "B-",
    antecedents: ["Arthrite rhumatoïde"],
    allergies: ["Sulfamides"],
    consultations: [
      {
        id: UUID(),
        date: new Date("2024-04-05"),
        medecin: { nom: "Dr. Belkaïd", specialite: "Rhumatologie" },
        diagnostic: "Arthrite rhumatoïde en rémission",
        tension: { systolique: 125, diastolique: 82 },
        medicaments: [
          { nom: "Méthotrexate", dosage: "15mg", duree: "Continu" },
        ],
        notes: "Monitor for remission status",
      },
    ],
  },
  {
    cin: "199209255678",
    nom: "Debbache",
    prenom: "Noor",
    dateNaissance: new Date("1992-09-25"),
    sexe: "F",
    adresse: { wilaya: "Tlemcen", commune: "Centre" },
    groupeSanguin: "O+",
    antecedents: ["Dépression"],
    allergies: [],
    consultations: [
      {
        id: UUID(),
        date: new Date("2024-01-30"),
        medecin: { nom: "Dr. Amina", specialite: "Psychiatrie" },
        diagnostic: "Dépression légère",
        tension: { systolique: 118, diastolique: 78 },
        medicaments: [{ nom: "Sertraline", dosage: "50mg", duree: "3 mois" }],
        notes: "Therapy sessions recommended",
      },
      {
        id: UUID(),
        date: new Date("2024-05-15"),
        medecin: { nom: "Dr. Amina", specialite: "Psychiatrie" },
        diagnostic: "Dépression en amélioration",
        tension: { systolique: 120, diastolique: 80 },
        medicaments: [{ nom: "Sertraline", dosage: "50mg", duree: "Continu" }],
        notes: "Continue with therapy",
      },
    ],
  },
  {
    cin: "198504126543",
    nom: "Farès",
    prenom: "Salim",
    dateNaissance: new Date("1985-04-12"),
    sexe: "M",
    adresse: { wilaya: "Béjaïa", commune: "Tichy" },
    groupeSanguin: "AB-",
    antecedents: ["Migraine chronique"],
    allergies: ["Codéine"],
    consultations: [
      {
        id: UUID(),
        date: new Date("2024-02-14"),
        medecin: { nom: "Dr. Ziane", specialite: "Neurologie" },
        diagnostic: "Migraine chronique",
        tension: { systolique: 122, diastolique: 79 },
        medicaments: [
          { nom: "Sumatriptan", dosage: "50mg", duree: "Au besoin" },
        ],
        notes: "Prophylactic treatment considered",
      },
    ],
  },
  {
    cin: "196902081234",
    nom: "Ghali",
    prenom: "Lamine",
    dateNaissance: new Date("1969-02-08"),
    sexe: "M",
    adresse: { wilaya: "Skikda", commune: "Centre" },
    groupeSanguin: "O+",
    antecedents: ["BPCO", "Tabagisme"],
    allergies: [],
    consultations: [
      {
        id: UUID(),
        date: new Date("2024-03-28"),
        medecin: { nom: "Dr. Belkaïd", specialite: "Pneumologie" },
        diagnostic: "BPCO modérée",
        tension: { systolique: 140, diastolique: 90 },
        medicaments: [
          { nom: "Tiotropium", dosage: "18mcg", duree: "Quotidien" },
        ],
        notes: "Smoking cessation counseling",
      },
    ],
  },
  {
    cin: "199110194567",
    nom: "Hamidouche",
    prenom: "Amina",
    dateNaissance: new Date("1991-10-19"),
    sexe: "F",
    adresse: { wilaya: "Oran", commune: "Haï Es Salam" },
    groupeSanguin: "A+",
    antecedents: ["Syndrome du côlon irritable"],
    allergies: ["Lactose"],
    consultations: [
      {
        id: UUID(),
        date: new Date("2024-04-18"),
        medecin: { nom: "Dr. Mansouri", specialite: "Gastro-entérologie" },
        diagnostic: "Syndrome du côlon irritable",
        tension: { systolique: 115, diastolique: 72 },
        medicaments: [
          { nom: "Dicyclomine", dosage: "20mg", duree: "Au besoin" },
        ],
        notes: "Dietary modifications advised",
      },
    ],
  },
  {
    cin: "197408157890",
    nom: "Ibrahim",
    prenom: "Hanifa",
    dateNaissance: new Date("1974-08-15"),
    sexe: "F",
    adresse: { wilaya: "Constantine", commune: "Koudiat Aatouf" },
    groupeSanguin: "B+",
    antecedents: ["Ostéoporose", "Ménopause"],
    allergies: [],
    consultations: [
      {
        id: UUID(),
        date: new Date("2024-02-12"),
        medecin: { nom: "Dr. Amina", specialite: "Rhumatologie" },
        diagnostic: "Ostéoporose post-ménopause",
        tension: { systolique: 132, diastolique: 85 },
        medicaments: [
          { nom: "Alendronate", dosage: "70mg", duree: "Hebdomadaire" },
        ],
        notes: "Calcium and vitamin D supplementation",
      },
    ],
  },
  {
    cin: "198611203456",
    nom: "Jaballah",
    prenom: "Omar",
    dateNaissance: new Date("1986-11-20"),
    sexe: "M",
    adresse: { wilaya: "Annaba", commune: "Sidi Amar" },
    groupeSanguin: "O-",
    antecedents: ["Dyslipidémie"],
    allergies: [],
    consultations: [
      {
        id: UUID(),
        date: new Date("2024-05-10"),
        medecin: { nom: "Dr. Saïdi", specialite: "Cardiologie" },
        diagnostic: "Dyslipidémie non traitée",
        tension: { systolique: 128, diastolique: 84 },
        medicaments: [{ nom: "Simvastatine", dosage: "20mg", duree: "2 mois" }],
        notes: "Lipid panel in 6 weeks",
      },
    ],
  },
  {
    cin: "198903134567",
    nom: "Kadri",
    prenom: "Aïcha",
    dateNaissance: new Date("1989-03-13"),
    sexe: "F",
    adresse: { wilaya: "Alger", commune: "Sidi Ferruch" },
    groupeSanguin: "AB+",
    antecedents: ["Anxiété"],
    allergies: ["Benzodiazépines"],
    consultations: [
      {
        id: UUID(),
        date: new Date("2024-01-22"),
        medecin: { nom: "Dr. Amina", specialite: "Psychiatrie" },
        diagnostic: "Trouble anxieux",
        tension: { systolique: 125, diastolique: 81 },
        medicaments: [{ nom: "Buspirone", dosage: "15mg", duree: "3 mois" }],
        notes: "Cognitive therapy recommended",
      },
    ],
  },
  {
    cin: "197207051234",
    nom: "Lamri",
    prenom: "Kamel",
    dateNaissance: new Date("1972-07-05"),
    sexe: "M",
    adresse: { wilaya: "Blida", commune: "Soumaa" },
    groupeSanguin: "A-",
    antecedents: ["Néphropathie diabétique"],
    allergies: ["Contrast iodé"],
    consultations: [
      {
        id: UUID(),
        date: new Date("2024-03-05"),
        medecin: { nom: "Dr. Ziane", specialite: "Néphrologie" },
        diagnostic: "Néphropathie diabétique stade 3",
        tension: { systolique: 145, diastolique: 92 },
        medicaments: [{ nom: "Losartan", dosage: "50mg", duree: "Continu" }],
        notes: "Monitor renal function quarterly",
      },
    ],
  },
  {
    cin: "199405201234",
    nom: "Marzouki",
    prenom: "Zaineb",
    dateNaissance: new Date("1994-05-20"),
    sexe: "F",
    adresse: { wilaya: "Sétif", commune: "Guerziz" },
    groupeSanguin: "B+",
    antecedents: ["Acné sévère"],
    allergies: [],
    consultations: [
      {
        id: UUID(),
        date: new Date("2024-02-28"),
        medecin: { nom: "Dr. Belkaïd", specialite: "Dermatologie" },
        diagnostic: "Acné sévère",
        tension: { systolique: 118, diastolique: 76 },
        medicaments: [
          { nom: "Isotrétinoïne", dosage: "20mg", duree: "6 mois" },
        ],
        notes: "Monthly dermatology follow-up",
      },
    ],
  },
  {
    cin: "198108095678",
    nom: "Nait Ali",
    prenom: "Djamel",
    dateNaissance: new Date("1981-08-09"),
    sexe: "M",
    adresse: { wilaya: "Tlemcen", commune: "Ouled Mimoun" },
    groupeSanguin: "O+",
    antecedents: ["Hépatite C"],
    allergies: [],
    consultations: [
      {
        id: UUID(),
        date: new Date("2024-04-08"),
        medecin: { nom: "Dr. Mansouri", specialite: "Gastro-entérologie" },
        diagnostic: "Hépatite C chronique",
        tension: { systolique: 130, diastolique: 80 },
        medicaments: [
          { nom: "Sofosbuvir", dosage: "400mg", duree: "12 semaines" },
        ],
        notes: "Viral load monitoring",
      },
    ],
  },
  {
    cin: "198606121234",
    nom: "Oudjani",
    prenom: "Saïd",
    dateNaissance: new Date("1986-06-12"),
    sexe: "M",
    adresse: { wilaya: "Béjaïa", commune: "Akbou" },
    groupeSanguin: "A+",
    antecedents: ["Apnée du sommeil"],
    allergies: [],
    consultations: [
      {
        id: UUID(),
        date: new Date("2024-01-15"),
        medecin: { nom: "Dr. Belkaïd", specialite: "Pneumologie" },
        diagnostic: "Apnée du sommeil sévère",
        tension: { systolique: 142, diastolique: 88 },
        medicaments: [],
        notes: "CPAP therapy initiated",
      },
    ],
  },
  {
    cin: "199207034567",
    nom: "Parmis",
    prenom: "Mahira",
    dateNaissance: new Date("1992-07-03"),
    sexe: "F",
    adresse: { wilaya: "Skikda", commune: "Koraïm" },
    groupeSanguin: "O-",
    antecedents: ["Lupus érythémateux disséminé"],
    allergies: ["AINS"],
    consultations: [
      {
        id: UUID(),
        date: new Date("2024-05-01"),
        medecin: { nom: "Dr. Ziane", specialite: "Rhumatologie" },
        diagnostic: "Lupus érythémateux disséminé en rémission",
        tension: { systolique: 120, diastolique: 78 },
        medicaments: [
          { nom: "Hydroxychloroquine", dosage: "400mg", duree: "Continu" },
        ],
        notes: "Regular lupus monitoring",
      },
    ],
  },
];

db.patients.insertMany(patients);

// Get patient IDs for referencing
const patientIds = db.patients.find({}, { _id: 1 }).toArray().map(p => p._id);

const analyses = [
  // Glycemia tests
  {
    patient_id: patientIds[0],
    date: new Date("2024-01-10"),
    type: "Glycémie",
    resultats: { valeur: 180, unite: "mg/dL" },
    laboratoire: "Labo Central Alger",
    valide: true
  },
  {
    patient_id: patientIds[0],
    date: new Date("2024-04-10"),
    type: "Glycémie",
    resultats: { valeur: 145, unite: "mg/dL" },
    laboratoire: "Labo Central Alger",
    valide: true
  },
  // Full blood count
  {
    patient_id: patientIds[1],
    date: new Date("2024-02-05"),
    type: "NFS",
    resultats: {
      hemoglobine: 12.5,
      globules_rouges: 4.2,
      globules_blancs: 7.1,
      plaquettes: 250
    },
    laboratoire: "Labo Central Alger",
    valide: true
  },
  // Lipid panel
  {
    patient_id: patientIds[2],
    date: new Date("2024-04-08"),
    type: "Lipidogramme",
    resultats: {
      cholesterol_total: 280,
      ldl: 180,
      hdl: 45,
      triglycerides: 200
    },
    laboratoire: "Labo Central Alger",
    valide: true
  },
  // Creatinine test
  {
    patient_id: patientIds[12],
    date: new Date("2024-03-03"),
    type: "Créatinine",
    resultats: { valeur: 1.8, unite: "mg/dL" },
    laboratoire: "Labo Central Alger",
    valide: true
  },
  // ECG
  {
    patient_id: patientIds[2],
    date: new Date("2024-04-10"),
    type: "ECG",
    resultats: { interpretation: "Normale" },
    laboratoire: "Hopital Central Alger",
    valide: true
  },
  // Additional tests for various patients
  {
    patient_id: patientIds[3],
    date: new Date("2024-03-12"),
    type: "Glycémie",
    resultats: { valeur: 95, unite: "mg/dL" },
    laboratoire: "Labo Central Alger",
    valide: true
  },
  {
    patient_id: patientIds[4],
    date: new Date("2024-02-18"),
    type: "NFS",
    resultats: {
      hemoglobine: 10.2,
      globules_rouges: 3.5,
      globules_blancs: 6.8,
      plaquettes: 240
    },
    laboratoire: "Labo Central Alger",
    valide: true
  },
  {
    patient_id: patientIds[5],
    date: new Date("2024-03-08"),
    type: "Lipidogramme",
    resultats: {
      cholesterol_total: 210,
      ldl: 120,
      hdl: 55,
      triglycerides: 150
    },
    laboratoire: "Labo Central Alger",
    valide: true
  },
  {
    patient_id: patientIds[9],
    date: new Date("2024-03-25"),
    type: "Glycémie",
    resultats: { valeur: 320, unite: "mg/dL" },
    laboratoire: "Labo Central Alger",
    valide: true
  }
];

db.analyses.insertMany(analyses);

print(
  "Collection setup complete. Patients inserted:",
  db.patients.countDocuments(),
);
print("Analyses inserted:", db.analyses.countDocuments());
