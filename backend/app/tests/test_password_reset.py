import pytest

from app.security import (
    create_access_token,
    create_password_reset_token,
    hash_password,
)


def _reset_token_for(client, email="test@example.com", password="secret123"):
    """Mints a reset token directly, since tests don't go through email."""
    from app.database import get_db
    from app.main import app
    from app.models.user import User

    db = next(app.dependency_overrides[get_db]())
    user = db.query(User).filter(User.email == email).first()
    return create_password_reset_token(user.id, user.hashed_password)


def test_forgot_password_returns_204_for_known_address(client, auth_headers):
    response = client.post("/auth/forgot-password", json={"email": "test@example.com"})
    assert response.status_code == 204


def test_forgot_password_returns_204_for_unknown_address(client):
    # Must not reveal whether the account exists.
    response = client.post("/auth/forgot-password", json={"email": "nobody@example.com"})
    assert response.status_code == 204


def test_reset_password_sets_the_new_password(client, auth_headers):
    token = _reset_token_for(client)

    response = client.post(
        "/auth/reset-password", json={"token": token, "new_password": "brandnew123"}
    )
    assert response.status_code == 204

    old = client.post("/auth/login", data={"username": "test@example.com", "password": "secret123"})
    assert old.status_code == 401

    new = client.post(
        "/auth/login", data={"username": "test@example.com", "password": "brandnew123"}
    )
    assert new.status_code == 200


def test_reset_token_cannot_be_used_twice(client, auth_headers):
    token = _reset_token_for(client)

    first = client.post(
        "/auth/reset-password", json={"token": token, "new_password": "brandnew123"}
    )
    assert first.status_code == 204

    second = client.post(
        "/auth/reset-password", json={"token": token, "new_password": "another456"}
    )
    assert second.status_code == 400


def test_reset_password_rejects_garbage_token(client):
    response = client.post(
        "/auth/reset-password", json={"token": "not-a-jwt", "new_password": "brandnew123"}
    )
    assert response.status_code == 400


def test_reset_password_rejects_an_access_token(client, auth_headers):
    from app.database import get_db
    from app.main import app
    from app.models.user import User

    db = next(app.dependency_overrides[get_db]())
    user = db.query(User).filter(User.email == "test@example.com").first()

    response = client.post(
        "/auth/reset-password",
        json={"token": create_access_token(str(user.id)), "new_password": "brandnew123"},
    )
    assert response.status_code == 400


def test_access_token_endpoints_reject_a_reset_token(client, auth_headers):
    token = _reset_token_for(client)

    response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401


@pytest.mark.parametrize("weak", ["short1", "alllettersnodigit", "12345678"])
def test_reset_password_rejects_weak_password(client, auth_headers, weak):
    token = _reset_token_for(client)

    response = client.post("/auth/reset-password", json={"token": token, "new_password": weak})
    assert response.status_code == 422


def test_reset_token_is_invalid_after_the_password_changed_another_way(client, auth_headers):
    from app.database import get_db
    from app.main import app
    from app.models.user import User

    token = _reset_token_for(client)

    db = next(app.dependency_overrides[get_db]())
    user = db.query(User).filter(User.email == "test@example.com").first()
    user.hashed_password = hash_password("changedelsewhere1")
    db.commit()

    response = client.post(
        "/auth/reset-password", json={"token": token, "new_password": "brandnew123"}
    )
    assert response.status_code == 400
