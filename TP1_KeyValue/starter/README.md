# TP1 - Redis: E-commerce Cache System
## Practical Work Report

---

## 1. Overview

This practical focused on implementing a Redis caching layer for the ShopFast e-commerce platform. The objectives were to master Redis data structures, implement the Cache-Aside pattern, manage user sessions, and build a real-time product ranking system.

---

## 2. Implemented Exercises

### Exercise 1: Redis Data Structures (4 pts)

Implementation of 8 functions covering all Redis data types:

**Hash (HSET, HGET, HGETALL, HINCRBY)**
- `store_product()`: Store product metadata (name, price, category, stock)
- `get_product()`: Retrieve with None return if absent

**List (LPUSH, LRANGE, LTRIM)**
- `record_view()`: Record navigation history with limit (max 10)
- `get_history()`: Retrieve complete list

**Hash for cart (HINCRBY)**
- `add_to_cart()`: Add/increment quantities
- `get_cart()`: Retrieve complete cart

**Set (SADD, SINTER)**
- `add_product_to_category()`: Associate products to categories
- `get_products_in_categories()`: Intersection to find products in multiple categories

Modeling choices:
- Hash for products: field flexibility + O(1) lookup
- List for history: insertion order preserved, LTRIM efficient for limit
- Set for categories: efficient set operations (SINTER for intersection)

---

### Exercise 2: Session Management (4 pts)

Implementation of complete user session lifecycle:

**Features**
- `create_session()`: UUID generation, JSON storage with 30 minute TTL
- `get_session()`: Retrieve with JSON deserialization
- `renew_session()`: TTL refresh (sliding expiration)
- `delete_session()`: Manual deletion (logout)
- `is_session_valid()`: Existence check
- `get_session_ttl()`: Check remaining TTL

Justification of choices:
- Keys: "session:{uuid}" for uniqueness and isolation
- TTL: 30 minutes for balance between security and UX
- Sliding expiration: refresh TTL on each request for active sessions
- JSON serialization: flexibility for future extensions (user data, permissions)

---

### Exercise 3: Cache-Aside Pattern with TTL (5 pts)

Implementation of the classic pattern and associated benchmark:

**Cache-Aside Pattern**
```
1. Look in Redis (HIT): immediate return (~1-2ms)
2. Cache MISS: slow DB query (~2000ms)
3. Store result with TTL 600s
4. Following requests: HIT until expiration
```

Implementation:
- `get_product_cached()`: Redis check → DB fallback → storage
- `invalidate_product_cache()`: Manual deletion after DB update
- `benchmark_cache()`: Performance statistics (HIT/MISS ratio, speedup)

Serialization:
- JSON for flexibility (nested objects possible)
- `decode_responses=True` to avoid bytes conversion

Display:
- Latency in milliseconds for each request
- Cache hit rate after warmup
- Acceleration factor (speedup)

---

### Exercise 4: Leaderboard with Sorted Sets (4 pts)

Implementation of a real-time ranking using ZSET:

**Features**
- `record_sale()`: Atomic score increment with ZINCRBY
- `get_top_products()`: Top N products with ZREVRANGE (descending)
- `get_product_rank()`: 1-based rank of a product
- `get_products_between_ranks()`: Leaderboard slice

Sorted Set advantages:
- O(log N) insertion/update
- O(1) rank lookup
- Automatic sort maintenance
- Efficient range operations

Return format:
```python
[
  {"product_id": "3", "sales": "200"},
  {"product_id": "2", "sales": "150"},
  {"product_id": "1", "sales": "100"}
]
```

---

### Exercise 5: Pipelines & Transactions (3 pts)

Implementation of grouped and transactional operations:

**Pipeline (without atomic guarantee)**
- `bulk_insert_products()`: Batch product insertion
- `batch_update_prices()`: Grouped price update

Advantage: Reduce number of network requests (1 round-trip vs N)

**Transactions (MULTI/EXEC with WATCH)**
- `atomic_order_checkout()`: Transaction with stock check
- `transfer_stock()`: Atomic transfer between two products

Mechanism:
- WATCH on critical keys
- MULTI to begin transaction
- Checks (e.g., stock available)
- EXEC if no concurrent modification (WatchError otherwise)
- Retry loop to handle conflicts

Use cases:
- Checkout: check stock → decrement → record order (atomically)
- Transfer: prevent race conditions in case of concurrent modifications

---

## 3. Architecture and Modeling Choices

### Key Schema

```
product:{id}              # Hash | Product metadata
cart:{user_id}            # Hash | Cart content
history:{user_id}         # List | Recently viewed products
category:{name}           # Set  | Products in category

session:{session_id}      # String (JSON) | Session data (TTL: 1800s)
product_cache:{id}        # String (JSON) | Cache-Aside (TTL: 600s)

leaderboard:sales         # Sorted Set | Sales ranking
{counter}                 # String | Simple counters

orders:{user_id}          # List | User orders
product:{id}:stock        # Hash | Inventory (for transactions)
```

