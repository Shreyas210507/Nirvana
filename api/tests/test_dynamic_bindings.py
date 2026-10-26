"""Unit tests for dynamic risk evaluation, nearest emergency shelters, and alert filtering."""

import unittest
from fastapi.testclient import TestClient
from app.main import app


class TestDynamicBindings(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_01_evaluate_risk_low_rain(self):
        """Evaluating risk with 0mm rainfall produces low/moderate rainfall factor."""
        res = self.client.get("/api/risks/evaluate?lat=17.385&lng=78.4867&rainfall_mm=0.0&temp=30.0&heat_index=32.0")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("flood", data)
        self.assertIn("heat", data)
        self.assertIn("factors", data["flood"])
        factor_names = [f["name"] for f in data["flood"]["factors"]]
        self.assertIn("Rainfall Forecast", factor_names)
        self.assertIn("Elevation", factor_names)
        self.assertIn("Drainage", factor_names)

    def test_02_evaluate_risk_heavy_rain(self):
        """Evaluating risk with 70mm rainfall produces higher flood score than 0mm."""
        res_low = self.client.get("/api/risks/evaluate?lat=17.385&lng=78.4867&rainfall_mm=5.0&temp=28.0")
        res_high = self.client.get("/api/risks/evaluate?lat=17.385&lng=78.4867&rainfall_mm=80.0&temp=28.0")
        self.assertEqual(res_low.status_code, 200)
        self.assertEqual(res_high.status_code, 200)

        score_low = res_low.json()["flood"]["score"]
        score_high = res_high.json()["flood"]["score"]
        self.assertGreater(score_high, score_low)

    def test_03_evaluate_risk_heatwave(self):
        """Evaluating risk with 44C temp and 48C heat index produces high/severe heat score."""
        res_mild = self.client.get("/api/risks/evaluate?lat=17.385&lng=78.4867&temp=28.0&heat_index=29.0")
        res_hot = self.client.get("/api/risks/evaluate?lat=17.385&lng=78.4867&temp=44.0&heat_index=49.0")
        self.assertEqual(res_mild.status_code, 200)
        self.assertEqual(res_hot.status_code, 200)

        self.assertGreater(res_hot.json()["heat"]["score"], res_mild.json()["heat"]["score"])

    def test_04_nearest_shelter_distance_calculation(self):
        """Querying /api/shelters/nearest with coordinates calculates distance and walking time."""
        res = self.client.get("/api/shelters/nearest?lat=17.370&lng=78.508&verified_only=true")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("id", data)
        self.assertIn("distance", data)
        self.assertIn("walking_time", data)
        self.assertIn("capacity", data)
        self.assertGreaterEqual(data["distance"], 0)
        self.assertGreaterEqual(data["walking_time"], 1)

    def test_05_shelters_list_sorted_by_distance(self):
        """Querying /api/shelters with user lat/lng returns shelters sorted by proximity."""
        res = self.client.get("/api/shelters?lat=17.370&lng=78.508")
        self.assertEqual(res.status_code, 200)
        shelters = res.json()
        self.assertGreater(len(shelters), 1)
        distances = [s["distance"] for s in shelters if s.get("distance") is not None]
        self.assertEqual(distances, sorted(distances))


if __name__ == "__main__":
    unittest.main()
