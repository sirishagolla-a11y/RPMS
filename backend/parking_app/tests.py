from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.utils import timezone
import datetime

from .models import Vehicle, ParkingSession, MonthlyPass, MonthlyPayment

class ParkingSystemTests(APITestCase):
    def setUp(self):
        # Create a vehicle with an active monthly pass
        self.monthly_vehicle = Vehicle.objects.create(
            vehicle_number="AP39AB1234",
            vehicle_type="Car",
            driver_name="John Doe",
            owner_name="John Doe",
            phone_number="9876543210",
            customer_type="monthly"
        )
        self.active_pass = MonthlyPass.objects.create(
            vehicle=self.monthly_vehicle,
            start_date=timezone.now().date() - datetime.timedelta(days=2),
            expiry_date=timezone.now().date() + datetime.timedelta(days=10),
            monthly_fee=300.00,
            status="ACTIVE",
            whatsapp_number="9876543210"
        )
        MonthlyPayment.objects.create(
            pass_record=self.active_pass,
            amount=300.00,
            payment_status="PAID",
            renewal_date=self.active_pass.expiry_date
        )

    def test_monthly_vehicle_entry(self):
        url = reverse("session-check-entry")
        data = {
            "vehicle_number": "AP39AB1234",
            "vehicle_type": "Car",
            "driver_name": "John Doe",
            "parking_slot": "A1"
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["is_monthly"])
        self.assertEqual(response.data["message"], "Monthly Pass Active")
        
        # Verify ParkingSession created
        session = ParkingSession.objects.get(receipt_number=response.data["session"]["receipt_number"])
        self.assertEqual(session.parking_fee, 0.00)
        self.assertEqual(session.payment_method, "FREE_MONTHLY")
        self.assertEqual(session.payment_status, "paid")

    def test_casual_vehicle_entry_and_exit(self):
        url = reverse("session-check-entry")
        data = {
            "vehicle_number": "MH12AB5678",
            "vehicle_type": "Car",
            "driver_name": "Casual Driver",
            "parking_slot": "B2"
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertFalse(response.data["is_monthly"])
        
        session_id = response.data["session"]["id"]
        
        # Now exit / release casual vehicle
        release_url = reverse("session-release", args=[session_id])
        release_response = self.client.post(release_url, {"payment_method": "UPI"}, format="json")
        self.assertEqual(release_response.status_code, status.HTTP_200_OK)
        self.assertEqual(release_response.data["status"], "released")
        self.assertEqual(float(release_response.data["parking_fee"]), 30.00) # 1 hour rate for Car is 30
        self.assertEqual(release_response.data["payment_method"], "UPI")

    def test_dashboard_stats(self):
        url = reverse("dashboard-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("currently_parked", response.data)
        self.assertIn("monthly_stats", response.data)
        self.assertEqual(response.data["monthly_stats"]["active_customers"], 1)

    def test_ai_check(self):
        url = reverse("session-ai-check")
        
        # Test active monthly member plate
        response = self.client.post(url, {"vehicle_number": "AP39AB1234"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["is_monthly"])
        self.assertEqual(response.data["message"], "Monthly Pass Active")
        
        # Test casual vehicle plate
        response_casual = self.client.post(url, {"vehicle_number": "KA01ZZ9999"}, format="json")
        self.assertEqual(response_casual.status_code, status.HTTP_200_OK)
        self.assertFalse(response_casual.data["is_monthly"])
