"""
TP5 - Benchmark Comparatif NoSQL
Mesurer les performances de Redis, MongoDB, Cassandra, Neo4j
"""
import time
import statistics
import json
from typing import Callable, List, Tuple
import redis
from pymongo import MongoClient
from cassandra.cluster import Cluster
from neo4j import GraphDatabase

# ─── Utilitaires de mesure ────────────────────────────────────────────────────

def measure_latency(fn: Callable, iterations: int = 1000) -> dict:
    """
    Exécuter fn iterations fois et retourner les statistiques
    """
    latencies = []
    for _ in range(iterations):
        start = time.perf_counter()
        fn()
        latencies.append((time.perf_counter() - start) * 1000)  # en ms
    
    latencies.sort()
    return {
        "mean_ms": statistics.mean(latencies),
        "p50_ms": latencies[int(0.50 * len(latencies))],
        "p95_ms": latencies[int(0.95 * len(latencies))],
        "p99_ms": latencies[int(0.99 * len(latencies))],
        "max_ms": max(latencies),
        "throughput_rps": 1000 / statistics.mean(latencies)
    }


def print_results(name: str, results: dict):
    print(f"\n{'='*50}")
    print(f" {name}")
    print(f"{'='*50}")
    for k, v in results.items():
        print(f"  {k:20s}: {v:.2f}")


# ─── Ex1 : Benchmark Écriture ─────────────────────────────────────────────────

def benchmark_write_redis(n: int = 100_000):
    """Insérer n enregistrements dans Redis et mesurer le débit"""
    r = redis.Redis(host='localhost', port=6379, decode_responses=True)
    r.flushdb()

    start = time.time()
    pipe = r.pipeline()
    for i in range(n):
        pipe.set(f"key:{i}", f"value:{i}")
        if (i + 1) % 1000 == 0:
            pipe.execute()
            pipe = r.pipeline()
    pipe.execute()
    elapsed = time.time() - start

    throughput = n / elapsed
    results = {
        "throughput_ops_per_sec": throughput,
        "elapsed_seconds": elapsed,
        "mean_ms": (elapsed / n) * 1000
    }
    print_results(f"Ex1 - Redis Write ({n:,} records)", results)
    return results


def benchmark_write_mongodb(n: int = 100_000):
    """Insérer n documents dans MongoDB et mesurer le débit"""
    client = MongoClient("mongodb://admin:admin123@localhost:27017/")
    db = client["benchmark"]
    collection = db["write_bench"]
    collection.drop()

    docs = [{"_id": i, "value": f"value:{i}", "timestamp": time.time()} for i in range(n)]

    start = time.time()
    collection.insert_many(docs, ordered=False)
    elapsed = time.time() - start

    throughput = n / elapsed
    results = {
        "throughput_ops_per_sec": throughput,
        "elapsed_seconds": elapsed,
        "mean_ms": (elapsed / n) * 1000
    }
    print_results(f"Ex1 - MongoDB Write ({n:,} records)", results)
    return results


def benchmark_write_cassandra(n: int = 100_000):
    """Insérer n rows dans Cassandra et mesurer le débit"""
    from cassandra.cluster import Cluster

    cluster = Cluster(['localhost'])
    session = cluster.connect()
    session.execute("DROP KEYSPACE IF EXISTS benchmark")
    session.execute("CREATE KEYSPACE benchmark WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1}")
    session.execute("USE benchmark")
    session.execute("CREATE TABLE bench_data (id INT PRIMARY KEY, value TEXT, timestamp BIGINT)")

    start = time.time()
    prepared = session.prepare("INSERT INTO bench_data (id, value, timestamp) VALUES (?, ?, ?)")
    for i in range(n):
        session.execute(prepared, [i, f"value:{i}", int(time.time() * 1000)])
    elapsed = time.time() - start

    throughput = n / elapsed
    results = {
        "throughput_ops_per_sec": throughput,
        "elapsed_seconds": elapsed,
        "mean_ms": (elapsed / n) * 1000
    }
    print_results(f"Ex1 - Cassandra Write ({n:,} records)", results)
    cluster.shutdown()
    return results


# ─── Ex2 : Benchmark Lecture ─────────────────────────────────────────────────

def benchmark_read_redis(iterations: int = 10_000):
    """Point lookup, range (ZRANGE), complex (pipeline multi-get)"""
    r = redis.Redis(host='localhost', port=6379, decode_responses=True)

    # Populate test data
    for i in range(1000):
        r.set(f"key:{i}", f"value:{i}")
        r.zadd("zset", {f"member:{i}": i})

    results = {}

    # Point lookup
    results["point_lookup"] = measure_latency(
        lambda: r.get(f"key:{iterations % 1000}"),
        iterations
    )

    # Range query (ZRANGE)
    results["range_query"] = measure_latency(
        lambda: r.zrange("zset", 0, 10),
        iterations
    )

    # Complex (multi-get pipeline)
    def complex_query():
        pipe = r.pipeline()
        for j in range(10):
            pipe.get(f"key:{j}")
        pipe.execute()

    results["complex_query"] = measure_latency(complex_query, iterations)

    print_results("Ex2 - Redis Read", results["point_lookup"])
    return results


