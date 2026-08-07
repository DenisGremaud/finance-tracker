def _create_category(client, auth_headers, name="Food"):
    return client.post("/categories", json={"name": name}, headers=auth_headers).json()


def test_create_and_list_expenses(client, auth_headers):
    category = _create_category(client, auth_headers)

    response = client.post(
        "/expenses",
        json={"amount": "25.50", "description": "Groceries", "date": "2026-08-05", "category_id": category["id"]},
        headers=auth_headers,
    )
    assert response.status_code == 201
    assert response.json()["amount"] == "25.50"

    listing = client.get("/expenses", headers=auth_headers)
    assert listing.status_code == 200
    assert len(listing.json()) == 1


def test_create_expense_with_invalid_category_fails(client, auth_headers):
    response = client.post(
        "/expenses",
        json={"amount": "10.00", "description": "Bad", "date": "2026-08-05", "category_id": 999},
        headers=auth_headers,
    )
    assert response.status_code == 400


def test_update_and_delete_expense(client, auth_headers):
    created = client.post(
        "/expenses",
        json={"amount": "10.00", "description": "Coffee", "date": "2026-08-01"},
        headers=auth_headers,
    ).json()

    updated = client.put(
        f"/expenses/{created['id']}", json={"amount": "12.00"}, headers=auth_headers
    )
    assert updated.status_code == 200
    assert updated.json()["amount"] == "12.00"

    deleted = client.delete(f"/expenses/{created['id']}", headers=auth_headers)
    assert deleted.status_code == 204

    missing = client.get(f"/expenses/{created['id']}", headers=auth_headers)
    assert missing.status_code == 404


def test_filter_expenses_by_date_range(client, auth_headers):
    client.post(
        "/expenses", json={"amount": "5.00", "description": "A", "date": "2026-01-10"}, headers=auth_headers
    )
    client.post(
        "/expenses", json={"amount": "5.00", "description": "B", "date": "2026-08-10"}, headers=auth_headers
    )

    response = client.get(
        "/expenses", params={"date_from": "2026-08-01", "date_to": "2026-08-31"}, headers=auth_headers
    )
    assert len(response.json()) == 1
    assert response.json()[0]["description"] == "B"
