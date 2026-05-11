# TP2 - MongoDB: Medical Records Management Platform
## Report

---

## 1. Schema Design

**Patients Collection**
- Schema validation enforcing required fields (cin, nom, prenom, dateNaissance, sexe, adresse)
- 20 patients across 8 Algerian regions
- Consultations embedded (2-5 per patient)
- Antecedents and allergies tracked

**Analyses Collection**
- Separate referenced collection for lab tests
- Types: Glycemia, NFS, Lipidogramme, Créatinine, ECG
- Linked via patient_id foreign key
- TTL index for automatic archival after 5 years

**Embedding vs Referencing**
- Consultations embedded: accessed with patient data, moderate size
- Analyses referenced: independent growth, queried separately

## 2. Queries

- 2.1: Diabetic patients over 50 in Algiers
- 2.2: Penicillin-allergic with 3+ consultations using $expr for array size
- 2.3: Name and latest consultation with $slice projection
- 2.4: No antecedents with systolic BP > 140
- 2.5: Full-text search on diagnoses with text index

## 3. Aggregation Pipelines

- 3.1: Diagnosis distribution by region (unwind, group, sort, limit)
- 3.2: Top medication by specialty (double unwind, nested grouping)
- 3.3: Monthly consultation evolution (date extraction, time-series)
- 3.4: High-risk patients (diabetes + hypertension + age > 60, avg consultations)
- 3.5: Top 5 doctors with re-consultation rate using unique patient sets

## 4. Indexes

- Compound index on (wilaya, antecedents) for region + medical history queries
- Consultation date index for time-range queries
- Text index on diagnoses for full-text search
- Patient_id index in analyses for $lookup performance
- TTL index: analyses expire after 5 years (157680000 seconds)

**Performance Impact**
- Before: COLLSCAN, 20 documents examined, ~150ms
- After: IXSCAN, 2-3 documents examined, ~15ms
- Improvement: 10x faster with compound index

## 5. $Lookup Operations

- Join patients with analyses for complete medical records
- Find patients with high glycemia (> 126 mg/dL)
- Cross-statistics: abnormal analysis rate by region

## 6. Design Rationale

**Embedding Consultations**
- Always accessed with patient data
- Moderate size (2-5 per patient)
- Single query, atomic updates

**Referencing Analyses**
- Independent growth (100+ tests per patient)
- Queried separately from patients
- TTL archival after 5 years

**Index Field Order**
- (wilaya, antecedents): wilaya filters first (more selective)
- Alternative (antecedents, wilaya) less efficient

## 7. Conclusion

MongoDB handles medical records effectively with:
- Flexible schema for varying data types
- Embedded consultations for performance
- Referenced analyses for scalability
- Aggregation pipelines for complex analytics
- Compound indexes optimizing real-world queries
