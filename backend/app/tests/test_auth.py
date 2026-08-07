import pytest


def test_register_and_me(client):
    response = client.post(
        "/auth/register",
        json={"email": "alice@example.com", "password": "secret123", "full_name": "Alice"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["user"]["email"] == "alice@example.com"
    assert body["token"]["access_token"]

    token = body["token"]["access_token"]
    me = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["email"] == "alice@example.com"


def test_register_duplicate_email_fails(client):
    payload = {"email": "bob@example.com", "password": "secret123"}
    client.post("/auth/register", json=payload)
    response = client.post("/auth/register", json=payload)
    assert response.status_code == 400


def test_login_success_and_failure(client):
    client.post("/auth/register", json={"email": "carol@example.com", "password": "secret123"})

    ok = client.post("/auth/login", data={"username": "carol@example.com", "password": "secret123"})
    assert ok.status_code == 200
    assert "access_token" in ok.json()

    bad = client.post("/auth/login", data={"username": "carol@example.com", "password": "wrong"})
    assert bad.status_code == 401


def test_protected_route_requires_token(client):
    response = client.get("/auth/me")
    assert response.status_code == 401


@pytest.mark.parametrize(
    "password",
    ["short1", "alllettersnodigit", "12345678", "1234567"],
)
def test_register_weak_password_rejected(client, password):
    response = client.post(
        "/auth/register",
        json={"email": "weakpass@example.com", "password": password},
    )
    assert response.status_code == 422


def test_login_is_rate_limited(client):
    client.post("/auth/register", json={"email": "ratelimit@example.com", "password": "secret123"})

    for _ in range(10):
        response = client.post(
            "/auth/login", data={"username": "ratelimit@example.com", "password": "wrong"}
        )
        assert response.status_code == 401

    limited = client.post(
        "/auth/login", data={"username": "ratelimit@example.com", "password": "wrong"}
    )
    assert limited.status_code == 429
