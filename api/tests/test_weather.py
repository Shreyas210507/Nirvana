"""Automated Test Suite for Nirvana Weather API & Geolocation Integration.
Verifies coordinate validation, bounds checking, Open-Meteo response normalization,
TTL caching, multiple distinct locations, and geocoding proxy.
"""

import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.routers.weather import WMO_CODE_MAP, WEATHER_CACHE


class TestWeatherAndGeolocation(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def setUp(self):
        # Clear in-memory server cache before each test
        WEATHER_CACHE.clear()

    def test_01_reject_latitude_out_of_bounds_high(self):
        """Latitude > 90 must return 400 Bad Request."""
        res = self.client.get("/api/weather?lat=95.5&lng=78.4")
        self.assertEqual(res.status_code, 400)
        data = res.json()
        self.assertIn("detail", data)
        self.assertIn("out of bounds (-90 to 90)", data["detail"])

    def test_02_reject_latitude_out_of_bounds_low(self):
        """Latitude < -90 must return 400 Bad Request."""
        res = self.client.get("/api/weather?lat=-92.0&lng=78.4")
        self.assertEqual(res.status_code, 400)
        self.assertIn("out of bounds (-90 to 90)", res.json()["detail"])

    def test_03_reject_longitude_out_of_bounds_high(self):
        """Longitude > 180 must return 400 Bad Request."""
        res = self.client.get("/api/weather?lat=17.38&lng=185.0")
        self.assertEqual(res.status_code, 400)
        self.assertIn("out of bounds (-180 to 180)", res.json()["detail"])

    def test_04_reject_longitude_out_of_bounds_low(self):
        """Longitude < -180 must return 400 Bad Request."""
        res = self.client.get("/api/weather?lat=17.38&lng=-185.0")
        self.assertEqual(res.status_code, 400)
        self.assertIn("out of bounds (-180 to 180)", res.json()["detail"])

    def test_05_reject_missing_or_invalid_coordinates(self):
        """Non-numeric coordinates must return 422 Unprocessable Entity."""
        res = self.client.get("/api/weather?lat=invalid&lng=78.4")
        self.assertEqual(res.status_code, 422)

    def test_06_live_weather_retrieval_hyderabad(self):
        """Fetch live Open-Meteo weather for Hyderabad coordinates."""
        res = self.client.get("/api/weather?lat=17.385&lng=78.4867")
        self.assertEqual(res.status_code, 200)
        data = res.json()

        # Provenance & status flags
        self.assertIn("source", data)
        self.assertIn("Open-Meteo", data["source"])
        self.assertFalse(data.get("is_mock", True))
        self.assertFalse(data.get("is_stale", True))
        self.assertIsNotNone(data.get("last_updated"))

        # Current conditions structure
        current = data.get("current")
        self.assertIsNotNone(current)
        self.assertIsInstance(current["temperature"], (int, float))
        self.assertIsInstance(current["humidity"], (int, float))
        self.assertIsInstance(current["rainfall"], (int, float))
        self.assertIsInstance(current["wind_speed"], (int, float))
        self.assertIsInstance(current["weather_code"], int)
        self.assertIsInstance(current["condition"], str)
        self.assertGreater(len(current["condition"]), 0)

        # Hourly forecast structure (up to 72 hours)
        hourly = data.get("hourly", [])
        self.assertGreaterEqual(len(hourly), 24)
        first_hour = hourly[0]
        self.assertIn("time", first_hour)
        self.assertIn("temperature", first_hour)
        self.assertIn("rainfall", first_hour)

        # Daily forecast structure (up to 7 days)
        daily = data.get("daily", [])
        self.assertGreaterEqual(len(daily), 3)
        first_day = daily[0]
        self.assertIn("date", first_day)
        self.assertIn("max_temp", first_day)
        self.assertIn("min_temp", first_day)

    def test_07_weather_caching_returns_fast_second_response(self):
        """Consecutive requests for the exact same coordinates should use server-side cache."""
        res1 = self.client.get("/api/weather?lat=17.385&lng=78.4867")
        self.assertEqual(res1.status_code, 200)
        data1 = res1.json()

        # Cache key should be present in WEATHER_CACHE
        self.assertEqual(len(WEATHER_CACHE), 1)

        # Second request
        res2 = self.client.get("/api/weather?lat=17.385&lng=78.4867")
        self.assertEqual(res2.status_code, 200)
        data2 = res2.json()

        self.assertEqual(data1["current"]["temperature"], data2["current"]["temperature"])
        self.assertEqual(data1["current"]["observation_time"], data2["current"]["observation_time"])

    def test_08_multiple_distinct_locations_have_distinct_weather(self):
        """Hyderabad (17.385, 78.4867) and Mumbai (19.076, 72.8777) must retrieve independent data."""
        res_hyd = self.client.get("/api/weather?lat=17.385&lng=78.4867")
        self.assertEqual(res_hyd.status_code, 200)
        hyd_data = res_hyd.json()

        res_mum = self.client.get("/api/weather?lat=19.076&lng=72.8777")
        self.assertEqual(res_mum.status_code, 200)
        mum_data = res_mum.json()

        # Both locations should be in cache as distinct keys
        self.assertEqual(len(WEATHER_CACHE), 2)
        self.assertIsNotNone(hyd_data["current"]["temperature"])
        self.assertIsNotNone(mum_data["current"]["temperature"])

    def test_09_geocode_endpoint_resolves_valid_city(self):
        """The geocode proxy endpoint should return coordinates for real city search."""
        res = self.client.get("/api/weather/geocode?query=Hyderabad")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("results", data)
        results = data["results"]
        self.assertIsInstance(results, list)
        self.assertGreater(len(results), 0)

        top = results[0]
        self.assertIn("name", top)
        self.assertIn("latitude", top)
        self.assertIn("longitude", top)
        # Hyderabad latitude ~ 17.38
        self.assertAlmostEqual(top["latitude"], 17.385, delta=0.5)

    def test_10_geocode_endpoint_handles_empty_query(self):
        """Query with less than 2 characters should trigger 422 Unprocessable Entity."""
        res = self.client.get("/api/weather/geocode?query=a")
        self.assertEqual(res.status_code, 422)

    def test_11_wmo_code_coverage(self):
        """WMO code table must cover standard weather codes without missing descriptions."""
        standard_codes = [0, 1, 2, 3, 45, 51, 61, 63, 65, 80, 95]
        for code in standard_codes:
            self.assertIn(code, WMO_CODE_MAP)
            self.assertIsInstance(WMO_CODE_MAP[code], str)
            self.assertGreater(len(WMO_CODE_MAP[code]), 0)


if __name__ == "__main__":
    unittest.main()
