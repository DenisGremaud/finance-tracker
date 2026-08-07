import pytest


def test_update_full_name(client, auth_headers):
    response = client.patch("/auth/me", json={"full_name": "Denis G."}, headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["full_name"] == "Denis G."

    me = client.get("/auth/me", headers=auth_headers)
    assert me.json()["full_name"] == "Denis G."


def test_update_email(client, auth_headers):
    response = client.patch("/auth/me", json={"email": "new@example.com"}, headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["email"] == "new@example.com"

    # The token carries the user id, so it stays valid after an email change.
    me = client.get("/auth/me", headers=auth_headers)
    assert me.status_code == 200
    assert me.json()["email"] == "new@example.com"


def test_update_email_rejects_address_taken_by_another_user(client, auth_headers):
    client.post("/auth/register", json={"email": "taken@example.com", "password": "secret123"})

    response = client.patch("/auth/me", json={"email": "taken@example.com"}, headers=auth_headers)
    assert response.status_code == 400


def test_update_email_to_own_address_is_allowed(client, auth_headers):
    response = client.patch("/auth/me", json={"email": "test@example.com"}, headers=auth_headers)
    assert response.status_code == 200


def test_update_requires_authentication(client):
    response = client.patch("/auth/me", json={"full_name": "Nope"})
    assert response.status_code == 401


def test_change_password_then_login_with_new_one(client, auth_headers):
    response = client.post(
        "/auth/change-password",
        json={"current_password": "secret123", "new_password": "brandnew123"},
        headers=auth_headers,
    )
    assert response.status_code == 204

    old = client.post("/auth/login", data={"username": "test@example.com", "password": "secret123"})
    assert old.status_code == 401

    new = client.post(
        "/auth/login", data={"username": "test@example.com", "password": "brandnew123"}
    )
    assert new.status_code == 200


def test_change_password_rejects_wrong_current(client, auth_headers):
    response = client.post(
        "/auth/change-password",
        json={"current_password": "wrongpass1", "new_password": "brandnew123"},
        headers=auth_headers,
    )
    assert response.status_code == 400


@pytest.mark.parametrize("weak", ["short1", "alllettersnodigit", "12345678"])
def test_change_password_rejects_weak_new(client, auth_headers, weak):
    response = client.post(
        "/auth/change-password",
        json={"current_password": "secret123", "new_password": weak},
        headers=auth_headers,
    )
    assert response.status_code == 422
