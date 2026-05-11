"""
TP1 - Exercise 5: Redis Pipelines & Transactions
Use Case: Atomic operations for orders and inventory
"""
import redis
import time
from typing import List

r = redis.Redis(host='localhost', port=6379, decode_responses=True)


def bulk_insert_products(r, products: List[dict]) -> int:
    """
    Insert multiple products in a single operation (pipeline).
    Returns the number of products inserted.
    """
    pipe = r.pipeline()
    for product in products:
        product_id = product.pop('id')
        pipe.hset(f"product:{product_id}", mapping=product)
    results = pipe.execute()
    return len(results)


def atomic_order_checkout(r, user_id: str, product_id: str, quantity: int) -> bool:
    """
    Atomic operation: check stock, decrement, add to order history.
    Uses MULTI/EXEC for transaction.
    Returns True if successful, False if insufficient stock.
    """
    try:
        pipe = r.pipeline(transaction=True)
        while True:
            try:
                pipe.watch(f"product:{product_id}:stock")

                stock = int(r.hget(f"product:{product_id}", "stock") or 0)
                if stock < quantity:
                    pipe.reset()
                    return False

                pipe.multi()
                pipe.hincrby(f"product:{product_id}", "stock", -quantity)
                pipe.lpush(f"orders:{user_id}", f"{product_id}:{quantity}")
                pipe.execute()
                return True
            except redis.WatchError:
                continue
    except Exception:
        return False


def increment_counter_atomic(r, key: str, increment: int = 1) -> int:
    """
    Atomically increment a counter.
    Returns the new value.
    """
    return r.incr(key, increment)


def transfer_stock(r, from_product_id: str, to_product_id: str, quantity: int) -> bool:
    """
    Atomically transfer stock from one product to another.
    Returns True if successful.
    """
    try:
        pipe = r.pipeline(transaction=True)
        while True:
            try:
                pipe.watch(f"product:{from_product_id}:stock", f"product:{to_product_id}:stock")

                from_stock = int(r.hget(f"product:{from_product_id}", "stock") or 0)
                if from_stock < quantity:
                    pipe.reset()
                    return False

                pipe.multi()
                pipe.hincrby(f"product:{from_product_id}", "stock", -quantity)
                pipe.hincrby(f"product:{to_product_id}", "stock", quantity)
                pipe.execute()
                return True
            except redis.WatchError:
                continue
    except Exception:
        return False


def batch_update_prices(r, price_updates: dict) -> int:
    """
    Update prices for multiple products in one operation.
    price_updates: {"product_id": new_price, ...}
    Returns the number of products updated.
    """
    pipe = r.pipeline()
    for product_id, new_price in price_updates.items():
        pipe.hset(f"product:{product_id}", "price", str(new_price))
    results = pipe.execute()
    return len([r for r in results if r])


if __name__ == "__main__":
    r.flushdb()

    print("=== Pipeline Tests ===")

    products = [
        {"id": 1, "name": "Samsung A54", "price": "65000", "stock": "15"},
        {"id": 2, "name": "Laptop HP", "price": "120000", "stock": "8"},
        {"id": 3, "name": "JBL Headphones", "price": "12000", "stock": "50"},
    ]
    inserted = bulk_insert_products(r, products)
    print(f"Products inserted: {inserted}")

    print("\n=== Atomic Checkout Test ===")
    success = atomic_order_checkout(r, "user:42", "1", 5)
    print(f"Checkout successful: {success}")
    print(f"Product 1 stock: {r.hget('product:1', 'stock')}")

    print("\n=== Counter Test ===")
    counter = increment_counter_atomic(r, "sales_today")
    print(f"Today sales: {counter}")

    print("\n=== Batch Update Test ===")
    updates = {"1": 70000, "2": 130000, "3": 13000}
    updated = batch_update_prices(r, updates)
    print(f"Products updated: {updated}")
    print(f"New price for product 1: {r.hget('product:1', 'price')}")
