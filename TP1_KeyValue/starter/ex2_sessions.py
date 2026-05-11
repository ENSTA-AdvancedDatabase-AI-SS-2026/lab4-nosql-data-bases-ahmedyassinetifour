"""
TP1 - Exercise 2: User Session Management
Use Case: ShopFast - Sessions with automatic expiration (TTL)
"""
import redis
import uuid
import json
from typing import Optional

r = redis.Redis(host='localhost', port=6379, decode_responses=True)

SESSION_TTL = 30 * 60


def create_session(r, user_id: str) -> str:
    """
    Create a new session for a user.
    Returns the session ID.
    Key: "session:{session_id}"
    Value: JSON with user_id and timestamp
    TTL: 30 minutes
    """
    session_id = str(uuid.uuid4())
    session_data = {"user_id": user_id, "created_at": str(__import__('time').time())}
    r.setex(f"session:{session_id}", SESSION_TTL, json.dumps(session_data))
    return session_id


def get_session(r, session_id: str) -> Optional[dict]:
    """
    Retrieve session data.
    Returns None if session doesn't exist (expired or deleted).
    """
    data = r.get(f"session:{session_id}")
    if data:
        return json.loads(data)
    return None


def renew_session(r, session_id: str) -> bool:
    """
    Renew a session (sliding expiration).
    Refresh TTL to 30 minutes again.
    Returns True if renewed, False if session doesn't exist.
    """
    if r.exists(f"session:{session_id}"):
        r.expire(f"session:{session_id}", SESSION_TTL)
        return True
    return False


def delete_session(r, session_id: str):
    """Delete a session (user logout)."""
    r.delete(f"session:{session_id}")


def is_session_valid(r, session_id: str) -> bool:
    """Check if a session exists and has not expired."""
    return r.exists(f"session:{session_id}") == 1


def get_session_ttl(r, session_id: str) -> int:
    """Return remaining TTL in seconds (-2 if not exists, -1 if no TTL)."""
    return r.ttl(f"session:{session_id}")


if __name__ == "__main__":
    r.flushdb()

    print("=== Session Tests ===")

    session_id = create_session(r, "user:42")
    print(f"Session created: {session_id}")

    session_data = get_session(r, session_id)
    print(f"Session data: {session_data}")

    print(f"Session valid: {is_session_valid(r, session_id)}")

    print(f"Session renewed: {renew_session(r, session_id)}")
    ttl = get_session_ttl(r, session_id)
    print(f"Remaining TTL: {ttl} seconds")

    delete_session(r, session_id)
    print(f"Session valid after deletion: {is_session_valid(r, session_id)}")