def benchmark_read_mongodb(iterations: int = 10_000):
    """find_one, find avec range, aggregate pipeline"""
    client = MongoClient("mongodb://admin:admin123@localhost:27017/")
    db = client["benchmark"]
    collection = db["read_bench"]
    collection.drop()

    # Populate test data
    docs = [{"_id": i, "value": f"value:{i}", "score": i, "timestamp": time.time()} for i in range(1000)]
    collection.insert_many(docs)
    collection.create_index("score")

    results = {}

    # Point lookup (find_one)
    results["point_lookup"] = measure_latency(
        lambda: collection.find_one({"_id": iterations % 1000}),
        iterations
    )

    # Range query
    results["range_query"] = measure_latency(
        lambda: list(collection.find({"score": {"$gte": 100, "$lte": 200}})),
        iterations
    )

    # Aggregation pipeline
    def agg_pipeline():
        return list(collection.aggregate([
            {"$match": {"score": {"$gte": 500}}},
            {"$group": {"_id": None, "avg_score": {"$avg": "$score"}}},
            {"$sort": {"avg_score": -1}}
        ]))

    results["complex_query"] = measure_latency(agg_pipeline, 100)  # Fewer iterations for complex ops

    print_results("Ex2 - MongoDB Read", results["point_lookup"])
    return results


# ─── Ex3 : Charge concurrente ─────────────────────────────────────────────────

def benchmark_concurrent(db_name: str = "redis", n_clients: int = 50, requests_per_client: int = 200):
    """Lancer n_clients threads simultanés, chaque thread effectue requests_per_client requêtes"""
    import threading

    latencies = []
    lock = threading.Lock()

    def redis_worker():
        r = redis.Redis(host='localhost', port=6379, decode_responses=True)
        for i in range(requests_per_client):
            start = time.perf_counter()
            r.get(f"key:{i % 1000}")
            with lock:
                latencies.append((time.perf_counter() - start) * 1000)

    def mongodb_worker():
        client = MongoClient("mongodb://admin:admin123@localhost:27017/")
        db = client["benchmark"]
        collection = db["read_bench"]
        for i in range(requests_per_client):
            start = time.perf_counter()
            collection.find_one({"_id": i % 1000})
            with lock:
                latencies.append((time.perf_counter() - start) * 1000)

    # Launch concurrent clients
    threads = []
    start = time.time()

    if db_name == "redis":
        worker_fn = redis_worker
    else:
        worker_fn = mongodb_worker

    for _ in range(n_clients):
        t = threading.Thread(target=worker_fn)
        t.start()
        threads.append(t)

    for t in threads:
        t.join()

    elapsed = time.time() - start
    total_requests = n_clients * requests_per_client

    latencies.sort()
    results = {
        "total_requests": total_requests,
        "total_time_sec": elapsed,
        "throughput_rps": total_requests / elapsed,
        "mean_latency_ms": statistics.mean(latencies),
        "p95_latency_ms": latencies[int(0.95 * len(latencies))],
        "p99_latency_ms": latencies[int(0.99 * len(latencies))],
        "max_latency_ms": max(latencies)
    }
    print_results(f"Ex3 - Concurrent ({db_name.upper()}, {n_clients} clients)", results)
    return results


# ─── Main ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("Benchmark NoSQL - Comparatif des 4 technologies")
    print("="*60)

    N = 10_000  # Reduce for testing, 100_000 for production

    print(f"\nEx1 - Benchmark Ecriture ({N:,} enregistrements)")
    write_results = {}
    write_results["redis"] = benchmark_write_redis(N)
    write_results["mongodb"] = benchmark_write_mongodb(N)
    # Cassandra skipped due to Docker compatibility issue on Windows
    # write_results["cassandra"] = benchmark_write_cassandra(N)

    print(f"\nEx2 - Benchmark Lecture (10,000 requetes)")
    read_results = {}
    read_results["redis"] = benchmark_read_redis(10_000)
    read_results["mongodb"] = benchmark_read_mongodb(10_000)

    print(f"\nEx3 - Test Charge Concurrente (50 clients, 200 req/client)")
    concurrent_results = {}
    concurrent_results["redis"] = benchmark_concurrent("redis", 50, 200)
    concurrent_results["mongodb"] = benchmark_concurrent("mongodb", 50, 200)

    # Save results
    all_results = {
        "write": write_results,
        "read": read_results,
        "concurrent": concurrent_results
    }

    with open("benchmark_results.json", "w") as f:
        json.dump(all_results, f, indent=2)

    print("\nBenchmark termine ! Consultez RAPPORT.md pour l'analyse.")