### Justification

1. **Composite keys**: "type:id" for clarity and namespace isolation
2. **Distinct TTL spaces**: Sessions (long) vs Cache (short)
3. **Appropriate types**:
   - String: Simple key-value, counters
   - Hash: Objects with multiple fields
   - List: Ordered collections, histories
   - Set: Membership and intersection operations
   - Sorted Set: Rankings, leaderboards

---

## 4. Observed Performance

### Cache-Aside Benchmark

Typical results (100 products, 10 iterations):

```
Iteration 1 (MISS):
  - DB query: ~2000ms
  - Cache store: ~1ms
  - Total: ~2001ms

Iterations 2-10 (HIT):
  - Redis lookup: ~1-2ms each
  - Avg HIT: 1.5ms
  
Performance:
  - Cache hit rate: 90%
  - Speedup: 1334x (2001ms vs 1.5ms)
  - Savings: 99.93% of DB time
```

Real impact for ShopFast:
- Product page: 3-4s → 10-50ms with cache
- 1000 requests/sec → easy handling vs saturation without cache

---

## 5. Answers to Reflection Questions

### Q1: What happens if Redis restarts?

**Answer**: Total cache loss (volatile in-memory data).

Impacts:
- Active sessions expire → user disconnection
- Cache-Aside: reload from DB (temporary bottleneck)
- Leaderboard: reset (daily reset)
- Cart: loss (critical if no client-side persistence)

Mitigations:
- Redis Persistence (RDB/AOF) for restart survival
- Cart duplication in database
- Short sessions (30min) and automatic renewal
- Acceptable for cache (DB fallback exists), critical for user state

### Q2: How to manage cache/DB coherence with concurrent access?

**Answer**: Multiple strategies depending on use case:

1. **Simple Cache-Aside**
   - Risk: reading stale data during TTL
   - Acceptable if: non-critical data, short TTL (5-10min)
   - Example: Product metadata (price can be slightly off)

2. **Active Invalidation**
   - Trigger DB update → DELETE cache immediately
   - Ensures: fresh data on change
   - Risk: missed invalidation → stale data
   - Example: Product stock (must be up-to-date)

3. **Write-Through**
   - DB update → update cache → response
   - Ensures: coherence
   - Risk: latency (slower write)

4. **Redis Transactions (WATCH/MULTI/EXEC)**
   - For atomic Redis modifications
   - Example: `atomic_order_checkout()` prevents double-sale

**Recommendation for ShopFast**:
- Product metadata: Simple Cache-Aside + 1h TTL
- Stock: Active invalidation (or atomic redis version)
- Cart: Write-through (critical)
- Sessions: WATCH/MULTI for concurrent modifications

### Q3: When is a too-short TTL problematic?

**Answer**: Depends on freshness vs performance trade-off.

**Too-short TTL (e.g., 1 minute)**
- Problem: High cache miss rate
- Ratio: 10 requests → 1-2 HIT, 8-9 MISS
- Impact: DB load increases, average latency rises
- Cost: 10x DB request vs 1x with long TTL
- Critical when: Data rarely changes (metadata)

**Too-long TTL (e.g., 24h)**
- Problem: Stale data for long periods
- Risk: Stock/price off for hours
- Impact: Degraded UX (buying out-of-stock), overbooking possible
- Critical when: Stock, price (critical data)

**Optimum by type**:
- Static metadata: 24h
- Prices: 5min (frequent changes)
- Stock: Active invalidation or very short (1min)
- Sessions: 30min (sliding window)
- Cart: No cache (personal data)

**Empirical formula**:
```
Ideal TTL = (Cost of DB request) / (Freshness tolerance)

Slow + critical: Short TTL
Slow + non-critical: Long TTL
Fast: TTL less important
```

---

## 6. Future Improvements and Extensions

1. **Clustering**: Redis replication for HA
2. **Eviction Policy**: Handle full memory (LRU vs LFU)
3. **Pub/Sub**: Distributed cache invalidation
4. **Lua Scripts**: Complex operations atomically
5. **Stream**: Persistent order history
6. **Geospatial**: User location for recommendations
7. **Monitoring**: Real-time latency, hit rate, memory usage

---

## 7. Conclusion

Complete implementation of all 5 exercises demonstrates Redis versatility:
- Application cache (Cache-Aside)
- Session store
- Leaderboard / Ranking
- Transactional operations
- Bulk operations

Modeling choices (keys, types, TTL) are fundamental to avoiding coherence and performance issues. Knowledge of patterns (Cache-Aside, Transactions) and pitfalls (concurrent writes, too-short/long TTL) is essential in production.

ShopFast would clearly benefit from Redis to reduce PostgreSQL load and improve user latency by 10-100x depending on operations.
