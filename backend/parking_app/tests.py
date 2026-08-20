from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.utils import timezone
from django.contrib.auth import get_user_model
import datetime
from .models import VehicleRate, Shift, ParkingRecord, Customer, MonthlySubscription


class AuthenticationAuthorizationTests(APITestCase):
    def setUp(self):
        self.bike_rate = VehicleRate.objects.get(vehicle_type='BIKE')
        self.car_rate = VehicleRate.objects.get(vehicle_type='CAR')
        self.User = get_user_model()

    def test_admin_login_returns_tokens_and_role(self):
        self.User.objects.create_user(username='adminuser', password='AdminPass123', role='ADMIN')

        response = self.client.post(reverse('login'), {
            'username': 'adminuser',
            'password': 'AdminPass123',
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access_token', response.data)
        self.assertIn('refresh_token', response.data)
        self.assertEqual(response.data['user_role'], 'ADMIN')
        self.assertEqual(response.data['username'], 'adminuser')

    def test_operator_login_returns_tokens_and_role(self):
        self.User.objects.create_user(username='operatoruser', password='OperatorPass123', role='OPERATOR')

        response = self.client.post(reverse('login'), {
            'username': 'operatoruser',
            'password': 'OperatorPass123',
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user_role'], 'OPERATOR')
        self.assertEqual(response.data['username'], 'operatoruser')

    def test_unauthorized_access_is_rejected(self):
        response = self.client.post(reverse('record_entry'), {
            'vehicle_number': 'KA-99-ZZ-9999',
            'vehicle_type': self.bike_rate.id,
        })

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_operator_can_record_entry_and_release_after_login(self):
        self.User.objects.create_user(username='opentry', password='OpPass123', role='OPERATOR')
        login_response = self.client.post(reverse('login'), {'username': 'opentry', 'password': 'OpPass123'})
        token = login_response.data['access_token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        shift_response = self.client.post(reverse('open_shift'), {'operator_name': 'Operator One'})
        self.assertEqual(shift_response.status_code, status.HTTP_201_CREATED)

        entry_response = self.client.post(reverse('record_entry'), {
            'vehicle_number': 'KA-11-AB-1111',
            'vehicle_type': self.bike_rate.id,
        })
        self.assertEqual(entry_response.status_code, status.HTTP_201_CREATED)

        release_response = self.client.post(reverse('release_vehicle'), {
            'record_id': entry_response.data['id'],
            'payment_method': 'CASH',
        })
        self.assertEqual(release_response.status_code, status.HTTP_200_OK)

    def test_operator_cannot_update_monthly_payment_but_admin_can(self):
        operator = self.User.objects.create_user(username='opnoadmin', password='OpPass123', role='OPERATOR')
        admin = self.User.objects.create_user(username='adminpay', password='AdminPass123', role='ADMIN')
        customer = Customer.objects.create(
            vehicle_number='KA-22-CD-2222',
            owner_name='Test Customer',
            phone_number='1234567890',
            vehicle_type=self.car_rate,
            is_active=True,
        )

        operator_token = self.client.post(reverse('login'), {'username': 'opnoadmin', 'password': 'OpPass123'}).data['access_token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {operator_token}')
        operator_response = self.client.put(reverse('monthly_pass_payment_update'), {
            'customer_id': customer.id,
            'payment_status': 'PAID',
        })
        self.assertEqual(operator_response.status_code, status.HTTP_403_FORBIDDEN)

        admin_token = self.client.post(reverse('login'), {'username': 'adminpay', 'password': 'AdminPass123'}).data['access_token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {admin_token}')
        admin_response = self.client.put(reverse('monthly_pass_payment_update'), {
            'customer_id': customer.id,
            'payment_status': 'PAID',
        })
        self.assertEqual(admin_response.status_code, status.HTTP_200_OK)


class MonthlyPassIntegrationTests(APITestCase):
    def setUp(self):
        self.bike_rate = VehicleRate.objects.get(vehicle_type='BIKE')
        self.car_rate = VehicleRate.objects.get(vehicle_type='CAR')

    def test_monthly_pass_entry_and_release_flow(self):
        self.client.post(reverse('open_shift'), {'operator_name': 'Monthly Tester'})

        customer = Customer.objects.create(
            vehicle_number='KA-04-EE-4444',
            owner_name='Amita',
            phone_number='7777777777',
            vehicle_type=self.car_rate,
            is_active=True,
        )
        MonthlySubscription.objects.create(
            customer=customer,
            month=timezone.now().month,
            year=timezone.now().year,
            amount=300.00,
            payment_status='PAID',
            start_date=timezone.now().date(),
            end_date=timezone.now().date() + datetime.timedelta(days=30),
        )

        response = self.client.post(reverse('record_entry'), {
            'vehicle_number': 'KA-04-EE-4444',
            'vehicle_type': self.car_rate.id,
            'customer_name': 'Amita',
            'customer_phone': '7777777777',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['type'], 'MONTHLY')
        self.assertEqual(response.data['fee'], 0)
        self.assertEqual(response.data['record']['customer_type'], 'MONTHLY')

        record_id = response.data['record']['id']
        release_response = self.client.post(reverse('release_vehicle'), {
            'record_id': record_id,
            'payment_method': 'CASH',
        })
        self.assertEqual(release_response.status_code, status.HTTP_200_OK)
        self.assertEqual(release_response.data['type'], 'MONTHLY')
        self.assertEqual(release_response.data['fee'], 0)

    def test_pending_monthly_pass_blocks_entry(self):
        self.client.post(reverse('open_shift'), {'operator_name': 'Pending Tester'})

        customer = Customer.objects.create(
            vehicle_number='KA-05-FF-5555',
            owner_name='Bharat',
            phone_number='6666666666',
            vehicle_type=self.bike_rate,
            is_active=True,
        )
        MonthlySubscription.objects.create(
            customer=customer,
            month=timezone.now().month,
            year=timezone.now().year,
            amount=300.00,
            payment_status='PENDING',
            start_date=timezone.now().date(),
            end_date=timezone.now().date() + datetime.timedelta(days=30),
        )

        response = self.client.post(reverse('record_entry'), {
            'vehicle_number': 'KA-05-FF-5555',
            'vehicle_type': self.bike_rate.id,
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['type'], 'MONTHLY_PENDING')

    def test_casual_entry_and_release_still_work(self):
        self.client.post(reverse('open_shift'), {'operator_name': 'Casual Tester'})

        response = self.client.post(reverse('record_entry'), {
            'vehicle_number': 'KA-06-GG-6666',
            'vehicle_type': self.bike_rate.id,
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['customer_type'], 'CASUAL')

        record_id = response.data['id']
        release_response = self.client.post(reverse('release_vehicle'), {
            'record_id': record_id,
            'payment_method': 'CASH',
        })
        self.assertEqual(release_response.status_code, status.HTTP_200_OK)
        self.assertEqual(release_response.data['status'], 'RELEASED')

class AuthenticationTests(APITestCase):
    def setUp(self):
        self.bike_rate = VehicleRate.objects.get(vehicle_type='BIKE')
        user_model = get_user_model()
        self.admin = user_model.objects.create_user(username='admin', password='admin123', role='ADMIN')
        self.operator = user_model.objects.create_user(username='operator', password='operator123', role='OPERATOR')

    def test_admin_login_returns_tokens_and_role(self):
        response = self.client.post(reverse('login'), {'username': 'admin', 'password': 'admin123'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access_token', response.data)
        self.assertIn('refresh_token', response.data)
        self.assertEqual(response.data['user_role'], 'ADMIN')
        self.assertEqual(response.data['username'], 'admin')

    def test_operator_login_and_protected_access(self):
        login_response = self.client.post(reverse('login'), {'username': 'operator', 'password': 'operator123'})
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login_response.data['access_token']}")
        response = self.client.post(reverse('record_entry'), {
            'vehicle_number': 'KA-11-LL-1111',
            'vehicle_type': self.bike_rate.id,
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('No active shift', response.data['error'])

    def test_unauthorized_access_is_denied(self):
        response = self.client.get(reverse('dashboard_stats'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_admin_can_update_monthly_payment(self):
        customer = Customer.objects.create(
            vehicle_number='KA-12-MM-1212',
            owner_name='Rita',
            phone_number='1234567890',
            vehicle_type=self.bike_rate,
            is_active=True,
        )
        MonthlySubscription.objects.create(
            customer=customer,
            month=timezone.now().month,
            year=timezone.now().year,
            amount=250.00,
            payment_status='PENDING',
        )

        login_response = self.client.post(reverse('login'), {'username': 'admin', 'password': 'admin123'})
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login_response.data['access_token']}")
        response = self.client.put(reverse('monthly_pass_payment_update'), {
            'customer_id': customer.id,
            'payment_status': 'PAID',
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['payment_status'], 'PAID')


class ParkingSystemTests(APITestCase):
    def setUp(self):
        # The rates are seeded by migration 0002. Let's verify and grab them.
        self.bike_rate = VehicleRate.objects.get(vehicle_type='BIKE')
        self.car_rate = VehicleRate.objects.get(vehicle_type='CAR')

    def test_shift_lifecycle(self):
        # 1. Get current shift - should show none active
        response = self.client.get(reverse('current_shift'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['active'])
        self.assertIsNone(response.data['shift'])

        # 2. Try to close a shift when none is open
        response = self.client.post(reverse('close_shift'))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # 3. Open a shift
        response = self.client.post(reverse('open_shift'), {"operator_name": "Test Operator"})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['operator_name'], "Test Operator")
        self.assertEqual(response.data['status'], "OPEN")
        shift_id = response.data['id']

        # 4. Try to open another shift while one is open
        response = self.client.post(reverse('open_shift'), {"operator_name": "Second Operator"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # 5. Get current shift - should show active
        response = self.client.get(reverse('current_shift'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['active'])
        self.assertEqual(response.data['shift']['id'], shift_id)

        # 6. Close the shift
        response = self.client.post(reverse('close_shift'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], "CLOSED")
        self.assertIsNotNone(response.data['end_time'])

    def test_parking_entry_without_shift(self):
        # Try to register entry with no open shift
        response = self.client.post(reverse('record_entry'), {
            "vehicle_number": "KA-01-AB-1234",
            "vehicle_type": self.bike_rate.id
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_parking_entry_and_exit_calculations(self):
        # Open shift
        self.client.post(reverse('open_shift'), {"operator_name": "Cashier A"})

        # Record entry
        response = self.client.post(reverse('record_entry'), {
            "vehicle_number": "KA-01-AB-1234",
            "vehicle_type": self.bike_rate.id,
            "customer_name": "Alice",
            "customer_phone": "9876543210"
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['vehicle_number'], "KA-01-AB-1234")
        self.assertEqual(response.data['status'], "PARKED")
        self.assertTrue(response.data['receipt_number'].startswith("PRK-"))
        record_id = response.data['id']

        # Try duplicate entry
        response = self.client.post(reverse('record_entry'), {
            "vehicle_number": "KA-01-AB-1234",
            "vehicle_type": self.bike_rate.id
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Let's mock a parking record that has been there for 2 hours and 15 mins
        # Standard fee: min_charge (10) + hourly_rate (5) * 3 hours = 25
        record = ParkingRecord.objects.get(id=record_id)
        # Shift back entry time by 2.25 hours
        record.entry_time = timezone.now() - datetime.timedelta(hours=2, minutes=15)
        record.save()

        # Release the vehicle
        response = self.client.post(reverse('release_vehicle'), {
            "record_id": record.id,
            "payment_method": "UPI"
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], "RELEASED")
        self.assertEqual(response.data['payment_method'], "UPI")
        # Hours = ceiling(135 minutes / 60) = 3 hours
        # Fee = 10 + 5 * 3 = 25
        self.assertEqual(float(response.data['fee_amount']), 25.00)

    def test_search_and_history(self):
        # Open shift
        self.client.post(reverse('open_shift'), {"operator_name": "Cashier B"})

        # Enter vehicles
        self.client.post(reverse('record_entry'), {
            "vehicle_number": "MH-12-PQ-9999",
            "vehicle_type": self.car_rate.id
        })
        self.client.post(reverse('record_entry'), {
            "vehicle_number": "DL-03-XY-8888",
            "vehicle_type": self.bike_rate.id
        })

        # Search active
        response = self.client.get(reverse('search_parked_vehicle'), {"q": "9999"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['vehicle_number'], "MH-12-PQ-9999")

        # History search
        response = self.client.get(reverse('parking_history'), {"q": "DL-03"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['vehicle_number'], "DL-03-XY-8888")

    def test_dashboard_stats(self):
        # Open shift
        self.client.post(reverse('open_shift'), {"operator_name": "Cashier C"})

        # Record vehicle entry
        resp = self.client.post(reverse('record_entry'), {
            "vehicle_number": "AP-05-ZZ-1111",
            "vehicle_type": self.bike_rate.id
        })
        record_id = resp.data['id']

        # Check dashboard before release
        response = self.client.get(reverse('dashboard_stats'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['current_inside'], 1)
        self.assertEqual(response.data['today_entries'], 1)
        self.assertEqual(response.data['today_exits'], 0)
        self.assertEqual(response.data['today_revenue']['total'], 0.0)

        # Release vehicle
        self.client.post(reverse('release_vehicle'), {
            "record_id": record_id,
            "payment_method": "CASH"
        })

        # Check dashboard after release
        response = self.client.get(reverse('dashboard_stats'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['current_inside'], 0)
        self.assertEqual(response.data['today_entries'], 1)
        self.assertEqual(response.data['today_exits'], 1)
        # Min charge is 10, hourly rate is 5. Since duration is 0, it counts as 1 hour.
        # Fee = 10 + 5 * 1 = 15
        self.assertEqual(response.data['today_revenue']['total'], 15.0)
        self.assertEqual(response.data['today_revenue']['cash'], 15.0)
        self.assertEqual(response.data['today_revenue']['upi'], 0.0)

    def test_dashboard_stats_include_current_month_monthly_metrics(self):
        customer = Customer.objects.create(
            vehicle_number='KA-07-HH-7777',
            owner_name='Mina',
            phone_number='1111111111',
            vehicle_type=self.car_rate,
            is_active=True,
        )
        MonthlySubscription.objects.create(
            customer=customer,
            month=timezone.now().month,
            year=timezone.now().year,
            amount=250.00,
            payment_status='PAID',
        )
        pending_customer = Customer.objects.create(
            vehicle_number='KA-08-II-8888',
            owner_name='Naveen',
            phone_number='2222222222',
            vehicle_type=self.bike_rate,
            is_active=True,
        )
        MonthlySubscription.objects.create(
            customer=pending_customer,
            month=timezone.now().month,
            year=timezone.now().year,
            amount=180.00,
            payment_status='PENDING',
        )

        current_month_record = ParkingRecord.objects.create(
            shift=Shift.objects.create(operator_name='Monthly Dashboard', shift_date=timezone.now().date(), start_time=timezone.now(), status='OPEN'),
            vehicle_type=self.bike_rate,
            vehicle_number='KA-09-JJ-9999',
            customer_name='Casual User',
            customer_phone='3333333333',
            customer_type='CASUAL',
            entry_date=timezone.now().date() - datetime.timedelta(days=40),
            entry_time=timezone.now() - datetime.timedelta(hours=2),
            exit_date=timezone.now().date(),
            exit_time=timezone.now(),
            fee_amount=50.00,
            payment_method='CASH',
            status='RELEASED',
        )
        previous_month_record = ParkingRecord.objects.create(
            shift=Shift.objects.create(operator_name='Previous Month Dashboard', shift_date=timezone.now().date(), start_time=timezone.now(), status='OPEN'),
            vehicle_type=self.bike_rate,
            vehicle_number='KA-10-KK-1010',
            customer_name='Old User',
            customer_phone='4444444444',
            customer_type='CASUAL',
            entry_date=timezone.now().date() - datetime.timedelta(days=60),
            entry_time=timezone.now() - datetime.timedelta(hours=4),
            exit_date=timezone.now().date() - datetime.timedelta(days=10),
            exit_time=timezone.now() - datetime.timedelta(days=10),
            fee_amount=90.00,
            payment_method='UPI',
            status='RELEASED',
        )

        response = self.client.get(reverse('dashboard_stats'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['monthly_revenue'], 250.0)
        self.assertEqual(response.data['monthly_pending_count'], 1)
        self.assertEqual(response.data['monthly_pending_amount'], 180.0)
        self.assertEqual(response.data['casual_revenue'], 50.0)
        self.assertEqual(response.data['total_revenue'], 300.0)
        self.assertEqual(response.data['total_monthly_customers'], 2)

    def test_monthly_pass_models_can_be_created(self):
        customer = Customer.objects.create(
            vehicle_number='KA-02-CC-2222',
            owner_name='Ravi',
            phone_number='9999999999',
            vehicle_type=self.car_rate,
            is_active=True,
        )
        subscription = MonthlySubscription.objects.create(
            customer=customer,
            month=8,
            year=2026,
            amount=300.00,
            payment_status='PENDING',
            start_date=timezone.now().date(),
            end_date=timezone.now().date() + datetime.timedelta(days=30),
        )

        self.assertEqual(customer.vehicle_number, 'KA-02-CC-2222')
        self.assertEqual(subscription.customer, customer)
        self.assertEqual(subscription.payment_status, 'PENDING')

    def test_monthly_pass_api_flow(self):
        response = self.client.post(reverse('monthly_pass_add'), {
            'vehicle_number': 'KA-03-DD-3333',
            'owner_name': 'Nisha',
            'phone_number': '8888888888',
            'vehicle_type': self.car_rate.id,
            'monthly_amount': 300.00,
            'start_date': '2026-08-01',
            'end_date': '2026-08-31',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['vehicle_number'], 'KA-03-DD-3333')
        self.assertEqual(response.data['payment_status'], 'PENDING')

        list_response = self.client.get(reverse('monthly_pass_list'))
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(list_response.data), 1)

        search_response = self.client.get(reverse('monthly_pass_search'), {'vehicle_number': 'KA-03-DD-3333'})
        self.assertEqual(search_response.status_code, status.HTTP_200_OK)
        self.assertEqual(search_response.data['customer']['vehicle_number'], 'KA-03-DD-3333')

        payment_response = self.client.put(reverse('monthly_pass_payment_update'), {
            'customer_id': response.data['id'],
            'payment_status': 'PAID',
            'payment_date': '2026-08-02',
        })
        self.assertEqual(payment_response.status_code, status.HTTP_200_OK)
        self.assertEqual(payment_response.data['payment_status'], 'PAID')

        reminder_response = self.client.post(reverse('monthly_pass_send_reminder'), {
            'customer_id': response.data['id'],
        })
        self.assertEqual(reminder_response.status_code, status.HTTP_200_OK)
        self.assertTrue(reminder_response.data['whatsapp_sent'])
