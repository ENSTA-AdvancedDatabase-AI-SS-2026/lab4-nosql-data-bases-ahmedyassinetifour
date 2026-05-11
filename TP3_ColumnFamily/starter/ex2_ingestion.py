"""
TP3 - Exercice 2 : Ingestion de données IoT
Use Case : SmartGrid DZ - 10 000 capteurs, 5 minutes de mesures
"""
from cassandra.cluster import Cluster
from cassandra.query import BatchStatement, BatchType
import uuid
import random
from datetime import datetime, timedelta
import time

# Configuration
CASSANDRA_HOST = 'localhost'
KEYSPACE = 'smartgrid'
NB_CAPTEURS = 10000
MINUTES_HISTORIQUE = 5

WILAYAS = ["Alger", "Oran", "Constantine", "Annaba", "Blida"]
COMMUNES = {
    "Alger": ["Bab Ezzouar", "Hydra", "El Harrach", "Dar El Beida"],
    "Oran": ["Bir El Djir", "Es Senia", "Arzew"],
    "Constantine": ["El Khroub", "Ain Smara", "Hamma Bouziane"],
    "Annaba": ["El Bouni", "El Hadjar", "Seraidi"],
    "Blida": ["Bougara", "Boufarik", "Larbaa"],
}

def connect():
    """Connexion au cluster Cassandra"""
    cluster = Cluster([CASSANDRA_HOST])
    session = cluster.connect(KEYSPACE)
    return session, cluster


def generate_mesure(capteur_id, wilaya, commune, timestamp):
    """Générer une mesure réaliste pour un capteur"""
    tension_base = 220  # Volts (réseau algérien)
    
    return {
        "capteur_id": capteur_id,
        "date_jour": timestamp.date(),
        "timestamp": timestamp,
        "wilaya": wilaya,
        "commune": commune,
        # Variation normale ± 10V
        "tension_v": round(tension_base + random.gauss(0, 5), 2),
        "courant_a": round(random.uniform(0.5, 15.0), 2),
        "puissance_kw": round(random.uniform(0.1, 3.3), 3),
        "frequence_hz": round(50 + random.gauss(0, 0.1), 2),
        "temperature": round(random.uniform(20, 65), 1),
        # 5% de chance d'alerte
        "alerte": random.random() < 0.05,
    }


def insert_single(session, mesure):
    """Insert a single measurement using prepared statement"""
    stmt = session.prepare("""
        INSERT INTO mesures_par_capteur
        (capteur_id, date_jour, timestamp, wilaya, commune,
         tension_v, courant_a, puissance_kw, frequence_hz,
         temperature, alerte, code_alerte)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        USING TTL 7776000
    """)

    session.execute(stmt, [
        mesure["capteur_id"],
        mesure["date_jour"],
        mesure["timestamp"],
        mesure["wilaya"],
        mesure["commune"],
        mesure["tension_v"],
        mesure["courant_a"],
        mesure["puissance_kw"],
        mesure["frequence_hz"],
        mesure["temperature"],
        mesure["alerte"],
        mesure.get("code_alerte", "NORMAL")
    ])


def insert_batch(session, mesures: list):
    """Insert batch of measurements efficiently using UNLOGGED BATCH"""
    if not mesures:
        return

    batch = BatchStatement(batch_type=BatchType.UNLOGGED)
    stmt = session.prepare("""
        INSERT INTO mesures_par_capteur
        (capteur_id, date_jour, timestamp, wilaya, commune,
         tension_v, courant_a, puissance_kw, frequence_hz,
         temperature, alerte, code_alerte)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        USING TTL 7776000
    """)

    for mesure in mesures:
        batch.add(stmt, [
            mesure["capteur_id"],
            mesure["date_jour"],
            mesure["timestamp"],
            mesure["wilaya"],
            mesure["commune"],
            mesure["tension_v"],
            mesure["courant_a"],
            mesure["puissance_kw"],
            mesure["frequence_hz"],
            mesure["temperature"],
            mesure["alerte"],
            mesure.get("code_alerte", "NORMAL")
        ])

    session.execute(batch)


def run_ingestion(session):
    """Generate and insert sensor measurements with batching"""
    print(f"Starting ingestion: {NB_CAPTEURS:,} sensors × {MINUTES_HISTORIQUE} min")
    start = time.time()

    # Generate sensor assignments (capteur_id → wilaya, commune)
    capteurs = []
    for i in range(NB_CAPTEURS):
        wilaya = random.choice(WILAYAS)
        commune = random.choice(COMMUNES[wilaya])
        capteurs.append({
            "id": uuid.uuid4(),
            "wilaya": wilaya,
            "commune": commune
        })

    # Generate measurements for last N minutes
    now = datetime.now()
    total_inserted = 0
    batch_size = 50

    for minute_offset in range(MINUTES_HISTORIQUE):
        timestamp_base = now - timedelta(minutes=minute_offset)
        batch = []

        for capteur in capteurs:
            mesure = generate_mesure(
                capteur["id"],
                capteur["wilaya"],
                capteur["commune"],
                timestamp_base
            )
            batch.append(mesure)

            # Insert in batches of 50
            if len(batch) >= batch_size:
                insert_batch(session, batch)
                total_inserted += len(batch)
                batch = []

        # Insert remaining measurements
        if batch:
            insert_batch(session, batch)
            total_inserted += len(batch)

    elapsed = time.time() - start
    total = NB_CAPTEURS * MINUTES_HISTORIQUE
    print(f"\nInserted {total:,} measurements in {elapsed:.1f}s")
    print(f"Throughput: {total/elapsed:,.0f} measurements/second")


if __name__ == "__main__":
    session, cluster = connect()
    run_ingestion(session)
    cluster.shutdown()
