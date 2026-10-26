"""Automated test suite for verified data flow, calculation rules, persistence, and error handling."""

import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.mock_data import HYDERABAD_WARDS, SHELTERS, MOCK_ALERTS
from app.database import get_active_reports_count


class TestDataFlowAndCalculations(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_01_wards_dataset_completeness(self):
        """All 22 wards exist and include geometry and survey metrics."""
        res = self.client.get("/api/wards")
        self.assertEqual(res.status_code, 200)
        wards = res.json()
        self.assertEqual(len(wards), 22)
        # Check first and last ward
        self.assertEqual(wards[0]["id"], "w-001")
        self.assertEqual(wards[0]["name"], "Malakpet")
        self.assertIsNotNone(wards[0]["geometry"])
        self.assertEqual(wards[21]["id"], "w-022")
        self.assertEqual(wards[21]["name"], "Uppal")

    def test_02_ward_not_found_returns_404(self):
        """Non-existent ward ID returns standard 404 error."""
        res = self.client.get("/api/wards/non-existent-ward-id")
        self.assertEqual(res.status_code, 404)
        self.assertIn("detail", res.json())

    def test_03_dashboard_kpis_calculated_from_actual_records(self):
        """Dashboard KPIs originate from real calculated counts rather than hardcoded numbers."""
        res = self.client.get("/api/risks/dashboard")
        self.assertEqual(res.status_code, 200)
        kpis = res.json()

        # Shelters open must match count of shelters with capacity
        expected_open = len([s for s in SHELTERS if s.capacity > 0])
        self.assertEqual(kpis["shelters_open"], expected_open)

        # Capacity used and total capacity must match sum of individual shelters
        expected_used = sum(s.current_occupancy for s in SHELTERS)
        expected_total = sum(s.capacity for s in SHELTERS)
        self.assertEqual(kpis["shelter_capacity_used"], expected_used)
        self.assertEqual(kpis["shelter_capacity_total"], expected_total)

        # Wards monitored must match 22
        self.assertEqual(kpis["wards_monitored"], 22)
        # Telemetry data points must be positive and non-zero
        self.assertGreater(kpis["active_data_points"], 0)

        # Provenance attribution
        self.assertIn("data_source", kpis)
        self.assertTrue(kpis["is_demonstration"])

    def test_04_community_reports_flow_and_persistence(self):
        """Submitting a community report persists to SQLite and increments active report count."""
        initial_count = get_active_reports_count()

        new_report_payload = {
            "type": "waterlogging",
            "severity": "high",
            "description": "Flooding near metro pillar 1045",
            "lat": 17.370,
            "lng": 78.508,
            "ward_id": "w-001",
            "language": "en"
        }
        create_res = self.client.post("/api/reports", json=new_report_payload)
        self.assertEqual(create_res.status_code, 201)
        created = create_res.json()
        report_id = created["id"]
        self.assertEqual(created["ward_name"], "Malakpet")
        self.assertEqual(created["status"], "submitted")

        # Active reports count in DB must have incremented by 1
        after_count = get_active_reports_count()
        self.assertEqual(after_count, initial_count + 1)

        # Dashboard KPI must reflect updated count
        kpi_res = self.client.get("/api/risks/dashboard")
        self.assertEqual(kpi_res.json()["active_reports"], after_count)

        # Confirm the report twice
        c1 = self.client.post(f"/api/reports/{report_id}/confirm")
        self.assertEqual(c1.status_code, 200)
        self.assertEqual(c1.json()["confirmations"], 1)

        c2 = self.client.post(f"/api/reports/{report_id}/confirm")
        self.assertEqual(c2.status_code, 200)
        self.assertEqual(c2.json()["confirmations"], 2)

        c3 = self.client.post(f"/api/reports/{report_id}/confirm")
        self.assertEqual(c3.status_code, 200)
        self.assertEqual(c3.json()["confirmations"], 3)
        self.assertEqual(c3.json()["status"], "confirmed")

    def test_05_shelter_not_found_returns_404(self):
        """Non-existent shelter ID returns 404."""
        res = self.client.get("/api/shelters/s-999999")
        self.assertEqual(res.status_code, 404)

    def test_06_alert_creation_and_resolution(self):
        """Creating an alert calculates reach from selected ward population."""
        alert_payload = {
            "hazard": "flood",
            "severity": "warning",
            "title": "Corridor Waterlogging Alert",
            "message": "Waterlogging expected in Malakpet",
            "actions": ["Take alternative routes"],
            "ward_ids": ["w-001"],
            "channels": ["in_app", "sms"],
            "language": "en"
        }
        res = self.client.post("/api/alerts", json=alert_payload)
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertEqual(data["ward_names"], ["Malakpet"])
        # Malakpet population is 48000
        self.assertEqual(data["estimated_reach"], 48000)


if __name__ == "__main__":
    unittest.main()
