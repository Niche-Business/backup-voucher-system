'''
import unittest
import sys
sys.path.append("/home/ubuntu/backup-voucher-system/backend/src")
from main import app, db, Voucher, User
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash

class VoucherRedemptionTestCase(unittest.TestCase):
    def setUp(self):
        app.config["TESTING"] = True
        app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
        self.client = app.test_client()
        with app.app_context():
            db.create_all()

    def tearDown(self):
        with app.app_context():
            db.session.remove()
            db.drop_all()

    def test_partial_redemption(self):
        with app.app_context():
            user = User(email="test@example.com", password_hash=generate_password_hash("password"), first_name="Test", last_name="User", user_type="recipient")
            issuer = User(email="issuer@example.com", password_hash=generate_password_hash("password"), first_name="Issuer", last_name="User", user_type="admin")
            vendor = User(email="vendor@example.com", password_hash=generate_password_hash("password"), first_name="Vendor", last_name="User", user_type="vendor")
            db.session.add_all([user, issuer, vendor])
            db.session.commit()

            voucher = Voucher(code="TESTVOUCHER", value=100.00, recipient_id=user.id, issued_by=issuer.id, expiry_date=datetime.now().date() + timedelta(days=30))
            db.session.add(voucher)
            db.session.commit()

            with self.client.session_transaction() as sess:
                sess['user_id'] = vendor.id

            response = self.client.post("/api/vendor/redeem-voucher", json={"code": "TESTVOUCHER", "amount": 50.00})
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json["remaining_balance"], 50.00)

            voucher = Voucher.query.filter_by(code="TESTVOUCHER").first()
            self.assertEqual(voucher.value, 50.00)
            self.assertEqual(voucher.status, "active")

    def test_full_redemption(self):
        with app.app_context():
            user = User(email="test@example.com", password_hash=generate_password_hash("password"), first_name="Test", last_name="User", user_type="recipient")
            issuer = User(email="issuer@example.com", password_hash=generate_password_hash("password"), first_name="Issuer", last_name="User", user_type="admin")
            vendor = User(email="vendor@example.com", password_hash=generate_password_hash("password"), first_name="Vendor", last_name="User", user_type="vendor")
            db.session.add_all([user, issuer, vendor])
            db.session.commit()

            voucher = Voucher(code="TESTVOUCHER", value=100.00, recipient_id=user.id, issued_by=issuer.id, expiry_date=datetime.now().date() + timedelta(days=30))
            db.session.add(voucher)
            db.session.commit()

            with self.client.session_transaction() as sess:
                sess['user_id'] = vendor.id

            response = self.client.post("/api/vendor/redeem-voucher", json={"code": "TESTVOUCHER", "amount": 100.00})
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json["remaining_balance"], 0.00)

            voucher = Voucher.query.filter_by(code="TESTVOUCHER").first()
            self.assertEqual(voucher.value, 0.00)
            self.assertEqual(voucher.status, "redeemed")

    def test_multiple_partial_redemptions(self):
        with app.app_context():
            user = User(email="test@example.com", password_hash=generate_password_hash("password"), first_name="Test", last_name="User", user_type="recipient")
            issuer = User(email="issuer@example.com", password_hash=generate_password_hash("password"), first_name="Issuer", last_name="User", user_type="admin")
            vendor = User(email="vendor@example.com", password_hash=generate_password_hash("password"), first_name="Vendor", last_name="User", user_type="vendor")
            db.session.add_all([user, issuer, vendor])
            db.session.commit()

            voucher = Voucher(code="TESTVOUCHER", value=100.00, recipient_id=user.id, issued_by=issuer.id, expiry_date=datetime.now().date() + timedelta(days=30))
            db.session.add(voucher)
            db.session.commit()

            with self.client.session_transaction() as sess:
                sess['user_id'] = vendor.id

            self.client.post("/api/vendor/redeem-voucher", json={"code": "TESTVOUCHER", "amount": 30.00})
            self.client.post("/api/vendor/redeem-voucher", json={"code": "TESTVOUCHER", "amount": 40.00})
            response = self.client.post("/api/vendor/redeem-voucher", json={"code": "TESTVOUCHER", "amount": 30.00})
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json["remaining_balance"], 0.00)

            voucher = Voucher.query.filter_by(code="TESTVOUCHER").first()
            self.assertEqual(voucher.value, 0.00)
            self.assertEqual(voucher.status, "redeemed")

    def test_redeem_with_invalid_amount(self):
        with app.app_context():
            user = User(email="test@example.com", password_hash=generate_password_hash("password"), first_name="Test", last_name="User", user_type="recipient")
            issuer = User(email="issuer@example.com", password_hash=generate_password_hash("password"), first_name="Issuer", last_name="User", user_type="admin")
            vendor = User(email="vendor@example.com", password_hash=generate_password_hash("password"), first_name="Vendor", last_name="User", user_type="vendor")
            db.session.add_all([user, issuer, vendor])
            db.session.commit()

            voucher = Voucher(code="TESTVOUCHER", value=100.00, recipient_id=user.id, issued_by=issuer.id, expiry_date=datetime.now().date() + timedelta(days=30))
            db.session.add(voucher)
            db.session.commit()

            with self.client.session_transaction() as sess:
                sess['user_id'] = vendor.id

            response = self.client.post("/api/vendor/redeem-voucher", json={"code": "TESTVOUCHER", "amount": 0})
            self.assertEqual(response.status_code, 400)

            response = self.client.post("/api/vendor/redeem-voucher", json={"code": "TESTVOUCHER", "amount": -50})
            self.assertEqual(response.status_code, 400)

            response = self.client.post("/api/vendor/redeem-voucher", json={"code": "TESTVOUCHER", "amount": 150})
            self.assertEqual(response.status_code, 400)

    def test_redeem_fully_redeemed_voucher(self):
        with app.app_context():
            user = User(email="test@example.com", password_hash=generate_password_hash("password"), first_name="Test", last_name="User", user_type="recipient")
            issuer = User(email="issuer@example.com", password_hash=generate_password_hash("password"), first_name="Issuer", last_name="User", user_type="admin")
            vendor = User(email="vendor@example.com", password_hash=generate_password_hash("password"), first_name="Vendor", last_name="User", user_type="vendor")
            db.session.add_all([user, issuer, vendor])
            db.session.commit()

            voucher = Voucher(code="TESTVOUCHER", value=0.00, status="redeemed", recipient_id=user.id, issued_by=issuer.id, expiry_date=datetime.now().date() + timedelta(days=30))
            db.session.add(voucher)
            db.session.commit()

            with self.client.session_transaction() as sess:
                sess['user_id'] = vendor.id

            response = self.client.post("/api/vendor/redeem-voucher", json={"code": "TESTVOUCHER", "amount": 10.00})
            self.assertEqual(response.status_code, 400)

if __name__ == "__main__":
    unittest.main()
'''
