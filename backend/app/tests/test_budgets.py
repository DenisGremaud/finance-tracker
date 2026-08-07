def _create_category(client, auth_headers, name="Food"):
    return client.post("/categories", json={"name": name}, headers=auth_headers).json()


def test_create_budget_and_status(client, auth_headers):
    category = _create_category(client, auth_headers)

    budget = client.post(
        "/budgets",
        json={"category_id": category["id"], "month": 8, "year": 2026, "amount": "200.00"},
        headers=auth_headers,
    )
    assert budget.status_code == 201

    client.post(
        "/expenses",
        json={"amount": "250.00", "description": "Big shop", "date": "2026-08-05", "category_id": category["id"]},
        headers=auth_headers,
    )

    status_response = client.get("/budgets/status", params={"month": 8, "year": 2026}, headers=auth_headers)
    assert status_response.status_code == 200
    status = status_response.json()[0]
    assert status["spent"] == "250.00"
    assert status["is_over"] is True


def test_duplicate_budget_rejected(client, auth_headers):
    category = _create_category(client, auth_headers)
    payload = {"category_id": category["id"], "month": 8, "year": 2026, "amount": "100.00"}
    client.post("/budgets", json=payload, headers=auth_headers)
    response = client.post("/budgets", json=payload, headers=auth_headers)
    assert response.status_code == 400
