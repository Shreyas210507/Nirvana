"""Comprehensive Automated Test Suite for Nirvana Authentication System.
Tests password hashing (bcrypt), JWT generation, route protection, brute-force
mitigation, registration, duplicate checks, profile updates, and password resets.
"""

import unittest
import uuid
from fastapi.testclient import TestClient
from app.main import app
from app.database import get_db, get_user_by_email
from app.auth import verify_password, FAILED_ATTEMPTS


class TestAuthenticationSystem(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def setUp(self):
        # Reset brute-force tracking and cookie jar between tests
        FAILED_ATTEMPTS.clear()
        self.client.cookies.clear()

    def test_01_seed_users_exist_and_passwords_are_bcrypt_hashed(self):
        """Verify baseline seed accounts exist and passwords are not stored in plaintext."""
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT email, hashed_password FROM users WHERE email IN ('citizen@nirvana.in', 'municipal@ghmc.gov.in')")
        rows = cursor.fetchall()
        conn.close()

        self.assertGreaterEqual(len(rows), 2)
        for row in rows:
            hashed = row["hashed_password"]
            # Bcrypt hashes start with $2a$ or $2b$
            self.assertTrue(hashed.startswith("$2b$") or hashed.startswith("$2a$"), f"Password for {row['email']} is not bcrypt hashed!")
            self.assertNotEqual(hashed, "CitizenSafe2026!")
            self.assertNotEqual(hashed, "NirvanaCommand2026!")

    def test_02_successful_citizen_login(self):
        """Test valid citizen credentials issue access and refresh tokens."""
        response = self.client.post("/api/auth/login", json={
            "email": "citizen@nirvana.in",
            "password": "CitizenSafe2026!",
            "remember_me": True,
        })
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("access_token", data)
        self.assertIn("refresh_token", data)
        self.assertEqual(data["user"]["email"], "citizen@nirvana.in")
        self.assertEqual(data["user"]["role"], "citizen")

    def test_03_successful_municipal_login(self):
        """Test valid municipal officer credentials."""
        response = self.client.post("/api/auth/login", json={
            "email": "municipal@ghmc.gov.in",
            "password": "NirvanaCommand2026!",
        })
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["user"]["role"], "municipal")

    def test_04_failed_login_with_incorrect_password(self):
        """Test incorrect password returns 401 Unauthorized without leaking sensitive info."""
        response = self.client.post("/api/auth/login", json={
            "email": "citizen@nirvana.in",
            "password": "WrongPassword123!",
        })
        self.assertEqual(response.status_code, 401)
        self.assertIn("Invalid email or password", response.json()["detail"])

    def test_05_failed_login_with_nonexistent_email(self):
        """Test non-existent user returns 401 with identical generic message (anti-enumeration)."""
        response = self.client.post("/api/auth/login", json={
            "email": "ghost_user_999@nirvana.in",
            "password": "SomePassword123!",
        })
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()["detail"], "Invalid email or password.")

    def test_06_brute_force_lockout_after_repeated_failures(self):
        """Test brute-force protection locks out account after 5 failed attempts."""
        test_email = "brute_target@example.com"
        for i in range(5):
            res = self.client.post("/api/auth/login", json={
                "email": test_email,
                "password": f"WrongAttempt{i}!",
            })
            self.assertEqual(res.status_code, 401)

        # 6th attempt must trigger 429 Too Many Requests
        lockout_res = self.client.post("/api/auth/login", json={
            "email": test_email,
            "password": "AnotherWrongAttempt!",
        })
        self.assertEqual(lockout_res.status_code, 429)
        self.assertIn("temporarily locked", lockout_res.json()["detail"])

    def test_07_user_registration_success(self):
        """Test complete user registration with real password hashing."""
        unique_email = f"user_{uuid.uuid4().hex[:8]}@example.com"
        password = "SecurePassword2026!"

        response = self.client.post("/api/auth/register", json={
            "email": unique_email,
            "password": password,
            "confirm_password": password,
            "full_name": "Aarav Sharma",
            "phone": "+91-9876500001",
            "role": "citizen",
            "ward_id": "w-002",
            "terms_agreed": True,
        })
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertIn("access_token", data)
        self.assertEqual(data["user"]["email"], unique_email)

        # Verify password is encrypted in database
        db_user = get_user_by_email(unique_email)
        self.assertIsNotNone(db_user)
        self.assertNotEqual(db_user["hashed_password"], password)
        self.assertTrue(verify_password(password, db_user["hashed_password"]))

    def test_08_registration_rejects_duplicate_email(self):
        """Test registration prevents duplicate email with 409 Conflict."""
        existing_email = "citizen@nirvana.in"
        response = self.client.post("/api/auth/register", json={
            "email": existing_email,
            "password": "SomeValidPassword123!",
            "confirm_password": "SomeValidPassword123!",
            "full_name": "Duplicate Tester",
            "terms_agreed": True,
        })
        self.assertEqual(response.status_code, 409)
        self.assertIn("already exists", response.json()["detail"])

    def test_09_registration_rejects_weak_passwords(self):
        """Test registration enforces strong password policy."""
        # Missing uppercase and special char
        weak_passwords = [
            ("short1!", "Password must be at least 8 characters long."),
            ("nouppercase1!", "Password must contain at least one uppercase letter."),
            ("NOLOWERCASE1!", "Password must contain at least one lowercase letter."),
            ("NoNumberHere!", "Password must contain at least one number."),
            ("NoSpecialChar12", "Password must contain at least one special character"),
        ]

        for pwd, expected_err in weak_passwords:
            res = self.client.post("/api/auth/register", json={
                "email": f"weak_{uuid.uuid4().hex[:6]}@example.com",
                "password": pwd,
                "confirm_password": pwd,
                "full_name": "Weak Tester",
                "terms_agreed": True,
            })
            self.assertEqual(res.status_code, 400)
            self.assertTrue(any(expected_err.lower() in res.json()["detail"].lower() for _ in [1]))

    def test_10_registration_rejects_mismatched_passwords(self):
        """Test registration fails when password and confirm_password do not match."""
        res = self.client.post("/api/auth/register", json={
            "email": f"mismatch_{uuid.uuid4().hex[:6]}@example.com",
            "password": "Password123!",
            "confirm_password": "DifferentPassword123!",
            "full_name": "Mismatch Tester",
            "terms_agreed": True,
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn("Passwords do not match", res.json()["detail"])

    def test_11_registration_requires_terms_agreement(self):
        """Test registration requires terms agreement."""
        res = self.client.post("/api/auth/register", json={
            "email": f"noterms_{uuid.uuid4().hex[:6]}@example.com",
            "password": "Password123!",
            "confirm_password": "Password123!",
            "full_name": "No Terms Tester",
            "terms_agreed": False,
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn("Terms of Service", res.json()["detail"])

    def test_12_me_endpoint_requires_authentication(self):
        """Test /api/auth/me rejects unauthenticated requests."""
        res = self.client.get("/api/auth/me")
        self.assertEqual(res.status_code, 401)

    def test_13_me_endpoint_with_valid_bearer_token(self):
        """Test /api/auth/me returns profile for authenticated user."""
        login_res = self.client.post("/api/auth/login", json={
            "email": "citizen@nirvana.in",
            "password": "CitizenSafe2026!",
        })
        token = login_res.json()["access_token"]

        me_res = self.client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(me_res.status_code, 200)
        self.assertEqual(me_res.json()["email"], "citizen@nirvana.in")

    def test_14_forgot_password_and_reset_flow(self):
        """Test complete tokenized forgot password & reset flow."""
        target_email = "citizen@nirvana.in"
        forgot_res = self.client.post("/api/auth/forgot-password", json={"email": target_email})
        self.assertEqual(forgot_res.status_code, 200)
        token = forgot_res.json().get("dev_reset_token")
        self.assertIsNotNone(token)

        # Reset password using token
        new_pwd = "BrandNewSafe2026!"
        reset_res = self.client.post("/api/auth/reset-password", json={
            "token": token,
            "new_password": new_pwd,
            "confirm_password": new_pwd,
        })
        self.assertEqual(reset_res.status_code, 200)

        # Login with new password must succeed
        new_login = self.client.post("/api/auth/login", json={
            "email": target_email,
            "password": new_pwd,
        })
        self.assertEqual(new_login.status_code, 200)

        # Reusing the token must fail (single-use protection)
        reuse_res = self.client.post("/api/auth/reset-password", json={
            "token": token,
            "new_password": "AnotherPassword2026!",
            "confirm_password": "AnotherPassword2026!",
        })
        self.assertEqual(reuse_res.status_code, 400)
        self.assertIn("already been used", reuse_res.json()["detail"])

        # Reset back to original password for subsequent tests
        back_res = self.client.post("/api/auth/forgot-password", json={"email": target_email})
        back_token = back_res.json().get("dev_reset_token")
        self.client.post("/api/auth/reset-password", json={
            "token": back_token,
            "new_password": "CitizenSafe2026!",
            "confirm_password": "CitizenSafe2026!",
        })

    def test_15_profile_update_persists_in_database(self):
        """Test profile updating via authenticated PUT /api/auth/profile."""
        login_res = self.client.post("/api/auth/login", json={
            "email": "citizen@nirvana.in",
            "password": "CitizenSafe2026!",
        })
        token = login_res.json()["access_token"]

        updated_name = "Rahul K. Verma"
        updated_phone = "+91-9999988888"
        update_res = self.client.put(
            "/api/auth/profile",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "full_name": updated_name,
                "phone": updated_phone,
                "ward_id": "w-005",
            }
        )
        self.assertEqual(update_res.status_code, 200)
        self.assertEqual(update_res.json()["full_name"], updated_name)

        # Verify persisted in SQLite
        db_user = get_user_by_email("citizen@nirvana.in")
        self.assertEqual(db_user["full_name"], updated_name)
        self.assertEqual(db_user["phone"], updated_phone)


if __name__ == "__main__":
    unittest.main()
