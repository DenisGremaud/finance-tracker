def test_create_and_list_categories(client, auth_headers):
    response = client.post("/categories", json={"name": "Food", "color": "#22c55e"}, headers=auth_headers)
    assert response.status_code == 201
    assert response.json()["name"] == "Food"

    listing = client.get("/categories", headers=auth_headers)
    assert listing.status_code == 200
    assert len(listing.json()) == 1


def test_duplicate_category_name_rejected(client, auth_headers):
    client.post("/categories", json={"name": "Food"}, headers=auth_headers)
    response = client.post("/categories", json={"name": "Food"}, headers=auth_headers)
    assert response.status_code == 400


def test_update_and_delete_category(client, auth_headers):
    created = client.post("/categories", json={"name": "Transport"}, headers=auth_headers).json()

    updated = client.put(
        f"/categories/{created['id']}", json={"name": "Transportation"}, headers=auth_headers
    )
    assert updated.status_code == 200
    assert updated.json()["name"] == "Transportation"

    deleted = client.delete(f"/categories/{created['id']}", headers=auth_headers)
    assert deleted.status_code == 204

    listing = client.get("/categories", headers=auth_headers)
    assert listing.json() == []


def test_categories_are_scoped_per_user(client):
    client.post("/auth/register", json={"email": "u1@example.com", "password": "secret123"})
    token1 = client.post(
        "/auth/login", data={"username": "u1@example.com", "password": "secret123"}
    ).json()["access_token"]

    client.post("/auth/register", json={"email": "u2@example.com", "password": "secret123"})
    token2 = client.post(
        "/auth/login", data={"username": "u2@example.com", "password": "secret123"}
    ).json()["access_token"]

    client.post("/categories", json={"name": "Food"}, headers={"Authorization": f"Bearer {token1}"})

    listing = client.get("/categories", headers={"Authorization": f"Bearer {token2}"})
    assert listing.json() == []
