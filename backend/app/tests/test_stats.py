from datetime import date


def _create_category(client, auth_headers, name="Food"):
    return client.post("/categories", json={"name": name}, headers=auth_headers).json()


def test_dashboard_reflects_current_month_expenses(client, auth_headers):
    category = _create_category(client, auth_headers)
    today = date.today().isoformat()

    client.post(
        "/expenses",
        json={"amount": "30.00", "description": "Lunch", "date": today, "category_id": category["id"]},
        headers=auth_headers,
    )

    response = client.get("/stats/dashboard", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["current_month_total"] == "30.00"
    assert body["current_month_count"] == 1
    assert body["top_categories"][0]["category_name"] == "Food"


def test_stats_by_category(client, auth_headers):
    category = _create_category(client, auth_headers)
    client.post(
        "/expenses",
        json={"amount": "20.00", "description": "A", "date": "2026-08-01", "category_id": category["id"]},
        headers=auth_headers,
    )
    client.post(
        "/expenses",
        json={"amount": "15.00", "description": "B", "date": "2026-08-02", "category_id": category["id"]},
        headers=auth_headers,
    )

    response = client.get("/stats/by-category", params={"month": 8, "year": 2026}, headers=auth_headers)
    assert response.status_code == 200
    assert response.json()[0]["total"] == "35.00"
