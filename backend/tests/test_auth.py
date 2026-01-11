
import unittest
import sys
sys.path.append("/home/ubuntu/backup-voucher-system/backend/src")
from main import app, db, User
from werkzeug.security import generate_password_hash

class AuthTestCase(unittest.TestCase):
    def setUp(self):
        app.config["TESTING"] = True
        app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
        self.client = app.test_client()
        with app.app_context():
            db.create_all()
            vendor = User(email="vendor@example.com", password_hash=generate_password_hash("password"), first_name="Vendor", last_name="User", user_type="vendor")
            db.session.add(vendor)
            db.session.commit()

    def tearDown(self):
        with app.app_context():
            db.session.remove()
            db.drop_all()

    def test_login(self):
        with self.client:
            response = self.client.post('/api/login', json={'email': 'vendor@example.com', 'password': 'password'})
            self.assertEqual(response.status_code, 200)
            # Check if user_id is in session
            with self.client.session_transaction() as sess:
                self.assertIn('user_id', sess)

if __name__ == "__main__":
    unittest.main()

